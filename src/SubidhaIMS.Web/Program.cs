using Microsoft.AspNetCore.Authentication.Cookies;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Authorization;
using Microsoft.AspNetCore.StaticFiles;
using Microsoft.EntityFrameworkCore;
using Scalar.AspNetCore;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Core.Interfaces;
using SubidhaIMS.Infrastructure.Data;
using SubidhaIMS.Infrastructure.Services;

var builder = WebApplication.CreateBuilder(args);

// 1. Configure Kestrel LAN binding
builder.WebHost.ConfigureKestrel(options =>
{
    options.ListenAnyIP(5000);
});

// 2. Database context
var connectionString = builder.Configuration.GetConnectionString("DefaultConnection") 
    ?? throw new InvalidOperationException("Connection string 'DefaultConnection' not found.");

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(connectionString, b => b.MigrationsAssembly("SubidhaIMS.Infrastructure")));

// 3. ASP.NET Core Identity
builder.Services.AddIdentityCore<AppUser>(options =>
{
    options.Password.RequireDigit = false;
    options.Password.RequiredLength = 6;
    options.Password.RequireNonAlphanumeric = false;
    options.Password.RequireUppercase = false;
})
.AddRoles<IdentityRole<Guid>>()
.AddEntityFrameworkStores<AppDbContext>();

// 4. Authentication & Cookie config (MUST BE BEFORE builder.Build())
builder.Services.AddAuthentication(CookieAuthenticationDefaults.AuthenticationScheme)
    .AddCookie(options =>
    {
        options.Cookie.Name = "SubidhaIMS.Auth";
        options.Cookie.HttpOnly = true;
        options.Cookie.SameSite = SameSiteMode.Lax;
        options.Events.OnRedirectToLogin = context =>
        {
            context.Response.StatusCode = StatusCodes.Status401Unauthorized;
            return Task.CompletedTask;
        };
    });

builder.Services.AddAuthorization();

// 5. Application domain services
builder.Services.AddScoped<IInventoryService, InventoryService>();
builder.Services.AddScoped<IPurchaseService, PurchaseService>();
builder.Services.AddScoped<ISalesService, SalesService>();
builder.Services.AddScoped<IReportingService, ReportingService>();

// 6. Web Controllers & OpenAPI
// Enforce authentication on EVERY controller and endpoint by default
builder.Services.AddControllers(options =>
{
    var policy = new AuthorizationPolicyBuilder()
        .RequireAuthenticatedUser()
        .Build();
    options.Filters.Add(new AuthorizeFilter(policy));
});
builder.Services.AddOpenApi();

// =========================================================================
// BUILD THE APP (NO MORE builder.Services calls allowed after this line!)
// =========================================================================
var app = builder.Build();

var provider = new FileExtensionContentTypeProvider();
provider.Mappings[".woff2"] = "font/woff2";
provider.Mappings[".woff"] = "font/woff";

app.UseDefaultFiles();
app.UseStaticFiles(new StaticFileOptions
{
    ContentTypeProvider = provider
});

// 7. Middleware pipeline (order matters!)
app.UseDefaultFiles();
app.UseStaticFiles();

app.UseRouting();

app.UseAuthentication();
app.UseAuthorization();

// 8. Scalar & OpenAPI
app.MapOpenApi();
app.MapScalarApiReference(options =>
{
    options
        .WithTitle("Subidha IMS Nepal - API Reference")
        .WithTheme(ScalarTheme.Moon)
        .WithDefaultHttpClient(ScalarTarget.JavaScript, ScalarClient.Fetch);
});

// 9. Controllers & Health check
app.MapControllers();

app.MapGet("/api/health", () => Results.Ok(new
{
    Status = "Online",
    Environment = "Local Retail Node (Nepal)",
    Timestamp = DateTime.UtcNow
}));

// 10. Startup migrations and Admin seed
using (var scope = app.Services.CreateScope())
{
    var services = scope.ServiceProvider;
    var logger = services.GetRequiredService<ILogger<Program>>();
    try
    {
        var db = services.GetRequiredService<AppDbContext>();
        db.Database.Migrate();

        var userManager = services.GetRequiredService<UserManager<AppUser>>();
        if (await userManager.FindByNameAsync("admin") == null)
        {
            var adminUser = new AppUser
            {
                UserName = "admin",
                Email = "admin@subidhaims.local",
                FullName = "Shop Administrator",
                IsActive = true
            };
            var result = await userManager.CreateAsync(adminUser, "admin123");
            if (result.Succeeded)
            {
                logger.LogInformation("Default local admin account created (admin / admin123).");
            }
        }
    }
    catch (Exception ex)
    {
        logger.LogError(ex, "Error while initializing database.");
    }
}

app.Run();
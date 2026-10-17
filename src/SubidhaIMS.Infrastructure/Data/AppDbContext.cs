using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Diagnostics;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Core.Enums;

namespace SubidhaIMS.Infrastructure.Data;

public class AppDbContext : IdentityDbContext<AppUser, IdentityRole<Guid>, Guid>
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options){}
    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
    {
        base.OnConfiguring(optionsBuilder);
        optionsBuilder.ConfigureWarnings(w => 
            w.Ignore(RelationalEventId.PendingModelChangesWarning));
    }
    public DbSet<BusinessSettings> BusinessSettings => Set<BusinessSettings>();
    public DbSet<AuditLog> AuditLogs => Set<AuditLog>();
    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Unit> Units => Set<Unit>();
    public DbSet<Product> Products => Set<Product>();
    public DbSet<ProductStock> ProductStocks => Set<ProductStock>();
    public DbSet<StockMovement> StockMovements => Set<StockMovement>();
    public DbSet<Supplier> Suppliers => Set<Supplier>();
    public DbSet<Customer> Customers => Set<Customer>();
    public DbSet<Purchase> Purchases => Set<Purchase>();
    public DbSet<PurchaseLine> PurchaseLines => Set<PurchaseLine>();
    public DbSet<Sale> Sales => Set<Sale>();
    public DbSet<SaleLine> SaleLines => Set<SaleLine>();
    public DbSet<LedgerAccount> LedgerAccounts => Set<LedgerAccount>();
    public DbSet<LedgerEntry> LedgerEntries => Set<LedgerEntry>();
    public DbSet<LedgerLine> LedgerLines => Set<LedgerLine>();

    protected override void OnModelCreating(ModelBuilder builder)
    {
        base.OnModelCreating(builder);

        // --- Monetary & Quantity Precision Conventions ---
        // Money: decimal(18,2)
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) && 
                       (p.Name.EndsWith("Price") || p.Name.EndsWith("Total") || 
                        p.Name.EndsWith("Amount") || p.Name.EndsWith("Balance") || 
                        p.Name.EndsWith("Debit") || p.Name.EndsWith("Credit") || 
                        p.Name.EndsWith("Value") || p.Name.EndsWith("Profit"))))
        {
            property.SetColumnType("decimal(18,2)");
        }

        // Quantities: decimal(18,3)
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) && 
                       (p.Name.Contains("Quantity") || p.Name.Contains("Level"))))
        {
            property.SetColumnType("decimal(18,3)");
        }

        // Unit Costs & Rates: decimal(18,4)
        foreach (var property in builder.Model.GetEntityTypes()
            .SelectMany(t => t.GetProperties())
            .Where(p => p.ClrType == typeof(decimal) && 
                       (p.Name.EndsWith("Cost") || p.Name.EndsWith("CostSnapshot") || p.Name.EndsWith("Rate"))))
        {
            property.SetColumnType("decimal(18,4)");
        }

        // --- Business Settings Single Row Constraint ---
        builder.Entity<BusinessSettings>(b =>
        {
            b.HasKey(x => x.Id);
            b.ToTable(t => t.HasCheckConstraint("CK_BusinessSettings_SingleRow", "\"Id\" = 1"));
        });

        // --- Product and Stock Configurations ---
        builder.Entity<Product>(b =>
        {
            b.HasIndex(x => x.Sku).IsUnique();
            b.HasIndex(x => x.Barcode);
            b.HasIndex(x => x.Name);
        });

        builder.Entity<ProductStock>(b =>
        {
            b.HasKey(x => x.ProductId);
            b.Property(x => x.Version).IsRowVersion(); // <--- USE THIS
            b.ToTable(t => t.HasCheckConstraint("CK_Stock_NonNegative", "\"QuantityOnHand\" >= 0"));
        });
        builder.Entity<StockMovement>(b =>
        {
            b.HasIndex(x => new { x.ProductId, x.MovementDate });
            b.ToTable(t => t.HasCheckConstraint("CK_StockMovement_NonZero", "\"QuantityChange\" <> 0"));
        });

        // --- Invoices & Lines ---
        builder.Entity<Purchase>(b =>
        {
            b.HasIndex(x => x.PurchaseNo).IsUnique();
            b.HasIndex(x => new { x.SupplierId, x.SupplierBillNo }).IsUnique();
        });

        builder.Entity<Sale>(b =>
        {
            b.HasIndex(x => x.InvoiceNo).IsUnique();
            b.HasIndex(x => x.SaleDate);
        });

        // --- Auto-Ledger Balancing Invariants ---
        builder.Entity<LedgerAccount>(b =>
        {
            b.HasIndex(x => x.Code).IsUnique();
        });

        builder.Entity<LedgerLine>(b =>
        {
            b.ToTable(t => t.HasCheckConstraint("CK_LedgerLine_OneSided", 
                "(\"Debit\" > 0 AND \"Credit\" = 0) OR (\"Credit\" > 0 AND \"Debit\" = 0)"));
        });

        // --- Seed Initial Data ---
        SeedDefaults(builder);
    }

    private static void SeedDefaults(ModelBuilder builder)
    {
        // 1. Business Profile
        builder.Entity<BusinessSettings>().HasData(new BusinessSettings
        {
            Id = 1,
            BusinessName = "Kathmandu Electronics & Mobile Hub",
            Address = "New Road, Kathmandu, Nepal",
            Phone = "+977-1-4200000",
            PanNumber = "600123456",
            IsVatRegistered = true,
            DefaultVatRate = 13.00m,
            CurrencyCode = "NPR"
        });

        // 2. Default Units
        builder.Entity<Unit>().HasData(
            new Unit { Id = 1, Name = "Piece", Symbol = "pcs", AllowsDecimal = false },
            new Unit { Id = 2, Name = "Box", Symbol = "box", AllowsDecimal = false },
            new Unit { Id = 3, Name = "Meter", Symbol = "m", AllowsDecimal = true }
        );

        // 3. Default Categories
        builder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Smartphones & Tablets" },
            new Category { Id = 2, Name = "Accessories & Chargers" },
            new Category { Id = 3, Name = "Spare Parts" }
        );

        // 4. Default System Ledger Accounts
        builder.Entity<LedgerAccount>().HasData(
            new LedgerAccount { Id = 1, Code = "1010", Name = "Cash in Hand", Category = AccountCategory.Asset },
            new LedgerAccount { Id = 2, Code = "1020", Name = "Bank & Digital Wallets (Fonepay)", Category = AccountCategory.Asset },
            new LedgerAccount { Id = 3, Code = "1030", Name = "Accounts Receivable (Debtors)", Category = AccountCategory.Asset },
            new LedgerAccount { Id = 4, Code = "1040", Name = "Inventory", Category = AccountCategory.Asset },
            new LedgerAccount { Id = 5, Code = "2010", Name = "Accounts Payable (Creditors)", Category = AccountCategory.Liability },
            new LedgerAccount { Id = 6, Code = "2020", Name = "VAT / Tax Payable", Category = AccountCategory.Liability },
            new LedgerAccount { Id = 7, Code = "3010", Name = "Owner Equity", Category = AccountCategory.Equity },
            new LedgerAccount { Id = 8, Code = "4010", Name = "Sales Revenue", Category = AccountCategory.Revenue },
            new LedgerAccount { Id = 9, Code = "5010", Name = "Cost of Goods Sold (COGS)", Category = AccountCategory.CostOfGoodsSold }
        );
    }
}
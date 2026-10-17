using Microsoft.AspNetCore.Identity;

namespace SubidhaIMS.Core.Entities;

public class AppUser : IdentityUser<Guid>
{
    public string FullName { get; set; } = string.Empty;
    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
}
public class BusinessSettings
{
    public int Id { get; set; } = 1;
    public string BusinessName { get; set; } = "Electronics Retail Nepal";
    public string? Address { get; set; } = "Kathmandu, Nepal";
    public string? Phone { get; set; }
    public string? Email { get; set; }
    public string? PanNumber { get; set; }
    public bool IsVatRegistered { get; set; } = false;
    public string CurrencyCode { get; set; } = "NPR";
    public decimal DefaultVatRate { get; set; } = 13.00m;
    public bool ShowBikramSambatDate { get; set; } = true;
    public string InvoicePrefix { get; set; } = "INV";
    public string PurchasePrefix { get; set; } = "PUR";
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;
}

public class AuditLog
{
    public long Id { get; set; }
    public DateTime OccurredAt { get; set; } = DateTime.UtcNow;
    public Guid? UserId { get; set; }
    public string EntityName { get; set; } = string.Empty;
    public string EntityId { get; set; } = string.Empty;
    public string Action { get; set; } = string.Empty; // Create, Update, Cancel, Post
    public string? Details { get; set; }
    public string? IpAddress { get; set; }
}
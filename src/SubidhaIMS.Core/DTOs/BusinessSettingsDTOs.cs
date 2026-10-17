using System.ComponentModel.DataAnnotations;

namespace SubidhaIMS.Core.DTOs;

public record BusinessSettingsDto(
    int Id,
    [Required, MaxLength(200)] string BusinessName,
    [MaxLength(300)] string? Address,
    [MaxLength(30)] string? Phone,
    [MaxLength(150)] string? Email,
    [MaxLength(20)] string? PanNumber,
    bool IsVatRegistered,
    decimal DefaultVatRate,
    string CurrencyCode,
    string InvoicePrefix,
    string PurchasePrefix
);

public record UpdateBusinessSettingsDto(
    [Required, MaxLength(200)] string BusinessName,
    [MaxLength(300)] string? Address,
    [MaxLength(30)] string? Phone,
    [MaxLength(150)] string? Email,
    [MaxLength(20)] string? PanNumber,
    bool IsVatRegistered,
    [Range(0, 100)] decimal DefaultVatRate
);
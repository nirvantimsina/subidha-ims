using Microsoft.EntityFrameworkCore;
using SubidhaIMS.Core.DTOs;
using SubidhaIMS.Core.Entities;
using SubidhaIMS.Core.Enums;
using SubidhaIMS.Core.Interfaces;
using SubidhaIMS.Infrastructure.Data;

namespace SubidhaIMS.Infrastructure.Services;

public class InventoryService : IInventoryService
{
    private readonly AppDbContext _db;

    public InventoryService(AppDbContext db)
    {
        _db = db;
    }

    public async Task<IEnumerable<ProductListDto>> GetProductsAsync(string? search = null, long? categoryId = null, bool? lowStockOnly = null)
    {
        var query = _db.Products
            .AsNoTracking()
            .Include(p => p.Category)
            .Include(p => p.Unit)
            .Include(p => p.Stock)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
        {
            var s = search.Trim().ToLower();
            query = query.Where(p => p.Name.ToLower().Contains(s) ||
                                     p.Sku.ToLower().Contains(s) ||
                                     (p.Barcode != null && p.Barcode.ToLower().Contains(s)));
        }

        if (categoryId.HasValue && categoryId.Value > 0)
        {
            query = query.Where(p => p.CategoryId == categoryId.Value);
        }

        if (lowStockOnly == true)
        {
            query = query.Where(p => p.Stock != null && p.Stock.QuantityOnHand <= p.ReorderLevel);
        }

        return await query
            .OrderBy(p => p.Name)
            .Select(p => new ProductListDto(
                p.Id,
                p.Sku,
                p.Barcode,
                p.Name,
                p.Category.Name,
                p.Unit.Symbol,
                p.DefaultPurchaseCost,
                p.DefaultSellingPrice,
                p.Stock != null ? p.Stock.QuantityOnHand : 0m,
                p.Stock != null ? p.Stock.AverageCost : 0m,
                p.Stock != null ? p.Stock.TotalValue : 0m,
                p.ReorderLevel,
                p.Stock != null && p.Stock.QuantityOnHand <= p.ReorderLevel,
                p.IsActive
            ))
            .ToListAsync();
    }

    public async Task<ProductDetailDto?> GetProductByIdAsync(long id)
    {
        var p = await _db.Products
            .AsNoTracking()
            .Include(x => x.Category)
            .Include(x => x.Unit)
            .Include(x => x.Stock)
            .FirstOrDefaultAsync(x => x.Id == id);

        if (p == null) return null;

        return new ProductDetailDto(
            p.Id,
            p.Sku,
            p.Barcode,
            p.Name,
            p.Description,
            p.CategoryId,
            p.Category.Name,
            p.UnitId,
            p.Unit.Name,
            p.Unit.Symbol,
            p.DefaultPurchaseCost,
            p.DefaultSellingPrice,
            p.ReorderLevel,
            p.Stock?.QuantityOnHand ?? 0m,
            p.Stock?.AverageCost ?? 0m,
            p.Stock?.TotalValue ?? 0m,
            p.IsActive,
            p.CreatedAt
        );
    }

    public async Task<ProductDetailDto> CreateProductAsync(CreateProductDto dto, Guid? userId = null)
    {
        if (await _db.Products.AnyAsync(p => p.Sku.ToLower() == dto.Sku.Trim().ToLower()))
        {
            throw new InvalidOperationException($"SKU '{dto.Sku}' already exists.");
        }

        if (!string.IsNullOrWhiteSpace(dto.Barcode) &&
            await _db.Products.AnyAsync(p => p.Barcode != null && p.Barcode.ToLower() == dto.Barcode.Trim().ToLower()))
        {
            throw new InvalidOperationException($"Barcode '{dto.Barcode}' already exists.");
        }

        using var transaction = await _db.Database.BeginTransactionAsync();

        var product = new Product
        {
            Sku = dto.Sku.Trim().ToUpperInvariant(),
            Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim(),
            Name = dto.Name.Trim(),
            Description = dto.Description?.Trim(),
            CategoryId = dto.CategoryId,
            UnitId = dto.UnitId,
            DefaultPurchaseCost = dto.DefaultPurchaseCost,
            DefaultSellingPrice = dto.DefaultSellingPrice,
            ReorderLevel = dto.ReorderLevel,
            IsActive = true,
            CreatedAt = DateTime.UtcNow
        };

        _db.Products.Add(product);
        await _db.SaveChangesAsync();

        var stock = new ProductStock
        {
            ProductId = product.Id,
            QuantityOnHand = 0m,
            AverageCost = dto.DefaultPurchaseCost,
            TotalValue = 0m,
            UpdatedAt = DateTime.UtcNow
        };
        _db.ProductStocks.Add(stock);
        await _db.SaveChangesAsync();

        if (dto.InitialStockQuantity > 0)
        {
            var unitCost = dto.InitialStockUnitCost > 0 ? dto.InitialStockUnitCost : dto.DefaultPurchaseCost;
            await RecordStockMovementInternalAsync(
                product.Id,
                StockMovementType.Opening,
                dto.InitialStockQuantity,
                unitCost,
                "OPENING-STOCK",
                "Initial inventory balance",
                DateTime.UtcNow
            );
        }

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = nameof(Product),
            EntityId = product.Id.ToString(),
            Action = "Create",
            Details = $"Created product {product.Name} (SKU: {product.Sku}) with opening qty {dto.InitialStockQuantity}"
        });
        await _db.SaveChangesAsync();

        await transaction.CommitAsync();

        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<ProductDetailDto> UpdateProductAsync(long id, UpdateProductDto dto, Guid? userId = null)
    {
        var product = await _db.Products.FindAsync(id)
            ?? throw new KeyNotFoundException($"Product #{id} not found.");

        if (await _db.Products.AnyAsync(p => p.Id != id && p.Sku.ToLower() == dto.Sku.Trim().ToLower()))
        {
            throw new InvalidOperationException($"SKU '{dto.Sku}' is used by another product.");
        }

        product.Sku = dto.Sku.Trim().ToUpperInvariant();
        product.Barcode = string.IsNullOrWhiteSpace(dto.Barcode) ? null : dto.Barcode.Trim();
        product.Name = dto.Name.Trim();
        product.Description = dto.Description?.Trim();
        product.CategoryId = dto.CategoryId;
        product.UnitId = dto.UnitId;
        product.DefaultPurchaseCost = dto.DefaultPurchaseCost;
        product.DefaultSellingPrice = dto.DefaultSellingPrice;
        product.ReorderLevel = dto.ReorderLevel;
        product.IsActive = dto.IsActive;

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = nameof(Product),
            EntityId = product.Id.ToString(),
            Action = "Update",
            Details = $"Updated metadata for product {product.Name} (SKU: {product.Sku})"
        });

        await _db.SaveChangesAsync();
        return (await GetProductByIdAsync(product.Id))!;
    }

    public async Task<bool> DeleteProductAsync(long id, Guid? userId = null)
    {
        var product = await _db.Products.Include(p => p.Stock).FirstOrDefaultAsync(p => p.Id == id);
        if (product == null) return false;

        var hasMovements = await _db.StockMovements.AnyAsync(m => m.ProductId == id && m.MovementType != StockMovementType.Opening);
        if (hasMovements)
        {
            product.IsActive = false;
            _db.AuditLogs.Add(new AuditLog
            {
                UserId = userId,
                EntityName = nameof(Product),
                EntityId = product.Id.ToString(),
                Action = "Deactivate",
                Details = $"Deactivated product {product.Name} because history exists"
            });
            await _db.SaveChangesAsync();
            return true;
        }

        _db.StockMovements.RemoveRange(_db.StockMovements.Where(m => m.ProductId == id));
        if (product.Stock != null) _db.ProductStocks.Remove(product.Stock);
        _db.Products.Remove(product);

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = nameof(Product),
            EntityId = id.ToString(),
            Action = "Delete",
            Details = $"Hard deleted unused product {product.Name}"
        });

        await _db.SaveChangesAsync();
        return true;
    }

    public Task RecordStockMovementAsync(
        long productId,
        StockMovementType movementType,
        decimal quantityChange,
        decimal unitCost,
        string referenceNumber,
        string? remarks = null,
        DateTime? movementDate = null,
        CancellationToken cancellationToken = default)
    {
        return RecordStockMovementInternalAsync(productId, movementType, quantityChange, unitCost, referenceNumber, remarks, movementDate, cancellationToken);
    }

    private async Task RecordStockMovementInternalAsync(
        long productId,
        StockMovementType movementType,
        decimal quantityChange,
        decimal unitCost,
        string referenceNumber,
        string? remarks = null,
        DateTime? movementDate = null,
        CancellationToken cancellationToken = default)
    {
        var stock = await _db.ProductStocks.FirstOrDefaultAsync(s => s.ProductId == productId, cancellationToken)
            ?? throw new KeyNotFoundException($"Stock record for Product #{productId} not found.");

        var oldQty = stock.QuantityOnHand;
        var oldAvgCost = stock.AverageCost;
        decimal newQty = oldQty;
        decimal newAvgCost = oldAvgCost;

        if (quantityChange > 0)
        {
            newQty = oldQty + quantityChange;
            if (newQty > 0)
            {
                var totalCostPool = (oldQty * oldAvgCost) + (quantityChange * unitCost);
                newAvgCost = Math.Round(totalCostPool / newQty, 4);
            }
            else
            {
                newAvgCost = unitCost;
            }
        }
        else if (quantityChange < 0)
        {
            var absQty = Math.Abs(quantityChange);
            if (oldQty < absQty)
            {
                throw new InvalidOperationException($"Insufficient stock for Product #{productId}. Available: {oldQty}, Requested: {absQty}");
            }
            newQty = oldQty - absQty;
            newAvgCost = oldAvgCost;
            unitCost = oldAvgCost;
        }
        else
        {
            throw new ArgumentException("Quantity change cannot be zero.", nameof(quantityChange));
        }

        stock.QuantityOnHand = newQty;
        stock.AverageCost = newAvgCost;
        stock.TotalValue = Math.Round(newQty * newAvgCost, 2);
        stock.UpdatedAt = DateTime.UtcNow;

        var movement = new StockMovement
        {
            ProductId = productId,
            MovementDate = movementDate ?? DateTime.UtcNow.Date,
            MovementType = movementType,
            QuantityChange = quantityChange,
            UnitCost = unitCost,
            BalanceQuantity = newQty,
            BalanceAverageCost = newAvgCost,
            ReferenceNumber = referenceNumber,
            Remarks = remarks,
            OccurredAt = DateTime.UtcNow
        };

        _db.StockMovements.Add(movement);
        await _db.SaveChangesAsync(cancellationToken);
    }

    public async Task<IEnumerable<StockMovementDto>> GetProductMovementHistoryAsync(long productId)
    {
        return await _db.StockMovements
            .AsNoTracking()
            .Include(m => m.Product)
            .Where(m => m.ProductId == productId)
            .OrderByDescending(m => m.OccurredAt)
            .Select(m => new StockMovementDto(
                m.Id,
                m.ProductId,
                m.Product.Name,
                m.Product.Sku,
                m.MovementDate,
                m.MovementType.ToString(),
                m.QuantityChange,
                m.UnitCost,
                m.BalanceQuantity,
                m.BalanceAverageCost,
                m.ReferenceNumber,
                m.Remarks
            ))
            .ToListAsync();
    }

    public async Task<StockMovementDto> RecordManualAdjustmentAsync(StockAdjustmentRequestDto dto, Guid? userId = null)
    {
        using var tx = await _db.Database.BeginTransactionAsync();

        var product = await _db.Products.Include(p => p.Stock).FirstOrDefaultAsync(p => p.Id == dto.ProductId)
            ?? throw new KeyNotFoundException($"Product #{dto.ProductId} not found.");

        decimal signedQty = dto.MovementType == StockMovementType.AdjustmentIn
            ? dto.Quantity
            : -Math.Abs(dto.Quantity);

        decimal cost = dto.MovementType == StockMovementType.AdjustmentIn
            ? dto.UnitCost
            : (product.Stock?.AverageCost ?? 0m);

        var refNo = $"ADJ-{DateTime.UtcNow:yyyyMMddHHmmss}";

        await RecordStockMovementInternalAsync(
            dto.ProductId,
            dto.MovementType,
            signedQty,
            cost,
            refNo,
            dto.Reason
        );

        _db.AuditLogs.Add(new AuditLog
        {
            UserId = userId,
            EntityName = "StockAdjustment",
            EntityId = dto.ProductId.ToString(),
            Action = dto.MovementType.ToString(),
            Details = $"Adjusted stock for {product.Name} by {signedQty}. Reason: {dto.Reason}"
        });
        await _db.SaveChangesAsync();

        await tx.CommitAsync();

        var latestMovement = await _db.StockMovements
            .Include(m => m.Product)
            .Where(m => m.ProductId == dto.ProductId && m.ReferenceNumber == refNo)
            .FirstAsync();

        return new StockMovementDto(
            latestMovement.Id,
            latestMovement.ProductId,
            latestMovement.Product.Name,
            latestMovement.Product.Sku,
            latestMovement.MovementDate,
            latestMovement.MovementType.ToString(),
            latestMovement.QuantityChange,
            latestMovement.UnitCost,
            latestMovement.BalanceQuantity,
            latestMovement.BalanceAverageCost,
            latestMovement.ReferenceNumber,
            latestMovement.Remarks
        );
    }
}
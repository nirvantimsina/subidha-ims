namespace SubidhaIMS.Core.Enums;

public enum DocStatus
{
    Draft = 1,
    Posted = 2,
    Cancelled = 3
}

public enum PaymentStatus
{
    Unpaid = 1,
    Partial = 2,
    Paid = 3
}

public enum PaymentMethod
{
    Cash = 1,
    BankTransfer = 2,
    FonepayQr = 3,
    Esewa = 4,
    Khalti = 5,
    Cheque = 6,
    Credit = 7
}

public enum StockMovementType
{
    Opening = 1,
    Purchase = 2,
    Sale = 3,
    AdjustmentIn = 4,
    AdjustmentOut = 5,
    Reversal = 6
}

public enum AccountCategory
{
    Asset = 1,
    Liability = 2,
    Equity = 3,
    Revenue = 4,
    CostOfGoodsSold = 5,
    Expense = 6
}
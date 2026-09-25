using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;

namespace TDK.Application.Interfaces;

public record PayMongoLineItem(string Name, decimal Amount, int Quantity = 1, string? Description = null);
public record PayMongoBilling(string Name, string? Email, string? Phone);

public interface IPayMongoService
{
    Task<string> CreateCheckoutSessionAsync(
        string referenceNumber, 
        List<PayMongoLineItem> lineItems, 
        PayMongoBilling billing,
        CancellationToken cancellationToken = default);
        
    bool VerifyWebhookSignature(string payload, string signatureHeader);
}

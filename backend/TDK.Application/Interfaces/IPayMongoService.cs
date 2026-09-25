using System.Threading.Tasks;

namespace TDK.Application.Interfaces;

public interface IPayMongoService
{
    Task<string> CreateLinkAsync(decimal amount, string description, string referenceNumber, System.Threading.CancellationToken cancellationToken = default);
    bool VerifyWebhookSignature(string payload, string signatureHeader);
}

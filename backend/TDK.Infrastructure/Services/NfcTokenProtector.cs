using Microsoft.AspNetCore.DataProtection;
using TDK.Application.Interfaces;

namespace TDK.Infrastructure.Services;

public sealed class NfcTokenProtector : INfcTokenProtector
{
    private readonly IDataProtector _protector;

    public NfcTokenProtector(IDataProtectionProvider provider) =>
        _protector = provider.CreateProtector("TDK.CustomerNfcToken.v1");

    public string Protect(string token) => _protector.Protect(token);

    public bool TryUnprotect(string protectedToken, out string token)
    {
        try
        {
            token = _protector.Unprotect(protectedToken);
            return true;
        }
        catch
        {
            token = string.Empty;
            return false;
        }
    }
}

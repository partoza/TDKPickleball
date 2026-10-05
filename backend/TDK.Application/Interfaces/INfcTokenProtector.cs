namespace TDK.Application.Interfaces;

public interface INfcTokenProtector
{
    string Protect(string token);
    bool TryUnprotect(string protectedToken, out string token);
}

using System.Net;
using System.Net.Mail;
using System.Net.Mime;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using QRCoder;
using TDK.Application.Interfaces;
using TDK.Domain.Entities;

namespace TDK.Infrastructure.Services;

public class SmtpEmailService : IEmailService
{
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task SendBookingConfirmationAsync(Booking booking, string courtName, CancellationToken cancellationToken = default) =>
        SendAsync(booking.Email, $"TDK booking {booking.BookingReference}", BuildBody(booking, courtName, "Your pickleball schedule is confirmed."), cancellationToken);

    public Task SendBookingReminderAsync(Booking booking, string courtName, CancellationToken cancellationToken = default) =>
        SendAsync(booking.Email, $"Reminder: {booking.BookingReference} starts in one hour", BuildBody(booking, courtName, "Your pickleball schedule starts in one hour."), cancellationToken);

    public Task SendTemporaryPasswordAsync(string email, string firstName, string temporaryPassword, CancellationToken cancellationToken = default) =>
        SendPlainAsync(email, "Your TDK account", $"Hello {firstName},\n\nYour temporary password is: {temporaryPassword}\n\nSign in and create a new password before accessing the administration portal.", cancellationToken);

    private async Task SendAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(to))
        {
            _logger.LogInformation("Booking email was skipped because no recipient email was provided");
            return;
        }
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            _logger.LogWarning("SMTP is not configured; email to {Recipient} was skipped", to);
            return;
        }

        using var message = new MailMessage(_configuration["Smtp:From"] ?? "noreply@thedirtykitchen.ph", to, subject, body) { IsBodyHtml = false };
        using var generator = new QRCodeGenerator();
        using var qrData = generator.CreateQrCode(ExtractReference(body), QRCodeGenerator.ECCLevel.Q);
        var qrBytes = new PngByteQRCode(qrData).GetGraphic(8);
        var html = $"<div style='font-family:-apple-system,BlinkMacSystemFont,Segoe UI,sans-serif;line-height:1.6;color:#172033'><pre style='font-family:inherit;white-space:pre-wrap'>{WebUtility.HtmlEncode(body)}</pre><p><strong>Booking QR</strong></p><img src='cid:booking-qr' width='220' height='220' alt='Booking QR code' /></div>";
        var view = AlternateView.CreateAlternateViewFromString(html, null, MediaTypeNames.Text.Html);
        var resource = new LinkedResource(new MemoryStream(qrBytes), MediaTypeNames.Image.Png) { ContentId = "booking-qr", TransferEncoding = TransferEncoding.Base64 };
        view.LinkedResources.Add(resource);
        message.AlternateViews.Add(view);
        using var client = new SmtpClient(host, _configuration.GetValue("Smtp:Port", 587))
        {
            EnableSsl = _configuration.GetValue("Smtp:EnableSsl", true),
            Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"])
        };
        await client.SendMailAsync(message, cancellationToken);
    }

    private async Task SendPlainAsync(string to, string subject, string body, CancellationToken cancellationToken)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host)) throw new InvalidOperationException("SMTP must be configured before creating a user");
        using var message = new MailMessage(_configuration["Smtp:From"] ?? "noreply@thedirtykitchen.ph", to, subject, body);
        using var client = new SmtpClient(host, _configuration.GetValue("Smtp:Port", 587))
        {
            EnableSsl = _configuration.GetValue("Smtp:EnableSsl", true),
            Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"])
        };
        await client.SendMailAsync(message, cancellationToken);
    }

    private static string ExtractReference(string body) => body.Split('\n').Select(x => x.Trim()).First(x => x.StartsWith("Reference:", StringComparison.Ordinal)).Split(':', 2)[1].Trim();

    private static string BuildBody(Booking booking, string courtName, string heading) => $"""
        {heading}

        Reference: {booking.BookingReference}
        Court: {courtName}
        Date: {booking.BookingDate:MMMM d, yyyy}
        Time: {booking.StartTime:h:mm tt} - {booking.EndTime:h:mm tt}
        Status: {booking.Status}
        Amount: PHP {booking.TotalAmount:N2}
        Paid: PHP {booking.AmountPaid:N2}
        Remaining: PHP {Math.Max(0, booking.TotalAmount - booking.AmountPaid):N2}

        Present the QR code containing your booking reference when you arrive.
        """;
}

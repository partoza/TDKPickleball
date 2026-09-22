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
    private const string BrandRed = "#861721";
    private const string BrandLogoUrl = "https://res.cloudinary.com/krofxeib/image/upload/v1790088474/tdk-logo.png";
    private const string BrandIconUrl = "https://res.cloudinary.com/krofxeib/image/upload/v1790088412/tdk-icon.png";
    private readonly IConfiguration _configuration;
    private readonly ILogger<SmtpEmailService> _logger;

    public SmtpEmailService(IConfiguration configuration, ILogger<SmtpEmailService> logger)
    {
        _configuration = configuration;
        _logger = logger;
    }

    public Task SendBookingConfirmationAsync(Booking booking, string courtName, CancellationToken cancellationToken = default) =>
        SendBookingAsync(booking, courtName, false, cancellationToken);

    public Task SendBookingReminderAsync(Booking booking, string courtName, CancellationToken cancellationToken = default) =>
        SendBookingAsync(booking, courtName, true, cancellationToken);

    public Task SendTemporaryPasswordAsync(string email, string firstName, string temporaryPassword, CancellationToken cancellationToken = default)
    {
        var plainText = $"Hello {firstName},\n\nYour temporary password is: {temporaryPassword}\n\nSign in and create a new password before accessing the administration portal.";
        var loginUrl = $"{GetFrontendUrl()}/tdkadmin";
        var html = WrapEmail($"""
            <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{BrandRed};">Account invitation</div>
            <h1 style="margin:12px 0 10px;font-size:28px;line-height:1.2;letter-spacing:-.03em;color:#111111;">Welcome to TDK.</h1>
            <p style="margin:0;color:#666666;font-size:15px;line-height:1.7;">Hello {Encode(firstName)}, your administration account is ready. Use this one-time password to sign in.</p>
            <div style="margin:28px 0;padding:18px 20px;border:1px solid #e7e7e7;border-radius:12px;background:#fafafa;">
              <div style="margin-bottom:8px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#777777;">Temporary password</div>
              <div style="font-family:SFMono-Regular,Consolas,Liberation Mono,monospace;font-size:20px;font-weight:700;letter-spacing:.04em;color:#111111;">{Encode(temporaryPassword)}</div>
            </div>
            {Button(loginUrl, "Open admin console")}
            <p style="margin:24px 0 0;color:#777777;font-size:13px;line-height:1.6;">You will be asked to replace this password immediately. Do not forward this email.</p>
            """, "Secure account access");
        return SendMessageAsync(email, "Your TDK administration account", plainText, html, null, cancellationToken, true);
    }

    private async Task SendBookingAsync(Booking booking, string courtName, bool isReminder, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(booking.Email))
        {
            _logger.LogInformation("Booking email was skipped because no recipient email was provided");
            return;
        }

        var title = isReminder ? "Your booking starts soon." : "Your court is booked.";
        var eyebrow = isReminder ? "Starts in one hour" : "Booking confirmed";
        var subject = isReminder ? $"Reminder: {booking.BookingReference} starts in one hour" : $"Booking confirmed - {booking.BookingReference}";
        var plainText = BuildPlainText(booking, courtName, isReminder);
        var html = BuildBookingHtml(booking, courtName, title, eyebrow);

        using var generator = new QRCodeGenerator();
        using var qrData = generator.CreateQrCode(booking.BookingReference, QRCodeGenerator.ECCLevel.H);
        
        byte[] qrBytes;
        try
        {
            using var httpClient = new System.Net.Http.HttpClient();
            var logoTask = httpClient.GetByteArrayAsync(BrandLogoUrl, cancellationToken);
            var iconTask = httpClient.GetByteArrayAsync(BrandIconUrl, cancellationToken);
            await Task.WhenAll(logoTask, iconTask);

            using var logoMs = new MemoryStream(logoTask.Result);
            using var logoImage = System.Drawing.Image.FromStream(logoMs);

            using var iconMs = new MemoryStream(iconTask.Result);
            using var iconImage = System.Drawing.Image.FromStream(iconMs);
            using var iconBitmap = new System.Drawing.Bitmap(iconImage);

            using var qr = new QRCode(qrData);
            // GetGraphic(pixelsPerModule, darkColor, lightColor, icon, iconSizePercent, iconBorderWidth)
            using var qrImage = qr.GetGraphic(8, System.Drawing.Color.Black, System.Drawing.Color.White, iconBitmap, 25, 2, true);

            int width = 440;
            int height = 540;
            using var bitmap = new System.Drawing.Bitmap(width, height);
            using var g = System.Drawing.Graphics.FromImage(bitmap);
            g.Clear(System.Drawing.Color.White);
            g.SmoothingMode = System.Drawing.Drawing2D.SmoothingMode.AntiAlias;
            g.TextRenderingHint = System.Drawing.Text.TextRenderingHint.AntiAlias;

            int logoW = 200;
            int logoH = (int)((float)logoImage.Height / logoImage.Width * logoW);
            g.DrawImage(logoImage, (width - logoW) / 2, 30, logoW, logoH);

            int qrSize = 320;
            g.DrawImage(qrImage, (width - qrSize) / 2, 30 + logoH + 20, qrSize, qrSize);

            using var fontRef = new System.Drawing.Font("Arial", 18, System.Drawing.FontStyle.Bold);
            using var brushRef = new System.Drawing.SolidBrush(System.Drawing.Color.Black);
            var stringFormat = new System.Drawing.StringFormat { Alignment = System.Drawing.StringAlignment.Center };
            g.DrawString(booking.BookingReference, fontRef, brushRef, new System.Drawing.RectangleF(0, 30 + logoH + 20 + qrSize + 15, width, 30), stringFormat);

            using var fontName = new System.Drawing.Font("Arial", 14, System.Drawing.FontStyle.Regular);
            using var brushName = new System.Drawing.SolidBrush(System.Drawing.Color.FromArgb(255, 71, 85, 105)); // slate-600
            g.DrawString(booking.CustomerName, fontName, brushName, new System.Drawing.RectangleF(0, 30 + logoH + 20 + qrSize + 45, width, 30), stringFormat);

            using var ms = new MemoryStream();
            bitmap.Save(ms, System.Drawing.Imaging.ImageFormat.Png);
            qrBytes = ms.ToArray();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to generate composite QR image");
            qrBytes = new PngByteQRCode(qrData).GetGraphic(6);
        }

        await SendMessageAsync(booking.Email, subject, plainText, html, qrBytes, cancellationToken, false);
    }

    private async Task SendMessageAsync(string to, string subject, string plainText, string html, byte[]? qrBytes, CancellationToken cancellationToken, bool requireConfiguration)
    {
        var host = _configuration["Smtp:Host"];
        if (string.IsNullOrWhiteSpace(host))
        {
            if (requireConfiguration) throw new InvalidOperationException("SMTP must be configured before creating a user");
            _logger.LogWarning("SMTP is not configured; email to {Recipient} was skipped", to);
            return;
        }

        using var message = new MailMessage
        {
            From = new MailAddress(_configuration["Smtp:From"] ?? "noreply@thedirtykitchen.ph", "The Dirty Kitchen"),
            Subject = subject,
            Body = plainText,
            IsBodyHtml = false
        };
        message.To.Add(to);

        var htmlView = AlternateView.CreateAlternateViewFromString(html, null, MediaTypeNames.Text.Html);
        if (qrBytes is not null)
        {
            var resource = new LinkedResource(new MemoryStream(qrBytes), MediaTypeNames.Image.Png)
            {
                ContentId = "tdk-booking-qr",
                TransferEncoding = TransferEncoding.Base64
            };
            resource.ContentType.Name = "tdk-booking-qr.png";
            htmlView.LinkedResources.Add(resource);
        }
        message.AlternateViews.Add(htmlView);

        using var client = new SmtpClient(host, _configuration.GetValue("Smtp:Port", 587))
        {
            EnableSsl = _configuration.GetValue("Smtp:EnableSsl", true),
            Credentials = new NetworkCredential(_configuration["Smtp:Username"], _configuration["Smtp:Password"])
        };
        await client.SendMailAsync(message, cancellationToken);
    }

    private string BuildBookingHtml(Booking booking, string courtName, string title, string eyebrow)
    {
        var remaining = Math.Max(0, booking.TotalAmount - booking.AmountPaid);
        var verifyUrl = $"{GetFrontendUrl()}/verify";
        var content = $"""
            <div style="font-size:12px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;color:{BrandRed};">{Encode(eyebrow)}</div>
            <h1 style="margin:12px 0 20px;font-size:30px;line-height:1.15;letter-spacing:-.035em;color:#111111;">{Encode(title)}</h1>
            <p style="margin:0 0 8px;color:#111111;font-size:15px;line-height:1.7;">Hello {Encode(booking.CustomerName)},</p>
            <p style="margin:0 0 28px;color:#666666;font-size:15px;line-height:1.7;">Everything you need for your visit is below.</p>

            <div style="margin:0 0 18px;">
              {DetailRow("Booked by", booking.CustomerName)}
              {DetailRow("Court", courtName)}
              {DetailRow("Date", booking.BookingDate.ToString("MMMM d, yyyy"))}
              {DetailRow("Time", $"{booking.StartTime:h:mm tt} - {booking.EndTime:h:mm tt}")}
              {DetailRow("Status", booking.Status.ToString(), true)}
            </div>

            <div style="margin:0 0 24px;">
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
                <tr><td style="padding-top:9px;color:#777777;font-size:13px;">Total</td><td align="right" style="padding-top:9px;color:#111111;font-size:14px;font-weight:700;">PHP {booking.TotalAmount:N2}</td></tr>
                <tr><td style="padding-top:9px;color:#777777;font-size:13px;">Paid</td><td align="right" style="padding-top:9px;color:#111111;font-size:14px;font-weight:700;">PHP {booking.AmountPaid:N2}</td></tr>
                <tr><td style="padding-top:9px;color:#777777;font-size:13px;">Remaining</td><td align="right" style="padding-top:9px;color:{BrandRed};font-size:14px;font-weight:700;">PHP {remaining:N2}</td></tr>
              </table>
            </div>

            <div style="margin:24px 0 0;padding-top:24px;border-top:1px solid #eeeeee;">
              <div style="margin-bottom:14px;font-size:11px;font-weight:700;letter-spacing:.1em;text-transform:uppercase;color:#777777;">Booking QR</div>
              <div style="width:168px;height:168px;margin:0;">
                <img src="cid:tdk-booking-qr" width="168" height="168" alt="Booking verification QR code" style="display:block;width:168px;height:168px;margin:0;border:0;" />
              </div>
              <div style="margin-top:16px;font-family:SFMono-Regular,Consolas,Liberation Mono,monospace;font-size:15px;font-weight:700;letter-spacing:.08em;color:#111111;">{Encode(booking.BookingReference)}</div>
              <p style="margin:8px 0 0;color:#555555;font-size:13px;font-weight:700;line-height:1.5;">Booked for {Encode(booking.CustomerName)}</p>
              <p style="margin:4px 0 0;color:#888888;font-size:12px;line-height:1.5;">Show this code when you arrive.</p>
            </div>

            <div style="margin-top:24px;">{Button(verifyUrl, "Verify booking")}</div>
            """;
        return WrapEmail(content, booking.BookingReference);
    }

    private static string DetailRow(string label, string value, bool last = false) => $"""
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr><td style="padding:4px 0;color:#777777;font-size:13px;">{Encode(label)}</td><td align="right" style="padding:4px 0;color:#111111;font-size:13px;font-weight:650;">{Encode(value)}</td></tr>
        </table>
        """;

    private static string Button(string url, string label) => $"""
        <table role="presentation" cellspacing="0" cellpadding="0" border="0"><tr><td style="border-radius:9px;background:#111111;"><a href="{Encode(url)}" style="display:inline-block;padding:12px 18px;color:#ffffff;text-decoration:none;font-size:13px;font-weight:700;">{Encode(label)}</a></td></tr></table>
        """;

    private static string WrapEmail(string content, string preheader) => $"""
        <!doctype html><html><head><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light only"></head>
        <body style="margin:0;padding:0;background:#ffffff;color:#111111;">
          <div style="display:none;max-height:0;overflow:hidden;opacity:0;">{Encode(preheader)}</div>
          <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:#ffffff;"><tr><td align="left" style="padding:32px 24px;">
            <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="max-width:560px;background:#ffffff;">
              <tr><td align="left" style="padding:0 0 24px;"><img src="{BrandLogoUrl}" width="190" alt="The Dirty Kitchen Pickleball Court" style="display:block;width:190px;max-width:100%;height:auto;border:0;" /></td></tr>
              <tr><td style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;">{content}</td></tr>
              <tr><td align="left" style="padding:24px 0 0;border-top:1px solid #eeeeee;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Arial,sans-serif;color:#888888;font-size:11px;line-height:1.6;margin-top:24px;display:block;">The Dirty Kitchen Pickleball Court<br>Automated booking email • Please do not reply.</td></tr>
            </table>
          </td></tr></table>
        </body></html>
        """;

    private static string BuildPlainText(Booking booking, string courtName, bool isReminder) => $"""
        {(isReminder ? "Your pickleball schedule starts in one hour." : "Your pickleball schedule is confirmed.")}

        Reference: {booking.BookingReference}
        Booked by: {booking.CustomerName}
        Court: {courtName}
        Date: {booking.BookingDate:MMMM d, yyyy}
        Time: {booking.StartTime:h:mm tt} - {booking.EndTime:h:mm tt}
        Status: {booking.Status}
        Total: PHP {booking.TotalAmount:N2}
        Paid: PHP {booking.AmountPaid:N2}
        Remaining: PHP {Math.Max(0, booking.TotalAmount - booking.AmountPaid):N2}

        Present your booking reference or QR code when you arrive.
        """;

    private string GetFrontendUrl() => (_configuration["Frontend:BaseUrl"] ?? "http://localhost:5173").TrimEnd('/');
    private static string Encode(string? value) => WebUtility.HtmlEncode(value ?? "");
}

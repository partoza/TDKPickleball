using Microsoft.AspNetCore.Http;

namespace TDK.Api.Validation;

public static class ProfileImageValidator
{
    public const long MaximumBytes = 5 * 1024 * 1024;
    public const long MaximumRequestBytes = MaximumBytes + 64 * 1024;

    public static async Task<(bool IsValid, string Error, string FileName, string ContentType)> ValidateAsync(IFormFile? image, CancellationToken cancellationToken)
    {
        if (image is null || image.Length == 0)
            return (false, "Choose a profile image", "", "");
        if (image.Length > MaximumBytes)
            return (false, "Profile images must be 5 MB or smaller", "", "");

        var header = new byte[12];
        await using var stream = image.OpenReadStream();
        var bytesRead = await stream.ReadAsync(header.AsMemory(0, header.Length), cancellationToken);

        if (bytesRead >= 3 && header[0] == 0xFF && header[1] == 0xD8 && header[2] == 0xFF)
            return (true, "", "profile.jpg", "image/jpeg");
        if (bytesRead >= 8 && header.AsSpan(0, 8).SequenceEqual(new byte[] { 0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A }))
            return (true, "", "profile.png", "image/png");
        if (bytesRead >= 12 && header.AsSpan(0, 4).SequenceEqual("RIFF"u8) && header.AsSpan(8, 4).SequenceEqual("WEBP"u8))
            return (true, "", "profile.webp", "image/webp");

        return (false, "Only JPEG, PNG, and WebP profile images are allowed", "", "");
    }
}

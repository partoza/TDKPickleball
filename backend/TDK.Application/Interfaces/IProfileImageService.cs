using TDK.Application.DTOs.Auth;

namespace TDK.Application.Interfaces;

public interface IProfileImageService
{
    Task<ProfileImageUploadResult> UploadAsync(Stream content, string fileName, string contentType, CancellationToken cancellationToken = default);
    Task DeleteAsync(string publicId, CancellationToken cancellationToken = default);
}

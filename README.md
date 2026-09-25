# TDK Pickleball

React/Vite public booking and administration frontend with an ASP.NET Core API and a MySQL-compatible TiDB database.

## Local setup

1. Copy `.env.example` to `frontend/.env` and adjust `VITE_API_URL` if needed.
2. Configure backend secrets outside source control:

   ```powershell
   cd backend
   dotnet user-secrets set "Jwt:Key" "<at-least-32-random-characters>" --project TDK.Api
   dotnet user-secrets set "Authentication:Google:ClientId" "<google-client-id>" --project TDK.Api
   dotnet user-secrets set "Cloudinary:CloudName" "<cloud-name>" --project TDK.Api
   dotnet user-secrets set "Cloudinary:ApiKey" "<api-key>" --project TDK.Api
   dotnet user-secrets set "Cloudinary:ApiSecret" "<api-secret>" --project TDK.Api
   ```

3. In Google Cloud, add `http://localhost:5173` as an authorized JavaScript origin. The Google Identity Services flow does not use a client secret or redirect URI.

4. Start the API with `dotnet run --project TDK.Api` from `backend`.
5. Run `npm install` and `npm run dev` from `frontend`.

The API applies Entity Framework migrations and seeds required roles when it starts.

The Cloudinary cloud name, API key, and API secret must come from the same Product Environment. After changing any Cloudinary user secret, restart the API before testing an upload.

For a production deployment, provide `SeedAdmin__Email` and `SeedAdmin__Password` as environment variables for the first administrator account, then remove or rotate the bootstrap password after provisioning. Configure Cloudinary with `Cloudinary__CloudName`, `Cloudinary__ApiKey`, and `Cloudinary__ApiSecret`; `Cloudinary__Folder` is optional and defaults to `tdk/users`. Set `Frontend__BaseUrl` to the production Vercel URL so links in booking and invitation emails open the deployed frontend.

See [DEPLOYMENT.md](DEPLOYMENT.md) for the complete MonsterASP.NET, TiDB Cloud, environment-variable, and production smoke-test instructions.

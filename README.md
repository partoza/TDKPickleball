# TDK Pickleball

React/Vite public booking and administration frontend with an ASP.NET Core API and SQL Server database.

## Local setup

1. Copy `.env.example` to `frontend/.env` and adjust `VITE_API_URL` if needed.
2. Configure backend secrets outside source control:

   ```powershell
   cd backend
   dotnet user-secrets set "Jwt:Key" "<at-least-32-random-characters>" --project TDK.Api
   dotnet user-secrets set "Authentication:Google:ClientId" "<google-client-id>" --project TDK.Api
   dotnet user-secrets set "Authentication:Google:ClientSecret" "<google-client-secret>" --project TDK.Api
   ```

3. In Google Cloud, register this local authorized redirect URI:

   `http://localhost:5000/signin-google`

4. Start the API with `dotnet run --project TDK.Api` from `backend`.
5. Run `npm install` and `npm run dev` from `frontend`.

The API applies Entity Framework migrations and seeds required roles when it starts.

For a production deployment, provide `SeedAdmin__Email` and `SeedAdmin__Password` as environment variables for the first administrator account, then remove or rotate the bootstrap password after provisioning.

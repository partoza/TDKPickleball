# Production deployment: MonsterASP.NET + TiDB Cloud

The frontend is deployed separately (for example, on Vercel). MonsterASP.NET hosts only the ASP.NET Core API, and TiDB Cloud hosts the MySQL-compatible database.

## 1. Create the TiDB Cloud database

1. Create a TiDB Cloud Starter or Essential cluster.
2. Open the cluster and choose **Connect**.
3. Select the public/standard connection type and generate a database password.
4. Save the host, port, username, password, and database name. The username normally includes the TiDB cluster prefix.
5. Create or select a database named `tdk_db`.

Use this ASP.NET/MySqlConnector connection-string shape. Replace every angle-bracket placeholder:

```text
Server=<TIDB_HOST>;Port=4000;Database=tdk_db;User ID=<TIDB_USERNAME>;Password=<TIDB_PASSWORD>;SslMode=VerifyFull;Pooling=true;MaximumPoolSize=10;ConnectionTimeout=15;DefaultCommandTimeout=60;
```

TiDB Cloud Starter/Essential requires TLS on its public endpoint. `VerifyFull` encrypts the connection and validates both the certificate authority and host name.

The API runs `Database.MigrateAsync()` at startup. The TiDB account therefore needs permission to create and alter the application tables. On the first successful API startup, all EF Core migrations are applied automatically.

## 2. Create the MonsterASP.NET website

1. Create a website in the MonsterASP.NET control panel.
2. Use a .NET 8 website/application pool.
3. Enable HTTPS/Let's Encrypt for the MonsterASP.NET subdomain or custom API domain.
4. Activate WebDeploy and download the `.publishSettings` profile. WebDeploy is preferred because it safely stops and restarts the application during deployment.

Do not set `ASPNETCORE_URLS` on MonsterASP.NET. IIS and the ASP.NET Core Hosting Module assign the internal listening port.

## 3. Add MonsterASP.NET environment variables

Open **Control panel → Websites → Manage website → Scripting → Environment Variables**. Add the following values. Double underscores map to nested `appsettings` sections.

```text
ASPNETCORE_ENVIRONMENT=Production

ConnectionStrings__DefaultConnection=Server=<TIDB_HOST>;Port=4000;Database=tdk_db;User ID=<TIDB_USERNAME>;Password=<TIDB_PASSWORD>;SslMode=VerifyFull;Pooling=true;MaximumPoolSize=10;ConnectionTimeout=15;DefaultCommandTimeout=60;

Jwt__Key=<RANDOM_SECRET_AT_LEAST_32_CHARACTERS>
Jwt__Issuer=TDKApi
Jwt__Audience=TDKUsers
Jwt__AdminSessionHours=24
Jwt__CustomerSessionHours=2

SeedAdmin__Email=<INITIAL_ADMIN_EMAIL>
SeedAdmin__Password=<STRONG_INITIAL_ADMIN_PASSWORD>

Smtp__Host=smtp.gmail.com
Smtp__Port=587
Smtp__EnableSsl=true
Smtp__From=<SMTP_SENDER_EMAIL>
Smtp__Username=<SMTP_SENDER_EMAIL>
Smtp__Password=<GMAIL_APP_PASSWORD>
Smtp__StoreEmail=<STORE_NOTIFICATION_EMAIL>

Authentication__Google__ClientId=<GOOGLE_WEB_CLIENT_ID>

Cloudinary__CloudName=<CLOUDINARY_CLOUD_NAME>
Cloudinary__ApiKey=<CLOUDINARY_API_KEY>
Cloudinary__ApiSecret=<CLOUDINARY_API_SECRET>
Cloudinary__Folder=tdk/users

Frontend__BaseUrl=https://<FRONTEND_DOMAIN>
Cors__AllowedOrigins__0=https://<FRONTEND_DOMAIN>
```

If both the apex and `www` frontend domains are used, add another allowed origin:

```text
Cors__AllowedOrigins__1=https://www.<FRONTEND_DOMAIN>
```

The values in `appsettings.json` and `appsettings.Production.json` remain defaults. MonsterASP.NET environment variables override matching JSON values, so secrets do not need to be uploaded in either file.

Copy the Cloudinary cloud name, API key, and API secret from the same Product Environment. If Cloudinary reports an invalid signature, the API secret does not match the selected cloud/key; replace all three values together and restart the API application so the hosting process reloads them.

After the first administrator is created, change that administrator's password. The bootstrap variables only create the account if it does not already exist; remove them afterward or replace them with values kept securely in the hosting control panel.

## 4. Publish the API

From the repository root, verify and publish:

```powershell
dotnet restore backend\TDK.sln
dotnet build backend\TDK.sln -c Release --no-restore
dotnet publish backend\TDK.Api\TDK.Api.csproj -c Release --no-restore -o .\publish\backend
```

### Visual Studio/WebDeploy

1. Open `backend/TDK.sln` in Visual Studio.
2. Right-click `TDK.Api` and select **Publish**.
3. Import the `.publishSettings` file downloaded from MonsterASP.NET.
4. Publish the `Release` configuration.

### ZIP upload alternative

ZIP the contents inside `publish/backend` (not the parent directory) and deploy that ZIP from MonsterASP.NET. The publish output includes the generated `web.config` needed by IIS.

## 5. Configure the Vercel frontend

Add these production variables to the Vercel project and redeploy:

```text
VITE_API_URL=https://<MONSTERASP_API_DOMAIN>
VITE_GOOGLE_CLIENT_ID=<GOOGLE_WEB_CLIENT_ID>
```

Do not add the Google client secret to Vercel or the frontend. This application uses Google Identity Services ID-token verification and needs only the public web client ID.

In Google Cloud Console, add the production frontend URL under **Authorized JavaScript origins**. This flow does not use a Google redirect URI.

## 6. Production smoke test

Test these in order:

1. `GET https://<API_DOMAIN>/api/courts` returns HTTP 200.
2. `GET https://<API_DOMAIN>/api/schedule-board` returns HTTP 200.
3. Open the frontend `/login` page and complete Google verification.
4. Log in to the admin application.
5. Confirm Courts, Rates, Internal & Coaches, Promos, Bookings, Schedule, Users, Notifications, and Data Storage load without 401 or 500 responses.
6. Create one test booking and confirm the customer/store email and receipt handling.
7. Upload and then replace one profile picture to confirm Cloudinary upload and old-image deletion.

If the API does not start, inspect **Websites → Manage website → Logs → ASP.NET Core Debug** in MonsterASP.NET. The most common causes are an invalid TiDB connection string, missing `Jwt__Key`, missing database DDL permissions, or an environment-variable name that uses a single underscore instead of a double underscore.

## Storage note

Application records are stored in TiDB. Profile images are stored in Cloudinary. Booking receipt images are currently stored on the MonsterASP.NET website disk under `App_Data/receipts`; keep website backups enabled and do not treat TiDB backups as receipt-file backups.

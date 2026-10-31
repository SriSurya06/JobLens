# JobLens Backend

The backend is a Node.js and Express REST API backed by MongoDB. The API runs on port 5000 and stores uploaded files under `uploads/`.

## Run with Docker Compose

The recommended way to run the application is from the repository root. Ensure `CCPDMS_FINAL/.env` exists, then start all services:

```bash
docker compose up --build
```

Compose starts MongoDB, this API, and the frontend. The API health endpoint is [http://localhost:5000/api/health](http://localhost:5000/api/health). Nginx in the frontend container proxies `/api` and `/uploads` requests to this service.

To seed demo data once the services are running:

```bash
docker compose exec backend node seed.js
```

For the full startup, configuration, and data-volume instructions, see the [root README](../README.md).

## Backend configuration

Compose reads `CCPDMS_FINAL/.env`. If the file does not exist, copy the safe template and set a strong `JWT_SECRET`:

```bash
cp CCPDMS_FINAL/.env.docker.example CCPDMS_FINAL/.env
```

On Windows PowerShell:

```powershell
if (!(Test-Path CCPDMS_FINAL/.env)) {
  Copy-Item CCPDMS_FINAL/.env.docker.example CCPDMS_FINAL/.env
}
```

Email and AI provider settings are optional. Compose supplies the MongoDB container URL and frontend origin. Never commit `.env` files, passwords, or API keys.

## Run the API outside Docker

For local development, use a MongoDB instance reachable from your machine and configure `MONGO_URI`, `JWT_SECRET`, and `CLIENT_URL` in `CCPDMS_FINAL/.env`. Then run from this directory:

```bash
npm install
npm run dev
```

The API uses `node server.js` for production mode:

```bash
npm start
```

Health check: `GET /api/health`.

# JobLens Frontend

The frontend is a React application. In Docker Compose it is built into static assets and served by Nginx, which also proxies API and uploaded-file requests to the backend.

## Run the full application

From the repository root, configure `CCPDMS_FINAL/.env` if needed and start the stack:

```bash
docker compose up --build
```

Open the app at [http://localhost:3000](http://localhost:3000). For environment setup, database seeding, and shutdown instructions, see the [root README](../README.md).

## Local frontend development

Start the backend and MongoDB first, then run these commands from this directory:

```bash
npm install --legacy-peer-deps
npm start
```

The development server runs at [http://localhost:3000](http://localhost:3000). The `proxy` setting in `package.json` forwards API requests to `http://localhost:5000`.

Create a production build with:

```bash
npm run build
```

The Docker image uses this build and serves it through Nginx on port 80 inside the container, published as port 3000 by Compose.

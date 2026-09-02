# TopNosh

A self-hosted recipe library management system with shopping lists.

## Seed data

```shell
prisma db seed
```

## Docker Deployment

TopNosh is packaged as a single-container deployment where the NestJS API
application serves both the REST API endpoints and the static Angular frontend
SPA from a single Node.js process on port `3000`.

Database persistence (SQLite) and configuration files (`.env` for API,
`app.properties` for Angular frontend) are maintained on the host machine and
mounted into the container.

### 1. Configuration Setup

Before building and running the container, create the configuration files from
their provided examples and initialize the database file on the host.

#### API Environment (`.env`)

Copy `.env.example` to `.env` and configure your secret keys and database URL:

```bash
cp .env.example .env
```

Ensure `DATABASE_URL` in `.env` points to the container path:

```env
DATABASE_URL="file:/app/dev.db"
JWT_SECRET="your-secure-jwt-secret"
```

#### Frontend Configuration (`app.properties`)

Copy `apps/web/public/assets/app.properties.example` to `app.properties` on the
host:

```bash
cp apps/web/public/assets/app.properties.example app.properties
```

Configure runtime settings:

```properties
PRODUCTION=true
API_URL=http://localhost:3000/api
```

#### Database Initialization

Initialize or create the SQLite database file on the host before mounting:

```bash
# Touch file if not already existing
touch dev.db

# Apply database migrations
npx prisma migrate deploy
```

### 2. Building the Docker Image

Build the Docker image:

```bash
docker build -t top-nosh .
```

To rebuild the image without using cache:

```bash
docker build --no-cache -t top-nosh .
```

### 3. Running the Docker Container

Run the container with volume mounts for the SQLite database, `.env`, and
`app.properties`:

#### Linux / macOS (Bash / Zsh)

```bash
docker run -d \
  --name top-nosh \
  -p 3000:3000 \
  -v "$(pwd)/dev.db:/app/dev.db" \
  -v "$(pwd)/.env:/app/.env" \
  -v "$(pwd)/app.properties:/app/dist/apps/web/browser/assets/app.properties" \
  top-nosh
```

#### Windows (PowerShell)

```powershell
docker run -d `
  --name top-nosh `
  -p 3000:3000 `
  -v "${PWD}/dev.db:/app/dev.db" `
  -v "${PWD}/.env:/app/.env" `
  -v "${PWD}/app.properties:/app/dist/apps/web/browser/assets/app.properties" `
  top-nosh
```

### 4. Verification

Once the container is running:

- **Web Interface**: Open `http://localhost:3000` in your browser to access the
  Angular application.
- **REST API**: Send requests to `http://localhost:3000/api` (e.g.
  `curl http://localhost:3000/api`).
- **Configuration Assets**: Verify mounted properties at
  `http://localhost:3000/assets/app.properties`.

### 5. Managing the Container

- View logs:
  ```bash
  docker logs -f top-nosh
  ```
- Stop container:
  ```bash
  docker stop top-nosh
  ```
- Restart container:
  ```bash
  docker restart top-nosh
  ```
- Remove container:
  ```bash
  docker rm -f top-nosh
  ```

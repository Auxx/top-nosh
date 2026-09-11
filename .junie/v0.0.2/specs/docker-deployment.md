# Docker Deployment

Prepare the workspace for Docker deployment using Single-Container Architecture.
Serve both the NestJS API (`api` project) and the Angular frontend (`web`
project) from a single Node process.

## Requirements

- Use `@nestjs/serve-static`.
- Use NodeJs version specified in `mise.toml` inside the Dockerfile.
- Dockerfile should contain a build stage which builds both `api` and `web`
  projects.
- Dockerfile should contain production stage which runs built projects and
  exposes port 3000.
- SQLite database file should be placed outside the docker container to persist
  data.
- `.env` file used by `api` project should be placed outside the docker
  container to provide environment variables to the `api` project.
- `app.properties` file used by `web` project should be placed outside the
  docker container to provide environment variables to the `web` project.
- Update `README.md` with instructions on how to build, re-build and run docker
  container.

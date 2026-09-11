# top-nosh workspace layout and structure

`top-nosh` is an NX-powered workspace consisting of multiple projects. Its goal
is to create a self-hosted web application with a back-end API to manage a
private collection of food recipes and shopping lists. It is deployed using
Docker.

## Tech stack

- NX - manages mono-repo workspace.
- Angular - front-end framework.
- Material Design Version 3 - front-end components and design system.
- NestJs - back-end framework.
- Prisma - ORM used in back-end projects.
- SQLite - a database used in back-end projects.
- TypeScript - a programming language used in all projects.
- SCSS - styling language used in all projects.
- JWT - JSON Web Token used for authentication.
- Jest - test runner used for all projects inside the workspace.
- ESLint - linter used for all projects inside the workspace.
- dprint - code formatter.

## Workspace layout

- Application type projects are located at `apps`.
- Library type projects are located at `libs`.
- Back-end API project is located at `apps/api`.
- Front-end project is located at `apps/web`.
- Custom UI components are located inside `ui` library project at `libs/ui`.
- Custom NX generators and executors are located inside `dev-toolkit` library
  project at `libs/dev-toolkit`.

## Front-end project structure

- The source code of front-end projects is located in `src` folder of the
  project, for example, `apps/web/src` for `web` project.
- Each project is split into features; each feature contains a set of related
  components, services, and other files in corresponding subfolders. For
  example, a feature called `auth` for `web` project is located at
  `apps/web/src/auth`, and it contains subfolders like `components` and
  `services`.

## Back-end project structure

- The source code of back-end projects is located in `src` folder of the
  project, for example, `apps/api/src` for `api` project.
- Each project is split into features; each feature contains a set of related
  controllers, services, and other files. Features are located inside `app`
  subfolder. For example, a feature called `auth` for `api` project is located
  at `apps/api/src/app/auth`. Controllers and services live inside the feature
  folder. DTOs, guards, and other files live inside corresponding subfolders.
  For example, login DTO is located at `apps/api/src/app/auth/dto/login.dto.ts`.
- Database schema is located at `prisma/schema.prisma`.
- Database migrations are located at `prisma/migrations`.

## Building projects

- **Build All projects**: `nx run-many --all --target=build --no-tui`
- **Build API project**: `nx run api:build:production --no-tui`
- **Build WEB project**: `nx run web:build:production --no-tui`

## Testing projects

- **Test All projects**: `nx run-many --all --target=test --no-tui`
- **Test API project**: `nx run api:test --no-tui`
- **Test WEB project**: `nx run web:test --no-tui`
- **Single file**: `npm exec nx test <project-name> --testFile=<path-to-spec>`

## Linting projects

- **Lint All projects**: `nx run-many --all --target=lint --no-tui`
- **Lint API project**: `nx run api:lint --no-tui`
- **Lint WEB project**: `nx run web:lint --no-tui`

## Formatting the code

- **Format the code**: `npm run format`
- **Check formatting**: `npm run format:check`

## Finalising the work

Once required code changes are made, lint and test all projects to ensure that
there are no issues. Fix issues, if any. Once the code passes linting and
testing, format it.

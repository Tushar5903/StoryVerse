# AGENTS.md

Two independent apps in this repo:

- `StoryVerse/` — Spring Boot 3.5.16 REST backend (Java 21, Maven, package `com.storyreview`, main class `StoryReviewApplication`)
- `FRONTEND/` — React 19 + Vite 8 + Redux Toolkit + react-router 7 + framer-motion + swiper (plain JS, no TS)

## Commands

Backend (run in `StoryVerse/`):
- Dev server: `.\mvnw.cmd spring-boot:run` (Windows) or `./mvnw spring-boot:run`
- Tests: `.\mvnw.cmd test` — only 2 tests; `JwtServiceTest` is pure unit, `StoryVerseApplicationTests` loads the context and fails without MySQL

Frontend (run in `FRONTEND/`):
- Dev server: `npm run dev`
- Lint: `npm run lint` (ESLint flat config, `eslint .`)
- Build: `npm run build`
- No frontend test framework.

## Backend gotchas

- Serves on port **8082** (`${SERVER_PORT:8082}`), not 8080; API base path is `/api`. Swagger UI at `/swagger-ui.html`.
- Requires a running MySQL at `jdbc:mysql://127.0.0.1:3306/storyverse_db` with user/password `root`/`tushar` (defaults in `StoryVerse/src/main/resources/application.properties`).
- `spring.jpa.hibernate.ddl-auto=validate` + Flyway enabled (`classpath:db/migration`, migrations V1–V6): schema changes MUST be a new `V7__*.sql` migration, never rely on JPA DDL.
- Mail (Gmail), Cloudinary, and JWT secret are committed as dev defaults in `application.properties`, all env-overridable (`MAIL_*`, `CLOUDINARY_*`, `JWT_SECRET`). Don't introduce new hardcoded secrets.
- Security: stateless JWT; `/api/auth/**`, swagger, actuator health, GET `/api/authors*`, `/api/books*`, GET `/api/books/*/chapters*`, and GET `/api/reviews` are public — everything else requires `Authorization: Bearer`. Chapter/review reads of *draft* books still 404 for non-owners.
- Book genres are a fixed set (`BookGenre` enum: Action, Comedy, Drama, Horror, Informative, Mystery, Romance, Sci-Fi, Sports, Thriller). Genre is validated/normalized server-side; the catalog filter (`GET /api/books?genre=`) and the frontend dropdown both use this list. Expose via `GET /api/books/genres`.

## Backend conventions

- Service layer: `XxxService` interface + `XxxServiceImpl` in `service/impl/`.
- Response DTOs are Java records added to the single `dto/response/ApiResponses.java` class (not one file per response); request DTOs are grouped per-domain in `dto/request/XxxRequests.java`.
- Auth/roles via `@EnableMethodSecurity`; uploads go through Cloudinary (`UploadController`, 10MB multipart cap).

## Frontend conventions

- Page-per-folder pattern: `src/pages/<PageName>/PageName.jsx` with a matching `.css`; shared UI in `src/components/common/`, layouts in `src/components/layout/`.
- All API access goes through `src/services/apiClient.js` via per-domain modules in `src/services/` (`booksApi.js`, `authorsApi.js`, ...). `apiClient` injects the JWT from `localStorage` (`sv_token`, `sv_refresh_token` — keys must stay consistent) and contains normalization shims for chapters and the admin dashboard payloads.
- Backend URL defaults to `http://localhost:8082/api`; override via `VITE_API_URL` (there is no Vite dev proxy).
- React Compiler is enabled via `vite.config.js` (`reactCompilerPreset` from `@vitejs/plugin-react`); keep it in mind when writing hook/memo patterns.

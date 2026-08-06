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
- `spring.jpa.hibernate.ddl-auto=validate` + Flyway enabled (`classpath:db/migration`, migrations V1–V7): schema changes MUST be a new `V8__*.sql` migration, never rely on JPA DDL.
- Mail (Gmail), Cloudinary, and JWT secret are committed as dev defaults in `application.properties`, all env-overridable (`MAIL_*`, `CLOUDINARY_*`, `JWT_SECRET`). Don't introduce new hardcoded secrets.
- Security: stateless JWT; `/api/auth/**`, swagger, actuator health, GET `/api/authors*`, `/api/books*`, `/api/users/*`, `/api/health`, GET `/api/books/*/chapters*`, and GET `/api/reviews` are public — everything else requires `Authorization: Bearer`. Chapter reads of *draft* books 404 for non-owners; review reads of drafts return an empty page — except the book's owner or an admin, who pass `@AuthenticationPrincipal CurrentUser` (nullable) through the service and get access (same pattern in `ChapterServiceImpl.assertReadable`).
- Book genres are a fixed set (`BookGenre` enum: Action, Comedy, Drama, Horror, Informative, Mystery, Romance, Sci-Fi, Sports, Thriller). Genre is validated/normalized server-side; the catalog filter (`GET /api/books?genre=`) and the frontend dropdown both use this list. Expose via `GET /api/books/genres`.

## Backend conventions

- Service layer: `XxxService` interface + `XxxServiceImpl` in `service/impl/`.
- Response DTOs are Java records added to the single `dto/response/ApiResponses.java` class (not one file per response); request DTOs are grouped per-domain in `dto/request/XxxRequests.java`.
- Auth/roles via `@EnableMethodSecurity`; uploads go through Cloudinary (`UploadController`, 10MB multipart cap).
- Reading progress: `ProgressService`/`ProgressServiceImpl` + `ReadingProgressRepository`; endpoints `POST /api/progress`, `DELETE /api/progress/{chapterId}`, `GET /api/progress`, `GET /api/progress/book/{bookId}`.
- `GET /api/users/{identifier}` resolves a user by id *or* username.

## Frontend conventions

- Page-per-folder pattern: `src/pages/<PageName>/PageName.jsx` with a matching `.css`; shared UI in `src/components/common/` (`Button`, `ConfirmModal`, `StatCard`, `UserAvatar`, `UserHandle`, `VerdictBadge`), layouts in `src/components/layout/` (`SharedNav` + `SearchBox` + `UserMenu`, `Footer`).
- Reviews are the most intricate page: `ReviewsPage` and `UserProfilePage` share `ReviewsPage.css`; verdicts render via color-coded classes (`filter-go-for-it`, etc. — class names are built with `replace(/_/g, '-')`, keep that normalization), and review deletion goes through `ConfirmModal` (no `window.confirm`). `BookDetailPage` renders verdicts with its own `.review-verdict` span + `.verdict-picker button.selected.*` rules (JSX emits lowercased, underscore-stripped verdict names).
- All API access goes through `src/services/apiClient.js` via per-domain modules in `src/services/` (`booksApi.js`, `authorsApi.js`, ...). `apiClient` injects the JWT from `localStorage` (`sv_token`, `sv_refresh_token` — keys must stay consistent), contains normalization shims for chapters and the admin dashboard payloads, and on 401 clears auth and redirects to `/login` unless the request targets an auth endpoint (`AUTH_PATHS`).
- Backend URL defaults to `http://localhost:8082/api`; override via `VITE_API_URL` (there is no Vite dev proxy). Env files committed: `.env`, `.env.production`, `.env.example` (also `VITE_APP_NAME`, `VITE_CLOUDINARY_*`); `.env.local`/`.env` are gitignored.
- React Compiler is enabled via `vite.config.js` (`reactCompilerPreset` from `@vitejs/plugin-react`); keep it in mind when writing hook/memo patterns.
- Sticky page elements assume the `SharedNav` bar (72px desktop and mobile, `sticky top:0`); if you change the navbar height, re-check sticky offsets like the review cards at `top:90px`. The bar is a 3-zone grid (`auto 1fr auto 1fr auto`, named areas brand/nav/actions) that embeds `SearchBox` in the actions zone — desktop search hides below 800px, the mobile drawer gets its own variant.
- Search: `SearchBox` (in `SharedNav/`) debounces ~250ms against `GET /api/books?q=<term>` and shows a dropdown of top results; Enter submits to `/search?q=…`. The `/search` route renders `ExplorePage` — `?q=` shows a search-results grid, `?view=` shows an All-Books grid for that section.
- Explore page carousels are native flex rows (wheel-to-horizontal with end guards, pointer drag, scroll-snap, hidden scrollbars) — NOT swiper; cards are 200×400 with a 78/22 poster/info split and a 2-line-clamped title. Swiper (`FreeMode`) is used only by `LandingPage` for the trending shelf.
- `LandingPage` hero shows a "review meter" explainer card whose 4 verdict colors must stay aligned with the `Meter` component in `BookDetailPage` (`SKIP #FF5F7D, TIMEPASS #F4B400, GO_FOR_IT #00D084, PERFECTION #A855F7`).

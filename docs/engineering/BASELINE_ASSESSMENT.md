# MyFamily — Engineering Baseline Assessment

**Epic:** E01 — Engineering Recovery & Platform Modernization  
**Assessment date:** 2026-11-26  
**Branch:** `chore/epic-e01-engineering-recovery`  
**Initial Baseline Commit:** `9152c26d47ade7df1cf5b25dc1f0a4bcd79eb1ff`  
**Environment:** Local development on Windows  
**Frontend:** `http://127.0.0.1:5500`  
**Backend:** `http://localhost:3000`  
**Stack:** Node.js, Express, MongoDB/Mongoose, HTML, CSS, JavaScript

---

## 1. Source Revision & Environment

| Property                | Value / Version                            | Notes                                             |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- |
| Git Branch              | `chore/epic-e01-engineering-recovery`      | Active working branch                             |
| Initial Baseline Commit | `9152c26d47ade7df1cf5b25dc1f0a4bcd79eb1ff` | Initial baseline reference commit                 |
| Node.js Runtime         | `v22.23.5`                                 | Baseline Node.js version (`.nvmrc`: `22`)         |
| npm Package Manager     | `10.9.9`                                   | Baseline package manager                          |
| MongoDB Server Version  | `8.0.39` (`8.0.39-patch-a3d00565977`)      | Verified via `buildInfo` on dev database (`test`) |
| Database Host           | MongoDB Atlas (remote development cluster) | Configured via `MONGO_URL` in `apps/api/.env`     |
| Frontend Host           | `http://127.0.0.1:5500`                    | Local static file server (`apps/web`)             |
| Backend Host            | `http://localhost:3000`                    | Express application (`apps/api`)                  |

---

## 2. Application Health

| Check                     | Result  | Notes                                                                                                                                                      |
| ------------------------- | ------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Backend startup           | PASS    | Backend server starts and listens on port 3000.                                                                                                            |
| Frontend startup          | PASS    | Frontend pages load and the application can be used. Image loading issues previously recorded have been resolved.                                          |
| MongoDB connection        | PASS    | Backend connects to MongoDB Atlas development database successfully.                                                                                       |
| Environment configuration | PASS    | Configuration verified; backend loads required `.env` variables cleanly.                                                                                   |
| Runtime stability         | WARNING | Historical runtime errors observed during avatar upload and image loading (subsequently resolved). Feed ordering inconsistency noted. See Observed Issues. |

---

## 3. Codebase Health

Codebase health inspection was conducted in `apps/api` (the npm package context). No dependencies were modified, updated, or installed.

### 3.1 npm audit

- **Result:** 16 vulnerabilities (3 low, 1 moderate, 10 high, 2 critical)
- **Key Affected Packages:**
  - `mongoose` (`8.0.4`): Critical (NoSQL injection, prototype pollution, sanitizeFilter bypasses)
  - `proxy-addr` (`2.0.7` via `express`): Critical (IP spoofing via IPv4-mapped IPv6 trust subnet)
  - `body-parser` (`1.20.2` via `express`): High (DoS via URL encoding / trailing bytes / unforced size limits)
  - `path-to-regexp` (`0.1.7` via `express`): High (ReDoS vulnerabilities)
  - `validator` (`13.11.0`): High (URL validation bypass, incomplete filtering)
  - `lodash` (`4.17.21`): High (Code injection and prototype pollution)
  - `jws` (`3.2.2` via `jsonwebtoken`): High (HMAC signature verification flaw)
  - `brace-expansion`, `braces`, `minimatch`, `picomatch`: High (ReDoS and resource exhaustion)
  - `qs` (`6.11.0`): Moderate (DoS via memory exhaustion)
  - `cookie` (`0.5.0`), `send` / `serve-static`: Low
- **Note:** Vulnerabilities remain unpatched in baseline to comply with non-refactoring constraints.

### 3.2 npm outdated

10 top-level dependencies in `apps/api` are outdated:

| Package             | Current     | Wanted      | Latest   | Location                |
| ------------------- | ----------- | ----------- | -------- | ----------------------- |
| `bcryptjs`          | 2.4.3       | 2.4.3       | 3.0.3    | `apps/api/node_modules` |
| `cors`              | 2.8.5       | 2.8.6       | 2.8.6    | `apps/api/node_modules` |
| `dotenv`            | 16.3.1      | 16.6.1      | 18.0.10  | `apps/api/node_modules` |
| `express`           | 4.18.2      | 4.22.3      | 5.3.0    | `apps/api/node_modules` |
| `express-validator` | 7.0.1       | 7.3.2       | 7.3.2    | `apps/api/node_modules` |
| `jsonwebtoken`      | 9.0.2       | 9.0.3       | 9.0.3    | `apps/api/node_modules` |
| `mongoose`          | 8.0.4       | 8.24.11     | 9.13.1   | `apps/api/node_modules` |
| `multer`            | 1.4.5-lts.1 | 1.4.5-lts.2 | 2.5.0    | `apps/api/node_modules` |
| `nodemon`           | 3.0.2       | 3.1.14      | 3.1.14   | `apps/api/node_modules` |
| `validator`         | 13.11.0     | 13.15.35    | 13.15.35 | `apps/api/node_modules` |

### 3.3 API Smoke Test

- **Test Script:** Configured in `apps/api/package.json`.
- **Script Command:** `"test": "node --test scripts/smoke-test.js"`
- **Execution:** Run `npm test` from the `apps/api` directory.
- **Test File:** `apps/api/scripts/smoke-test.js`
- **Latest Result:** 7 tests passed (7/7 PASS).

The API smoke test uses Node.js built-in testing capabilities
without introducing additional dependencies.

---

## 4. Functional Baseline

The functional baseline combines interactive browser observations with the automated API safety net. Results are distinguished by verification method.

| Workflow / Function   | Method             | Result                                 | Observation                                                                                                                                         |
| --------------------- | ------------------ | -------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------- |
| Login page access     | Manual (Browser)   | PASS                                   | Login page renders. Verifies HTTP access and DOM rendering.                                                                                         |
| Account registration  | Automated & Manual | PASS                                   | User registered via API (`POST /api/auth/register`) with token generation.                                                                          |
| User authentication   | Automated & Manual | PASS                                   | Login succeeds via API (`POST /api/auth/login`) returning JWT token and `idUser`.                                                                   |
| Profile setup — Skip  | Manual (Browser)   | PASS                                   | Skipping avatar setup permits navigation to the home feed.                                                                                          |
| Profile avatar upload | Manual (Browser)   | Resolved _(Initial finding: FAIL)_     | Initial finding: Avatar upload returned HTTP 500 (`PATCH /api/users/avatar`). Subsequently resolved after creating the missing `uploads` directory. |
| Home feed display     | Manual (Browser)   | Resolved _(Initial: PASS WITH ISSUES)_ | Initial finding: Requests for `profile.png` returned HTTP 404. Subsequently resolved after creating the missing `uploads` directory.                |
| Create Post           | Automated (API)    | PASS                                   | Post created (`POST /api/posts`), persisted in MongoDB, verified in response.                                                                       |
| Get Feed              | Automated (API)    | PASS                                   | Feed retrieved (`GET /api/posts?limit=10&page=1`), created post is present.                                                                         |
| Like Post             | Automated (API)    | PASS                                   | Like toggled (`PATCH /api/like/:idPost`), liking username verified in `likesPost`.                                                                  |
| Add Comment           | Automated (API)    | PASS                                   | Comment created (`POST /api/comments`), persisted, linked to post, verified.                                                                        |
| Verify Post/Like/Comm | Automated (API)    | PASS                                   | Single post fetch confirms `usernameLikes` and `lengthComments` updated appropriately.                                                              |

> Results are explicitly categorized as Manual or Automated. Unverified edge cases or untested user paths are not claimed as PASS.

---

## 5. Performance Baseline

Measurements were collected using Chrome DevTools Network under local development conditions, with **Disable cache** enabled and **No throttling** selected.

### Frontend Page Load

Three clean page-load measurements were retained. The earlier capture with `Keep log` enabled and accumulated navigation requests was excluded.

| Metric           | Measurements           | Baseline (median) |
| ---------------- | ---------------------- | ----------------: |
| DOMContentLoaded | 328 ms, 172 ms, 261 ms |        **261 ms** |
| Load             | 355 ms, 227 ms, 296 ms |        **296 ms** |

### Posts API

Request measured: `GET /api/posts?limit=5&page=1`  
All four sampled requests returned HTTP 200.

| Metric                 | Measurements                              | Baseline (median) |
| ---------------------- | ----------------------------------------- | ----------------: |
| Total request duration | 214.96 ms, 94.30 ms, 172.08 ms, 201.76 ms |     **186.92 ms** |

The API duration is the browser-observed end-to-end request time. It is not an isolated MongoDB query execution measurement.

---

## 6. Minimal API Safety Net Results

A lightweight smoke test suite was created in `apps/api/scripts/smoke-test.js` using Node.js built-in `node:test` and `node:assert/strict` (with `dotenv` and `mongoose` from existing dependencies for scoped test-data teardown).

The test runs against the active development server (`http://localhost:3000`), registers a unique test user per run (`smoke_<timestamp>_<random>`), creates, likes, and comments on a post, and uses an `after()` hook that runs reliably even if a test fails to delete the created post, associated likes and comments, and the registered test user without touching pre-existing data.

### Test Execution Log

```text
▶ API Safety Net — Smoke Test Suite
  ✔ 1. Register — User Registration with unique credentials (813.4397ms)
  ✔ 2. Login — User Authentication (366.5145ms)
  ✔ 3. Create Post — Submit new post (137.7871ms)
  ✔ 4. Get Feed — Retrieve posts and verify created post is present (300.1625ms)
  ✔ 5. Like Post — Toggle like on created post (1541.2122ms)
  ✔ 6. Add Comment — Create comment on created post (709.9387ms)
  ✔ 7. Verify Post, Like, and Comment in responses (409.7046ms)
✔ API Safety Net — Smoke Test Suite (7490.5487ms)
ℹ tests 7
ℹ suites 1
ℹ pass 7
ℹ fail 0
ℹ cancelled 0
ℹ skipped 0
ℹ todo 0
ℹ duration_ms 8296.1445
```

### Workflows Verified

1. **Register (`POST /api/auth/register`):** Creates new user with valid schema; receives HTTP 201 and JWT token.
2. **Login (`POST /api/auth/login`):** Authenticates test user; receives HTTP 200, JWT token, and `idUser`.
3. **Create Post (`POST /api/posts`):** Submits content with `userId` and `username`; receives HTTP 201 with generated post ID.
4. **Get Feed (`GET /api/posts`):** Fetches paginated feed; confirms created post is present in `posts` array.
5. **Like Post (`PATCH /api/like/:idPost`):** Sends like toggle; receives HTTP 200 with test username in `likesPost`.
6. **Add Comment (`POST /api/comments`):** Submits comment referencing `postId`; receives HTTP 201 with created comment ID.
7. **Response Verification:** Fetches post by ID and comments by post ID; validates `usernameLikes`, `lengthComments`, and comment content.
8. **Teardown:** Executes reliably in `after()` even on test failure—attempts API deletion of the created post (`DELETE /api/posts/:id`) and runs scoped MongoDB cleanup to remove all test-created comments, likes, posts, and the registered test user, verifying zero remaining test records without affecting pre-existing data.

---

## 7. Observed Issues

| Issue / Observation               | Status                      | Root Cause           | Evidence & Details                                                                                                                                                                                                                                                                                                       |
| --------------------------------- | --------------------------- | -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Avatar update fails               | **Resolved**                | Missing directory    | **Initial finding:** `PATCH /api/users/avatar` returned HTTP 500 during the earlier avatar-upload attempt. Destination folder `uploads` was missing.<br>**Subsequent status:** Resolved after creating the missing `uploads` directory.                                                                                  |
| Profile image requests fail       | **Resolved**                | Missing directory    | **Initial finding:** Requests for `/uploads/profile.png` returned HTTP 404 in the Network panel. Default avatar asset could not be served.<br>**Subsequent status:** Resolved after creating the missing `uploads` directory.                                                                                            |
| Feed Posts Ordering Inconsistency | **Open — Not Investigated** | **Not Investigated** | **Observed behavior:**<br>• When one account publishes three posts, their ordering appears as expected.<br>• When another account publishes a new post, the feed ordering changes unexpectedly.<br>• The newly published post may appear in an arbitrary position instead of following the expected chronological order. |
| Static image connection error     | Historical finding          | Not confirmed        | `ERR_CONNECTION_REFUSED` was observed for a static image request in a separate attempt; it should not be treated as the confirmed cause of the avatar failure.                                                                                                                                                           |
| Browser autocomplete warning      | Open (Minor)                | Missing HTML attr    | Chrome reported a missing `autocomplete` attribute on a password input. This is a browser warning, not a confirmed application runtime failure.                                                                                                                                                                          |
| Dependency vulnerabilities        | Open                        | Outdated packages    | 16 known vulnerabilities in `apps/api` dependencies, including 2 critical advisories in `mongoose` and `proxy-addr`.                                                                                                                                                                                                     |

No application code or dependencies were altered to fix these issues during this baseline assessment.

---

## 8. Overall Assessment

**Status: WARNING — Core API endpoints and feed access are functional, initial avatar upload and profile image loading failures have been resolved, but a feed post ordering inconsistency has been identified (Open — Not Investigated), and multiple high/critical dependency vulnerabilities exist.**

This baseline establishes:

- The verified pre-fix state of the MyFamily application for Epic E01.
- Validated performance baselines (Frontend DOMContentLoaded: 261 ms, Load: 296 ms, Posts API: 186.92 ms).
- A verified, repeatable smoke test suite (`apps/api/scripts/smoke-test.js`, run via `node --test apps/api/scripts/smoke-test.js`) covering essential user operations (7/7 passed), with no additional dependencies introduced.
- Resolution of initial media upload/asset issues (avatar upload 500 and profile image 404 resolved after creating the missing `uploads` directory).
- Clear documentation of active open issues (Feed Posts Ordering Inconsistency) and codebase health gaps for remediation in subsequent engineering epics.

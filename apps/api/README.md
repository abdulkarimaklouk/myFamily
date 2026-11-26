# myFamily API

Backend REST API for the **myFamily** social networking application, located at `apps/api` in the [myFamily repository](https://github.com/abdulkarimaklouk/myFamily).

## Overview

The API provides authentication, user profile and avatar management, post CRUD operations, post like toggling, and comment creation and retrieval for the `apps/web` frontend client, persisting data in MongoDB via Mongoose.

## Implemented Features & Endpoints

All routers are mounted in `index.js`. Unless noted otherwise, endpoints require an `Authorization: Bearer <token>` header verified by `middleware/verifyToken.js`.

- **Authentication (`/api/auth`)**
  - `POST /api/auth/register` — Register a new user (`username`, `email`, `password` hashed with `bcryptjs`) and issue a JWT (`1d` expiry).
  - `POST /api/auth/login` — Authenticate an existing user and return a JWT and `idUser`.
- **Users (`/api/users`, protected)**
  - `GET /api/users` — List users with `limit` and `page` pagination (excludes `password` and `__v`).
  - `GET /api/users/user` — Get the currently authenticated user from the JWT payload.
  - `GET /api/users/:id` — Get a user by ID.
  - `PATCH /api/users/avatar` — Upload and update the authenticated user's avatar (`multipart/form-data` field `avatar`, saved via `multer` to `uploads/` and served statically at `/uploads`).
- **Posts (`/api/posts`, protected)**
  - `GET /api/posts` — Fetch paginated posts (`limit`, `page`).
  - `POST /api/posts` — Create a new post (`content`, `userId`, `username`).
  - `GET /api/posts/:id` — Fetch a single post by ID.
  - `PATCH /api/posts/:id` — Update a post by ID.
  - `DELETE /api/posts/:id` — Delete a post and its associated comments and likes.
- **Likes (`/api/like`, protected)**
  - `PATCH /api/like/:idPost` — Toggle like/unlike on a post (`likeUserName`, `postId`).
- **Comments (`/api/comments`, protected)**
  - `POST /api/comments` — Add a comment to a post (`content`, `userId`, `username`, `postId`, `avatar`) and increment the post's `lengthComments`.
  - `GET /api/comments/:id` — Fetch paginated comments for a post (`limit`, `page`).
  - `GET /api/comments/comment/:id` — Fetch a single comment by ID.
- **Error Handling & CORS**
  - Global error middleware (`utils/appError.js`, `middleware/asyncWrapper.js`), JSON 404 fallback, and `cors` middleware.

## Tech Stack & Dependencies

Dependencies declared in `apps/api/package.json`:

- **Runtime:** Node.js (v22 recommended; see root `.nvmrc`)
- **Framework & Middleware:** `express` (`^4.18.2`), `cors` (`^2.8.5`), `dotenv` (`^16.3.1`)
- **Database / ODM:** MongoDB with `mongoose` (`^8.0.4`)
- **Authentication:** `jsonwebtoken` (`^9.0.2`), `bcryptjs` (`^2.4.3`)
- **Validation:** `express-validator` (`^7.0.1`), `validator` (`^13.11.0`)
- **File Uploads:** `multer` (`^1.4.5-lts.1`)
- **Dev Runner:** `nodemon` (`^3.0.2`)
- **Testing:** Node.js built-in `node:test` and `node:assert/strict`

## Project Structure

```text
apps/api/
├── Controllers/
│   ├── auth.controller.js
│   ├── comment.controller.js
│   ├── like.controller.js
│   ├── post.controller.js
│   └── user.controller.js
├── middleware/
│   ├── asyncWrapper.js
│   ├── validation.js
│   └── verifyToken.js
├── models/
│   ├── comment.model.js
│   ├── like.model.js
│   ├── post.model.js
│   └── user.model.js
├── routes/
│   ├── auth.route.js
│   ├── comment.route.js
│   ├── like.route.js
│   ├── post.route.js
│   └── user.route.js
├── scripts/
│   └── smoke-test.js
├── utils/
│   ├── appError.js
│   ├── generateJWT.js
│   └── httpStatusText.js
├── .env.example
├── .gitignore
├── index.js
├── package.json
├── package-lock.json
└── README.md
```

> **Note:** Uploaded avatars are stored in `apps/api/uploads/` (ignored via `.gitignore`) and served from `/uploads`. Ensure `uploads/` exists before uploading avatars.

## Setup & Startup

1. Clone the repository and navigate to the API package:

   ```bash
   git clone https://github.com/abdulkarimaklouk/myFamily.git
   cd myFamily/apps/api
   ```

2. Install dependencies:

   ```bash
   npm install
   ```

3. Configure environment variables by copying `.env.example` to `.env`:

   ```env
   MONGO_URL=<your-mongodb-connection-string>
   PORT=3000
   JWT_SECRET_KEY=<your-jwt-secret>
   ```

   - `MONGO_URL`: MongoDB connection URI passed to `mongoose.connect()`.
   - `PORT`: HTTP port for Express (defaults to `3000` if unset).
   - `JWT_SECRET_KEY`: Secret used to sign and verify JWTs.

4. Create the uploads directory if not present:

   ```bash
   mkdir uploads
   ```

5. Start the API server (`nodemon index.js`):

   ```bash
   npm start
   ```

## Testing

`apps/api` includes a lightweight API smoke test suite in `scripts/smoke-test.js` powered by Node.js built-in `node:test` and `node:assert/strict` (using `dotenv` and `mongoose` from existing dependencies for scoped test-data cleanup).

With the API server running and connected to a development/test database, run:

```bash
npm test
```

This executes `node --test scripts/smoke-test.js` against `TEST_API_URL`, `API_URL`, or the default `http://localhost:3000`, verifying:

1. User registration (`POST /api/auth/register`) with unique per-run credentials
2. User login (`POST /api/auth/login`)
3. Post creation (`POST /api/posts`)
4. Feed retrieval (`GET /api/posts?limit=10&page=1`)
5. Liking a post (`PATCH /api/like/:idPost`)
6. Adding a comment (`POST /api/comments`)
7. Response verification for the post, like, and comment, followed by an `after()` teardown hook (which runs reliably even on test failure) that deletes the created post, associated likes and comments, and the generated test user without touching pre-existing data

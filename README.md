# myFamily

A social networking web application built with a Node.js/Express REST API (`apps/api`) and a static HTML, CSS, and JavaScript frontend (`apps/web`).

## Overview

myFamily allows users to register and sign in with JWT authentication, upload a profile avatar, publish and manage posts, browse a paginated feed, like or unlike posts, and add and view comments.

## Implemented Features

- **User Authentication:** Account registration and login backed by `bcryptjs` password hashing and JWT bearer tokens.
- **User Profiles & Avatars:** Authenticated user lookup and profile avatar upload (with an option to skip avatar setup during onboarding).
- **Posts:** Create, read (paginated feed and single post view), update, and delete posts.
- **Likes & Comments:** Toggle likes on posts, add comments, and view comments per post.

## Tech Stack

- **Frontend (`apps/web`):** HTML, CSS, JavaScript (ES Modules), Font Awesome, `validator.js`
- **Backend (`apps/api`):** Node.js (v22 per `.nvmrc`), Express.js, Mongoose
- **Database:** MongoDB
- **Authentication & File Uploads:** `jsonwebtoken`, `bcryptjs`, `multer`
- **Testing:** Node.js built-in test runner (`node:test`)

## Project Structure

```text
myFamily/
├── .github/
│   └── pull_request_template.md
├── apps/
│   ├── api/                 # Backend REST API (Node.js, Express, MongoDB)
│   └── web/                 # Static frontend application (HTML, CSS, JavaScript)
├── docs/
│   └── engineering/
│       └── BASELINE_ASSESSMENT.md
├── .gitignore
├── .nvmrc                   # Node.js 22
└── README.md
```

## Getting Started

### Prerequisites

- Node.js (v22 recommended; see `.nvmrc`)
- npm
- A MongoDB connection string
- A local static web server (such as VS Code Live Server) for `apps/web`

### Installation & Configuration

There is no root `package.json`; backend dependencies are managed inside `apps/api` and the frontend has no build step.

1. Clone the repository:

   ```bash
   git clone https://github.com/abdulkarimaklouk/myFamily.git
   cd myFamily
   ```

2. Install backend dependencies:

   ```bash
   cd apps/api
   npm install
   ```

3. Create `apps/api/.env` from `apps/api/.env.example` and configure your environment variables:

   ```env
   MONGO_URL=<your-mongodb-connection-string>
   PORT=3000
   JWT_SECRET_KEY=<your-jwt-secret>
   ```

4. Create the local uploads directory inside `apps/api` if it does not already exist:

   ```bash
   mkdir uploads
   ```

### Running the Application

1. **Start the backend API** (from `apps/api`):

   ```bash
   npm start
   ```

   The API listens on `PORT` (defaults to `3000` at `http://localhost:3000`).

2. **Start the frontend** (`apps/web`):

   Serve the repository root via a static file server at `http://127.0.0.1:5500` and open `http://127.0.0.1:5500/apps/web/login.html` in a browser (the frontend sends API requests to `http://localhost:3000`).

### Running API Smoke Tests

With the backend server running, execute the smoke test suite from `apps/api`:

```bash
npm test
```

## Documentation

- [Backend API Documentation](apps/api/README.md)
- [Frontend Overview](apps/web/README.md)
- [Engineering Baseline Assessment](docs/engineering/BASELINE_ASSESSMENT.md)

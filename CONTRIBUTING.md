# Contributing to TestDog

Thanks for checking out TestDog! This guide will help you get set up and ready to contribute effectively.

---

## 🔧 Tech Stack

* **Node.js (ESM)** + **Express v5**
* **Passport** with Google OAuth 2.0
* **MongoDB** (via Mongoose)
* **Redis** (via ioredis)
* **Security**: Helmet, rate limiting, JWT
* **Testing**: Jest + Supertest + in-memory mocks
* **Linting/Formatting**: ESLint + Prettier + Husky

---

## 📁 Project Structure (quick overview)

```
src/
├── app.js                → Express setup
├── config/               → Passport, Redis config
├── controllers/          → Auth & user logic
├── middlewares/          → Custom logic (auth, rate-limit, etc.)
├── routes/               → /auth, /users API routes
server.js                 → App entry point
Dockerfile                → Production build config
.husky/                   → Git hooks
.github/workflows/        → CI/CD
```

---

## 🚀 Getting Started

### 1. Clone & Install

```bash
git clone https://github.com/Ankur77720/testdog.git
cd testdog
npm install
```

### 2. Environment Setup

Copy `.env.example` → `.env` and fill in:

* `MONGO_URI`, `REDIS_URL`, `JWT_SECRET`
* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
* `PORT`, etc.

### 3. Run the Server

```bash
npm run dev
```

---

## ✅ Scripts You’ll Use

| Script           | Purpose                        |
| ---------------- | ------------------------------ |
| `npm run dev`    | Run dev server (nodemon + ESM) |
| `npm test`       | Run tests (Jest + mocks)       |
| `npm run lint`   | Check linting rules            |
| `npm run format` | Format files via Prettier      |

---

## 🧪 Testing Notes

* Uses in-memory Mongo & Redis for fast, isolated tests.
* No need for local DBs while testing—just run `npm test`.

---

## 📦 Git & Contribution Flow

1. **Create a branch** for your feature or fix.
2. Code changes go in `src/`.
3. Run `npm run lint`, `format`, and `test` before committing.
4. Husky runs pre-commit checks automatically.
5. Push and open a PR—GitHub Actions will validate your changes.

---

## 🐳 Docker Notes

* The `Dockerfile` is for **production**.
* For local dev, use `npm run dev` and connect to local or Docker Mongo/Redis.
* No `docker-compose.yml` yet, but it's easy to add if needed.

---

## 💡 Tips for New Contributors

* Start with small issues—validation, middlewares, route cleanup.
* Check `passport.js` to understand how Google login is set up.
* Explore Redis config if working on rate-limiting or caching.

---

Feel free to open issues, suggest improvements, or ask questions on PRs.
We appreciate every contribution—big or small.

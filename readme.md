# Testdog API Server

Testdog is an open-source, community-powered API server offering a growing collection of free-to-use APIs for your projects. Whether you're building a side project, a portfolio piece, or an MVP — feel free to plug in and go!

---

## 🚀 Use These APIs in Your Projects

All APIs provided by Testdog are **completely free**. You can integrate them into your personal or commercial projects without any restrictions.

- No API keys required  
- No rate limiting (unless explicitly mentioned)  
- Easy to explore and consume

> ✨ Want a specific API? Raise a request or contribute by adding one yourself!

---

## 🤝 Open for Contributions

Testdog is **open-source**, and we're always looking for contributors!

### How to Contribute

1. Fork the repository
2. Create a feature branch
3. Add your API or improve existing ones
4. Raise a Pull Request (PR)

If your PR aligns with our development direction and passes checks, we’ll merge it. Simple as that.

> Please make sure to follow best practices and write clean, modular code.

---

## 🛠 Dev Setup & Contribution Guide

### Tech Stack
- Node.js (ESM) + Express v5
- MongoDB (Mongoose), Redis (ioredis)
- Passport (Google OAuth 2.0), JWT
- Testing: Jest + Supertest
- Linting & Formatting: ESLint + Prettier + Husky

### Folder Structure
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

````

### ⚙️ Getting Started

#### 1. Install dependencies
```bash
git clone https://github.com/Ankur77720/testdog.git
cd testdog
npm install
````

#### 2. Setup Environment Variables

Configure `.env` with:

* `MONGO_URI`, `REDIS_URL`
* `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
* `JWT_SECRET`, `PORT`, etc.

#### 3. Start the Dev Server

```bash
npm run dev
```

### Available Scripts

| Script           | Purpose                        |
| ---------------- | ------------------------------ |
| `npm run dev`    | Run dev server (nodemon + ESM) |
| `npm test`       | Run tests (Jest + mocks)       |
| `npm run lint`   | Check linting rules            |
| `npm run format` | Format files via Prettier      |

### Pre-Commit Workflow

* Git hooks are configured using **Husky**
* On every commit:

  * Lint & format checks run automatically
  * Tests are expected to pass locally and in CI

### Docker Notes

* The included `Dockerfile` is for **production builds**.
* For local development, use `npm run dev` and connect to local or containerized Mongo/Redis.
* No `docker-compose.yml` yet, but it’s easy to add if needed.

---

## 🧪 Testing

Run all tests with:

```bash
npm test
```

* Uses **in-memory MongoDB and Redis mocks** — no need for local services during tests.
* Fast and isolated test environment using `mongodb-memory-server` and `ioredis-mock`.

---

## 🐛 Found a Bug or Issue?

If you encounter any problems or have suggestions:

* [Open an issue](https://github.com/Ankur77720/testdog/issues) describing the problem.
* Be as detailed as possible so contributors can replicate and resolve it.

---

## 💡 Final Note

Testdog is powered entirely by its contributors. The addition of any new API depends on community support and availability. So if something’s missing — feel free to build it!

---

Happy hacking! ✨
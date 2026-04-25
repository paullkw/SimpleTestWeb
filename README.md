# SimpleTest Web Login

This app includes a complete user authentication flow with:

- Web login/register UI in `app/page.tsx`
- Post-login dashboard in `app/dashboard/page.tsx`
- MongoDB user storage in database `simpletest`
- Secure password hashing with `bcryptjs`
- HTTP-only cookie sessions signed with JWT

## 1. Install dependencies

```bash
npm install
```

## 2. Configure environment variables

Create `.env.local` from `.env.example` and set values:

```bash
MONGODB_URI=mongodb://127.0.0.1:27017
JWT_SECRET=replace_with_a_long_random_secret
```

`MONGODB_URI` should point to your MongoDB server.
The app always uses database name `simpletest`.

## 3. Run the app

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## API routes

- `POST /api/auth/register`
- `POST /api/auth/login`
- `GET /api/auth/me`
- `POST /api/auth/logout`

## Dashboard tests source

After login, users are redirected to `/dashboard`, which displays all documents from the MongoDB collection `tests` in database `simpletest`.

Optional fields used by the UI per test document:

- `title` (string)
- `description` (string)
- `durationMinutes` (number)
- `questionsCount` (number)

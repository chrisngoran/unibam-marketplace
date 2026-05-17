# University of Bamenda Marketplace (starter)

This is a starter scaffold for a marketplace web app using Next.js, TypeScript, Prisma and Tailwind CSS.

Quick start:

```bash
npm install
npm run prisma:generate
npm run dev
```

Next steps:
- Configure DATABASE_URL in `.env`
- Run `npm run prisma:migrate` to create the database
- Implement authentication and payments
 - Configure GitHub OAuth: set `GITHUB_ID` and `GITHUB_SECRET` in `.env`
 - Run `npm run prisma:migrate` after setting `DATABASE_URL`
 - To use Stripe payments, set `STRIPE_SECRET` and `NEXTAUTH_URL` in `.env`
- To run locally when dependencies are installed:

```bash
npm run prisma:generate
npm run prisma:migrate
npm run dev
```

Quick local test: the default `.env.example` uses SQLite (`file:./dev.db`) so you can run migrations without Postgres.

## Features added
- Search and category filtering on the marketplace home page
- Optional category field on listings
- Listing edit/delete for owners
- Docker deployment support via `Dockerfile` and `docker-compose.yml`

## Deployment

Docker:

```bash
docker build -t unibam-marketplace .
docker run -p 3000:3000 --env-file .env unibam-marketplace
```

Docker Compose:

```bash
docker compose up --build
```

Vercel:

- `git push` your repository to GitHub
- Create a Vercel project from `https://github.com/chrisngoran/unibam-marketplace`
- Set the required environment variables in Vercel

Status: Prototype scaffold with Next.js, Prisma, NextAuth (GitHub), and Stripe checkout endpoints. Includes product CRUD and simple UI.

Commit: initial scaffold + auth + payments

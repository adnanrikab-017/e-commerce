# GoCart

GoCart is a mobile-first, single-brand ecommerce application built with Next.js App Router. It has two roles only: customer and administrator.

## Local setup

1. Install Node.js 20.9 or newer and run `npm install`.
2. Copy `.env.example` to `.env`, then set a MySQL connection string and a random `AUTH_SECRET` of at least 32 characters.
3. Run `npx prisma migrate dev --name initial` and `npx prisma generate`.
4. Create the first administrator directly in the database or through the forthcoming protected admin bootstrap process. Never place credentials in source control.
5. Start the application with `npm run dev`.

## Architecture notes

- `prisma/schema.prisma` contains the normalized single-brand commerce schema; it has no vendor/store entities.
- Server-only database access is centralized in `lib/prisma.js`.
- Admin pages require a signed, HTTP-only session and their data endpoints enforce the same authorization check.
- `middleware.js` supplies a per-request Content Security Policy and baseline browser security headers.
- Browser state is limited to the shopping experience; prices, stock, coupons, orders, and permissions must always be calculated and validated on the server.

## Deployment requirements

Set all environment variables in the hosting platform, use managed MySQL with backups, and configure an image provider such as Cloudinary before enabling uploads. Run dependency auditing and production build checks in CI before deployment.

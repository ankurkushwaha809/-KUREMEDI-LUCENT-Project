# Workspace Instructions

## Project Layout
- `backend/` is the Express + MongoDB API.
- `Frontend/website/` is the Next.js customer web app.
- `Frontend/admin/` is the admin web app.
- `Frontend/app/` and `Frontend/mrapp/` are mobile app projects; do not change them unless the task explicitly targets mobile.

## Working Rules
- Prefer small, focused changes that match the existing code style.
- Reuse shared API helpers from `Frontend/website/src/api/` instead of calling `fetch` directly in feature components.
- Put reusable UI logic in `Frontend/website/src/components/` or `Frontend/website/src/utils/`.
- Keep route code in `Frontend/website/src/app/` and use client components only when state, effects, or browser APIs are required.
- Treat order status as order-level data unless the backend explicitly adds per-item delivery state.

## Frontend Conventions
- Use Tailwind utility classes and keep layouts responsive for mobile and desktop.
- Prefer existing icons and components before adding new dependencies.
- Keep product and order flows aligned with the existing Next.js app router structure.
- The product detail route already accepts `/products/[id]` and can resolve slug-or-id values.

## Validation
- Website app: run `npm run dev`, `npm run build`, and `npm run lint` from `Frontend/website/` when needed.
- Backend app: run `npm run dev` from `backend/` for local API work.
- The backend package currently does not define a real test suite.

## Reference Files
- See [Frontend/website/README.md](../Frontend/website/README.md) for deployment notes.
- See [backend/package.json](../backend/package.json) for backend scripts.

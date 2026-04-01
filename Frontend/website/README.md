This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on AWS Amplify

This app includes an `amplify.yml` build spec. To deploy **and avoid white screen / 404 on routes**:

1. **Root directory:** In Amplify Console → App settings → General, set **Root directory** to `website` (so the build runs from `website/` and uses `website/amplify.yml`).
2. **Use Next.js SSR (required for routes to work):** Amplify must run the Next.js server, not static hosting.
   - In Amplify Console → **Hosting** (or App settings), ensure the app uses **"Next.js - SSR"** and **WEB_COMPUTE**.
   - If you see 404 on every route except `/`, the app is likely on static hosting. Switch to SSR:
     - **Console:** Hosting → Edit → set framework to **Next.js - SSR** and save. Redeploy.
     - **CLI:**  
       `aws amplify update-app --app-id <YOUR_APP_ID> --platform WEB_COMPUTE --region <REGION>`  
       `aws amplify update-branch --app-id <YOUR_APP_ID> --branch-name main --framework "Next.js - SSR" --region <REGION>`  
     Then trigger a new deploy.
3. **Env vars:** In Amplify → Environment variables, add `NEXT_PUBLIC_API_URL` (and any others). If the app lives in a subfolder, you can set `AMPLIFY_MONOREPO_APP_ROOT=website`.

**Why 404?** If Amplify serves only the built files (static mode) and does not run `next start`, only the root might load; all other routes (e.g. `/login`, `/products`) return 404. Using **Next.js - SSR** fixes this by running the Node server.

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.

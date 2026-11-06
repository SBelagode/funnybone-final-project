This is a [Next.js](https://nextjs.org) project bootstrapped with [`create-next-app`](https://github.com/vercel/next.js/tree/canary/packages/create-next-app).

## Getting Started

Use Node.js 24.x for local development. If you use `nvm`, run:

```bash
nvm install
nvm use
```

Then run the development server:

```bash
npm ci
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.js`. The page auto-updates as you edit the file.


### Deployment Steps

Just once per computer: Configure AWS single sign-on:

```bash
aws configure sso
```

1. Switch to the branch you want to deploy (e.g., main):

```bash
git checkout main
```

2. Build, login to AWS, export the creditials, and deploy the application:

```bash
npm run deploy:staging
```

or

```bash
npm run deploy:production
```


## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

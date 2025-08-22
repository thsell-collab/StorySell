# LaunchQuik - Shopify Remix App Boilerplate

LaunchQuik is a complete Shopify Remix app boilerplate & toolkit with everything you need to launch your Shopify app faster than ever. It allows developers to focus on solving merchant problems, instead of boring and repetitive tasks.

## What you will get?

• **Billing & Subscriptions**: Works with both managed and manual pricing. Monthly & annual subscription plans, usage charges, one-time charge, all integrated in the code.
• **Webhooks integration**: Effortlessly create and manage real-time webhook events.
• **Emails integration**: Supports Resend, Mailgun and Brevo. Send Emails on install and uninstall along with separate admin page for sending app updates to all Merchants.
• **Embedded app with Polaris**: Ready to use embedded app with Polaris components.
• **Ready-to-use Extensions**: Jump-start your development with ready-to-use theme app blocks, checkout UI extensions, post-purchase extensions, app embed blocks, and many more coming in future updates. Don't forget to say bye to "CORS errors".
• **Pagination tables**: Built-in pagination tables for orders and products along with search, sort and filter options.
• **Analytics dashboard**: Built-in analytics dashboard to track orders revenue, total count based on date range.
• **Built for Shopify**: It is optimized for "Built for Shopify".
• **Scalable architecture**: Launch apps that can grow with your business.

## Why Choose LaunchQuik?

• **Save Time**: Focus on building app that solves a merchant problem, not on repetitive tasks.
• **Avoid headaches**: No more cors error, setting up Billing API, analytics dashboard, webhook configuration, listing screenshots.
• **Earn fast**: The faster you launch, the more you learn, the more you earn.
• **Stay Updated**: I updated code regularly up with Shopify's latest features and best practices, so you don't have to invest time.



## Getting Started

### Pre-requisites

To use LaunchQuik effectively, make sure your development environment meets the following requirements:

#### Node.js
• **Why**: Required to run Shopify Remix and LaunchQuik.
• **Version**: 18.x or later (LTS recommended)

Note: You can't use Polaris 13.9.5 with Node 18.x

```bash
node --version
```

#### npm or yarn
• **Why**: Required to install and manage dependencies.
• **npm**: 9.x or later
• **pnpm**: 8.x or later
• **yarn**: 1.22.x or later

```bash
npm -v
# or
yarn -v
# or
pnpm -v
```

#### Git
• **Why**: For cloning the repository and version control.
• **Version**: 2.x or later

```bash
git -v
```

#### Additional Software
• **Code Editor**: VS Code with the Shopify Remix extension recommended
• **Browser**: Latest Chrome, Safari, Edge or Firefox

#### Shopify Requirements
• **Shopify Partner Account**: Required to create & manage your Shopify apps
• **Shopify CLI**: v3.x
• **Shopify Development Store**: To test your Shopify app

#### Basic knowledge of:
• [GraphQL for Shopify APIs](https://shopify.dev/docs/api/admin-rest/2025-01/resources/graphql)
• [Remix framework](https://remix.run/)
• [React.js](https://react.dev/)
• [Shopify Polaris design system](https://polaris.shopify.com/)
• [Prisma](https://prisma.io/)

### Installation Process

1. **Clone the Repository**
   ```bash
   git clone https://github.com/launchquik/toolkit.git
   cd launchquik
   ```

2. **Install Dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Set Up Environment Variables**
   • Copy `.env.example` and rename it to `.env`
   • Fill in required values like DB connection, app name, etc.

   ```env
   APP_NAME=LaunchQuik
   APP_HANDLE=launchQuik-app-handle
   DATABASE_URL=postgres://postgres:password@127.0.0.1:5432/launchquik-db
   SHOPIFY_APP_URL=https://apps-remix.com
   SHOPIFY_API_KEY=12345678
   SHOPIFY_API_SECRET=12345678
   ```

   Then open `shopify.app.toml` and add:
   ```toml
   scopes = "read_locales, read_customers, read_products, write_discounts, write_orders, write_products, write_metaobject_definitions, write_metaobjects, write_products"
   ```

4. **Generate Prisma Migration**
   ```bash
   npm run prisma migrate dev
   # or
   yarn prisma migrate dev
   # or
   pnpm prisma migrate dev
   ```

5. **Run Your App Locally**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

6. **Verify App Installation**
   • Check your console for errors
   • Check if all pages are working

## Need Help?

Our documentation covers everything you need to know about LaunchQuik. If you can't find what you're looking for, check out our FAQ or email me at [support@launchquik.dev](mailto:support@launchquik.dev).

Start launching amazing Shopify apps today with LaunchQuik!

---

**Note**: This boilerplate is designed to be a starting point. Customize it according to your specific app requirements while maintaining the established patterns and best practices.

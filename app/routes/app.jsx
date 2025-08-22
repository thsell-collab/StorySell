import React, { useState } from "react";
import { json } from "@remix-run/node";
import { Link, Outlet, useLoaderData, useRouteError, useSubmit } from "@remix-run/react";
import { boundary } from "@shopify/shopify-app-remix/server";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import { NavMenu } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import { shopQuery, getWebhookQuery, getWebhookMutationQuery } from "../utils/graphql-queries";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
export const links = () => [{ rel: "stylesheet", href: polarisStyles }];
import { first_email_html } from "../utils/email-templates";
import { sendmail } from "../utils/send-mail";
import enTranslations from '@shopify/polaris/locales/en.json';
import { StoresModel } from "../models/stores";

// Loader: Authenticates user, fetches shop and store info, and handles onboarding
export const loader = async ({ request }) => {
  const { admin, session, billing, redirect } = await authenticate.admin(request);
  const shop = session.shop;
  const { hasActivePayment, appSubscriptions } = await billing.check();
  const useManaged = Number(process.env.MANAGED_PRICING) === 1;
  const shopData = await admin.graphql(shopQuery).then(res => res.json());
  const shopInfo = shopData?.data?.shop;

  const {
    myshopifyDomain,
    shopOwnerName: shopOwner,
    email,
    plan,
  } = shopInfo || {};
  const shopName = myshopifyDomain?.split(".")[0];
  const unqi = await StoresModel.findUnique({ where: { shop } });

  // Create or update store
  const store = await StoresModel.upsert({
    where: { shop },
    update: { shop_owner_name: shopOwner, email, access_token: session.accessToken },
    create: { shop, shop_owner_name: shopOwner, email, access_token: session.accessToken },
  });
  // console.log("Store created or updated:", store);
  // Send welcome email if not sent previously
  if (store?.email_sent !== 1) {
    await StoresModel.update({ where: { shop }, data: { email_sent: 1 } });
    const htmlContent = first_email_html(shopName);
    await sendmail(email, shopOwner, `Welcome to ${process.env.APP_NAME}`, htmlContent, "brevo");
  }
      
  // Redirect to plans page if subscription is not active
  if (!hasActivePayment) {
    if (useManaged) {
      throw redirect(`/auth/exit-iframe?exitIframe=https://admin.shopify.com/store/${shopName}/charges/${process.env.APP_HANDLE}/pricing_plans`);
    } else {
      console.log("Redirecting to plans because no active payment for shop:", shop);
      return redirect(`/plans?shop=${shop}`);
    }
  }

  return json({
    shopData: shopInfo,
    apiKey: process.env.SHOPIFY_API_KEY || "",
    app_handle: process.env.APP_HANDLE || "",
    useManaged
  });
};

export const action = async () => {
}

// Function to generate replacements for DatePicker placeholders
const generateDatePickerReplacements = () => {
  const now = new Date();
  const nextMonth = new Date(now.getFullYear(), now.getMonth() + 1, 1);
  const prevMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1);

  return {
    nextMonthName: nextMonth.toLocaleString('default', { month: 'long' }), // "August"
    previousMonthName: prevMonth.toLocaleString('default', { month: 'long' }), // "June"
    year: now.getFullYear().toString(), // "2025"
    nextYear: (now.getFullYear() + 1).toString(), // "2026"
    previousYear: (now.getFullYear() - 1).toString(), // "2024"
  };
};

const updatedTranslations = {
  ...enTranslations,
  Polaris: {
    ...enTranslations.Polaris,
    DatePicker: {
      ...enTranslations.Polaris.DatePicker,
      nextMonth: `Show next month, ${generateDatePickerReplacements().nextMonthName}`,
      previousMonth: `Show previous month, ${generateDatePickerReplacements().previousMonthName}`,
      showNextYear: `Show next year, ${generateDatePickerReplacements().nextYear}`,
      showPreviousYear: `Show previous year, ${generateDatePickerReplacements().previousYear}`,
    },
  },
};

export default function App() {
  const { shopData, apiKey, app_handle, useManaged, translations } = useLoaderData();
  return (
    <>
      <AppProvider i18n={updatedTranslations} isEmbeddedApp apiKey={apiKey}>
        <>
          <NavMenu>
            <Link to="/app" rel="home">Home</Link>
            <Link to="/app/analytics">Analytics</Link>
            <Link to="/app/orders">Orders</Link>
            <Link to="/app/products">Products</Link>
            <Link to="/app/general-settings-form">General Settings Form</Link>
            <Link to={useManaged ? `/auth/exit-iframe?exitIframe=https://admin.shopify.com/store/${(shopData?.data?.shop?.myshopifyDomain)?.split(".")?.[0]}/charges/${app_handle}/pricing_plans` : "/plans"} {...(useManaged ? { target: "_blank" } : {})}>
              Plans
            </Link>
          </NavMenu>
          <Outlet />
        </>
      </AppProvider>
    </>
  );
}

// Shopify needs Remix to catch some thrown responses, so that their headers are included in the response.
export function ErrorBoundary() {
  return boundary.error(useRouteError());
}

export const headers = (headersArgs) => {
  return boundary.headers(headersArgs);
};

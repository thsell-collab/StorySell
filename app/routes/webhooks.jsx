import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import db from "../db.server";
import { uninstall_email_html } from "../utils/email-templates";
import { sendmail } from "../utils/send-mail";
import { PrismaClient } from '@prisma/client';
import { StoresModel } from "../models/stores";
import { jobQueue } from "../utils/queue-server";
const prisma = new PrismaClient();

// Action: Handles Shopify webhook events, verifies HMAC, and processes topics
export const action = async ({ request }) => {
  const secret = process.env.SHOPIFY_API_SECRET || '';
  const hmacHeader = request.headers.get("x-shopify-hmac-sha256") || '';

  // 1. Read raw body once
  const rawBody = await request.text();

  // 2. Verify HMAC signature using Web Crypto API
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );

  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(rawBody));
  const hash = Buffer.from(signature).toString("base64");

  console.log("Computed HMAC:", hash);
  console.log("Shopify HMAC:", hmacHeader);

  if (hash !== hmacHeader) {
    console.error("HMAC verification failed!");
    return new Response("Unauthorized", { status: 401 });
  }

  // 3. To avoid error, create a new request with the raw body to pass to authenticate.webhook
  const reqWithBody = new Request(request.url, {
    method: request.method,
    headers: request.headers,
    body: rawBody
  });

  // 4. Now call your authenticate.webhook with the new request that still has the body
  const { topic, shop, session, admin } = await authenticate.webhook(reqWithBody);

  const store = await StoresModel.findUnique({
    where: { shop },
  });
  
  if (!admin) {
    // The admin context isn't returned if the webhook fired after a shop was uninstalled.
    throw new Response();
  }
  console.log("Webhook topic:", topic);
  // The topics handled here should be declared in the shopify.app.toml. More info: https://shopify.dev/docs/apps/build/cli-for-apps/app-configuration
  switch (topic) {
    case "APP_UNINSTALLED":
      if (session) {
        await db.session.deleteMany({ where: { shop } });
      }
      
      if(store) {
        let email = store?.email, shop_owner_name = store?.shop_owner_name; 
        const email_html = uninstall_email_html((shop)?.split(".")?.[0]);        
        await sendmail(email, shop_owner_name, "Was Everything Okay? We'd Love Your Feedback!", email_html, "brevo");
       
        // Remove this query if using postgres or sqlite
        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 0;`);
        
        await StoresModel.deleteMany({
          where: { shop },
        });
        
        // Remove this query if using postgres or sqlite
        await prisma.$executeRawUnsafe(`SET FOREIGN_KEY_CHECKS = 1;`);
      }
      break;
    
    case "ORDERS_CREATE":
      console.log("Processing order creation for shop:", rawBody);
      await jobQueue.add("processOrder", { shop: shop });
      break;
    
    case "CUSTOMERS_DATA_REQUEST":
    case "CUSTOMERS_REDACT":
    case "SHOP_REDACT":
    
    default:
      throw new Response("Unhandled webhook topic", { status: 404 });
  }
  throw new Response();
};

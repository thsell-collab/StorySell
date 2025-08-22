import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { saveOrderMetafieldMutation } from "../utils/graphql-queries";
import { StoresModel } from "../models/stores";

const allowedOrigin = "https://extensions.shopifycdn.com";

// Loader: Handles preflight CORS and GET requests
export const loader = async ({ request }) => {
  const { cors } = await authenticate.public.checkout(request);
  
  // Respond with CORS headers
  return cors(json({ ok: "ok" }), {
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin
    },
  });
};

// Action: Handles POST requests and CORS
export const action = async ({ request }) => {
  const body = await request.json();
  const { cors } = await authenticate.public.checkout(request);
  console.log("Received body:", body);
  
  // Save metafield to Shopify if shop and store found
  const shop = body?.shop;
  const metafieldValue = body?.metafieldValue;
  
  if (shop) {
    try {
      const store = await StoresModel.findUnique({ where: { shop } });
      if (store && store.access_token) {
        let SHOPIFY_ACCESS_TOKEN = store.access_token;
        console.log("Saving metafield for shop:", shop, "with value:", metafieldValue);
        
        let mutation = saveOrderMetafieldMutation({
          orderId: body.orderId.replace("OrderIdentity", "Order"),
          namespace: "boilerplate_order_namespace",
          key: "nps_score",
          value: metafieldValue,
          type: "single_line_text_field"
        });
          
        let result = await fetch(`https://${shop}/admin/api/2024-10/graphql.json`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-Shopify-Access-Token": SHOPIFY_ACCESS_TOKEN,
          },
          body: JSON.stringify({ query: mutation }),
        });
        
        let res = await result.json();
        console.log("Metafield API response:", res);
        
        if (res.errors) {
          console.error("GraphQL errors:", res.errors);
        }
      } else {
        console.error("Store not found or no access token available for shop:", shop);
      }
    } catch (error) {
      console.error("Error saving metafield:", error);
    }
  }

  // Respond with CORS headers
  return cors(json({ ok: "ok" }), {
    headers: {
      "Access-Control-Allow-Origin": allowedOrigin
    },
  });
};

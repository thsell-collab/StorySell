import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";

// Mock offer data for demo. Replace with real DB/API data as needed.
const offers = [{
  id: 1,
  title: "One time offer",
  productTitle: "The S-Series Snowboard",
  productImageURL: "https://cdn.shopify.com/s/files/1/0763/0703/8528/products/Main_9129b69a-0c7b-4f66-b6cf-c4222f18028a_430x.jpg?v=1683548245",
  productDescription: ["This PREMIUM snowboard is so SUPER DUPER awesome!"],
  originalPrice: "699.95",
  discountedPrice: "699.95",
  changes: [
    {
      type: "add_variant",
      variantID: 50094047428928, // Example variant ID, replace with actual
      quantity: 1,
      discount: {
        value: 15,
        valueType: "percentage",
        title: "15% off",
      },
    },
  ],
}];

// Loader: Handles preflight OPTIONS and GET requests
export const loader = async ({ request }) => {
  if (request.method === "OPTIONS") {
    // Respond to CORS preflight
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  // Authenticate request
  await authenticate.public.checkout(request);
  // Return dummy response for loader
  return new Response(JSON.stringify({ offerData: "offerData" }), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
    },
  });
};

// Action: Handles POST requests and CORS preflight
export const action = async ({ request }) => {
  const origin = request.headers.get('Origin');
  if (request.method === "OPTIONS") {
    // Respond to CORS preflight
    return new Response(null, {
      status: 204,
      headers: {
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
      },
    });
  }
  // Authenticate request
  await authenticate.public.checkout(request);
  // Return offers data with CORS headers
  return json({ offers }, {
    headers: {
      "Access-Control-Allow-Origin": origin || "*",
      "Content-Type": "application/json"
    },
  });
};

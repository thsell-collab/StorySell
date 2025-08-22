import { json } from "@remix-run/node";
import { v4 as uuidv4 } from "uuid";
import jwt from "jsonwebtoken";
import { authenticate } from "../shopify.server";
import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

// Loader: Handles CORS preflight for extension
export const loader = async ({ request }) => {
  await authenticate.public.checkout(request);
  // Handles CORS preflight for extension
};

// Action: Signs JWT for add-to-cart and metafield changes
export const action = async ({ request }) => {
  // Authenticate and get CORS helper
  const { cors } = await authenticate.public.checkout(request);
  const body = await request.json();
  console.log("body", body);
  // Handle changes: sign JWT for add-to-cart and metafield
  if (body?.changes) {
    // Normalize variant IDs and prepare offer changes
    const selectedOffer = [...body.changes];
    console.log("selectedOffer", selectedOffer);

    // JWT for add-to-cart changes
    const payload_add = {
      iss: process.env.SHOPIFY_API_KEY,
      jti: uuidv4(),
      iat: Date.now(),
      sub: body.referenceId,
      changes: selectedOffer,
    };
    const add_token = jwt.sign(
      payload_add,
      process.env.SHOPIFY_API_SECRET
    );

    // JWT for post-purchase metafield
    // Use key and namespace as per your requirement. Create metafield by adding key in ORDER_METAFIELDS_TO_CREATE or SHOP_METAFIELDS_TO_CREATE or PRODUCT_METAFIELDS_TO_CREATE
    const payload_meta = {
      iss: process.env.SHOPIFY_API_KEY,
      jti: uuidv4(),
      iat: Date.now(),
      sub: body.referenceId,
      changes: [
        {
          key: "nps_score",
          namespace: "boilerplate_order_namespace",
          value: "value",
          valueType: "string",
          type: "set_metafield",
        },
      ],
    };
    const metafield_token = jwt.sign(
      payload_meta,
      process.env.SHOPIFY_API_SECRET
    );

    return cors(json({ add_token, metafield_token }));
  }

  // Default fallback response
  return cors(json({ add_token: "" }));
};

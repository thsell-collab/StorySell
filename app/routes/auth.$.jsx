import { authenticate } from "../shopify.server";

// Loader: Authenticates user for protected route
export const loader = async ({ request }) => {
  await authenticate.admin(request);
  // Returns null for protected route
  return null;
};

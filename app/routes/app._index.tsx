import type { HeadersFunction, LoaderFunctionArgs } from "react-router";
import { authenticate } from "../shopify.server";
import { boundary } from "@shopify/shopify-app-react-router/server";

export const loader = async ({ request }: LoaderFunctionArgs) => {
  await authenticate.admin(request);

  return null;
};

export default function Index() {
  return (
    <s-page heading="StorySell">
      <s-section heading="Welcome to StorySell">
        <s-paragraph>
          Show a video on each product page and see how it affects your sales.
        </s-paragraph>
        <s-paragraph>
          The app is being set up. Product videos will be available here soon.
        </s-paragraph>
      </s-section>
    </s-page>
  );
}

export const headers: HeadersFunction = (headersArgs) => {
  return boundary.headers(headersArgs);
};

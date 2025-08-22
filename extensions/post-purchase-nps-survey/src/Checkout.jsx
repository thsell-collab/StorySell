import React, { useState } from "react";
import {
  reactExtension,
  BlockStack,
  Choice,
  ChoiceList,
  InlineStack,
  useSettings,
  useAppMetafields,
  useShop,
  Banner,
  Text,
  Button,
  useApi,
  useOrder
} from "@shopify/ui-extensions-react/checkout";

const thankYou = reactExtension("purchase.thank-you.block.render", () => (
  <App target="purchase.thank-you.block.render" />
));
export { thankYou };

const orderStatus = reactExtension("customer-account.order-status.block.render", () => (
  <App target="customer-account.order-status.block.render" />
));
export { orderStatus };

const APP_URL = "https://apps-topaz.vercel.app";

function App({ target }) {
  // This is the URL of your app server where you handle the NPS survey logic.
  const settings = useSettings() || {};
  const { nps_question, status } = settings;
  const { orderConfirmation, sessionToken } = useApi();
  const order = target === "customer-account.order-status.block.render" ? useOrder() : null;
  
  const plan_status = useAppMetafields({
    type: "shop",
    key: "plan_status",
    namespace: "boilerplate_shop_namespace"
  });

  const planStatusValue = plan_status?.[0]?.metafield?.value?.toLowerCase();

  const shop = useShop();
  const [selectedChoice, setSelectedChoice] = useState("");
  const [loading, setLoading] = useState(false);
  const [saveStatus, setSaveStatus] = useState(0);
  const ratingCount = parseInt(status || "10", 10);
  const ratingOptions = Array.from({ length: ratingCount }, (_, i) => String(i + 1));
  
  const handleChoiceChange = (newChoice) => {
    setSelectedChoice(newChoice);
  };

  const handleSubmit = async () => {
    const token = await sessionToken.get();
    
    let orderId = target === "purchase.thank-you.block.render"
      ? orderConfirmation?.current?.order?.id
      : order?.id;
      
    if (!selectedChoice || !orderId || !shop?.myshopifyDomain) return;

    setLoading(true);
    try {
      const res = await fetch(`${APP_URL}/api/save-metafields`, {
        method: "POST",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({
          shop: shop?.myshopifyDomain,
          metafieldValue: selectedChoice,
          orderId: `${orderId}`
        }),
      });
      const result = await res.json();
      console.log("Result:", result);
      setSaveStatus(1);
    } catch (err) {
      console.error("Error saving metafield:", err);
    } finally {
      setLoading(false);
    }
  };

  if (planStatusValue !== "active") {
    return (
      <Banner status="warning">
        <BlockStack>
          <Text>
            Currently you are on free plan. Please select a paid plan to continue using this extension.
          </Text>
        </BlockStack>
      </Banner>
    );
  }

  if (!nps_question || !["5", "10"].includes(status)) return null;

  return (
    <BlockStack padding="base" border="base" inlineAlignment="center" spacing="base">
      {saveStatus === 1 ? (
        <Banner status="success" title="Rating saved successfully." />
      ) : (
        <>
          <Text size="small" emphasis="bold" alignment="center">
            {nps_question}
          </Text>
          <ChoiceList
            name="nps-rating"
            value={selectedChoice}
            onChange={handleChoiceChange}
            variant="base"
          >
            <InlineStack spacing="loose">
              {ratingOptions.map((option) => (
                <Choice key={option} id={option}>
                  {option}
                </Choice>
              ))}
            </InlineStack>
          </ChoiceList>

          <Button onPress={handleSubmit} disabled={!selectedChoice || loading}>
            {loading ? "Saving..." : "Submit Rating"}
          </Button>
        </>
      )}
    </BlockStack>
  );
}

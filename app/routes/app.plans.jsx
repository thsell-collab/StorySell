import { json } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  appStatusQuery,
  recurringChargeQuery,
  recurringWithUsageChargeQuery,
  createOneTimeChargeQuery,
  createUsageChargeQuery
} from "../utils/graphql-queries";
import {
  MONTHLY_PLANS,
  YEARLY_PLANS,
  ONE_TIME_CHARGE,
  MONTHLY_WITH_USAGE_PLANS,
  USAGE_TERMS,
  USAGE_AMOUNT,
  TRIAL_DAYS
} from "../utils/constants";
import { StoresModel } from "../models/stores";
import { AppProvider } from "@shopify/shopify-app-remix/react";
import enTranslations from "@shopify/polaris/locales/en.json";
import polarisStyles from "@shopify/polaris/build/esm/styles.css?url";
import { useState, useEffect } from "react";
import {
  Box,
  BlockStack,
  ButtonGroup,
  InlineStack,
  Layout,
  Card,
  Page,
  Text,
  Button,
  InlineGrid
} from "@shopify/polaris";

export const links = () => [{ rel: "stylesheet", href: polarisStyles }];

// Loader: Returns Shopify API key and current plan info
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const shop = url.searchParams.get("shop");
  
  try {
    const { session } = await authenticate.admin(request);
    
    // Get current store plan information
    const store = await StoresModel.findByShop(session.shop);
    
    return json({ 
      apiKey: process.env.SHOPIFY_API_KEY,
      shop: session.shop,
      currentPlan: store ? {
        planId: store.plan_id,
        planType: store.plan_billing_cycle
      } : null
    });
  } catch (error) {
    // If authentication fails and we have a shop param, redirect to login
    if (shop) {
      throw redirect(`/auth/login?shop=${shop}`);
    }
    throw error;
  }
};

// Action: Handles plan selection and creates charges via GraphQL
export const action = async ({ request }) => {
  const { admin, redirect, session } = await authenticate.admin(request);

  const appStatus = await admin.graphql(appStatusQuery).then(res => res.json());
  const launchUrl = appStatus?.data?.currentAppInstallation?.launchUrl;

  const formData = Object.fromEntries(await request.formData());
  const { planId, planName, isOneTime, interval, isUsage, amount, billingCycle } = formData;
  const isTest = true; // Set false when deploying

  // Update store with selected plan info
  // await StoresModel.update({
  //   where: { shop: session.shop },
  //   data: {
  //     plan_id: planId,
  //     plan_billing_cycle: billingCycle,
  //   }
  // });

  let confirmationUrl = "";
  let responseJson = {};
  
  // Handles one-time, usage, and recurring charges
  if (isOneTime === "true") {
    responseJson = await admin
      .graphql(createOneTimeChargeQuery(isTest, launchUrl, planName, Number(amount)))
      .then(res => res.json());
    confirmationUrl = responseJson?.data?.appPurchaseOneTimeCreate?.confirmationUrl;
  } else if (isUsage === "true") {
    responseJson = await admin
      .graphql(
        recurringWithUsageChargeQuery(
          isTest,
          launchUrl,
          planName,
          TRIAL_DAYS,
          Number(amount),
          interval,
          USAGE_TERMS,
          USAGE_AMOUNT
        )
      )
      .then(res => res.json());
    confirmationUrl = responseJson?.data?.appSubscriptionCreate?.confirmationUrl;
  } else {
    responseJson = await admin
      .graphql(
        recurringChargeQuery(isTest, launchUrl, planName, TRIAL_DAYS, Number(amount), interval)
      )
      .then(res => res.json());
    confirmationUrl = responseJson?.data?.appSubscriptionCreate?.confirmationUrl;
  }

  return redirect(
    `/auth/exit-iframe?exitIframe=${encodeURIComponent(confirmationUrl)}`,
    { target: "_parent" }
  );
};

export default function App() {
  const [billingCycle, setBillingCycle] = useState("yearly");
  const { apiKey, currentPlan } = useLoaderData();
  const submit = useSubmit();
  
  // Set initial billing cycle based on current plan
  useEffect(() => {
    if (currentPlan?.planType) {
      setBillingCycle(currentPlan.planType);
    }
  }, [currentPlan]);

  const plans =
    billingCycle === "monthly"
      ? MONTHLY_PLANS
      : billingCycle === "yearly"
      ? YEARLY_PLANS
      : billingCycle === "one-time"
      ? ONE_TIME_CHARGE
      : billingCycle === "monthly-usage"
      ? MONTHLY_WITH_USAGE_PLANS
      : [];

  const intervalMap = {
    monthly: "EVERY_30_DAYS",
    yearly: "ANNUAL",
    "monthly-usage": "EVERY_30_DAYS"
  };
  const interval = intervalMap[billingCycle] || "EVERY_30_DAYS";

  const getAlternatePlan = (planId) => {
    if (billingCycle === "monthly-usage") return null;
    const altId =
      billingCycle === "monthly"
        ? `${planId}_yearly`
        : planId.replace("_yearly", "");
    return (billingCycle === "monthly" ? YEARLY_PLANS : MONTHLY_PLANS).find((p) => p.id === altId);
  };

  const handleSelect = (planId, planName, amount, isOneTime = "false", interval = "EVERY_30_DAYS", isUsage = "false") => {
    submit({ planId, planName, amount, isOneTime, interval, isUsage, billingCycle }, { method: "post" });
  };

  return (
    <AppProvider i18n={enTranslations} isEmbeddedApp apiKey={apiKey}>
      <Page
        title="Select a plan"
        backAction={{ content: "Back", url: "/app" }}  // <-- Added Back button
      >
        <Layout>
          <Layout.Section>
            <InlineStack align="center" wrap>
              <div
                style={{
                  backgroundColor: "#E3E3E3",
                  padding: "0.125rem",
                  borderRadius: "var(--p-border-radius-200)"
                }}
              >
                <ButtonGroup segmented>
                  <Button
                    variant={billingCycle === "monthly" ? "secondary" : "tertiary"}
                    onClick={() => setBillingCycle("monthly")}
                  >
                    Pay monthly
                  </Button>
                  <Button
                    variant={billingCycle === "yearly" ? "secondary" : "tertiary"}
                    onClick={() => setBillingCycle("yearly")}
                  >
                    Pay yearly
                  </Button>
                  <Button
                    variant={billingCycle === "one-time" ? "secondary" : "tertiary"}
                    onClick={() => setBillingCycle("one-time")}
                  >
                    Pay once
                  </Button>
                  <Button
                    variant={billingCycle === "monthly-usage" ? "secondary" : "tertiary"}
                    onClick={() => setBillingCycle("monthly-usage")}
                  >
                    Pay monthly with usage charge
                  </Button>
                </ButtonGroup>
              </div>
            </InlineStack>
          </Layout.Section>

          <Layout.Section>
            <Box>
              <BlockStack>
                <InlineGrid
                  alignItems="center"
                  columns={{
                    xs: 1,
                    sm: 2,
                    md: billingCycle === "one-time" ? 3 : MONTHLY_PLANS.length === 4 ? 4 : 3
                  }}
                  gap="400"
                >
                  {plans.map((plan) => {
                    const alternate = billingCycle !== "one-time" ? getAlternatePlan(plan.id) : null;
                    const isCurrentPlan = currentPlan?.planId === plan.id && currentPlan?.planType === billingCycle;

                    return (
                      <Card 
                        key={plan.id} 
                        padding="500" 
                        style={{ 
                          maxWidth: "300px",
                          border: isCurrentPlan ? "2px solid #00848e" : undefined,
                          backgroundColor: isCurrentPlan ? "#f6f6f7" : undefined
                        }}
                      >
                        <Box gap="100">
                          <InlineStack align="space-between">
                            <Text variant="bodySm" as="p">
                              {plan.name}
                            </Text>
                          </InlineStack>

                          <Text variant="headingXl" as="h1">${plan.price}</Text>

                          {billingCycle === "one-time" && (
                            <Text variant="bodySm" tone="subdued">One-time charge</Text>
                          )}

                          {billingCycle === "monthly-usage" && plan.chargeCriteria && (
                            <Text variant="bodySm" tone="subdued">{plan.chargeCriteria}</Text>
                          )}

                          {alternate && billingCycle !== "one-time" && billingCycle !== "monthly-usage" && (
                            <Text variant="bodySm" tone="subdued">
                              ${alternate.price} {billingCycle === "monthly" ? "/ year" : "/ 30 days"}
                              {billingCycle === "monthly" && (
                                <> ({`$${parseFloat(plan.price) * 12 - parseFloat(alternate.price)} off`})</>
                              )}
                            </Text>
                          )}

                          <br /><br />

                          <Button
                            variant="primary"
                            fullWidth
                            disabled={isCurrentPlan}
                            onClick={() =>
                              handleSelect(
                                plan.id,
                                plan.name,
                                Number(plan.price),
                                billingCycle === "one-time",
                                interval,
                                billingCycle === "monthly-usage"
                              )
                            }
                          >
                            {isCurrentPlan 
                              ? "Current Plan" 
                              : billingCycle === "one-time" 
                              ? "Pay once" 
                              : "Select"
                            }
                          </Button>

                          <br /><br />

                          <BlockStack gap="100">
                            {plan.features.map((feature, idx) => (
                              <InlineStack key={idx} gap="100" align="start">
                                <Text as="span" variant="bodySm">
                                  {feature}
                                </Text>
                              </InlineStack>
                            ))}
                          </BlockStack>
                        </Box>
                      </Card>
                    );
                  })}
                </InlineGrid>
              </BlockStack>
            </Box>
          </Layout.Section>
        </Layout>
      </Page>
    </AppProvider>
  );
}

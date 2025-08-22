import { json, redirect } from "@remix-run/node";
import { authenticate } from "../shopify.server";
import {
  appStatusQuery,
  shopQuery,
  metafieldsPinMutation,
  createUsageChargeQuery,
  setMetafieldValueMutation,
  createMetafieldDefinitionsMutation
} from "../utils/graphql-queries";
import {
  SHOP_METAFIELDS_TO_CREATE,
  ORDER_METAFIELDS_TO_CREATE,
  PRODUCT_METAFIELDS_TO_CREATE,
  META_FIELDS_TO_PIN,
  USAGE_DESCRIPTION,
  MONTHLY_PLANS,
  YEARLY_PLANS,
  MONTHLY_WITH_USAGE_PLANS
} from "../utils/constants";
import { StoresModel } from "../models/stores";

// Helper function to pin metafields
const pinMetafields = async (admin, mutationRes, fieldsToPin) => {
  if (!fieldsToPin?.length) return;
  
  for (const entry of Object.values(mutationRes?.data || {})) {
    const createdDef = entry?.createdDefinition;
    if (createdDef && fieldsToPin.includes(createdDef.key)) {
      await admin.graphql(metafieldsPinMutation(createdDef.id));
    }
  }

};

// Loader: Handles onboarding and plan assignment
export const loader = async ({ request }) => {
  const { session, admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const charge_id = url.searchParams.get("charge_id");
  const shop = url.searchParams.get("shop");

  if (!shop) return null;

  const [shopRes, appRes] = await Promise.all([
    admin.graphql(shopQuery).then(res => res.json()),
    admin.graphql(appStatusQuery).then(res => res.json()),
  ]);

  const shopData = shopRes?.data?.shop;
  const shop_owner_name = shopData?.shopOwnerName ?? "";
  const email = shopData?.email ?? "";
  const shopId = shopData?.id;
  const currentApp = appRes?.data?.currentAppInstallation;

  let plan_type = 0;
  let plan_status = "inactive";
  let plan_id = null;
  let plan_billing_cycle = null;

  const subscription = currentApp?.activeSubscriptions?.[0];
  const oneTimePurchase = currentApp?.oneTimePurchases?.edges?.[0]?.node;
  console.log("Current app data:", currentApp, oneTimePurchase);
  if (subscription) {
    // Subscription-based plan
    plan_status = subscription?.status ?? null;
    const planNameFromSubscription = (subscription?.name || "").toLowerCase();
    const isUsagePlan = subscription?.lineItems?.length > 1;
    
    // Check for yearly plans first by checking subscription interval
    const isYearlyPlan = subscription?.name && subscription?.lineItems?.[0]?.plan?.pricingDetails?.interval === "ANNUAL";
    
    let selectedPlans, matchedPlan;
    
    if (isUsagePlan) {
      selectedPlans = MONTHLY_WITH_USAGE_PLANS;
      matchedPlan = selectedPlans.find(p => p.name.toLowerCase() === planNameFromSubscription);
      plan_billing_cycle = "monthly-usage";
    } else if (isYearlyPlan) {
      selectedPlans = YEARLY_PLANS;
      matchedPlan = selectedPlans.find(p => p.name.toLowerCase() === planNameFromSubscription);
      plan_billing_cycle = "yearly";
    } else {
      selectedPlans = MONTHLY_PLANS;
      matchedPlan = selectedPlans.find(p => p.name.toLowerCase() === planNameFromSubscription);
      plan_billing_cycle = "monthly";
    }
    
    plan_type = matchedPlan ? selectedPlans.indexOf(matchedPlan) + 1 : 0;
    
    // Store plan ID for selection display
    if (matchedPlan) {
      plan_id = matchedPlan.id;
    }
    
    // Use this only when you want to create a usage charge based on some criteria
    // if (isUsagePlan) {
    //   const usageCharge = matchedPlan?.usageCharge ?? "0";
    //   subscription_id = subscription?.lineItems?.[1]?.id ?? null;

    //   const usageChargeRes = await admin
    //     .graphql(createUsageChargeQuery(subscription_id, USAGE_DESCRIPTION, usageCharge))
    //     .then(res => res.json());

    //   console.log("Usage charge response:", usageChargeRes?.data?.appUsageRecordCreate?.appUsageRecord);
    //   console.log("Usage charge errors:", usageChargeRes?.data?.appUsageRecordCreate?.userErrors);
    // }
  } else if (oneTimePurchase) {
    // One-time charge
    plan_status = oneTimePurchase?.status ?? null;
    plan_type = 4;
    plan_id = oneTimePurchase?.id; 
    plan_billing_cycle = "one-time";
  }

  // Create shop metafield definitions first
  const shopFields = Object.keys(SHOP_METAFIELDS_TO_CREATE).map(key => ({ 
    key, 
    name: SHOP_METAFIELDS_TO_CREATE[key].name 
  }));
  const shopMutation = createMetafieldDefinitionsMutation(shopFields, "SHOP", "boilerplate_shop_namespace");
  await admin.graphql(shopMutation).then(res => res.json());
  
  // Create order metafield definitions using generic function
  const orderFields = Object.keys(ORDER_METAFIELDS_TO_CREATE).map(key => ({ 
    key, 
    name: ORDER_METAFIELDS_TO_CREATE[key].name 
  }));
  const orderMutation = createMetafieldDefinitionsMutation(orderFields, "ORDER", "boilerplate_order_namespace");
  const orderMutationRes = await admin.graphql(orderMutation).then(res => res.json());
  
  // Pin order metafields if needed
  await pinMetafields(admin, orderMutationRes, META_FIELDS_TO_PIN.order);

  // Create product metafield definitions using generic function
  const productFields = Object.keys(PRODUCT_METAFIELDS_TO_CREATE).map(key => ({ 
    key, 
    name: PRODUCT_METAFIELDS_TO_CREATE[key].name 
  }));
  const productMutation = createMetafieldDefinitionsMutation(productFields, "PRODUCT", "boilerplate_product_namespace");
  const productMutationRes = await admin.graphql(productMutation).then(res => res.json());
  
  // Pin product metafields if needed
  await pinMetafields(admin, productMutationRes, META_FIELDS_TO_PIN.product);
  
  // This is just an example, you can set any metafield value as needed
  await admin.graphql(setMetafieldValueMutation(shopId, "boilerplate_shop_namespace", "plan_type", String(plan_type)));
  await admin.graphql(setMetafieldValueMutation(shopId, "boilerplate_shop_namespace", "plan_status", String(plan_status)));
  
  await admin.graphql(setMetafieldValueMutation("gid://shopify/Product/8340534198592", "boilerplate_product_namespace", "avg_rating", 4)).then(res => res.json());

  await admin.graphql(setMetafieldValueMutation("gid://shopify/Order/6632830665024", "boilerplate_order_namespace", "nps_score", 4)).then(res => res.json());
  
  // Upsert store in DB with essential plan details only
  await StoresModel.update({
    where: { shop },
    data: {
      charge_id,
      plan_type,
      plan_status,
      plan_id,
      plan_billing_cycle,
    }
  });

  throw redirect(`/app?${url.searchParams.toString()}`);
};

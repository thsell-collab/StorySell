// Shopify GraphQL queries and mutation builders for app features

// Webhook queries
const getWebhookQuery = `#graphql
  query {
    webhookSubscriptions(first: 20) {
      edges {
        node {
          id
          topic
          endpoint {
            __typename
            ... on WebhookHttpEndpoint { callbackUrl }
            ... on WebhookEventBridgeEndpoint { arn }
            ... on WebhookPubSubEndpoint { pubSubProject pubSubTopic }
          }
        }
      }
    }
  }`;

// Create a webhook subscription
const getWebhookMutationQuery = (topic, callbackUrl) => `mutation {
  webhookSubscriptionCreate(
    topic: ${topic},
    webhookSubscription: { callbackUrl: "${callbackUrl}", format: JSON }
  ) {
    webhookSubscription { id topic format endpoint { ... on WebhookHttpEndpoint { callbackUrl } } }
    userErrors { field message }
  }
}`;

// App status query
const appStatusQuery = `#graphql
{
  currentAppInstallation {
    launchUrl
    oneTimePurchases(first: 1) {
      edges {
        node {
          ... on AppPurchaseOneTime {
            price {
              amount
              currencyCode
            }
            id
            name
            status
            test
          }
        }
      }
    }
    activeSubscriptions {
      id
      name
      status
      lineItems {
        id
        plan {
          pricingDetails {
            __typename
            ... on AppRecurringPricing {
              price {
                amount
                currencyCode
              }
              interval
            }
            ... on AppUsagePricing {
              terms
              cappedAmount {
                amount
                currencyCode
              }
            }
          }
        }
      }
    }
    app {
      id
      title
    }
  }
}`;

// Shop details query
const shopQuery = `#graphql
  {
    shop {
      id
      myshopifyDomain
      shopOwnerName
      email
      name
      currencyCode
      plan { shopifyPlus partnerDevelopment }
      plan_type: metafield(namespace: "boilerplate_shop_namespace", key: "plan_type") { value type }
      plan_status: metafield(namespace: "boilerplate_shop_namespace", key: "plan_status") { value type }
    }
  }`;

// Update shop metafields
const getShopMutationQuery = (ownerId) => `#graphql
  mutation UpdateMetafieldValue {
    metafieldsSet(metafields: [
      { key: "plan_status", namespace: "boilerplate_shop_namespace", ownerId: "${ownerId}", type: "single_line_text_field", value: "inactive" },
      { key: "plan_type", namespace: "boilerplate_shop_namespace", ownerId: "${ownerId}", type: "number_integer", value: "0" }
    ]) {
      metafields { id key namespace value }
      userErrors { field message }
    }
  }`;

// Pin metafield definition query
const metafieldsPinMutation = (id) => `#graphql
  mutation { metafieldDefinitionPin(definitionId: "${id}") 
  { 
    pinnedDefinition 
    {
       key 
    } 
    userErrors 
    { 
      field 
      message 
    } 
  } 
}`;

// Generic metafield setter - works for any owner type (Shop, Order, Product, etc.)
const setMetafieldValueMutation = (ownerId, namespace, key, value, type = "single_line_text_field") => `#graphql
  mutation {
    metafieldsSet(metafields: [{
      ownerId: "${ownerId}",
      namespace: "${namespace}",
      key: "${key}",
      value: "${value}",
      type: "${type}"
    }]) {
      metafields { id namespace key value type }
      userErrors { field message }
    }
  }`;

// Generic metafield definition creator - works for any owner type
const createMetafieldDefinitionsMutation = (fields, ownerType, namespace) => {
  const mutationFields = fields
    .map((field, index) => {
      const fieldType = field.type || "single_line_text_field";
      const description =
        field.description || `Custom metafield for ${field.key}`;
      return `
    metafieldDefinitionCreate${index}: metafieldDefinitionCreate(definition: {
      name: "${field.name}",
      namespace: "${namespace}",
      key: "${field.key}",
      type: "${fieldType}",
      description: "${description}",
      ownerType: ${ownerType}
    }) {
      createdDefinition { id key name }
      userErrors { field message code }
    }`;
    })
    .join("");

  return `mutation CreateMetafieldDefinitions { ${mutationFields} }`;
};

// Orders count queries
const getOrdersCountQuery = `#graphql
  query {
    total: ordersCount(query: "fulfillment_status:*") { count }
    fulfilled: ordersCount(query: "fulfillment_status:fulfilled") { count }
    unfulfilled: ordersCount(query: "fulfillment_status:unfulfilled") { count }
  }`;

// Orders list query
const getOrdersQuery = `#graphql
  query ($first: Int, $after: String, $last: Int, $before: String, $query: String) {
    orders(first: $first, after: $after, last: $last, before: $before, reverse: true, query: $query) {
      pageInfo { hasNextPage hasPreviousPage startCursor endCursor }
      edges {
        node {
          id name displayFinancialStatus displayFulfillmentStatus processedAt
          currentTotalPriceSet { shopMoney { amount currencyCode } }
          customAttributes { key value }
          nps_score: metafield(namespace: "boilerplate_order_namespace", key: "nps_score") { value }
        }
      }
    }
  }`;

// Products list query
const getProductsQuery = `#graphql
  query getProducts($first: Int, $last: Int, $after: String, $before: String) {
    products(first: $first, last: $last, after: $after, before: $before) {
      edges {
        node {
          id title handle status totalInventory createdAt
          variantsCount { count precision }
          featuredImage { originalSrc altText }
          variants(first: 1) { edges { node { price } } }
          metafield(namespace: "boilerplate_product_namespace", key: "avg_rating") {
            value
          }
        }
      }
      pageInfo { hasNextPage hasPreviousPage endCursor startCursor }
    }
  }`;

// Recurring charge mutation
const recurringChargeQuery = (
  isTest,
  baseUrl,
  planName,
  trialDays,
  recurringAmount,
  interval,
) => `#graphql
  mutation {
    appSubscriptionCreate(
      name: "${planName}",
      returnUrl: "${baseUrl}/app/approved",
      test: ${isTest},
      trialDays: ${trialDays},
      lineItems: [
        { plan: { appRecurringPricingDetails: { price: { amount: ${recurringAmount}, currencyCode: USD }, interval: ${interval} } } }
      ]
    ) {
      userErrors { field message }
      confirmationUrl
      appSubscription { id lineItems { id plan { pricingDetails { __typename } } } }
    }
  }`;

// Recurring charge with usage mutation
const recurringWithUsageChargeQuery = (
  isTest,
  baseUrl,
  planName,
  trialDays,
  recurringAmount,
  interval,
  usageTerms,
  usageAmount,
) => `#graphql
  mutation {
    appSubscriptionCreate(
      name: "${planName}",
      returnUrl: "${baseUrl}/app/approved",
      test: ${isTest},
      trialDays: ${trialDays},
      lineItems: [
        { plan: { appRecurringPricingDetails: { price: { amount: ${recurringAmount}, currencyCode: USD }, interval: ${interval} } } },
        { plan: { appUsagePricingDetails: { terms: "${usageTerms}", cappedAmount: { amount: ${usageAmount}, currencyCode: USD } } } }
      ]
    ) {
      userErrors { field message }
      confirmationUrl
      appSubscription { id lineItems { id plan { pricingDetails { __typename } } } }
    }
  }`;

// Create usage charge mutation
const createUsageChargeQuery = (
  subscriptionLineItemId,
  usageDescription,
  usageCharge,
) => `#graphql
  mutation {
    appUsageRecordCreate(
      subscriptionLineItemId: "${subscriptionLineItemId}",
      description: "${usageDescription}",
      price: { amount: ${usageCharge}, currencyCode: USD }
    ) {
      userErrors { field message }
      appUsageRecord { id }
    }
  }`;

// One-time charge mutation
const createOneTimeChargeQuery = (
  isTest,
  baseUrl,
  planName,
  oneTimeAmount,
) => `#graphql
  mutation {
    appPurchaseOneTimeCreate(
      name: "${planName}",
      price: { amount: ${oneTimeAmount}, currencyCode: USD },
      returnUrl: "${baseUrl}/app/approved",
      test: ${isTest}
    ) {
      userErrors { field message }
      confirmationUrl
      appPurchaseOneTime { id status createdAt price { amount currencyCode } }
    }
  }`;

// Customers list query
const getCustomersQuery = `#graphql
  query ($first: Int, $after: String) {
    customers(first: $first, after: $after) {
      pageInfo { hasNextPage endCursor }
      edges { node { id email firstName lastName createdAt } }
    }
  }`;

// Shop locales query
const shopLocalesQuery = `#graphql
  { shopLocales { locale primary published name } }`;

// Save order metafield mutation
const saveOrderMetafieldMutation = ({
  orderId,
  namespace,
  key,
  value,
  type = "single_line_text_field",
}) => `#graphql
  mutation {
    metafieldsSet(metafields: [{
      ownerId: "${orderId}",
      namespace: "${namespace}",
      key: "${key}",
      value: "${value}",
      type: "${type}"
    }]) {
    metafields { id namespace key value }
    userErrors { field message }
  }
}`;

// Check if post-purchase app is in use
const checkpostPurchaseAppInUseQuery = `query CheckPostPurchaseApp { app { isPostPurchaseAppInUse } }`;

// Theme query
export const themeQuery = `{
  themes(first: 1, roles: MAIN) {
    edges {
      node {
        id
        name
        role
      }
    }
  }
}`;

// Theme settings file query
export const themeSettingsFileQuery = (themeId) => `{
  theme(id: "${themeId}") {
    id
    name
    role
    files(filenames: ["config/settings_data.json"], first: 1) {
      nodes {
        body {
          ... on OnlineStoreThemeFileBodyText {
            content
          }
        }
      }
    }
  }
}`;

// Export all queries and mutation builders
export {
  appStatusQuery,
  shopQuery,
  metafieldsPinMutation,
  getShopMutationQuery,
  getWebhookQuery,
  getWebhookMutationQuery,
  getOrdersCountQuery,
  getOrdersQuery,
  getProductsQuery,
  recurringWithUsageChargeQuery,
  createUsageChargeQuery,
  recurringChargeQuery,
  createOneTimeChargeQuery,
  setMetafieldValueMutation,
  createMetafieldDefinitionsMutation,
  getCustomersQuery,
  shopLocalesQuery,
  saveOrderMetafieldMutation,
  checkpostPurchaseAppInUseQuery,
};

// Utility function to format currency values
// Usage: FORMAT_MONEY('USD', 100) => "$100.00"
const FORMAT_MONEY = (currencyCode, amount) =>
  Intl.NumberFormat("en-US", {
    style: "currency",
    currency: currencyCode,
  }).format(amount);

// Monthly subscription plans
// Each plan object contains id, name, price, and feature list
const MONTHLY_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "9",
    features: ["Up to 100 orders", "Email support", "Analytics dashboard"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "29",
    features: ["Unlimited orders", "Priority support", "Advanced analytics"],
  },
  {
    id: "enterprise",
    name: "Unlimited",
    price: "59",
    features: ["Dedicated manager", "Custom integrations", "24/7 support"],
  },
];

// Yearly subscription plans
// Structure matches MONTHLY_PLANS, but with yearly pricing
const YEARLY_PLANS = [
  {
    id: "basic_yearly",
    name: "Basic",
    price: "90",
    features: ["Up to 100 orders", "Email support", "Analytics dashboard"],
  },
  {
    id: "standard_yearly",
    name: "Standard",
    price: "290",
    features: ["Unlimited orders", "Priority support", "Advanced analytics"],
  },
  {
    id: "enterprise_yearly",
    name: "Unlimited",
    price: "590",
    features: ["Dedicated manager", "Custom integrations", "24/7 support"],
  },
];

// One-time charge plan
// Used for single payment scenarios
const ONE_TIME_CHARGE = [
  {
    id: "one_time",
    name: "One Time",
    price: "49",
    features: ["Up to 100 orders", "Email support", "Analytics dashboard"],
  },
];

// Monthly plans with usage-based charges
// Each plan includes usageCharge and chargeCriteria for dynamic billing
const MONTHLY_WITH_USAGE_PLANS = [
  {
    id: "basic",
    name: "Basic",
    price: "9",
    usageCharge: "1",
    chargeCriteria: "$1 for every 100 orders",
    features: ["Up to 100 orders", "Email support", "Analytics dashboard"],
  },
  {
    id: "standard",
    name: "Standard",
    price: "29",
    usageCharge: "0.5",
    chargeCriteria: "$0.5 for every 100 orders",
    features: ["Unlimited orders", "Priority support", "Advanced analytics"],
  },
  {
    id: "advanced",
    name: "Advanced",
    price: "59",
    usageCharge: "0.25",
    chargeCriteria: "$0.25 for every 100 orders",
    features: ["Dedicated manager", "Custom integrations", "24/7 support"],
  },
];

// Trial period for new users (in days)
const TRIAL_DAYS = 14;
// Usage charge terms and description for billing UI
const USAGE_TERMS = "Usage charge terms";
const USAGE_DESCRIPTION = "Usage Description";
const USAGE_AMOUNT = 20;

// Metafield definitions for shop, order, and product
// Used to create metafields in Shopify for storing app-specific data
const SHOP_METAFIELDS_TO_CREATE = {
  plan_status: { name: "For storing plan status" },
  plan_type: { name: "For storing plan type" },
};

const ORDER_METAFIELDS_TO_CREATE = {
  nps_score: { name: "For storing NPS survey score" },
};

const PRODUCT_METAFIELDS_TO_CREATE = {
  avg_rating: { name: "For storing product rating" },
};

// Metafields to pin by owner type
const META_FIELDS_TO_PIN = {
  order: ["nps_score"],
  product: ["avg_rating"]
};

// Export all constants for use throughout the app
export {
  FORMAT_MONEY, // Currency formatting utility
  MONTHLY_PLANS, // Monthly subscription plans
  YEARLY_PLANS, // Yearly subscription plans
  ONE_TIME_CHARGE, // One-time charge plan
  MONTHLY_WITH_USAGE_PLANS, // Monthly plans with usage-based charges
  TRIAL_DAYS, // Trial period length
  USAGE_TERMS, // Usage charge terms
  USAGE_DESCRIPTION, // Usage charge description
  USAGE_AMOUNT, // Usage charge amount
  SHOP_METAFIELDS_TO_CREATE, // Shop metafield definitions
  ORDER_METAFIELDS_TO_CREATE, // Order metafield definitions
  PRODUCT_METAFIELDS_TO_CREATE, // Product metafield definitions
  META_FIELDS_TO_PIN, // Metafields to pin by owner type
};

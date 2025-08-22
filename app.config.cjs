module.exports = {
    apps: [{
        name: "post-purchase",
        script: "npm start",
        env: {
            "APP_NAME": "Boilerplate",
            "DATABASE_URL": "",
            "DIRECT_URL": "",
            "SHOPIFY_APP_URL": "https://deploy-url.com",
            "SHOPIFY_API_KEY": "",
            "SHOPIFY_API_SECRET": "",
            "PORT": "3000",
            "SCOPES": "read_themes,read_locales,read_markets_home,customer_read_customers,customer_read_orders,customer_write_customers,customer_write_orders,read_customers,read_products,write_customers,write_discounts,write_discounts_allocator_functions,write_orders,write_products,write_purchase_options",
            "REVIEW_URL": "https://apps.shopify.com",
            "RESEND_API_KEY": "",
            "BREVO_API_KEY": "",
            "MAILGUN_API_KEY": "",
            "ADMIN_STORE": "demostore.myshopify.com",
            "MANAGED_PRICING": "0",
            "APP_HANDLE": "app-handle",
            "DEMO_LINK": "",
            "SHOPIFY_MY_POST_PURCHASE_UI_EXTENSION_ID": "00d2212f-be71-4f04-9da0-fcbebbcb2fd7",
            "SHOPIFY_PRODUCT_OFFER_ID": "f258ea8d-ac1f-468d-b9b1-66009af4c48d",
            "SHOPIFY_THEME_APP_EXTENSION_ID": "f4c144bf-7186-49f9-a987-ee4c6d1016f0",
            "SHOPIFY_NPS_SURVEY_ID": "95663aae-bf22-458f-8599-5a4bd6da2f38"
        },
    }],
};
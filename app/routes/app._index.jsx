import { json, redirect } from "@remix-run/node";
import { useLoaderData, useSubmit } from "@remix-run/react";
import {
  Page,
  Layout,
  Text,
  Card,
  Button,
  BlockStack,
  Link,
  InlineStack,
  MediaCard,
  VideoThumbnail,
  Grid,
  Banner,
  FooterHelp,
  Spinner,
  Divider,
  Badge,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { authenticate } from "../shopify.server";
import {
  shopQuery,
  getOrdersCountQuery,
  checkpostPurchaseAppInUseQuery,
  themeQuery,
  themeSettingsFileQuery
} from "../utils/graphql-queries";
import {
  StatCard,
  RecommendedAppCard,
  FeatureCard,
  CallCard
} from "../utils/common-components";
import { StoresModel } from "../models/stores";
import { useI18n } from "@shopify/react-i18n";
import { useState } from "react";

// Opens Crisp live chat if available
function openChat() {
  if (window.$crisp?.push) window.$crisp.push(["do", "chat:open"]);
  else console.warn("Crisp chat not initialized.");
}

// Loader: Fetches shop data, orders, post-purchase status, and theme info
export const loader = async ({ request }) => {
  const { admin, session } = await authenticate.admin(request);
  // Query for active theme
  const themeResp = await admin.graphql(themeQuery).then(res => res.json());
  const themeNode = themeResp?.data?.themes?.edges?.[0]?.node;
  let appEmbedEnabled = false;
  if (themeNode?.id) {
    // Use GraphQL to fetch config/settings_data.json file content
    const fileResp = await admin.graphql(themeSettingsFileQuery(themeNode.id)).then(res => res.json());
    const fileContent = (fileResp?.data?.theme?.files?.nodes?.[0]?.body?.content);
    // Step 1: Extract the JSON part
    const jsonMatch = fileContent.match(/{[\s\S]*}/);
    if (!jsonMatch) throw new Error("No JSON object found in string");

    const jsonString = jsonMatch[0];

    // Step 2: Parse the string to an object
    let parsedData;
    try {
      parsedData = JSON.parse(jsonString);
    } catch (err) {
      console.error("JSON parse error:", err.message);
    }

    const blocks = parsedData?.current?.blocks || {};

    const enabledAppEmbedBlock = Object.entries(blocks).find(
      ([, block]) =>
        block.type.includes(`shopify://apps/${((process.env.APP_NAME || "Your App Name").toLowerCase()).replace(" ", "-")}/`) && block.disabled === false
    );

    if (enabledAppEmbedBlock) {
      appEmbedEnabled = true;
    }
  }
  // Fetch shop details
  const shopResp = await admin.graphql(shopQuery).then((res) => res.json());
  const shop_data = shopResp?.data ?? {};

  // Fetch orders count (total, fulfilled, unfulfilled)
  const ordersResp = await admin.graphql(getOrdersCountQuery).then((res) => res.json());
  const totalOrders = ordersResp?.data?.total?.count ?? 0;
  const fulfilledOrders = ordersResp?.data?.fulfilled?.count ?? 0;
  const unfulfilledOrders = ordersResp?.data?.unfulfilled?.count ?? 0;

  // Check if post-purchase app is in use
  const postPurchaseResponse = await admin.graphql(checkpostPurchaseAppInUseQuery).then((res) => res.json());
  const isPostPurchaseAppInUse = postPurchaseResponse?.data?.app?.isPostPurchaseAppInUse ?? false;
  
  // Get store plan information from database
  const store = await StoresModel.findByShop(session.shop);
  
  return json({
    shop_data,
    plan_type: store?.plan_type || 0,
    totalOrders,
    fulfilledOrders,
    unfulfilledOrders,
    isPostPurchaseAppInUse,
    app_name: process.env.APP_NAME || "Your App Name",
    demo_link: "https://your-demo-link.com",
    review_url: "https://apps.shopify.com/your-app",
    current_year: new Date().getFullYear(),
    theme_app_extension_id : process.env.SHOPIFY_THEME_APP_EXTENSION_ID || "your-theme-app-extension-id",
    block_name: process.env.BLOCK_NAME || "theme-app-extension",
    appEmbedEnabled,
    themeNode,
  });
};

// Action: Handles refresh by redirecting back
export const action = async ({ request }) => {
  const formData = Object.fromEntries(await request.formData());
  if (formData.action === "refresh") return redirect("/app");
};

export default function Index() {
  // i18n, loader data, and state
  const [i18n] = useI18n({ id: "default" });
  const submit = useSubmit();
  const {
    shop_data,
    demo_link,
    app_name,
    current_year,
    review_url,
    plan_type,
    totalOrders,
    fulfilledOrders,
    unfulfilledOrders,
    isPostPurchaseAppInUse,
    theme_app_extension_id,
    block_name,
    appEmbedEnabled,
    themeNode
  } = useLoaderData();
  const shop = shop_data?.shop;
  const storeAdminUrl = `https://admin.shopify.com/store/${shop?.myshopifyDomain?.split(".")[0]}`;
  const themeEditorUrl = themeNode?.id ? `${storeAdminUrl}/themes/${(themeNode.id).split("/").pop()}/editor` : `${storeAdminUrl}/themes`;
  const [refreshing, setRefreshing] = useState(false);

  // State for individual refresh buttons
  const [refreshingPostPurchase, setRefreshingPostPurchase] = useState(false);
  const [refreshingAppEmbed, setRefreshingAppEmbed] = useState(false);

  // Refresh handlers for each card
  const handleRefreshPostPurchase = () => {
    setRefreshingPostPurchase(true);
    window.location.reload();
  };
  const handleRefreshAppEmbed = () => {
    setRefreshingAppEmbed(true);
    window.location.reload();
  };

  return (
    <Page>
      {/* TitleBar with support button */}
      <TitleBar title={`Hey ${shop?.shopOwnerName || "Shopify Merchant"}`}>
        <button variant="primary" onClick={openChat}>
          Get support
        </button>
      </TitleBar>
      
      {/* Show free plan card only if user is on free plan */}
      {!plan_type && (
        <Card>
          <InlineStack align="space-between">
            <Text variant="headingMd">
              Current plan: <Badge tone="info">Free</Badge>
            </Text>
            <Button variant="primary" url="/plans">
              Upgrade Plan
            </Button>
          </InlineStack>
        </Card>
      )}
      <br/>
      {/* App embed block enable step card */}
      {appEmbedEnabled ? (
        <Banner tone="success" title="App embed is active." />
      ) : (
        <Card>
          <BlockStack>
            <Text variant="headingMd">Enable app embed block</Text>
            <br />
            <Text variant="bodyMd">
              To enable app embed block in your store theme, click on below "Enable app embed" button &gt; click on app embeds &gt; toggle on "your app name" &gt; click on save.
            </Text>
            <br />
            <InlineStack gap={200}>
              <Button
                variant="primary"
                url={themeEditorUrl}
                target="_blank"
                style={{ minWidth: 180, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>Enable app embed</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleRefreshAppEmbed}
                disabled={refreshingAppEmbed}
                style={{ minWidth: 180, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                  {refreshingAppEmbed ? <Spinner accessibilityLabel="Refreshing" size="small" /> : "Refresh status"}
                </span>
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}
      <br/>
      {/* Post-purchase app status card */}
      {isPostPurchaseAppInUse ? (
        <Banner tone="success" title={`“${app_name}” is active on post-purchase page.`} />
      ) : (
        <Card>
          <BlockStack>
            <Text variant="headingMd">Enable post-purchase app</Text>
            <br />
            <Text variant="bodyMd">
              To enable post-purchase upsell for customers, click on below "Enable post-purchase app" button &gt; select “your app name” &gt; click on save.
            </Text>
            <br />
            <InlineStack gap={200}>
              <Button
                variant="primary"
                url={`${storeAdminUrl}/settings/checkout#post-purchase-page`}
                target="_blank"
                style={{ minWidth: 180, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>Enable post-purchase app</span>
              </Button>
              <Button
                variant="secondary"
                onClick={handleRefreshPostPurchase}
                disabled={refreshingPostPurchase}
                style={{ minWidth: 180, height: 36, padding: 0, display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
              >
                <span style={{ display: 'inline-block', width: '100%', textAlign: 'center' }}>
                  {refreshingPostPurchase ? <Spinner accessibilityLabel="Refreshing" size="small" /> : "Refresh status"}
                </span>
              </Button>
            </InlineStack>
          </BlockStack>
        </Card>
      )}
      <br/>
      <Divider borderColor="border"/>
      <br/>
      <BlockStack gap="200">
        <Layout>
          {/* Main Section: Orders stats and features */}
          <Layout.Section>
            <BlockStack gap="200">
              {/* Orders summary with analytics button */}
              <Card>
                <Grid>
                  <StatCard title="Total orders" value={totalOrders} />
                  <StatCard title="Fulfilled orders" value={fulfilledOrders} />
                  <StatCard title="Unfulfilled orders" value={unfulfilledOrders} />
                </Grid>
                <br />
                <Button variant="primary" url="/app/analytics">
                  View analytics
                </Button>
              </Card>
            </BlockStack>

            <br />
            {/* Features grouped by tiers (Basic, Standard, Advanced) */}
            {/* Basic Features */}
            <Card>
              <Text variant="headingSm">Basic {Number(plan_type) === 1 ? <Badge tone="success">Active</Badge> : ''}</Text>
              <br />
              <Grid>
                <FeatureCard title="General Settings" url="/app/general-settings-form" />
                <FeatureCard
                  title="Theme App Extensions"
                  url={`${storeAdminUrl}/admin/themes/current/editor?template=product&addAppBlockId=${theme_app_extension_id}/${block_name}&target=newAppsSection`}
                  external
                />
              </Grid>
            </Card>

            <br />

            {/* Standard Features */}
            <Card>
              <Text variant="headingSm">Standard {Number(plan_type) === 2 ? <Badge tone="success">Active</Badge> : ''}</Text>
              <br />
              <Grid>
                <FeatureCard title="Manage Orders" url="/app/orders" />
                <FeatureCard title="Manage Products" url="/app/products" />
              </Grid>
            </Card>

            <br />

            {/* Advanced Features */}
            <Card>
              <Text variant="headingSm">Advanced {Number(plan_type) === 3 ? <Badge tone="success">Active</Badge> : ''}</Text>
              <br />
              <Grid>
                <FeatureCard
                  title="Checkout Extensions"
                  url={`${storeAdminUrl}/settings/checkout/editor`}
                  external
                />
                <FeatureCard
                  title="Thank You Page Extensions"
                  url={`${storeAdminUrl}/settings/checkout/editor?page=thank-you`}
                  external
                />
              </Grid>
            </Card>
          </Layout.Section>

          {/* Sidebar: Setup guide & About section */}
          <Layout.Section variant="oneThird">
            <BlockStack gap="500">
              {/* Setup guide card */}
              <MediaCard
                portrait
                title={`Get started with "your app name"`}
                primaryAction={{
                  content: "Open Setup Guide",
                  variant: "primary",
                  url: demo_link,
                  target: "_blank",
                }}
              >
                <VideoThumbnail thumbnailUrl="/images/pp-logo.png" />
              </MediaCard>

              {/* About section */}
              <Card>
                <BlockStack gap="200">
                  <Text as="h2" variant="headingMd">
                    About {app_name}
                  </Text>
                  {/* Useful links */}
                  {[
                    { text: "Need something else?", url: "" },
                    { text: "View changelog", url: "" },
                    { text: "View roadmap", url: "" },
                  ].map((link, idx) => (
                    <InlineStack key={idx} align="space-between">
                      <Text>{link.text}</Text>
                      <Link url={link.url} target="_blank" removeUnderline>
                        Click here
                      </Link>
                    </InlineStack>
                  ))}
                  {/* Live chat link */}
                  <InlineStack align="space-between">
                    <Text>Contact us</Text>
                    <Link onClick={openChat} removeUnderline>
                      Live chat
                    </Link>
                  </InlineStack>
                </BlockStack>
              </Card>
            </BlockStack>
          </Layout.Section>
        </Layout>
        <br />
        <Divider borderColor="border" />
        <br />
        <CallCard openChat={openChat}/>
        <br />
        <Divider borderColor="border" />
        <br />
        {/* Recommended apps section */}
        <BlockStack gap="200">
          <Text variant="headingLg">Recommended Apps</Text>
          <Grid>
            <RecommendedAppCard title="App name" description="App description" imgSrc="/images/buy_again.png" />
            <RecommendedAppCard title="App name" description="App description" imgSrc="/images/logo.png" />
          </Grid>
        </BlockStack>

        {/* Footer */}
        <FooterHelp>
          {app_name} © {current_year}
        </FooterHelp>
      </BlockStack>
    </Page>
  );
}

import { useEffect, useState, useRef } from "react";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import {
  Page,
  Layout,
  Button,
  BlockStack,
  InlineStack,
  DatePicker,
  Grid,
  Popover,
  Box,
  InlineGrid,
  useBreakpoints,
  Card,
  Text,
  Link,
  Spinner
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { SalesCard } from "../utils/common-components";
import { shopQuery } from "../utils/graphql-queries";
import { PrismaClient } from '@prisma/client';
import { FORMAT_MONEY } from "../utils/constants";
import { CalendarIcon } from "@shopify/polaris-icons";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import { StoresModel } from "../models/stores";

const prisma = new PrismaClient();

// Loader: Fetches analytics data from Shopify and local store
export const loader = async ({ request }) => {
  const { admin } = await authenticate.admin(request);
  const url = new URL(request.url);
  const since = url.searchParams.get("since");
  const until = url.searchParams.get("until");
  const response = await admin.graphql(shopQuery);
  const responseJson = await response.json();
  const currencyCode = responseJson?.data?.shop?.currencyCode;
  const myshopifyDomain = responseJson?.data?.shop?.myshopifyDomain;

  const store = await StoresModel.findUnique({ where: { shop: myshopifyDomain } });
  if (!store) throw new Error("Store not found");

  const storedMaxCreatedAt = store.last_order_created_at ?? "";
  let newMaxCreatedAt = storedMaxCreatedAt;

  const formatDate = (date) =>
    `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')}`;
  const todayDateFormatted = formatDate(new Date());
  const filterQuery = since && until ? `processed_at:>=${since} processed_at:<=${until}` : `processed_at:>=${todayDateFormatted}`;

  let total_today = 0, todaysOrderCount = 0;
  const dailyMap = {};
  const productSalesMap = {};

  const fetchOrders = async (endCursor = null) => {
    const query = `#graphql
    {
      orders(first: 250${endCursor ? `, after: \"${endCursor}\"` : ""}, query: \"${filterQuery}\") {
        edges {
          node {
            createdAt
            currentTotalPriceSet {
              shopMoney {
                amount
                currencyCode
              }
            }
            lineItems(first: 100) {
              edges {
                node {
                  product {
                    id
                  }
                  name
                  quantity
                }
              }
            }
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
      }
    }`;

    const res = await admin.graphql(query);
    const json = await res.json();
    const orders = json?.data?.orders?.edges ?? [];

    for (const { node: order } of orders) {
      todaysOrderCount++;
      const createdAt = order.createdAt;
      if (!storedMaxCreatedAt || new Date(createdAt) > new Date(storedMaxCreatedAt)) {
        newMaxCreatedAt = createdAt;
      }
      const date = createdAt.split("T")[0];
      const amount = Number(order.currentTotalPriceSet?.shopMoney?.amount || 0);

      if (!dailyMap[date]) {
        dailyMap[date] = { date, orderCount: 0, totalAmount: 0 };
      }
      dailyMap[date].orderCount++;
      dailyMap[date].totalAmount += amount;

      total_today += amount;

      // Aggregate product sales
      for (const item of order.lineItems.edges) {
        const name = item.node.name;
        const qty = item.node.quantity || 0;
        const key = name;

        if (!productSalesMap[key]) {
          productSalesMap[key] = { name, quantity: 0, totalAmount: 0, id: item.node?.product?.id };
        }

        productSalesMap[key].quantity += qty;
        productSalesMap[key].totalAmount += amount; // crude approximation
      }
    }

    if (json.data.orders.pageInfo.hasNextPage) {
      await fetchOrders(json.data.orders.pageInfo.endCursor);
    }
  };

  await fetchOrders();

  if (newMaxCreatedAt !== storedMaxCreatedAt) {
    await StoresModel.update({
      where: { shop: myshopifyDomain },
      data: { last_order_created_at: newMaxCreatedAt },
    });
  }

  const chartData = Object.values(dailyMap)
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .map((entry) => ({
      ...entry,
      totalAmount: parseFloat(entry.totalAmount.toFixed(2)),
    }));

  const topProducts = Object.values(productSalesMap)
    .sort((a, b) => b.totalAmount - a.totalAmount)
    .slice(0, 5);

  return json({
    analytics: {
      currencyCode,
      total_today: total_today.toFixed(2),
      todaysOrderCount,
      total_orders_count: store.total_orders_count || 0,
    },
    chartData,
    topProducts,
    shopData: responseJson.data,
  });
};

export const action = async ({ request }) => {
  await authenticate.admin(request);
  return json({});
};

// AnalyticsPage: Displays analytics dashboard with charts and filters
export default function AnalyticsPage() {
  const loaderData = useLoaderData();
  const fetcher = useFetcher();
  const isLoading = fetcher.state === "loading"; // track if fetching new data
  const analytics = fetcher.data?.analytics || loaderData.analytics;
  const shopData = loaderData.shopData;
  const chartData = fetcher.data?.chartData || loaderData.chartData;
  const topProducts = fetcher.data?.topProducts || loaderData.topProducts;
  const currencyCode = analytics?.currencyCode;

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const [dateRange, setDateRange] = useState({ start: today, end: today });
  const [{ month, year }, setDate] = useState({
    month: today.getMonth(),
    year: today.getFullYear(),
  });
  const [popoverActive, setPopoverActive] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState("custom");
  const { mdDown } = useBreakpoints();

  const handleMonthChange = (month, year) => setDate({ month, year });
  const handleDateChange = ({ start, end }) => setDateRange({ start, end });

  const handlePresetSelect = (preset) => {
    setSelectedPreset(preset);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    let start, end;
    
    switch (preset) {
      case "today":
        start = end = new Date(today);
        break;
      case "yesterday":
        start = end = new Date(today.getTime() - 24 * 60 * 60 * 1000);
        break;
      case "last7":
        start = new Date(today.getTime() - 6 * 24 * 60 * 60 * 1000);
        end = new Date(today);
        break;
      case "last30":
        start = new Date(today.getTime() - 29 * 24 * 60 * 60 * 1000);
        end = new Date(today);
        break;
      case "last90":
        start = new Date(today.getTime() - 89 * 24 * 60 * 60 * 1000);
        end = new Date(today);
        break;
      case "last365":
        start = new Date(today.getTime() - 364 * 24 * 60 * 60 * 1000);
        end = new Date(today);
        break;
      case "last12months":
        start = new Date(today.getFullYear() - 1, today.getMonth(), today.getDate());
        end = new Date(today);
        break;
      case "lastweek":
        const lastWeekStart = new Date(today.getTime() - (today.getDay() + 6) * 24 * 60 * 60 * 1000);
        start = new Date(lastWeekStart);
        end = new Date(lastWeekStart.getTime() + 6 * 24 * 60 * 60 * 1000);
        break;
      case "lastmonth":
        start = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        end = new Date(today.getFullYear(), today.getMonth(), 0);
        break;
      default:
        return;
    }
    
    setDateRange({ start, end });
  };

  const formatDate = (date) => {
    const y = date.getFullYear(), m = (`0${date.getMonth() + 1}`).slice(-2), d = (`0${date.getDate()}`).slice(-2);
    return `${y}-${m}-${d}`;
  };

  const applyDateRange = () => {
    setPopoverActive(false);
    const since = formatDate(dateRange.start);
    const until = formatDate(dateRange.end);
    fetcher.load(`/app/analytics?since=${since}&until=${until}`);
  };

  const applyPreset = () => {
    applyDateRange();
  };

  const getButtonText = () => {
    if (dateRange.start.toDateString() === dateRange.end.toDateString()) {
      return dateRange.start.toLocaleDateString();
    }
    return `${dateRange.start.toLocaleDateString()} - ${dateRange.end.toLocaleDateString()}`;
  };

  const dynamicSalesLabel = dateRange.start.toDateString() === dateRange.end.toDateString()
    ? `Total sales on ${dateRange.start.toLocaleDateString()}`
    : `Total sales from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`;

  const dynamicOrdersCountLabel = dateRange.start.toDateString() === dateRange.end.toDateString()
    ? `Orders on ${dateRange.start.toLocaleDateString()}`
    : `Orders from ${dateRange.start.toLocaleDateString()} to ${dateRange.end.toLocaleDateString()}`;

  const datePickerRef = useRef(null);

  return (
    <Page fullWidth title="Analytics">
      {/* Date Range Popover */}
      <Popover
        active={popoverActive}
        autofocusTarget="none"
        preferredAlignment="left"
        preferredPosition="below"
        fluidContent
        sectioned={false}
        fullHeight
        activator={
          <Button size="slim" icon={CalendarIcon} onClick={() => setPopoverActive(!popoverActive)}>
            {getButtonText()}
          </Button>
        }
        onClose={() => setPopoverActive(false)}
      >
        <Popover.Pane fixed>
          <InlineGrid columns={{ xs: "1fr", mdDown: "1fr", md: "200px 1fr" }} gap={0} ref={datePickerRef}>
            <Box padding="400" borderInlineEndWidth="025" borderColor="border">
              <BlockStack gap="200">
                <Text variant="headingXs" as="h6">Select period</Text>
                <BlockStack gap="100">
                  {[
                    { key: "today", label: "Today" },
                    { key: "yesterday", label: "Yesterday" },
                    { key: "last7", label: "Last 7 days" },
                    { key: "last30", label: "Last 30 days" },
                    { key: "last90", label: "Last 90 days" },
                    { key: "last365", label: "Last 365 days" },
                    { key: "last12months", label: "Last 12 months" },
                    { key: "lastweek", label: "Last week" },
                    { key: "lastmonth", label: "Last month" }
                  ].map(({ key, label }) => (
                    <Button
                      key={key}
                      variant={selectedPreset === key ? "primary" : "tertiary"}
                      size="slim"
                      fullWidth
                      textAlign="start"
                      onClick={() => handlePresetSelect(key)}
                    >
                      {label}
                    </Button>
                  ))}
                </BlockStack>
              </BlockStack>
            </Box>
            <Box padding={{ xs: 500 }} maxWidth={mdDown ? "320px" : "516px"}>
              <BlockStack gap="400">
                <DatePicker
                  month={month}
                  year={year}
                  selected={{ start: dateRange.start, end: dateRange.end }}
                  onMonthChange={handleMonthChange}
                  onChange={(range) => {
                    handleDateChange(range);
                    setSelectedPreset("custom");
                  }}
                  multiMonth
                  allowRange
                />
              </BlockStack>
            </Box>
          </InlineGrid>
        </Popover.Pane>
        <Popover.Pane fixed>
          <Popover.Section>
            <InlineStack align="end">
              <Button onClick={() => setPopoverActive(false)}>Cancel</Button>
              <Button 
                variant="primary" 
                onClick={selectedPreset === "custom" ? applyDateRange : applyPreset} 
                style={{ marginLeft: '8px' }}
              >
                Apply
              </Button>
            </InlineStack>
          </Popover.Section>
        </Popover.Pane>
      </Popover>

      <br />

      {/* Show Spinner While Loading */}
      {isLoading ? (
        <Box padding="800" align="center">
          <Spinner accessibilityLabel="Loading analytics data" size="large" />
        </Box>
      ) : (
        <BlockStack gap="500">
          <Layout>
            <Layout.Section>
              <Grid>
                <SalesCard title="Sales" salesAmount={FORMAT_MONEY(currencyCode, analytics?.total_today ?? 0)} />
                <SalesCard title="Order count" ordersCount={analytics?.todaysOrderCount} />
                <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
                  <Card title="Top 5 Products (by Sales)" sectioned>
                    {topProducts?.length > 0 ? (
                      <>
                        <InlineStack align="space-between">
                          <Text alignment="start" as="h2" variant="headingMd">
                            Top products
                          </Text>
                        </InlineStack>
                        <br />
                        <BlockStack gap="300">
                          {topProducts.map((product, index) => (
                            <InlineStack key={index} wrap={false} gap="400" align="space-between">
                              <Link target="_blank" url={`https://admin.shopify.com/store/${shopData.shop?.myshopifyDomain.split(".")[0]}/products/${product.id.split("/").pop()}`}><Text truncate>{product.name}</Text></Link>
                              <Text>{FORMAT_MONEY(currencyCode, product.totalAmount.toFixed(2))}</Text>
                            </InlineStack>
                          ))}
                        </BlockStack>
                      </>
                    ) : (
                      <Text>No product sales yet.</Text>
                    )}
                  </Card>
                </Grid.Cell>
              </Grid>
            </Layout.Section>

            <Layout.Section>
              <InlineGrid columns={{ xs: "1fr", md: "1fr 1fr" }} gap="400">
                <Card>
                  <Text variant="headingSm" as="h6">Sales (Line)</Text>
                  <ResponsiveContainer width="100%" height={250}>
                    {chartData?.length > 0 ? (
                      <LineChart data={chartData}>
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Line type="monotone" dataKey="totalAmount" stroke="#00bfa5" />
                      </LineChart>
                    ) : (
                      <Box padding="400"><Text>No data available.</Text></Box>
                    )}
                  </ResponsiveContainer>
                </Card>
                <Card>
                  <Text variant="headingSm" as="h6">Order Count (Bar)</Text>
                  <ResponsiveContainer width="100%" height={250}>
                    {chartData?.length > 0 ? (
                      <BarChart data={chartData}>
                        <XAxis dataKey="date" angle={-45} textAnchor="end" height={60} tick={{ fontSize: 10 }} />
                        <YAxis />
                        <Tooltip />
                        <Bar dataKey="orderCount" fill="#8884d8" />
                      </BarChart>
                    ) : (
                      <Box padding="400"><Text>No data available.</Text></Box>
                    )}
                  </ResponsiveContainer>
                </Card>
              </InlineGrid>
            </Layout.Section>
          </Layout>
        </BlockStack>
      )}
    </Page>
  );
}

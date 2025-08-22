import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  IndexTable,
  Text,
  Page,
  Layout,
  Badge,
  Link,
  IndexFilters,
  useSetIndexFiltersMode,
  useBreakpoints,
  RangeSlider,
} from "@shopify/polaris";
import { useMemo, useState } from "react";
import { authenticate } from "../shopify.server";
import { FORMAT_MONEY } from "../utils/constants";
import { getOrdersQuery, shopQuery } from "../utils/graphql-queries";
import { PrismaClient } from "@prisma/client";
import { StoresModel } from "../models/stores";
const prisma = new PrismaClient();
const perPageCount = 20;

// Loader: Fetches paginated orders from Shopify and local store info
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const before = url.searchParams.get("before");
  const { admin, session } = await authenticate.admin(request);

  const [{ data: shopData }, store] = await Promise.all([
    (await admin.graphql(shopQuery)).json(),
    StoresModel.findUnique({ where: { shop: session.shop } }),
  ]);

  const createdDate = "2024-05-31T00:00:00Z";
  const paginationVars = after
    ? { first: perPageCount, after }
    : before
    ? { last: perPageCount, before }
    : { first: perPageCount };

  const variables = {
    ...paginationVars,
    query: `processed_at:>${createdDate}`,
  };

  const { data } = await (await admin.graphql(getOrdersQuery, { variables })).json();

  // Returns shop data, orders data, and shop name for client rendering
  return json({
    shopData,
    ordersData: data.orders,
    shopName: session.shop,
  });
};

// OrdersPage: Displays paginated order list with filters
export default function OrdersPage() {
  const { ordersData, shopName } = useLoaderData();
  const navigate = useNavigate();
  const orders = ordersData.edges.map(edge => edge.node);
  const { hasNextPage, hasPreviousPage, endCursor, startCursor } = ordersData.pageInfo;

  const [queryValue, setQueryValue] = useState("");
  const [selected, setSelected] = useState(0);
  const [sortSelected, setSortSelected] = useState(["date desc"]);
  const [npsRange, setNpsRange] = useState([0, 10]);
  const { mode, setMode } = useSetIndexFiltersMode();
  const { smDown } = useBreakpoints();

  const tabs = [
    { content: "All", id: "ALL" },
    { content: "NPS only", id: "NPS" },
    { content: "Paid", id: "PAID" },
    { content: "Pending", id: "PENDING" },
    { content: "Refunded", id: "REFUNDED" },
    { content: "Fulfilled", id: "FULFILLED" },
    { content: "Unfulfilled", id: "UNFULFILLED" },
  ];

  const filters = [
    {
      key: "npsRange",
      label: "NPS score",
      filter: (
        <RangeSlider
          label="NPS Range"
          labelHidden
          value={npsRange}
          min={0}
          max={10}
          step={1}
          output
          onChange={setNpsRange}
        />
      ),
    },
  ];

  const appliedFilters = [
    {
      key: "npsRange",
      label: `NPS: ${npsRange[0]} to ${npsRange[1]}`,
      onRemove: () => setNpsRange([0, 10]),
    },
  ];

  const sortOptions = [
    { label: "Date", value: "date asc", directionLabel: "Oldest" },
    { label: "Date", value: "date desc", directionLabel: "Newest" },
    { label: "Amount", value: "amount asc", directionLabel: "Low to High" },
    { label: "Amount", value: "amount desc", directionLabel: "High to Low" },
    { label: "NPS", value: "nps asc", directionLabel: "Low to High" },
    { label: "NPS", value: "nps desc", directionLabel: "High to Low" },
  ];

  const filteredOrders = useMemo(() => {
    let result = [...orders];

    const tab = tabs[selected].id;
    if (tab === "NPS") {
      result = result.filter((o) => o.nps_score?.value != null);
    } else if (["PAID", "PENDING", "REFUNDED"].includes(tab)) {
      result = result.filter((o) => o.displayFinancialStatus === tab);
    } else if (["FULFILLED", "UNFULFILLED"].includes(tab)) {
      result = result.filter((o) => o.displayFulfillmentStatus === tab);
    }

    if (queryValue?.trim()) {
      result = result.filter((o) =>
        o.name.toLowerCase().includes(queryValue.toLowerCase())
      );
    }

    result = result.filter((o) => {
      const nps = parseInt(o.nps_score?.value ?? 0);
      return nps >= npsRange[0] && nps <= npsRange[1];
    });

    const fieldMap = {
      date: (o) => new Date(o.processedAt),
      amount: (o) => parseFloat(o.currentTotalPriceSet?.shopMoney?.amount ?? 0),
      nps: (o) => parseInt(o.nps_score?.value ?? 0),
    };

    if (sortSelected?.[0]) {
      const [field, direction] = sortSelected[0].split(" ");
      const getter = fieldMap[field];
      if (getter) {
        result.sort((a, b) => {
          const valA = getter(a);
          const valB = getter(b);
          if (valA < valB) return direction === "asc" ? -1 : 1;
          if (valA > valB) return direction === "asc" ? 1 : -1;
          return 0;
        });
      }
    }

    return result;
  }, [orders, selected, queryValue, sortSelected, npsRange]);

  const updateUrl = (key, valueToSet, keyToDelete) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, valueToSet);
    url.searchParams.delete(keyToDelete);
    navigate(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const formatShopifyDate = (timestamp) => {
    const date = new Date(timestamp);
    const now = new Date();
    const yesterday = new Date(now);
    yesterday.setDate(now.getDate() - 1);

    const isSameDay = (d1, d2) =>
      d1.getFullYear() === d2.getFullYear() &&
      d1.getMonth() === d2.getMonth() &&
      d1.getDate() === d2.getDate();

    const time = date.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', hour12: true });

    if (isSameDay(date, now)) return `Today at ${time}`;
    if (isSameDay(date, yesterday)) return `Yesterday at ${time}`;
    if ((now - date) / (1000 * 60 * 60 * 24) < 7)
      return `${date.toLocaleDateString(undefined, { weekday: "long" })} at ${time}`;

    return `${date.toLocaleDateString(undefined, { day: "numeric", month: "short", year: "numeric" })} at ${time}`;
  };

  return (
    <Page fullWidth title="Orders list">
      <Layout>
        <Layout.Section>
          <IndexFilters
            tabs={tabs}
            selected={selected}
            onSelect={setSelected}
            mode={mode}
            setMode={setMode}
            queryValue={queryValue}
            queryPlaceholder="Search orders"
            onQueryChange={setQueryValue}
            onQueryClear={() => setQueryValue("")}
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            onSort={setSortSelected}
            filters={[]}
            appliedFilters={appliedFilters}
            canCreateNewView={false}
            onClearAll={() => setNpsRange([0, 10])}
          />
          <IndexTable
            itemCount={filteredOrders.length}
            headings={[
              { title: "Order" },
              { title: "Date" },
              { title: "Payment Status" },
              { title: "Fulfillment Status" },
              { title: "Amount" },
              { title: "NPS Score" },
            ]}
            condensed={smDown}
            selectable={false}
            pagination={{
              hasNext: hasNextPage,
              hasPrevious: hasPreviousPage,
              onNext: () => hasNextPage && updateUrl("after", endCursor, "before"),
              onPrevious: () => hasPreviousPage && updateUrl("before", startCursor, "after"),
            }}
          >
            {filteredOrders.map((order, index) => {
              const orderId = order.id.split("/").pop();
              const currency = order.currentTotalPriceSet?.shopMoney?.currencyCode;
              const amount = order.currentTotalPriceSet?.shopMoney?.amount;
              const npsValue = order.nps_score?.value;

              return (
                <IndexTable.Row id={order.id} key={order.id} position={index}>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      <Link
                        removeUnderline
                        url={`https://admin.shopify.com/store/${shopName.split(".")[0]}/orders/${orderId}`}
                        target="_blank"
                      >
                        {order.name}
                      </Link>
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{formatShopifyDate(order.processedAt)}</IndexTable.Cell>
                  <IndexTable.Cell>
                    <Badge progress={
                        order.displayFinancialStatus === "REFUNDED"
                          ? "info"
                          : order.displayFinancialStatus === "PENDING"
                          ? "critical"
                          : "complete"
                      }
                    >
                      {order.displayFinancialStatus.charAt(0).toUpperCase() + order.displayFinancialStatus.slice(1).toLowerCase()}                    
                    </Badge>
                  </IndexTable.Cell>

                  <IndexTable.Cell>
                    <Badge tone={
                          order.displayFulfillmentStatus === "UNFULFILLED"
                          ? "attention"
                          : "default"
                      }
                      progress={
                          order.displayFulfillmentStatus === "UNFULFILLED"
                          ? "incomplete"
                          : "complete"
                      }
                    >
                      {order.displayFulfillmentStatus.charAt(0).toUpperCase() + order.displayFulfillmentStatus.slice(1).toLowerCase()}
                    </Badge>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{FORMAT_MONEY(currency, amount)}</IndexTable.Cell>
                  <IndexTable.Cell>
                    {npsValue ? <Badge tone="success">{npsValue}</Badge> : "-"}
                  </IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

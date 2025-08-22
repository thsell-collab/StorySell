import { json } from "@remix-run/node";
import { useLoaderData, useNavigate } from "@remix-run/react";
import {
  Page,
  Layout,
  IndexTable,
  Text,
  Link,
  Thumbnail,
  IndexFilters,
  useSetIndexFiltersMode,
  useBreakpoints,
  Badge,
  ChoiceList,
  TextField,
  RangeSlider,
} from "@shopify/polaris";
import { useMemo, useState, useCallback } from "react";
import { authenticate } from "../shopify.server";
import { getProductsQuery } from "../utils/graphql-queries";

const perPageCount = 10;

// Loader: Fetches paginated products from Shopify using GraphQL
export const loader = async ({ request }) => {
  const url = new URL(request.url);
  const after = url.searchParams.get("after");
  const before = url.searchParams.get("before");

  const { admin, session } = await authenticate.admin(request);
  const paginationVars = after
    ? { first: perPageCount, after }
    : before
    ? { last: perPageCount, before }
    : { first: perPageCount };

  const { data } = await (
    await admin.graphql(getProductsQuery, { variables: paginationVars })
  ).json();

  // Returns products data and shop name for client rendering
  return json({
    productsData: data.products,
    shopName: session.shop,
  });
};

// ProductsPage: Displays paginated product list with filters and tabs
export default function ProductsPage() {
  const { productsData, shopName } = useLoaderData();
  const navigate = useNavigate();
  const { smDown } = useBreakpoints();
  const { mode, setMode } = useSetIndexFiltersMode();

  // products: Array of product nodes from Shopify
  // hasNextPage/hasPreviousPage: Pagination controls
  // queryValue: Search/filter value
  // tabs: Product status tabs
  const products = productsData?.edges?.map((edge) => edge.node) || [];
  const { hasNextPage, hasPreviousPage, endCursor, startCursor } = productsData.pageInfo;

  const [queryValue, setQueryValue] = useState('');
  const [selected, setSelected] = useState(0);
  const [tabs, setTabs] = useState([
    { content: "All", id: "ALL" },
    { content: "Active", id: "ACTIVE" },
    { content: "Draft", id: "DRAFT" },
    { content: "Archived", id: "ARCHIVED" },
  ]);

  const [accountStatus, setAccountStatus] = useState([]);
  const [moneySpent, setMoneySpent] = useState(undefined);
  const [taggedWith, setTaggedWith] = useState('');

  const handleAccountStatusChange = useCallback((value) => setAccountStatus(value), []);
  const handleMoneySpentChange = useCallback((value) => setMoneySpent(value), []);
  const handleTaggedWithChange = useCallback((value) => setTaggedWith(value), []);
  const handleQueryValueChange = useCallback((value) => setQueryValue(value), []);
  
  const handleAccountStatusRemove = useCallback(() => setAccountStatus([]), []);
  const handleMoneySpentRemove = useCallback(() => setMoneySpent(undefined), []);
  const handleTaggedWithRemove = useCallback(() => setTaggedWith(''), []);
  const handleQueryValueRemove = useCallback(() => setQueryValue(''), []);

  const handleFiltersClearAll = useCallback(() => {
    handleAccountStatusRemove();
    handleMoneySpentRemove();
    handleTaggedWithRemove();
    handleQueryValueRemove();
  }, []);

  const filters = [
    {
      key: 'accountStatus',
      label: 'Account status',
      filter: (
        <ChoiceList
          title="Account status"
          titleHidden
          choices={[
            { label: 'Enabled', value: 'enabled' },
            { label: 'Not invited', value: 'not invited' },
            { label: 'Invited', value: 'invited' },
            { label: 'Declined', value: 'declined' },
          ]}
          selected={accountStatus}
          onChange={handleAccountStatusChange}
          allowMultiple
        />
      ),
      shortcut: true,
    },
    {
      key: 'taggedWith',
      label: 'Tagged with',
      filter: (
        <TextField
          label="Tagged with"
          value={taggedWith}
          onChange={handleTaggedWithChange}
          autoComplete="off"
          labelHidden
        />
      ),
      shortcut: true,
    },
    {
      key: 'moneySpent',
      label: 'Money spent',
      filter: (
        <RangeSlider
          label="Money spent is between"
          labelHidden
          value={moneySpent || [0, 500]}
          prefix="$"
          output
          min={0}
          max={2000}
          step={1}
          onChange={handleMoneySpentChange}
        />
      ),
    },
  ];

  const appliedFilters = [];
  if (taggedWith) {
    appliedFilters.push({
      key: 'taggedWith',
      label: `Tagged with ${taggedWith}`,
      onRemove: handleTaggedWithRemove,
    });
  }
  const [sortSelected, setSortSelected] = useState(['title asc']);
  
  const filteredProducts = useMemo(() => {
    const statusFilter = tabs[selected]?.id;
    let result = [...products];
  
    if (statusFilter !== "ALL") {
      result = result.filter((p) => p.status === statusFilter);
    }
  
    if (queryValue?.trim()) {
      result = result.filter((p) =>
        p.title.toLowerCase().includes(queryValue.toLowerCase())
      );
    }

    const fieldMap = {
      title: (p) => p.title?.toLowerCase(),
      createdAt: (p) => new Date(p.createdAt),
      price: (p) => parseFloat(p.variants?.edges?.[0]?.node?.price ?? 0),
      inventory: (p) => p.totalInventory ?? 0,
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
  }, [products, selected, queryValue, sortSelected]);  

  const formatDate = (timestamp) => {
    return new Date(timestamp).toLocaleDateString(undefined, {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const updateUrl = (key, valueToSet, keyToDelete) => {
    const url = new URL(window.location.href);
    url.searchParams.set(key, valueToSet);
    url.searchParams.delete(keyToDelete);
    navigate(`${url.pathname}?${url.searchParams.toString()}`);
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case "ACTIVE":
        return <Badge tone="success">Active</Badge>;
      case "DRAFT":
        return <Badge tone="info">Draft</Badge>;
      case "ARCHIVED":
        return <Badge>Archived</Badge>;
      default:
        return null;
    }
  };
  const onHandleCancel = () => {};

  const sortOptions = [
    { label: "Title", value: "title asc", directionLabel: "A-Z" },
    { label: "Title", value: "title desc", directionLabel: "Z-A" },
    { label: "Created At", value: "createdAt asc", directionLabel: "Oldest" },
    { label: "Created At", value: "createdAt desc", directionLabel: "Newest" },
    { label: "Price", value: "price asc", directionLabel: "Low to High" },
    { label: "Price", value: "price desc", directionLabel: "High to Low" },
    { label: "Inventory", value: "inventory asc", directionLabel: "Low to High" },
    { label: "Inventory", value: "inventory desc", directionLabel: "High to Low" },
  ];  
  
  return (
    <Page fullWidth title="Products List">
      <Layout>
        <Layout.Section>
          <IndexFilters
            sortOptions={sortOptions}
            sortSelected={sortSelected}
            onSort={setSortSelected}        
            tabs={tabs}
            selected={selected}
            onSelect={setSelected}
            mode={mode}
            setMode={setMode}
            queryPlaceholder="Search products"
            queryValue={queryValue}
            onQueryChange={handleQueryValueChange}
            onQueryClear={() => setQueryValue("")}
            canCreateNewView={false}
            filters={[]}            
            appliedFilters={appliedFilters}
            onClearAll={handleFiltersClearAll}
            cancelAction={{
              onAction: onHandleCancel,
              disabled: false,
              loading: false,
            }}
          />
          <IndexTable
            condensed={smDown}
            itemCount={filteredProducts.length}
            selectable={false}
            pagination={{
              hasNext: hasNextPage,
              hasPrevious: hasPreviousPage,
              onNext: () => updateUrl("after", endCursor, "before"),
              onPrevious: () => updateUrl("before", startCursor, "after"),
            }}
            headings={[
              { title: "Product" },
              { title: "Status" },
              { title: "Price" },
              { title: "Average rating" },
              { title: "Inventory" },
              { title: "Created at" },
            ]}
          >
            {filteredProducts.map((product, index) => {
              const price = product?.variants?.edges?.[0]?.node?.price ?? "-";
              const image = product?.featuredImage;
              const rating = product?.metafield?.value ? parseFloat(product.metafield.value).toFixed(1) : "-";

              return (
                <IndexTable.Row id={product.id} key={product.id} position={index}>
                  <IndexTable.Cell>
                    <Text variant="bodyMd" fontWeight="bold" as="span">
                      <Link
                        removeUnderline
                        url={`https://admin.shopify.com/store/${shopName.split(".")[0]}/products/${product.id.split("/").pop()}`}
                        target="_blank"
                      >
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          {image ? (
                            <Thumbnail source={image.originalSrc} alt={image.altText || product.title} />
                          ) : (
                            <Thumbnail
                              source="https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-image.png"
                              alt="No image"
                            />
                          )}
                          {product.title}
                        </div>
                      </Link>
                    </Text>
                  </IndexTable.Cell>
                  <IndexTable.Cell>{getStatusBadge(product.status)}</IndexTable.Cell>
                  <IndexTable.Cell>{price}</IndexTable.Cell>
                  <IndexTable.Cell>{rating}</IndexTable.Cell>
                  <IndexTable.Cell>{product.totalInventory ?? "0"} in stock</IndexTable.Cell>
                  <IndexTable.Cell>{formatDate(product.createdAt)}</IndexTable.Cell>
                </IndexTable.Row>
              );
            })}
          </IndexTable>
        </Layout.Section>
      </Layout>
    </Page>
  );
}

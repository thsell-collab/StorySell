import React, { useEffect, useState } from "react";
import {
  reactExtension,
  Divider,
  Image,
  Banner,
  Heading,
  Button,
  InlineLayout,
  BlockStack,
  Text,
  SkeletonText,
  SkeletonImage,
  useCartLines,
  useApplyCartLinesChange,
  useApi,
  useSettings,
  useAppMetafields,
  useShop,
} from "@shopify/ui-extensions-react/checkout";

// Registering the checkout UI extension entry point
export default reactExtension("purchase.checkout.block.render", () => <App />);

// Default fallback values
let upsell_title = "You might also like", button_title = "Add now", kind = "secondary";

const APP_URL = "https://apps-topaz.vercel.app";

function App() {
  const { query, i18n, sessionToken } = useApi();
  const applyCartLinesChange = useApplyCartLinesChange();
  const cartLines = useCartLines();
  const { title, button_text, button_kind } = useSettings();
  const shop = useShop();
    
  const plan_status = useAppMetafields({
      type: "shop",
      key: "plan_status",
      namespace: "boilerplate_shop_namespace"
    });
  
  const planStatusValue = plan_status?.[0]?.metafield?.value?.toLowerCase();
  
  // UI and product state management
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [adding, setAdding] = useState({});
  const [errorMap, setErrorMap] = useState({});

  // Override default settings with merchant-provided settings
  upsell_title = title || upsell_title;
  button_title = button_text || button_title;
  kind = button_kind || kind;

  // Fetch upsell product suggestions on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Handle upsell item add-to-cart logic
  async function handleAddToCart(variantId) {
    const token = await sessionToken.get();

    // This is demo code, replace with your actual logic
    const res = await fetch(`${APP_URL}/api/save-metafields`, {
      method: "POST",
      headers: { 
        "Authorization": `Bearer ${token}`,
        "Content-Type": "application/json" 
      },
      body: JSON.stringify({
        shop: shop?.myshopifyDomain,
        metafieldValue: 4,
        orderId: "gid://shopify/Order/6641401561408"
      }),
    });
    await res.json();
    
    setAdding(prev => ({ ...prev, [variantId]: true }));
    setErrorMap(prev => ({ ...prev, [variantId]: false }));

    const result = await applyCartLinesChange({
      type: "addCartLine",
      merchandiseId: variantId,
      quantity: 1,
    });

    setAdding(prev => ({ ...prev, [variantId]: false }));

    if (result.type === "error") {
      setErrorMap(prev => ({ ...prev, [variantId]: true }));
      console.error(result.message);

      // Auto-hide after 3 seconds
      setTimeout(() => {
        setErrorMap(prev => ({ ...prev, [variantId]: false }));
      }, 3000);
    }
  }

  // Fetch product data using Shopify storefront query
  async function fetchProducts() {
    setLoading(true);
    try {
      const { data } = await query(
        `query ($first: Int!) {
          products(first: $first) {
            nodes {
              id
              title
              images(first: 1) {
                nodes {
                  url
                }
              }
              variants(first: 1) {
                nodes {
                  id
                  price {
                    amount
                    currencyCode
                  }
                }
              }
            }
          }
        }`,
        {
          variables: { first: 4 },
        }
      );

      setProducts(data.products.nodes);
    } catch (error) {
      console.error("Failed to fetch products:", error);
    } finally {
      setLoading(false);
    }
  }

  if (loading) return <LoadingSkeleton />;

  if (!products.length) return null;

  const productsOnOffer = getProductsOnOffer(cartLines, products);
  if (!productsOnOffer.length) return null;

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

  return (
    <BlockStack spacing="loose">
      <Divider />
      <Heading level={2}>{upsell_title}</Heading>
      <BlockStack
        spacing="base"
        padding="base"
        border="base"
        borderRadius="base"
        background="surface"
      >
        {productsOnOffer.slice(0, 4).map((product) => (
          <ProductOffer
            key={product.id}
            product={product}
            i18n={i18n}
            adding={adding}
            error={errorMap[product.variants.nodes[0]?.id]}
            handleAddToCart={handleAddToCart}
          />
        ))}
      </BlockStack>
    </BlockStack>
  );
}

function getProductsOnOffer(cartLines, products) {
  const variantIdsInCart = cartLines.map(line => line.merchandise.id);

  return products.filter(product => {
    const variantId = product.variants.nodes[0]?.id;
    return variantId && !variantIdsInCart.includes(variantId);
  });
}

function LoadingSkeleton() {
  return (
    <BlockStack spacing="loose">
      <Divider />
      <Heading level={2}>{upsell_title}</Heading>
      <BlockStack spacing="loose">
        <InlineLayout spacing="base" columns={[64, "fill", "auto"]} blockAlignment="center">
          <SkeletonImage aspectRatio={1} />
          <BlockStack spacing="none">
            <SkeletonText inlineSize="large" />
            <SkeletonText inlineSize="small" />
          </BlockStack>
          <Button kind={kind} disabled>
            {button_title}
          </Button>
        </InlineLayout>
      </BlockStack>
    </BlockStack>
  );
}

function ProductOffer({ product, i18n, adding, handleAddToCart, error }) {
  const { title, images, variants } = product;
  const variant = variants.nodes[0];

  const priceAmount = variant.price.amount;
  const currencyCode = variant.price.currencyCode || "INR";
  const formattedPrice = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: currencyCode,
    minimumFractionDigits: 2,
  }).format(priceAmount);

  const imageUrl = images.nodes[0]?.url || "https://cdn.shopify.com/s/files/1/0533/2089/files/placeholder-images-image_medium.png";

  return (
    <>
      <InlineLayout spacing="base" columns={[64, "fill", "auto"]} blockAlignment="center">
        <Image
          source={imageUrl}
          accessibilityDescription={title}
          aspectRatio={1}
          border="base"
          borderWidth="base"
          borderRadius="loose"
        />
        <BlockStack spacing="extraTight">
          <Text size="medium" emphasis="bold">{title}</Text>
          <Text appearance="subdued">{formattedPrice}</Text>
        </BlockStack>
        <Button
          kind={kind}
          loading={adding[variant.id] || false}
          accessibilityLabel={`Add ${title} to cart`}
          onPress={() => handleAddToCart(variant.id)}
        >
          {button_title}
        </Button>
      </InlineLayout>
      {error && <ErrorBanner />}
    </>
  );
}

function ErrorBanner() {
  return (
    <Banner status="critical">
      There was an issue adding this product. Please try again.
    </Banner>
  );
}

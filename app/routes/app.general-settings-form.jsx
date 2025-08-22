import {
  Page,
  Text,
  BlockStack,
  InlineGrid,
  Box,
  Card,
  TextField,
  Select,
  Checkbox,
  RangeSlider,
  ColorPicker,
  DatePicker,
  ChoiceList,
  useBreakpoints,
  Divider,
  Layout,
  PageActions
} from "@shopify/polaris";
import { useSubmit, useLoaderData } from "@remix-run/react";
import { useState, useCallback } from "react";
import { StoresModel } from "../models/stores";

// Loader: Fetches store settings from database
export const loader = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const { PrismaClient } = await import("@prisma/client");

  const { admin, session } = await authenticate.admin(request);
  const prisma = new PrismaClient();

  const store = await StoresModel.findUnique({ where: { shop: session.shop } });
  let settings = {};

  if (store) {
    // Fetch your stored settings here
    // settings = await SettingsModel.findUnique({ where: { storeId: store.id } });
  }

  // Returns settings object for client rendering
  return { settings };
};

// Action: Handles settings form submission and updates database
export const action = async ({ request }) => {
  const { authenticate } = await import("../shopify.server");
  const { PrismaClient } = await import("@prisma/client");

  const { admin, session } = await authenticate.admin(request);
  const prisma = new PrismaClient();

  const formData = await request.formData();
  const data = Object.fromEntries(formData);

  console.log("Submitted:", data);

  // You can store to DB here
  // await SettingsModel.upsert(...)

  return null;
};

// ExtendedSettingsPage: Renders general settings form for the app
export default function ExtendedSettingsPage() {
  const { smUp } = useBreakpoints();
  const submit = useSubmit();
  const today = new Date();
  const { settings } = useLoaderData();
  
  const initialState = {
    productName: "",
    productSize: "medium",
    isFeatured: false,
    inventoryLevel: 50,
    primaryColor: { hue: 120, saturation: 1, brightness: 1 },
    productImage: null,
    category: "home",
    tags: [],
    channels: [],
    status: "active",
    launchDate: today,
  };

  const [formValues, setFormValues] = useState(initialState);
  const [initialValues, setInitialValues] = useState(initialState);

  const isDirty = JSON.stringify(formValues) !== JSON.stringify(initialValues);

  const handleChange = useCallback((field) => (value) => {
    setFormValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  const handleColorChange = (color) => {
    setFormValues((prev) => ({ ...prev, primaryColor: color }));
  };

  const handleLaunchDateChange = (date) => {
    setFormValues((prev) => ({ ...prev, launchDate: date.start }));
  };

  const handleSubmit = () => {
    const payload = {
      ...formValues,
      launchDate: formValues.launchDate.toISOString(),
      productImage: formValues.productImage?.name || "",
    };

    const form = new FormData();
    for (const key in payload) {
      form.append(key, typeof payload[key] === "object" ? JSON.stringify(payload[key]) : payload[key]);
    }

    submit(form, { method: "post" });
    setInitialValues(formValues);
  };

  return (
    <Page title="General settings form" divider
      primaryAction={{
        content: "Save",
        disabled: !isDirty,
        onAction: handleSubmit,
      }}
      secondaryActions={[{
        content: "Discard",
        destructive: true,
        disabled: !isDirty,
        onAction: () => setFormValues(initialValues),
      }]}
    >
      <BlockStack gap="800">
        {/* Basic */}
        <Section title="Basic Info" description="Core information about the product.">
          <TextField
            label="Product name"
            value={formValues.productName}
            onChange={handleChange("productName")}
            placeholder="E.g. Ceramic Vase"
          />
          <Select
            label="Size"
            options={[
              { label: "Small", value: "small" },
              { label: "Medium", value: "medium" },
              { label: "Large", value: "large" },
            ]}
            value={formValues.productSize}
            onChange={handleChange("productSize")}
          />
        </Section>

        {smUp && <Divider />}

        {/* Availability */}
        <Section title="Availability & Classification" description="Categorize and control visibility.">
          <Checkbox
            label="Mark as Featured"
            checked={formValues.isFeatured}
            onChange={handleChange("isFeatured")}
          />
          <ChoiceList
            title="Product category"
            choices={[
              { label: "Home", value: "home" },
              { label: "Fashion", value: "fashion" },
              { label: "Accessories", value: "accessories" },
            ]}
            selected={[formValues.category]}
            onChange={(selected) => setFormValues((prev) => ({ ...prev, category: selected[0] }))}
          />
          <ChoiceList
            title="Channels"
            allowMultiple
            choices={[
              { label: "Online store", value: "online" },
              { label: "Retail", value: "retail" },
              { label: "Wholesale", value: "wholesale" },
            ]}
            selected={formValues.channels}
            onChange={handleChange("channels")}
          />
          <ChoiceList
            title="Tags"
            allowMultiple
            choices={[
              { label: "New", value: "new" },
              { label: "Sale", value: "sale" },
              { label: "Bestseller", value: "bestseller" },
            ]}
            selected={formValues.tags}
            onChange={handleChange("tags")}
          />
          <ChoiceList
            title="Status"
            choices={[
              { label: "Active", value: "active" },
              { label: "Inactive", value: "inactive" },
              { label: "Draft", value: "draft" },
            ]}
            selected={[formValues.status]}
            onChange={(selected) => setFormValues((prev) => ({ ...prev, status: selected[0] }))}
          />
        </Section>

        {smUp && <Divider />}

        {/* Inventory */}
        <Section title="Inventory & Visuals" description="Stock and design preferences.">
          <RangeSlider
            label="Inventory level"
            min={0}
            max={100}
            step={1}
            value={formValues.inventoryLevel}
            onChange={handleChange("inventoryLevel")}
            output
          />
          <ColorPicker
            fullWidth
            onChange={handleColorChange}
            color={formValues.primaryColor}
          />
          {formValues.productImage && (
            <Text tone="subdued">{formValues.productImage.name}</Text>
          )}
        </Section>

        {smUp && <Divider />}

        {/* Launch Date */}
        <Section title="Launch Date" description="Choose when this product goes live.">
          <DatePicker
            month={formValues.launchDate.getMonth()}
            year={formValues.launchDate.getFullYear()}
            onChange={handleLaunchDateChange}
            selected={formValues.launchDate}
            onMonthChange={() => {}}
          />
        </Section>
      </BlockStack>
      
      <Layout.Section>
        <PageActions
          secondaryActions={[
            {
              content: "Discard",
              destructive: true,
              disabled: !isDirty,
              onAction: () => setFormValues(initialValues),
            },
          ]}
          primaryAction={{
            content: "Save",
            disabled: !isDirty,
            onAction: handleSubmit,
          }}
        />
      </Layout.Section>
      
    </Page>
  );
}

// ─────────────────────────────
// Layout wrapper for sections
// ─────────────────────────────
function Section({ title, description, children }) {
  return (
    <InlineGrid columns={{ xs: "1fr", md: "2fr 5fr" }} gap="400">
      <Box as="section">
        <BlockStack gap="400">
          <Text as="h3" variant="headingMd">{title}</Text>
          <Text as="p" variant="bodyMd">{description}</Text>
        </BlockStack>
      </Box>
      <Card roundedAbove="sm">
        <BlockStack gap="400">{children}</BlockStack>
      </Card>
    </InlineGrid>
  );
}

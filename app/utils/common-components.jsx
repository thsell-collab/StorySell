import React from "react";
import { Icon, Card, BlockStack, Text, Grid, InlineStack, Button, Link, CalloutCard, MediaCard } from "@shopify/polaris";

// Card showing sales or order count, with optional 'View products' link
const SalesCard = ({ title, salesAmount, ordersCount, showView, data }) => (
  <Grid.Cell columnSpan={{ xs: 4, sm: 4, md: 4, lg: 4, xl: 4 }}>
    <Card>
      <BlockStack gap="200">
        <InlineStack align="space-between">
          <Text alignment="start" as="h2" variant="headingMd">{title}</Text>
          {showView ? (
            <Link onClick={() => showView(data)} removeUnderline>
              View products
            </Link>
          ) : null}
        </InlineStack>
        <br />
        <Text alignment="start" variant="headingLg">
          {salesAmount ? `${salesAmount}` : `${ordersCount}`}
        </Text>
      </BlockStack>
    </Card>
  </Grid.Cell>
);

// Card for upsell configuration
const UpsellCard = ({ title, desc, link }) => (
  <Grid.Cell columnSpan={{ xs: 6, sm: 6, md: 6, lg: 6, xl: 6 }}>
    <Card>
      <BlockStack gap="500">
        <BlockStack gap="200">
          <Text as="h2" variant="headingMd">{title}</Text>
          <Text variant="bodyMd" as="p">{desc}</Text>
        </BlockStack>
        <InlineStack gap="300">
          <Button variant="primary" url={`/app/upsell/${link}`}>Configure</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  </Grid.Cell>
);

// Callout card for support options
const CallCard = ({ openChat }) => (
  <CalloutCard
    title="Can't find what you need?"
    illustration="/images/call.JPG"
    primaryAction={{
      content: 'Schedule a call',
      url: '',
      target: '_blank',
      variant: 'primary'
    }}
    secondaryAction={{
      content: 'Live chat',
      onAction: openChat,
      variant: 'secondary'
    }}
  />
);

// Card for displaying a stat (e.g. order count)
const StatCard = ({ title, value }) => (
  <Grid.Cell columnSpan={{ xs: 4 }}>
    <Text as="h2" variant="headingMd">{title}</Text>
    <Text variant="heading2xl">{value ?? 0}</Text>
  </Grid.Cell>
);

// Card for a feature, with external link option
const FeatureCard = ({ title, url, external = false }) => (
  <Grid.Cell columnSpan={{ xs: 6, sm: 3, md: 3, lg: 6, xl: 6 }}>
    <Card>
      <BlockStack gap="200">
        <Text as="h2" variant="headingMd">{title}</Text>
        <InlineStack gap="300">
          <Button variant="primary" url={url} target={external ? "_blank" : undefined}>Configure</Button>
        </InlineStack>
      </BlockStack>
    </Card>
  </Grid.Cell>
);

// Card for a recommended app, with install button
const RecommendedAppCard = ({ title, description, imgSrc }) => (
  <Grid.Cell columnSpan={{ xs: 6 }}>
    <MediaCard
      title={title}
      primaryAction={{ content: "Install now", tone: "success", variant: "primary", onAction: () => window.open("", "_blank") }}
      description={description}
      size="small"
    >
      <img alt="" style={{ objectFit: "cover", width: "100%", height: "100%" }} src={imgSrc} />
    </MediaCard>
  </Grid.Cell>
);

export { SalesCard, UpsellCard, CallCard, StatCard, FeatureCard, RecommendedAppCard };

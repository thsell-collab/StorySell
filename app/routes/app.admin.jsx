import { json, redirect } from "@remix-run/node";
import { useLoaderData, useActionData, Form, useNavigation } from "@remix-run/react";
import { TitleBar } from "@shopify/app-bridge-react";
import {
  Page,
  TextField,
  FormLayout,
  Card,
  Button,
  Banner,
} from "@shopify/polaris";
import { authenticate } from "../shopify.server";
import { sendmail } from "../utils/send-mail";
import { useState } from "react";
import { StoresModel } from "../models/stores";

// Loader: Fetches shop owner name and status for admin page
export const loader = async ({ request }) => {
  const { session } = await authenticate.admin(request);
  const { shop } = session;
  const store = await StoresModel.findUnique({
    where: { shop },
  });
  const url = new URL(request.url);
  const status = url.searchParams.get("status");
  return json({
    shopOwnerName: store?.shop_owner_name ?? "Admin",
    status: status 
  });
};

// Action: Sends email to all stores with provided subject and HTML
export const action = async ({ request }) => {
  await authenticate.admin(request);
  const formData = await request.formData();
  const subject = formData.get("subject");
  const html = formData.get("html");
  let status = 1;
  if (!subject || !html) {
    return json({ error: "Subject and HTML content are required." }, { status: 400 });
  }

  const stores = await StoresModel.findMany({});
  console.log("here");
  // Sends email to all stores and handles errors
  for (const store of stores) {
    try {
      await sendmail(
        store?.email,
        store?.shop_owner_name,
        subject.toString(),
        html.toString(),
        "brevo"
      );
    } catch (error) {
      status = 0;
      console.error(`Failed to send email to ${store.email}:`, error);
    }
  }
  return redirect(`/app/admin?status=${status}`);
};

export default function EmailSenderPage() {
  const { shopOwnerName, status } = useLoaderData();
  const navigation = useNavigation();
  const actionData = useActionData();
  const [subject, setSubject] = useState("");
  const [html, setHtml] = useState("");
  const isSubmitting = navigation.state === "submitting";

  return (
    <Page>
      <TitleBar title={`Hey ${shopOwnerName}`} />

      <Form method="post">
        <Card sectioned title="Send Email to All Merchants">
          <FormLayout>
            {actionData?.error && <Banner>{actionData.error}</Banner>}
            <TextField
              label="Subject"
              name="subject"
              value={subject}
              onChange={setSubject}
              autoComplete="off"
              requiredIndicator
            />
            <TextField
              label="HTML Content"
              name="html"
              value={html}
              onChange={setHtml}
              multiline={8}
              autoComplete="off"
              requiredIndicator
            />
            <Button submit primary loading={isSubmitting}>
              {isSubmitting ? "Sending..." : "Send email to all Merchants"}
            </Button>
          </FormLayout>
        </Card>
      </Form>
      {status ? 
        <>
          <br />
          <Banner tone={status === "1" ? "success" : "warning"}>
            {status === "1" ? "Email sent sucessfully" : "Something went wrong. Please try after sometime"}
          </Banner>
        </>
        : 
          ''
      }
    </Page>
  );
}

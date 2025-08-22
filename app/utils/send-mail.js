import Mailgun from "mailgun.js";
import FormData from "form-data";
import { Resend } from "resend";

// Initialize Mailgun client
const mailgun = new Mailgun(FormData);
const mg = mailgun.client({
  username: "api",
  key: process.env.MAILGUN_API_KEY || "key-yourkeyhere",
});

// Send email using the selected provider
export const sendmail = async (
  email,
  shopOwnerName,
  subject,
  html,
  provider = "brevo" // default provider
) => {
  // Personalize email content
  html = html.replace("[Shopify Merchant]", shopOwnerName);
  try {
    switch (provider) {
      case "resend":
        // Send using Resend
        const { data, error } = await resend.emails.send({
          from: "Acme <onboarding@resend.dev>",
          to: [email],
          subject,
          html,
        });
        if (error) throw new Error(error.message || "Resend email failed.");
        return { success: true, data };

      case "mailgun":
        // Send using Mailgun
        const domain = process.env.MAILGUN_DOMAIN;
        const msg = await mg.messages.create(domain, {
          from: `Shop Admin <mailgun@${domain}>`,
          to: [email],
          subject,
          html,
        });
        return { success: true, data: msg };

      case "brevo":
        // Send using Brevo
        const response = await fetch("https://api.brevo.com/v3/smtp/email", {
          method: "POST",
          headers: {
            "api-key": process.env.BREVO_API_KEY,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            sender: { name: "Shop Admin", email: "name@domain.com" },
            to: [{ email }],
            subject,
            htmlContent: html,
          }),
        });
        if (!response.ok) {
          const err = await response.json();
          throw new Error(err.message || "Brevo email failed.");
        }
        const emaildata = await response.json();
        return { success: true, emaildata };

      default:
        throw new Error("Unsupported email provider.");
    }
  } catch (err) {
    // Log and return error
    console.error(`[Email Error - ${provider}]`, err.message);
    return { success: false, error: err.message };
  }
};

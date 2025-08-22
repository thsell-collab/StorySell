// Email template styles for consistent branding
const style = `<style>
  body {
    font-family: Arial, sans-serif;
    background: #f9f9f9;
    color: #0d1117;
    margin: 0;
    padding: 0;
  }
  .email-container {
    max-width: 600px;
    margin: auto;
    background: #fff;
    padding: 20px;
    border-radius: 8px;
  }
  .email-body {
    line-height: 1.6;
  }
  .email-body h2 {
    font-size: 20px;
    margin-top: 20px;
  }
  .feature-list li {
    margin: 8px 0;
  }
  .cta-button {
    display: inline-block;
    margin-top: 20px;
    padding: 10px 20px;
    background: #000;
    color: #fff !important;
    text-decoration: none !important;
    border-radius: 5px;
    font-weight: bold;
    font-family: Arial, sans-serif;
  }
</style>`;

// Header for all emails
const header = (appName = "YourApp") => `
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>Welcome to ${appName}</title>
  ${style}
</head>
<body>
  <div class="email-container">
    <div class="email-body">
      <p>Dear Shopify Merchant,</p>
`;

// Footer for all emails
const footer = `
      <br><p>Best regards,<br>Your Name</p>
    </div>
  </div>
</body>
</html>
`;

// Returns the HTML for a given email type
function getEmailTemplate(type, appName = "YourApp") {
  switch (type) {
    case "new":
      return `${header(appName)}
        <p>Thanks for installing <b>${appName}</b>!</p>
        <ul class="feature-list">
          <li><b>Feature 1</b></li>
          <li><b>Feature 2</b></li>
        </ul>
        <p>Questions? Reach us at <a href="mailto:email@domain.com">email@domain.com</a>.</p>
      ${footer}`;
    case "uninstall":
      return `${header(appName)}
        <p>We noticed you uninstalled <b>${appName}</b>. We'd love your feedback.</p>
        <a href="https://calendly.com/demo" class="cta-button">Schedule Call</a>
      ${footer}`;
    default:
      return "";
  }
}

// Exported functions for sending specific emails
export const first_email_html = () => getEmailTemplate("new");
export const uninstall_email_html = () => getEmailTemplate("uninstall");

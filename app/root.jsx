import {
  Links,
  Meta,
  Outlet,
  Scripts,
  ScrollRestoration,
  useLoaderData,
} from "@remix-run/react";
import { json } from "@remix-run/node";
import { I18nContext, I18nManager } from "@shopify/react-i18n";
import { useRef, useEffect } from "react";
import { authenticate } from "./shopify.server";
import { shopLocalesQuery } from "./utils/graphql-queries";
import en from "./i18n/en.js";

export async function loader({ request }) {
  const { admin } = await authenticate.admin(request);
  const apiKey = process.env.SHOPIFY_API_KEY;
  let locale = "en";
  let translations = en;

  try {
    const data = await admin.graphql(shopLocalesQuery).then(res => res.json());
    const shopLocales = data?.data?.shopLocales || [];
    const primaryLocale = shopLocales.find((l) => l.primary);
    
    if (primaryLocale?.locale) {
      locale = primaryLocale.locale;

      try {
        const localeFile = await import(`./i18n/${locale}.js`);
        translations = localeFile.default;
      } catch (err) {
        console.warn("Locale file not found, falling back to English.");
        translations = en;
      }
    }
  } catch (err) {
    console.error("Error fetching locales:", err);
  }

  return json({ apiKey, locale, translations });
}

export default function App() {
  const { apiKey, locale, translations } = useLoaderData();
  const i18nManagerRef = useRef(null);
  
  if (!i18nManagerRef.current) {
    i18nManagerRef.current = new I18nManager({
      locale,
      onError(error) {
        console.error("I18n Error:", error);
      },
    });

    i18nManagerRef.current.register({
      id: "default",
      fallback: translations,
      translations: {
        [locale]: () => translations,
      },
    });

    i18nManagerRef.current.update({ locale });
    i18nManagerRef.current.resolve(); // ✅ required to set initialized
  }

  useEffect(() => {
    // You can still update here if needed dynamically
    i18nManagerRef.current?.update({ locale });
    i18nManagerRef.current?.resolve();
  }, [locale]);
  useEffect(() => {
    // ✅ Crisp Chat Script
    window.$crisp = [];
    window.CRISP_WEBSITE_ID = ""; // <- Add your Crisp Website ID here

    const crispScript = document.createElement("script");
    crispScript.src = "https://client.crisp.chat/l.js";
    crispScript.async = true;
    document.head.appendChild(crispScript);

    /*
      const tawkScript = document.createElement("script");
      tawkScript.type = "text/javascript";
      tawkScript.async = true;
      tawkScript.src = "https://embed.tawk.to/YOUR_TAWK_ID/default";
      tawkScript.setAttribute("crossorigin", "*");
      document.head.appendChild(tawkScript);
    */

    return () => {
      if (crispScript.parentNode) crispScript.parentNode.removeChild(crispScript);
      // if (tawkScript.parentNode) tawkScript.parentNode.removeChild(tawkScript);
    };
  }, []);

  return (
    <html lang={locale}>
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width,initial-scale=1" />
        <meta name="shopify-api-key" content={apiKey} />
        <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js"></script>
        <link rel="preconnect" href="https://cdn.shopify.com/" />
        <link
          rel="stylesheet"
          href="https://cdn.shopify.com/static/fonts/inter/v4/styles.css"
        />
        <Meta />
        <Links />
      </head>
      <body>
        <I18nContext.Provider value={i18nManagerRef.current}>
          <Outlet />
          <ScrollRestoration />
          <Scripts />
        </I18nContext.Provider>
      </body>
    </html>
  );
}

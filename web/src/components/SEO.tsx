import { useEffect } from "react";

export interface SEOProps {
  title?: string;
  description?: string;
  keywords?: string;
  canonical?: string;
  ogType?: string;
  ogImage?: string;
  schema?: Record<string, any> | Record<string, any>[];
  noindex?: boolean;
}

export default function SEO({
  title = "Gole Khaja Ghar | Best Nepali Khaja, Momo & Restaurant in Pokhara (Sisuwa)",
  description = "Authentic Nepali Khaja Ghar & Restaurant in Sisuwa, Pokhara-30. Taste fresh delicious momos, traditional khaja sets, chowmein, sekuwa & snacks. Dine-in, pickup & fast home delivery in Pokhara.",
  keywords,
  canonical,
  ogType = "website",
  ogImage = "https://golekhajaghar.com/images/hero_bg.jpg",
  schema,
  noindex = false,
}: SEOProps) {
  useEffect(() => {
    // 1. Page Title
    if (title) {
      document.title = title;
    }

    // Helper to safely update or append meta tags
    const setMetaTag = (attrName: "name" | "property", attrValue: string, content: string) => {
      let element = document.querySelector(`meta[${attrName}="${attrValue}"]`) as HTMLMetaElement | null;
      if (!element) {
        element = document.createElement("meta");
        element.setAttribute(attrName, attrValue);
        document.head.appendChild(element);
      }
      element.setAttribute("content", content);
    };

    // 2. Meta description
    if (description) {
      setMetaTag("name", "description", description);
      setMetaTag("property", "og:description", description);
      setMetaTag("name", "twitter:description", description);
    }

    // 3. Meta title & Open Graph title
    if (title) {
      setMetaTag("name", "title", title);
      setMetaTag("property", "og:title", title);
      setMetaTag("name", "twitter:title", title);
    }

    // 4. Meta keywords
    if (keywords) {
      setMetaTag("name", "keywords", keywords);
    }

    // 5. Open Graph Type & Image
    setMetaTag("property", "og:type", ogType);
    setMetaTag("property", "og:image", ogImage);
    setMetaTag("name", "twitter:image", ogImage);

    // 6. Robots directive
    if (noindex) {
      setMetaTag("name", "robots", "noindex, nofollow");
    } else {
      setMetaTag("name", "robots", "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1");
    }

    // 7. Canonical URL
    const canonicalUrl = canonical || (typeof window !== "undefined" ? window.location.href : "https://golekhajaghar.com");
    let linkCanonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement | null;
    if (!linkCanonical) {
      linkCanonical = document.createElement("link");
      linkCanonical.setAttribute("rel", "canonical");
      document.head.appendChild(linkCanonical);
    }
    linkCanonical.setAttribute("href", canonicalUrl);
    setMetaTag("property", "og:url", canonicalUrl);
    setMetaTag("name", "twitter:url", canonicalUrl);

    // 8. Dynamic Page Structured Data (JSON-LD)
    const scriptId = "page-structured-data";
    let existingScript = document.getElementById(scriptId);
    if (schema) {
      if (!existingScript) {
        existingScript = document.createElement("script");
        existingScript.id = scriptId;
        existingScript.setAttribute("type", "application/ld+json");
        document.head.appendChild(existingScript);
      }
      existingScript.textContent = JSON.stringify(schema);
    } else if (existingScript) {
      existingScript.remove();
    }

    return () => {
      const s = document.getElementById(scriptId);
      if (s) s.remove();
    };
  }, [title, description, keywords, canonical, ogType, ogImage, schema, noindex]);

  return null;
}

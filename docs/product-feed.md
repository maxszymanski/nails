# Shared Product Feed: Meta and Google Merchant Center

The project publishes an RSS 2.0 XML feed in Google Merchant Center format:

`https://www.iwonnaildisplay.de/feeds/products.xml`

This production URL works only after deploying this change. Locally use the same
path on the running Next.js server. No token, login or additional environment
variable is required. The response is server-generated, cached for one hour and
independent of language cookies, browser language and URL query parameters.

## Market and Source of Truth

- Initial market: Germany, German language, EUR, 19% German VAT included.
- Names and descriptions: existing German product translations.
- Product links: canonical `/de/produkte/...` pages.
- Product data, stock flags, images, shipping weights and catalog IDs:
  `src/data/products.ts`.
- Gross prices use the same helper as visible product prices and JSON-LD.
- German checkout multiplies the rounded gross unit price by quantity. Net
  product values, other destination VAT calculations and payment methods remain
  unchanged.
- No coupons, promotions, artificial stock counts, ratings or expiry dates.
- All six products were confirmed new and in stock. Maintain `inStock` manually;
  this is not an inventory management integration.
- The owner confirmed no assigned GTIN/EAN or MPN. The feed sets
  `identifier_exists` to `no`, retains the real brand and does not fabricate codes.
  If codes are assigned later, add the genuine identifiers and update this flag.

## Stable Catalog IDs

| Cart ID | Product | Feed ID / SKU |
| --- | --- | --- |
| 0 | nails | ind-nails |
| 1 | magnetic | ind-magnetic |
| 2 | transparent | ind-transparent |
| 3 | frame | ind-frame |
| 4 | cabinet | ind-cabinet |
| 5 | display | ind-display |

Keep these IDs unchanged across updates and languages. They are merchant catalog
IDs, not GTINs, MPNs or Meta Graph object IDs. They are also included as `sku` in
product JSON-LD. They become Meta retailer/content IDs only after a successful
import; do not assume they match an existing catalog.

The initial Google taxonomy categories describe the products' display purpose:
`499897` (Retail Display Props & Models) for sample tips and the display strip;
`4160` (Retail Display Cases) for the frame and cabinet.

## Meta Setup

1. Deploy, then open the feed URL and confirm HTTP 200 with six products.
2. In the intended catalog choose a scheduled data feed using a URL.
3. Select **Google Merchant Center** as the input format. In particular the
   availability values are Google's `in_stock` / `out_of_stock`, not Meta-native
   values with spaces.
4. Enter the production feed URL. A daily refresh is sufficient for the current
   code-based catalog; request a refresh after deploying price or stock changes.
5. Check import diagnostics, images, gross prices and the six retailer IDs.
   Changing IDs in an existing catalog can create duplicates, so test a new
   catalog before replacing a working one.
6. The Meta Checkout URL is documented in [meta-checkout.md](meta-checkout.md).
   This feed itself does not populate the cart or create orders. Confirm imported
   retailer IDs before connecting and validating the checkout link.

## Google Merchant Center Setup

1. Create/configure the account and verify/claim `www.iwonnaildisplay.de`.
2. Add a scheduled product data source using the same XML URL; choose Germany,
   German and EUR.
3. Configure German shipping at account level to match checkout: EUR 4.90,
   free from EUR 50.00 gross product value, maximum order weight 30 kg. The feed
   includes shipping weights, but intentionally does not override account rules
   with fixed per-item shipping charges. Do not advertise a checkout link that
   bypasses the existing 30 kg limit.
4. Configure returns and actual delivery times from the shop's policies. Do not
   invent delivery promises: the stated dispatch period starts after payment.
5. Check product diagnostics and test landing pages and checkout totals before
   enabling listings. Feed validity does not guarantee platform approval.

The format choice in Meta does not connect a Google account automatically.
DE/PL/EN storefronts and their existing checkout remain available; this initial
feed targets Germany only. Other markets need appropriate localized data and
shipping/VAT configuration, not just a change of language in the feed URL.

## Verification

Run `npm test`, `npm run lint` and `npm run build`. Feed tests check all six
products, stable IDs, existing images, German gross prices, checkout/schema
consistency, XML escaping and HTTP response metadata. Routing tests ensure the
feed is not redirected by language negotiation and do not open other `/feeds/`
paths. No test sends real order emails.

Specifications:

- [Google product data](https://support.google.com/merchants/answer/7052112?hl=en)
- [Google RSS 2.0](https://support.google.com/merchants/answer/14987622?hl=en)
- [Google identifier_exists](https://support.google.com/merchants/answer/6324478?hl=en)
- [Meta catalog feed](https://developers.facebook.com/documentation/ads-commerce/catalog/reference)
- [Google taxonomy](https://www.google.com/basepages/producttype/taxonomy-with-ids.en-US.txt)

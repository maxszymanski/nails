# Meta Commerce Manager Checkout URL

After deploying this change, enter this exact base URL in Commerce Manager:

`https://www.iwonnaildisplay.de/de/meta-checkout`

Do not add fixed `products` values to the URL saved in Meta. Meta adds the cart
parameters when a customer continues checkout. The same route exists at
`/pl/meta-checkout` and `/en/meta-checkout`. An unprefixed `/meta-checkout` follows
the existing language negotiation and preserves query parameters.

## Contract and Cart Policy

- `products` is required: comma-separated `CONTENT_ID:QUANTITY` entries. Encoded
  colons and commas are handled once by Next.js, not decoded again by the parser.
- Content IDs match `g:id` in `/feeds/products.xml` exactly:
  `ind-nails`, `ind-magnetic`, `ind-transparent`, `ind-frame`, `ind-cabinet`,
  `ind-display`. These IDs were also checked against the public production feed.
  This is not access to the merchant's Meta account or proof of a successful import.
- Cart IDs 0-5 and all prices, names, images and weights come from project data.
  Prices, totals and redirect targets in query parameters are ignored.
- Quantities must be canonical positive integers, at most 10,000 per product,
  subject to the existing 30 kg total order limit. Reject duplicate content IDs,
  repeated `products` / `coupon` parameters, more than six entries, unknown IDs,
  unavailable products and malformed data. The product parameter is capped at
  2,048 characters.
- A valid Meta cart **replaces** the existing session cart atomically. It never
  calls additive `addItem`. Reloading or reopening a link restores exactly its
  stated quantities, without adding copies. Reopening a link also intentionally
  discards changes made to the cart after the previous import.
- Invalid requests leave the old cart unchanged and never open the order form.
- An omitted, empty or whitespace-only `coupon` does nothing. A nonempty coupon
  displays an explicit unsupported-coupon message. Continuing without it requires
  clicking a button; this removes only `coupon`, preserving products and tracking.
  No discount is invented or passed to the order API.
- Import runs after browser cart hydration. React effect cancellation prevents
  abandoned or Strict Mode effects from applying twice. The ordinary cart opens
  at step one, showing the existing product cards and quantities. The customer
  continues to the unchanged order form using the existing cart button. No extra
  product summary or other UI is added to the cart or form.
- Closing and reopening the modal via the page button does not re-import the
  original link. The existing Back to cart button allows quantities to be changed.
- Navigation away closes a cart opened by this page. Standard cart entry
  still starts at cart step one. Bank transfer, order API and email flow are
  unchanged. No order is submitted on GET.
- `fbclid`, `cart_origin` and UTM parameters stay in the URL, including when the
  route changes language. No tracking service or additional cookie is installed.
- Pages are dynamic and `noindex`, with query-free canonicals. They are not added
  to the sitemap. JavaScript is required by the existing browser cart/checkout.

## Browser Tests After Deployment

Start with a product already in the site's cart. Open these links without placing
a real order:

1. One product, quantity three:
   `https://www.iwonnaildisplay.de/de/meta-checkout?products=ind-nails%3A3`
   Expect the ordinary cart with only three nail packs, not the order form.
   Continue with the existing cart button: expect EUR 25.71 gross products and
   EUR 4.90 German delivery (EUR 30.61 total), without an extra item summary.
2. Two products with different quantities:
   `https://www.iwonnaildisplay.de/de/meta-checkout?products=ind-nails%3A2%2Cind-frame%3A1`
   Expect two nail packs and one frame, EUR 112.33 gross products and free German
   delivery. Reload and reopen the same link: quantities must remain 2 and 1.
3. Unknown ID:
   `https://www.iwonnaildisplay.de/de/meta-checkout?products=unknown%3A1`
   Expect a localized error, no checkout, and the previous cart unchanged.
4. Invalid quantity / overweight:
   test `products=ind-nails%3A0` and `products=ind-cabinet%3A14`.
   Both must preserve the previous cart and not open the form.
5. Unsupported coupon:
   `https://www.iwonnaildisplay.de/de/meta-checkout?products=ind-nails%3A1&coupon=TEST&cart_origin=instagram&utm_source=instagram`
   No discount or cart change until choosing to continue without the coupon.
   Then expect one nail pack and retained attribution parameters.
6. Repeat for `/pl/meta-checkout` and `/en/meta-checkout`. Close the modal and
   change language: products, quantities and tracking parameters should remain.
   The delivery country still defaults to Germany independently of UI language.

Then run Meta's checkout validation tool using the actual imported catalog items,
and verify the shop in preview mode as described in the official documentation.
Local tests do not replace Meta's validator and do not imply the endpoint has
already been deployed or approved. No API token or new environment variable is
required for this browser checkout URL.

## Automated Tests

`npm test` includes parser, feed-ID mapping, unavailable products, limits,
duplicate/repeated parameters, URL decoding, unsupported coupons, persistent cart
replacement, re-entry, effect cancellation, storage errors, ordinary cart entry,
localized metadata and language/query preservation. `npm run lint` and
`npm run build` check project compatibility.

[Official Meta Checkout URL documentation](https://developers.facebook.com/documentation/ads-commerce/commerce-platform/setup-checkout-url)

Vercel deployment and testing notes

This branch adds two serverless endpoints for Vercel to handle Stripe Checkout and webhooks, and updates index.html to call the create-checkout-session endpoint.

Files added
- api/create-checkout-session.js  - creates Stripe Checkout Sessions
- api/webhook.js                 - verifies webhook signatures and writes to Airtable
- package.json                   - declares the stripe dependency
- index.html                     - updated client to POST to /api/create-checkout-session

Environment variables (set these in your Vercel project settings)
- STRIPE_SECRET_KEY        = your Stripe secret key (sk_test_... or sk_live_...)
- STRIPE_PUBLISHABLE_KEY   = your Stripe publishable key (pk_test_... or pk_live_...)
- STRIPE_WEBHOOK_SECRET    = the webhook signing secret from Stripe (for production or test webhooks)
- AIRTABLE_API_KEY         = Airtable API key with write access
- AIRTABLE_BASE_ID         = Airtable base ID (e.g. appXXXXXXXX)
- AIRTABLE_TABLE_NAME      = Airtable table name (e.g. Orders)
- ORIGIN                   = Optional. Your site origin (https://your-site.com). Used for success/cancel URLs. If not set, Vercel will infer from request host.

How it works
1. The client collects cart details and posts to /api/create-checkout-session with customer info.
2. The serverless function uses the Stripe secret key (from env) to create a Checkout Session and returns the session.id.
3. The client calls stripe.redirectToCheckout({ sessionId }) to send the user to Stripe Checkout.
4. When Checkout completes, Stripe posts checkout.session.completed to the webhook endpoint (api/webhook).
5. The webhook verifies the signature, fetches line items, and creates an idempotent record in Airtable (if configured).

Testing locally with Stripe CLI
1. Set local env vars for STRIPE_SECRET_KEY and AIRTABLE_API_KEY (don\'t commit them).
2. Run a local dev server (Vercel CLI recommended) or use a simple Node server for testing.
3. Start Stripe CLI to forward events:
   stripe listen --forward-to http://localhost:3000/api/webhook
4. Use the client to create a test Checkout Session (with pk_test_ and sk_test_ keys) and complete a payment using 4242 4242 4242 4242.
5. Observe the webhook delivery in Stripe CLI and confirm an Airtable record is created.

Notes & security
- Never commit secret keys to the repository. Use Vercel Environment Variables.
- The webhook handler verifies Stripe signatures. Keep STRIPE_WEBHOOK_SECRET safe.
- The webhook performs an idempotent check in Airtable using stripe_session_id to avoid duplicates.
- Price IDs are still placeholders in index.html. Replace the option values with your price_xxx IDs before going live, or provide them via your own process.

If you want, I can:
- Replace the price placeholders with the real price IDs when you provide them.
- Update the Airtable field mapping to match your table schema if you share the field names.
- Add logging or a simple dashboard for monitoring order ingestion.

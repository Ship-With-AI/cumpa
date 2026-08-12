---
title: Voluntary Stripe support payment
date: 2026-08-12
context: Exploration of a one-time contribution that removes the launch dialog without unlocking features
---

# Voluntary Stripe Support Payment

## Product decisions

- Show a support dialog on every application launch until payment is verified.
- Offer one optional, one-time USD $49.99 contribution.
- Payment unlocks no functionality; paid and unpaid users otherwise receive the same product.
- Close the open dialog automatically after payment is verified.
- Let supporters restore status on unlimited installations by verifying the payment email through a magic link.

## Minimal secure architecture

1. The local app opens a Stripe-hosted Payment Link for the fixed price and includes a random installation ID as `client_reference_id`.
2. A hosted service owns the Stripe API key and webhook secret. No Stripe secret ships with Cumpa.
3. A signature-verified Stripe webhook—not the browser redirect—records durable support status after validating payment status, live/test mode, price, amount, and currency. Webhook and Checkout Session IDs are processed idempotently.
4. While the support dialog is open, the app polls a narrow installation-status endpoint and closes the dialog after the verified webhook binds that installation to the paid email.
5. Recovery submits an email and installation challenge. The service returns a generic response and emails a high-entropy, single-use, short-lived magic link. Consuming it binds that installation; the app then observes supported status.
6. Local persistence contains only the random installation ID and cached supported status. The hosted service stores paid-email entitlements, processed Stripe IDs, installation bindings, and expiring recovery challenges.

## Deliberate exclusions

- No subscription, user account, billing portal, feature entitlement, license key, device limit, transfer flow, or revocation UI.
- No trust in success redirects, client-authored payment state, or secrets embedded in the local package.

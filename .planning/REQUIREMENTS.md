# Requirements: Voluntary Support Payment

## Payment

- **PAY-01:** The application offers exactly one optional, one-time support payment priced at USD $49.99 through Stripe-hosted Checkout.
- **PAY-02:** Paying does not unlock, restrict, or alter any application feature except automatic support-dialog visibility.
- **PAY-03:** The application treats only server-side, signature-verified Stripe webhook fulfillment as proof of payment; a client redirect or local claim is insufficient.
- **PAY-04:** The local application and published package contain no Stripe secret key or webhook secret.

## Support dialog

- **SUP-01:** The application shows the support dialog on every launch until support status is verified for that installation.
- **SUP-02:** The dialog clearly describes the payment as optional support for application development and links to the fixed Stripe payment page.
- **SUP-03:** An unpaid user can dismiss the dialog and use the complete application without restriction.
- **SUP-04:** After the hosted service verifies payment for the current installation, the open dialog closes automatically without requiring a relaunch or manual refresh.
- **SUP-05:** Once support status is verified and persisted, that installation no longer shows the dialog on launch.

## Recovery

- **REC-01:** A supporter can restore support status on another installation by entering the email associated with the Stripe payment and completing an emailed magic link.
- **REC-02:** Recovery responses do not disclose whether an email has paid, and recovery tokens are high-entropy, single-use, short-lived, and bound to the requesting installation.
- **REC-03:** A paid email can restore support status on unlimited installations; no device-management or transfer flow is required.

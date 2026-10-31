---
title: YouPI payment gateway — cloud server setup
type: operations
tags: [ops, payments, youpi, upi]
links: [features/premium, features/admin, operations/deployment, operations/credentials]
updated: 2026-10-29
---

# YouPI payment gateway on a cloud server (step by step)

Our app only **talks to** YouPI PG ([[features/premium]], D-061). YouPI itself runs on a server you
control, because it is a set of always-on Node.js services with a database file, plus a phone that
reads your bank alerts. This page is the owner's checklist. Source: the
[YouPI-PG repo](https://github.com/youpi-pg/YouPI-PG) docs (`docs/INSTALLATION.md`,
`CONFIGURATION.md`, `ANDROID_MOBILE_APP.md`, `WHITE_LABEL.md`), read on 2026-10-29.

> YouPI calls itself experimental: about **20 payments a day per receiving bank account** at most,
> and a review before real customers. Keep payments switched off in admin → Payments until step 8
> works end to end.

## What you need
- A small **Linux server (Ubuntu 24.04)** in a **Mumbai** region: 1 vCPU, 1–2 GB RAM, 25 GB disk, a
  fixed public IP. Any provider works (₹400–800 a month).
- Two subdomains of `englishconnection.in` (DNS at GoDaddy):
  `pay.englishconnection.in` (the checkout page learners see) and
  `api-pay.englishconnection.in` (the payment API our app calls).
- **One Android phone** that stays on and charged, with the SIM of the bank account that receives UPI
  money and that bank's / your UPI app's notifications turned on.
- The UPI ID (VPA) of that account, e.g. `englishconnection@okhdfc`.

## 1. Create the server
1. Create the Ubuntu 24.04 server in the Mumbai region, add your SSH key, note its IP.
2. In the provider's firewall allow only ports **22** (SSH), **80** and **443**. Everything else stays
   closed — YouPI's own ports (6100, 7000, 6001…) are reached only through the web server below.

## 2. Point the domains at it
At GoDaddy → DNS for `englishconnection.in`, add two **A** records to the server's IP:
`pay` and `api-pay`. Wait until `ping pay.englishconnection.in` shows the IP (minutes to an hour).

## 3. Install Node.js 24 and YouPI
SSH in (`ssh root@<ip>`), then:

```bash
apt update && apt upgrade -y
curl -fsSL https://deb.nodesource.com/setup_24.x | bash -
apt install -y nodejs git sqlite3
node -v        # must be 24.x or newer
adduser --disabled-password --gecos "" youpi
su - youpi
git clone https://github.com/youpi-pg/YouPI-PG.git youpi-pg
cd youpi-pg
npm install
cp .env.example .env
```

## 4. Configure `.env`
`nano .env` and set (keep every other line as it is):

```env
BASE_PAYMENT_API_URL=https://api-pay.englishconnection.in
BASE_CHECKOUT_URL=https://pay.englishconnection.in
CHECKOUT_PUBLIC_URL=https://pay.englishconnection.in
DEFAULT_APP_NAME="English Connection"
DEFAULT_SUPPORT_EMAIL="ec.devbx@gmail.com"
DEFAULT_SUPPORT_PHONE="<your support number>"
DEFAULT_MERCHANT_NAME="English Connection"
DEFAULT_MERCHANT_SLUG="english-connection"
WHATSAPP_SENDER_NAME="English Connection"
```

Also generate the two long secrets and paste them in (each command prints a new random value):

```bash
node -e "console.log('ENCRYPTION_MASTER_KEY=' + require('crypto').randomBytes(32).toString('hex'))"
node -e "console.log('JWT_SECRET=' + require('crypto').randomBytes(32).toString('hex'))"
```

Never put this `.env` in git or send it in chat.

## 5. Keep it running (systemd)
Back as root (`exit`), create `/etc/systemd/system/youpi.service`:

```ini
[Unit]
Description=YouPI PG
After=network.target

[Service]
User=youpi
WorkingDirectory=/home/youpi/youpi-pg
ExecStart=/usr/bin/npm start
Restart=always
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload
systemctl enable --now youpi
curl -s localhost:6100/health     # {"status":"UP","service":"payment-api"}
curl -s localhost:7000/health     # {"status":"UP","service":"checkout-portal"}
```

`npm start` runs in production mode; the first start creates `data/youpi_pg.sqlite` and the
secrets under `data/.secrets/`.

## 6. HTTPS in front (Caddy — gets the certificates by itself)

```bash
apt install -y caddy
```

`/etc/caddy/Caddyfile`:

```caddy
pay.englishconnection.in {
    reverse_proxy 127.0.0.1:7000
}
api-pay.englishconnection.in {
    reverse_proxy 127.0.0.1:6100
}
```

```bash
systemctl reload caddy
curl -s https://api-pay.englishconnection.in/health
```

The **merchant admin (6001)** stays private. Open it from your laptop through SSH:
`ssh -L 6001:localhost:6001 root@<ip>` → then <http://localhost:6001> in your browser. It asks for
the admin token once: `cat /home/youpi/youpi-pg/data/.secrets/admin_api_token` on the server.

## 7. Set up the merchant in YouPI's admin
In <http://localhost:6001> (through the SSH tunnel):
1. **Receiving accounts (VPAs)**: add your UPI ID — it goes into the QR code learners scan.
2. **Branding**: name "English Connection", our colour, logo URL if you like.
3. **Webhooks & security secrets**:
   - Webhook notification URL: `https://engconnect-beta.vercel.app/api/payments/youpi/webhook`
     (the exact URL is shown on our admin → Payments page; use the englishconnection.in one once the
     domain fully points at the app).
   - Copy the **webhook secret** (or press generate and copy). Set it yourself in Vercel → Settings →
     Environment Variables → `YOUPI_WEBHOOK_SECRET` (Production), then redeploy. Don't paste it in chat
     — or put it in the local `credentials.txt` and ask Claude to set it from there.
4. Copy the **Merchant ID** (UUID) if you created your own merchant. If you use the default merchant,
   leave our Merchant ID field empty.
5. **Observers & pairing**: see step 8.

## 8. Pair the Android phone
1. Build the observer app from YouPI's source (`apps/android-observer-app`, `./gradlew assembleRelease`,
   needs JDK 17 + Android SDK) — or ask Claude to build it. The repo also ships a ready
   `youpi-sms-gateway.apk`; only install it after checking its SHA-256 against
   `youpi-sms-gateway.apk.sha256`.
2. On the phone: open **YOUPI Observer** → allow notification access → Settings → Apps → YOUPI
   Observer → Battery **Unrestricted**, allow autostart / background activity.
3. In YouPI admin → **Observers & Pairing** → **+ Pair Android Device**; in the app enter the gateway
   URL `https://api-pay.englishconnection.in` and the enrollment token, tap **Pair**. The status must
   turn **CONNECTED**.
4. (Optional second channel) Gmail observer: needs a Google Cloud OAuth client — see YouPI
   `docs/OBSERVERS_SETUP.md`.

## 9. Switch it on in our app
Admin → **Payments** (`/v3/admin/payments`):
- Payment API address: `https://api-pay.englishconnection.in`
- Merchant ID: from step 7 (or empty for the default merchant)
- Price, discount, days; unlock rule **Bank statement matches** (safe) to start with
- Turn **On**, Save. `/v3/premium` now shows the price and **Pay ₹X with UPI**.

## 10. Test with ₹1 before telling anyone
1. Set the full price to **₹1** temporarily, pay from another phone's UPI app.
2. Check: YouPI admin shows the payment observed → our admin → Payments shows it **observed**.
3. Download that day's bank statement CSV and import it in YouPI (admin → statements, or
   `POST /api/v1/admin/statements/import`) → our row turns **paid** and the account becomes Pro.
4. Put the real price back.

## Running it
- **Daily**: the phone must stay on, charged and online, or payments can't be confirmed.
- **Confirming payments**: with "Bank statement matches", import the statement CSV in YouPI once or
  twice a day; until then learners see "Payment received — being confirmed". Our admin → Payments can
  **Grant Pro** by hand for a payment you have checked yourself.
- **Backups**: `sqlite3 /home/youpi/youpi-pg/data/youpi_pg.sqlite ".backup '/home/youpi/backup-$(date +%F).sqlite'"`
  (add it to a daily cron) and copy `data/.secrets/` somewhere safe.
- **Updates**: `su - youpi`, `cd youpi-pg && git pull && npm install`, then `systemctl restart youpi`.
- **Health**: `curl https://api-pay.englishconnection.in/health`.
- **Emergency stop**: switch payments **Off** in our admin → Payments. Paid Pro is kept; payments
  already in flight are still credited when their webhook arrives.

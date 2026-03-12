# EMS (Electronics Mobile Shop)

Android-first inventory + purchase/sales tracking app for a mobile phone shop owner.

## Features

- Dashboard with 4 modules: **Recent**, **Received From**, **Sold To**, **Inventory**
- Dependent dropdowns: **Company → Models** (searchable)
- Real-time inventory updates (local/offline mode by default)
- Prevents selling when stock is not available
- IMEI stored as **unique entries** (one IMEI per piece)
- Payment status: **Paid / Pending**
- Printable receipts: **PDF export + Share + Print**
- Light/Dark mode (toggle from the dashboard header)

## Run (local/offline mode)

```bash
cd EMS
npm install
npx expo start
```

## Enable Firebase (Firestore realtime sync)

1. Create a Firebase project
2. Enable **Firestore Database**
3. Open `src/config/firebaseConfig.ts` and paste your Firebase **web** config
4. Restart the app

When Firebase is configured, the app automatically switches from **Local** to **Firebase** mode.


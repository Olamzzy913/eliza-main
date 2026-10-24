# Hair store: customer website

Next.js + Tailwind CSS + Firebase (Firestore). This is the PUBLIC website only.
The owner's dashboard is a separate project (`hair-dashboard`) that uses the same Firebase project.

Pages: / (shop), /product/[id], /cart, /checkout, /track, /track/[code]

## Setup
1. Use the SAME Firebase project as the dashboard. Copy `.env.local.example` to `.env.local`
   and paste the same Firebase web-app config.
2. Firestore rules are shared and already published from the dashboard project. (`firestore.rules`
   is included here for reference. It is identical.)
3. `npm install` then `npm run dev` and open http://localhost:3000
4. Products appear once you add them in the dashboard with "Visible in the shop" switched on.
5. Shop name, WhatsApp, delivery fee and bank details come from the dashboard's Settings page.

## Deploy
Push to GitHub, import in Vercel, add the Firebase env variables.

## How tracking works
Each order gets a 12-character code that is also its Firestore document ID. Anyone with the code can
view that one order. Orders can't be listed or changed from the website.

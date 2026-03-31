# Support Chat (Real-time Retailer/MR ↔ Admin)

## Overview

- **Retailers** and **MRs (agents)** use the mobile app Support screen to create tickets and chat.
- **Admin** uses the admin panel (Support & Tickets) to view tickets (#TCK-xxxx), reply, **Call customer** (Twilio voice), and **Close ticket**.
- **User form**: Name, Phone, Email, Problem type, Message (optional attachment) → ticket created with status NEW.
- Real-time: app uses WebSocket; admin uses 4s polling when a ticket is open.

## Twilio Voice (admin → customer call)

Set in `.env`: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_PHONE_NUMBER`, `TWILIO_API_KEY_SID`, `TWILIO_API_SECRET`, `TWILIO_TWIML_APP_SID`. Create a TwiML App in Twilio Console with Voice URL = `https://<your-api>/api/support/voice/connect-admin`. Admin panel uses `@twilio/voice-sdk`; **Call customer** initiates outbound call and joins admin to the same conference.

## Configuration

### Backend (Node)

- `JWT_SECRET` must be set in `.env` (used for HTTP auth and WebSocket token verification).
- Server listens on `0.0.0.0:PORT` so WebSocket is reachable from LAN (e.g. phone).
- WebSocket path: `ws://<host>:<port>/support-ws?token=<jwt>`.

### App (Expo)

- `EXPO_PUBLIC_DEV_HOST` (or default `192.168.1.206`) must match your machine’s LAN IP so API and WS use the same host.
- Support WS URL is derived from API base URL (same host, `ws` scheme).

### Admin (Vite)

- `VITE_BASE_URL` should point to backend API (e.g. `http://localhost:5000/api` or your server).
- Admin token is stored in `localStorage` as `adminToken` after login.

## Roles

- **Customer routes** (create ticket, get my tickets, get ticket, send message, push token): `user`, `vendor`, `agent` (retailer = usually `user`, MR = `agent`).
- **Admin routes**: `admin` only.
- WebSocket: customers can join only their own ticket rooms; admin can join any ticket room (for future WS in admin if needed).

## Quick Test Checklist

1. **Backend**: `npm run dev` (or start script), ensure no errors and DB connected.
2. **App (retailer/MR)**: Login → Support → send a message (new ticket). Open same ticket from history → send another message. Confirm messages appear and no errors.
3. **Admin**: Login → Support & Tickets → open the same ticket. Confirm messages from app appear (within 4s if polling). Reply from admin; confirm reply appears in app (WebSocket or 4s polling).
4. **Real-time**: With ticket open in app, reply from admin → reply should appear in app without refresh. With ticket open in admin, send from app → message should appear in admin within 4s.
5. **Twilio call**: Admin opens ticket → **Call customer** → allow mic; customer phone rings; after solving → **End call** then **Close ticket**.
5. **Twilio call**: Admin opens ticket → **Call customer** → allow mic; customer phone rings; after solving → **End call** then **Close ticket**.

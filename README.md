# Eat N Chill - QR Ordering System 🍽️

A modern, real-time, QR-code based ordering system custom-built for "Eat N Chill". It allows customers to browse a rich, animated menu from their phones and places orders directly to the kitchen in real-time, managed via a comprehensive admin dashboard.

## Features ✨

### 📱 Customer Portal (Mobile First)
*   **Dynamic Menu Browsing**: Smooth, horizontal scrolling category navigation.
*   **Rich Customization**: Support for complex product options (e.g., milk types, extra shots, add-ons).
*   **Shopping Cart & Checkout**: Intuitive cart interface with special instruction support.
*   **Live Status Tracking**: Customers can watch their order status change from "Pending" to "Preparing" to "Ready".

### 💻 Admin Dashboard
*   **Live Order Stream**: Uses Server-Sent Events (SSE) to update the kitchen screen instantly without refreshing.
*   **Audio & Visual Alerts**: Emits a custom chime and pop-up toast notification when a new order arrives.
*   **Menu Management**: Full CRUD interface for Categories, Food Items, and Options.
*   **Table & QR Management**: Generate, download, and manage QR codes linked to specific tables.
*   **Financial Insights**: Daily revenue tracking and order volume summaries.

## Tech Stack 🛠️

*   **Frontend**: React 19 (Vite), React Router DOM, strict Vanilla CSS architecture.
*   **Backend**: Node.js, Express.js.
*   **Database**: Turso (Cloud SQLite via `@libsql/client`) for free, permanent hosting.
*   **Real-Time**: Server-Sent Events (SSE) for zero-dependency live updates.

---

## Local Setup & Development 🚀

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed and a [Turso](https://turso.tech/) database created.

### 2. Environment Variables
Create a `.env` file in the `server` directory:
```env
TURSO_DATABASE_URL=your_database_url
TURSO_AUTH_TOKEN=your_auth_token
```

### 3. Install Dependencies
You need to install dependencies for both the client and the server.

```bash
# Install Everything (from root)
npm install
```

### 4. Run the Servers
Open a terminal and run from the root:
```bash
npm run dev
```

### 5. Access the Application
*   **Customer Portal**: `http://localhost:5173/` (Optionally `/table/T1`)
*   **Admin Dashboard**: `http://localhost:5173/admin`
    *   **Username**: `eatnchill`
    *   **Password**: `Nepal@123`

---

## Deployment Architecture ☁️

This project is optimized for a **100% Free Hosting** strategy:

1.  **Entire Project**: Can be deployed to **Vercel** using the root `vercel.json`.
2.  **Database**: Hosted on **Turso** (SQLite in the cloud).
3.  **Vercel Configuration**: The backend runs as Serverless Functions, while the frontend is served as static assets.

**IMPORTANT**: Ensure you add `TURSO_DATABASE_URL` and `TURSO_AUTH_TOKEN` to your Vercel Project Environment Variables.

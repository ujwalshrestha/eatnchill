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
*   **Database**: SQLite (via `sql.js` for fast local data handling).
*   **Real-Time**: Server-Sent Events (SSE) for zero-dependency live updates.

---

## Local Setup & Development 🚀

### 1. Prerequisites
Ensure you have [Node.js](https://nodejs.org/) installed.

### 2. Install Dependencies
You need to install dependencies for both the client and the server.

```bash
# Install Server Dependencies
cd server
npm install

# Install Client Dependencies
cd ../client
npm install
```

### 3. Run the Servers
Open two terminal windows to run both servers simultaneously.

**Terminal 1 (Backend - Port 3001):**
```bash
cd server
npm run dev
```

**Terminal 2 (Frontend - Port 5173):**
```bash
cd client
npm run dev
```

### 4. Access the Application
*   **Customer Portal**: `http://localhost:5173/` (Optionally `/table/T1`)
*   **Admin Dashboard**: `http://localhost:5173/admin`
    *   **Username**: `eatnchill`
    *   **Password**: `Nepal@123`

---

## Deployment Architecture ☁️

If you plan to deploy this project:
1.  **Frontend**: Can be deployed seamlessly as a Static Site to Vercel, Netlify, or Cloudflare Pages.
2.  **Backend**: Because it relies on a local SQLite database file, it **must** be deployed to a persistent server (like Render, Railway, or Heroku). Deploying the backend to Vercel Serverless Functions will result in a read-only filesystem error preventing orders from saving.

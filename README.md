# ShopKart

A full-stack e-commerce web application built with the **MERN stack** (MongoDB, Express, React, Node.js). ShopKart lets users browse products, manage a wishlist and cart, and place orders with integrated Razorpay payments.

---

## Features

- **Authentication** — Register / Login with JWT-based auth (HTTP-only cookies)
- **Products** — Browse a product catalogue with detailed product pages
- **Wishlist** — Save products to a personal wishlist
- **Cart** — Add/remove items, adjust quantities
- **Orders** — Place orders and view order history
- **Payments** — Razorpay payment gateway integration
- **Order Success** — Confirmation page after successful checkout

---

## Project Structure

```
ShopKart/
├── client/                  # React + Vite frontend
│   ├── src/
│   │   ├── pages/           # Home, Products, Cart, Checkout, Orders, ...
│   │   ├── components/      # Reusable UI components
│   │   ├── context/         # React Context (global state)
│   │   ├── axiosCalls/      # Axios API call helpers
│   │   └── services/        # Service utilities
│   └── vite.config.js
│
└── server/                  # Express + Node.js backend
    ├── routes/              # customers, products, wishlist, cart, orders
    ├── controllers/         # Route logic
    ├── models/              # Mongoose schemas
    ├── middlewares/         # Auth middleware
    ├── config/              # DB / app configuration
    ├── utils/               # Helper utilities
    ├── .env.example         # copy this to .env and fill in your values
    └── index.js             # Server entry point (port 8067)
```

---

## Getting Started

### Prerequisites

- [Node.js](https://nodejs.org/) v18+
- [npm](https://www.npmjs.com/) v9+
- A [MongoDB Atlas](https://cloud.mongodb.com/) account (free tier works)
- A [Razorpay](https://dashboard.razorpay.com/) account (test mode is fine)

---

### 1. Clone the repository

```bash
git clone https://github.com/<your-username>/ShopKart.git
cd ShopKart
```

---

### 2. Configure environment variables

```bash
cd server
cp .env.example .env       # on Windows: copy .env.example .env
```

Open `server/.env` and fill in your actual values:

| Variable              | Description                                    |
|-----------------------|------------------------------------------------|
| `dbUri`               | MongoDB Atlas connection string                |
| `jwt_secret`          | A long, random secret string for signing JWTs  |
| `RAZORPAY_KEY_ID`     | Razorpay API Key ID (from the dashboard)       |
| `RAZORPAY_KEY_SECRET` | Razorpay API Key Secret                        |

> **Never commit your `.env` file.** It is already listed in `.gitignore`.

---

### 3. Start the backend

```bash
cd server
npm install
node index.js          # or: npx nodemon index.js for auto-reload
```

The server will start on **http://localhost:8067**

---

### 4. Start the frontend

Open a **new terminal**:

```bash
cd client
npm install
npm run dev
```

The React app will start on **http://localhost:5173**

---

## API Routes

| Method | Route                  | Description              | Auth Required |
|--------|------------------------|--------------------------|---------------|
| POST   | `/customers/register`  | Register a new user      | No            |
| POST   | `/customers/login`     | Login (sets cookie)      | No            |
| GET    | `/products`            | List all products        | No            |
| GET    | `/products/:id`        | Get a single product     | No            |
| GET    | `/wishlist`            | Get user wishlist        | Yes           |
| POST   | `/wishlist`            | Add item to wishlist     | Yes           |
| DELETE | `/wishlist/:id`        | Remove from wishlist     | Yes           |
| GET    | `/cart`                | Get user cart            | Yes           |
| POST   | `/cart`                | Add item to cart         | Yes           |
| DELETE | `/cart/:id`            | Remove from cart         | Yes           |
| POST   | `/orders`              | Place an order           | Yes           |
| GET    | `/orders`              | Get user orders          | Yes           |

---

## Tech Stack

| Layer     | Technology                                     |
|-----------|------------------------------------------------|
| Frontend  | React 19, React Router v7, Axios, Tailwind CSS v4 |
| Backend   | Node.js, Express 5                             |
| Database  | MongoDB Atlas, Mongoose                        |
| Auth      | JWT, bcrypt, HTTP-only cookies                 |
| Payments  | Razorpay                                       |
| Build     | Vite 8                                         |

---

## Security Notes

- `.env` is excluded from git via `.gitignore` — real secrets are **never** committed
- Use `server/.env.example` as the template for required environment variables
- Passwords are hashed with **bcrypt** before storage
- Auth tokens are stored in **HTTP-only cookies** (not `localStorage`)

---

## License

This project is for educational purposes as part of the Scaler MERN curriculum.

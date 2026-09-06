# Golu Khaja Ghar (Decoupled Architecture)

Online Food Ordering and Restaurant Management Platform restructured into a clean two-tier architecture:

```
project-root/
├── web/            # Next.js 16 (Frontend UI Only - Zero Database Code)
├── services/       # Express.js + Node.js (Backend REST API, Auth, MongoDB/Mongoose)
└── README.md
```

---

## 1. Directory Structure

### `web/` — Frontend Application
- **Framework**: Next.js 16 (App Router), React 19, Tailwind CSS v4, Lucide Icons, Framer Motion, Leaflet.
- **Responsibilities**: UI presentation, client state management, responsive designs, PWA service worker, API client consumption.
- **Security**: Contains **zero** database connection code, zero ORM/Mongoose models, zero direct database queries, and zero private server credentials.

### `services/` — Backend Application
- **Framework**: Node.js, Express.js, TypeScript, Mongoose (MongoDB), Jose (JWT), Bcrypt, Multer, Web Push, Cloudinary.
- **Responsibilities**: REST API endpoints, JWT authentication & password hashing, database operations, business logic, server-side price computation, image uploads, push notifications, and WhatsApp alerts.

---

## 2. Quick Start & Local Development

### 1. Configure Environment Variables

1. **Backend (`services/.env`)**:
   ```bash
   cp services/.env.example services/.env
   ```
   Ensure `MONGODB_URI`, `JWT_SECRET`, `ADMIN_PASSWORD`, and Cloudinary/VAPID keys are configured.

2. **Frontend (`web/.env.local`)**:
   ```bash
   cp web/.env.example web/.env.local
   ```
   Ensure `BACKEND_API_URL=http://localhost:5000` and `NEXT_PUBLIC_API_URL=http://localhost:5000/api`.

### 2. Run Applications

From the root directory:

- **Run Backend Service (Port 5000)**:
  ```bash
  npm run dev:services
  ```

- **Run Frontend Application (Port 3000)**:
  ```bash
  npm run dev:web
  ```

- **Production Builds**:
  ```bash
  npm run build
  ```

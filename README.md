# 🚀 Enterprise ERP System

> An AI-powered Enterprise Resource Planning (ERP) platform designed to streamline inventory, procurement, manufacturing, sales, customer management, and business analytics through a unified, scalable, and intelligent solution.

<p align="center">

![React](https://img.shields.io/badge/Frontend-React%20%2B%20Vite-61DAFB?style=for-the-badge&logo=react)
![Node.js](https://img.shields.io/badge/Backend-Node.js-339933?style=for-the-badge&logo=node.js)
![Express](https://img.shields.io/badge/API-Express-black?style=for-the-badge&logo=express)
![PostgreSQL](https://img.shields.io/badge/Database-PostgreSQL-336791?style=for-the-badge&logo=postgresql)
![TailwindCSS](https://img.shields.io/badge/UI-TailwindCSS-38B2AC?style=for-the-badge&logo=tailwind-css)
![AI](https://img.shields.io/badge/AI-Gemini%20%7C%20Groq-purple?style=for-the-badge)

</p>

---

# 🌐 Live Demo

Coming Soon

# 📄 Documentation

Coming Soon

# 🎥 Demo Video

Coming Soon

---

# 📌 Problem Statement

Modern businesses often rely on multiple disconnected systems, spreadsheets, or standalone software to manage inventory, procurement, manufacturing, sales, finance, customers, and vendors. These disconnected workflows introduce several operational challenges:

- Duplicate data entry
- Manual processing errors
- Poor inventory visibility
- Delayed reporting
- Lack of centralized business data
- Difficult production planning
- Inefficient procurement
- Limited decision-making capabilities

Traditional ERP solutions are often expensive, complex, and inaccessible for startups and small-to-medium businesses. Moreover, many existing ERP systems lack intelligent AI-driven recommendations that help organizations make better operational decisions.

---

# 💡 Our Solution

Enterprise ERP System provides a centralized, AI-powered business management platform that integrates all major enterprise operations into a single application.

The platform enables organizations to:

- 📦 Manage inventory in real time
- 🏭 Track manufacturing workflows
- 🛒 Handle procurement and vendor management
- 💰 Process sales orders and invoices
- 👥 Maintain customer and supplier information
- 📊 Visualize business performance through dashboards
- 🤖 Receive AI-powered business insights and recommendations
- 🔐 Secure business data with JWT authentication and role-based access control

By combining ERP functionality with AI, the system reduces manual effort, improves operational efficiency, and supports data-driven decision-making.

---

# ✨ Key Features

## 📊 Dashboard

- Business KPIs
- Revenue Analytics
- Manufacturing Statistics
- Inventory Insights
- AI Recommendations

---

## 📦 Inventory Management

- Product Management
- Stock Tracking
- Warehouse Management
- Stock Transfers
- Stock Adjustments

---

## 🏭 Manufacturing

- Bill of Materials (BOM)
- Production Planning
- Work Orders
- Manufacturing Queue
- Material Tracking

---

## 🛒 Procurement

- Purchase Orders
- Vendor Management
- Procurement Workflow
- AI Procurement Suggestions

---

## 💰 Sales

- Sales Orders
- Invoice Management
- Payment Tracking
- Revenue Monitoring

---

## 👥 Customer & Vendor Management

- Customer Database
- Vendor Database
- Business Partner Analytics

---

## 🤖 AI Assistant

- AI Business Assistant
- Procurement Recommendations
- Inventory Insights
- Manufacturing Planner
- Vendor Analysis

---

## 📑 Audit System

- Audit Logs
- Activity Tracking
- User Monitoring

---

# 🏗 System Architecture

```

                    React Frontend
                           │
                           │ REST API
                           ▼
                  Express.js Backend
                           │
        ┌──────────────────┼─────────────────┐
        │                  │                 │
        ▼                  ▼                 ▼
 Authentication      Business Logic      AI Services
        │                  │                 │
        └──────────────┬───┴─────────────────┘
                       ▼
                PostgreSQL Database

```

---

# 🛠 Technology Stack

## Frontend

- React.js
- Vite
- Tailwind CSS
- React Router
- Axios

## Backend

- Node.js
- Express.js
- JWT Authentication

## Database

- PostgreSQL

## AI Integration

- Google Gemini API
- Groq API

## Version Control

- Git
- GitHub

---

# 📁 Project Structure

```

ERP-System

├── backend
│ ├── config
│ ├── controllers
│ ├── middlewares
│ ├── repositories
│ ├── routes
│ ├── services
│ ├── utils
│ ├── validations
│ └── server.js

├── frontend
│ ├── public
│ ├── src
│ ├── assets
│ ├── features
│ ├── hooks
│ ├── layouts
│ ├── routes
│ └── services

├── migrations

├── schema.sql

└── README.md

```

---

# 📸 Screenshots

> Add screenshots here.

- Login Page
- Dashboard
- Inventory
- Manufacturing
- Sales
- AI Assistant

---

# 🚀 Installation

## Clone Repository

```bash
git clone https://github.com/dhikondagopi/erp-system.git
```

```bash
cd erp-system
```

## Backend

```bash
cd backend
npm install
```

Create `.env`

```env
PORT=5000

DATABASE_URL=YOUR_DATABASE_URL

JWT_SECRET=YOUR_SECRET

GEMINI_API_KEY=YOUR_GEMINI_API_KEY

GROQ_API_KEY=YOUR_GROQ_API_KEY
```

Run backend

```bash
npm start
```

## Frontend

```bash
cd frontend
npm install
npm run dev
```

---

# 📈 Future Scope

- Multi-Tenant ERP
- Barcode & QR Code Integration
- Mobile Application
- Cloud Deployment
- Email & SMS Notifications
- AI Demand Forecasting
- Predictive Analytics
- Role-Based Enterprise Permissions

---

# 👨‍💻 About the Developer

## Gopi D

Final-Year B.Tech Computer Science (Cybersecurity)

Passionate about building scalable full-stack applications, AI-powered enterprise solutions, and cybersecurity-focused software.

### Connect with Me

- 💼 LinkedIn: (https://gopidhikondaportfolio.netlify.app/)
- 💻 GitHub: https://github.com/dhikondagopi
- 📧 Email: dhikondagopinaidu@gmail.com

---

## ⭐ Support

If you found this project useful, consider giving it a ⭐ on GitHub.

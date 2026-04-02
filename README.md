<h1 align="center">
  <img src="https://img.shields.io/badge/eMediCare-AI%20Healthcare%20Platform-blue?style=for-the-badge&logo=react" alt="eMediCare" />
</h1>

<p align="center">
  <b>An AI-Enabled Healthcare Appointment & Telemedicine Platform</b><br/>
  Built with the MERN Stack + Microservices Architecture
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18-61DAFB?logo=react&logoColor=white" />
  <img src="https://img.shields.io/badge/Node.js-18-339933?logo=node.js&logoColor=white" />
  <img src="https://img.shields.io/badge/Express.js-4-000000?logo=express&logoColor=white" />
  <img src="https://img.shields.io/badge/MongoDB-6-47A248?logo=mongodb&logoColor=white" />
  <img src="https://img.shields.io/badge/Docker-24-2496ED?logo=docker&logoColor=white" />
  <img src="https://img.shields.io/badge/Kubernetes-1.28-326CE5?logo=kubernetes&logoColor=white" />
</p>

---

## 📋 Table of Contents

- [About](#-about)
- [Features](#-features)
- [Tech Stack](#-tech-stack)
- [Project Structure](#-project-structure)
- [Setup Instructions](#-setup-instructions)
- [Running the Project](#-running-the-project)
- [API Overview](#-api-overview)
- [Team](#-team)

---

## 🏥 About

**eMediCare** is a full-stack, AI-powered healthcare platform that bridges the gap between patients and healthcare providers. It enables patients to book appointments, consult doctors via video calls, receive AI-driven symptom assessments, and manage prescriptions — all from one seamless platform.

---

## ✨ Features

| Feature | Description |
|--------|-------------|
| 🩺 **Doctor Booking** | Browse verified doctors by specialty and book appointments in real time |
| 📹 **Video Consultation** | Secure, HIPAA-friendly telemedicine sessions using WebRTC |
| 💳 **Payment Gateway** | Integrated payment processing for consultations and services |
| 🔔 **Smart Notifications** | SMS, email, and in-app alerts for appointments and results |
| 🤖 **AI Symptom Checker** | AI-powered symptom analysis to suggest potential diagnoses |
| 📋 **Prescription Management** | Digital prescriptions issued and stored securely |
| 🔐 **Authentication** | JWT-based secure login for patients, doctors, and admins |

---

## 🛠️ Tech Stack

### Frontend
- **React 18** — UI library
- **React Router DOM** — Client-side routing
- **Axios** — HTTP requests
- **Vite** — Lightning-fast dev server & bundler

### Backend (Microservices)
- **Node.js + Express.js** — REST API services
- **MongoDB + Mongoose** — NoSQL database & ODM
- **JWT + bcryptjs** — Authentication & password hashing
- **Dotenv** — Environment variable management
- **Cors** — Cross-origin resource sharing

### DevOps & Infrastructure
- **Docker** — Containerization of all services
- **Kubernetes (K8s)** — Orchestration and scaling
- **API Gateway** — Unified entry point for all microservices

---

## 📁 Project Structure

```
eMediCare/
├── frontend/                   # React + Vite frontend application
│   ├── public/
│   ├── src/
│   │   ├── assets/
│   │   ├── components/
│   │   ├── pages/
│   │   ├── services/
│   │   ├── App.jsx
│   │   └── main.jsx
│   ├── package.json
│   └── vite.config.js
│
├── api-gateway/                # API Gateway — routes requests to microservices
│   ├── src/
│   │   └── index.js
│   └── package.json
│
├── services/                   # Backend Microservices
│   ├── auth-service/           # User authentication & authorization
│   │   ├── src/
│   │   │   ├── routes/
│   │   │   ├── models/
│   │   │   ├── controllers/
│   │   │   └── index.js
│   │   └── package.json
│   │
│   ├── appointment-service/    # Doctor booking & scheduling
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── payment-service/        # Payment processing
│   │   ├── src/
│   │   └── package.json
│   │
│   ├── notification-service/   # Email/SMS/in-app notifications
│   │   ├── src/
│   │   └── package.json
│   │
│   └── ai-service/             # AI symptom checker
│       ├── src/
│       └── package.json
│
├── docker/                     # Dockerfiles for each service
│   ├── frontend.Dockerfile
│   ├── api-gateway.Dockerfile
│   └── services.Dockerfile
│
├── k8s/                        # Kubernetes manifests
│   ├── frontend-deployment.yaml
│   ├── api-gateway-deployment.yaml
│   └── services-deployment.yaml
│
├── .gitignore
├── docker-compose.yml
└── README.md
```

---

## ⚙️ Setup Instructions

### Prerequisites

Make sure you have the following installed:

- [Node.js](https://nodejs.org/) (v18 or above)
- [npm](https://www.npmjs.com/) (comes with Node.js)
- [MongoDB](https://www.mongodb.com/) (local or Atlas)
- [Docker](https://www.docker.com/) (optional, for containerization)
- [Git](https://git-scm.com/)

---

### 1️⃣ Clone the Repository

```bash
git clone https://github.com/your-username/eMediCare.git
cd eMediCare
```

---

### 2️⃣ Set Up Environment Variables

Each service needs its own `.env` file. Create them as follows:

**`services/auth-service/.env`**
```env
PORT=5001
MONGO_URI=mongodb://localhost:27017/emedicare_auth
JWT_SECRET=your_super_secret_key
```

**`api-gateway/.env`**
```env
PORT=8080
AUTH_SERVICE_URL=http://localhost:5001
APPOINTMENT_SERVICE_URL=http://localhost:5002
PAYMENT_SERVICE_URL=http://localhost:5003
NOTIFICATION_SERVICE_URL=http://localhost:5004
AI_SERVICE_URL=http://localhost:5005
```

**`frontend/.env`**
```env
VITE_API_BASE_URL=http://localhost:8080
```

---

### 3️⃣ Install Backend Dependencies

```bash
# API Gateway
cd api-gateway
npm install
cd ..

# Auth Service
cd services/auth-service
npm install
cd ../..

# Appointment Service
cd services/appointment-service
npm install
cd ../..

# Payment Service
cd services/payment-service
npm install
cd ../..

# Notification Service
cd services/notification-service
npm install
cd ../..

# AI Service
cd services/ai-service
npm install
cd ../..
```

---

### 4️⃣ Install Frontend Dependencies

```bash
cd frontend
npm install
cd ..
```

---

## 🚀 Running the Project

### Option A — Run Manually (Development)

Open separate terminals for each service:

```bash
# Terminal 1 — API Gateway
cd api-gateway && npm run dev

# Terminal 2 — Auth Service
cd services/auth-service && npm run dev

# Terminal 3 — Appointment Service
cd services/appointment-service && npm run dev

# Terminal 4 — Payment Service
cd services/payment-service && npm run dev

# Terminal 5 — Notification Service
cd services/notification-service && npm run dev

# Terminal 6 — AI Service
cd services/ai-service && npm run dev

# Terminal 7 — Frontend
cd frontend && npm run dev
```

Access the app at: **http://localhost:5173**

---

### Option B — Run with Docker Compose

```bash
docker-compose up --build
```

Access the app at: **http://localhost:3000**

---

## 🔌 API Overview

| Method | Endpoint | Service | Description |
|--------|----------|---------|-------------|
| POST | `/api/auth/register` | Auth Service | Register a new user |
| POST | `/api/auth/login` | Auth Service | Login and get JWT token |
| GET | `/api/appointments` | Appointment Service | Get all appointments |
| POST | `/api/appointments/book` | Appointment Service | Book a new appointment |
| POST | `/api/payments/pay` | Payment Service | Process a payment |
| POST | `/api/ai/symptom-check` | AI Service | Check symptoms via AI |

---

## 👥 Team

| Name | Role |
|------|------|
| Akshara Minoli | Full Stack Developer & Project Lead |

---

## 📄 License

This project is licensed under the [MIT License](LICENSE).

---

<p align="center">Made with ❤️ for better healthcare</p>

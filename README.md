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

### 4️⃣ Build Docker Images (Optional)

To build Docker images for all services:

**For Linux/macOS:**
```bash
chmod +x docker-build.sh
./docker-build.sh docker.io your-username latest
```

**For Windows:**
```bash
docker-build.bat docker.io your-username latest
```

Alternatively, build manually:
```bash
# Build services
docker build -t emedicare/auth-service -f docker/services.Dockerfile ./services/auth-service

# Build frontend
docker build -t emedicare/frontend -f docker/frontend.Dockerfile ./frontend

# Build API Gateway
docker build -t emedicare/api-gateway -f docker/api-gateway.Dockerfile ./api-gateway
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

# Terminal 7 — Doctor Service
cd services/doctor-service && npm run dev

# Terminal 8 — Patient Service
cd services/patient-service && npm run dev

# Terminal 9 — Telemedicine Service
cd services/telemedicine-service && npm run dev

# Terminal 10 — Admin Service
cd services/admin-service && npm run dev

# Terminal 11 — Frontend
cd frontend && npm run dev
```

Access the app at: **http://localhost:5173**

#### Manual Mode URLs

| Component | URL |
|-----------|-----|
| Frontend (Vite) | http://localhost:5173 |
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:5001 |
| Appointment Service | http://localhost:5002 |
| Payment Service | http://localhost:5003 |
| Notification Service | http://localhost:5004 |
| AI Service | http://localhost:5005 |
| Doctor Service | http://localhost:5006 |
| Patient Service | http://localhost:5007 |
| Telemedicine Service | http://localhost:5008 |
| Admin Service | http://localhost:5009 |

---

### Option B — Run with Docker Compose

```bash
docker compose up --build
```

Access the app at: **http://localhost:3000**

#### Docker Mode URLs

| Component | URL |
|-----------|-----|
| Frontend (Nginx) | http://localhost:3000 |
| API Gateway | http://localhost:8080 |
| Auth Service | http://localhost:5001 |
| Appointment Service | http://localhost:5002 |
| Payment Service | http://localhost:5003 |
| Notification Service | http://localhost:5004 |
| AI Service | http://localhost:5005 |
| Doctor Service | http://localhost:5006 |
| Patient Service | http://localhost:5007 |
| Telemedicine Service | http://localhost:5008 |
| Admin Service | http://localhost:5009 |
| MongoDB | mongodb://localhost:27017 |

### 🧭 Project Commands (Quick Reference)

Run these commands from the project root:

```bash
# Start all services (build images if needed)
docker compose up --build

# Start all services in detached mode
docker compose up -d --build

# Stop all services
docker compose down

# Stop all services and remove volumes
docker compose down -v

# See container status
docker compose ps

# Follow all logs
docker compose logs -f

# Follow logs for a specific service
docker compose logs -f frontend
docker compose logs -f api-gateway
docker compose logs -f admin-service
docker compose logs -f doctor-service

# Restart specific services
docker compose restart frontend
docker compose restart api-gateway admin-service doctor-service

# Rebuild and recreate key services
docker compose up -d --build frontend api-gateway admin-service doctor-service appointment-service patient-service payment-service
```

### ✅ Health/Validation Commands

```bash
# Gateway health
curl http://localhost:8080/health

# Direct service checks
curl http://localhost:5001/health
curl http://localhost:5002/health
curl http://localhost:5006/health
curl http://localhost:5007/health
curl http://localhost:5008/health
```

---

### Option C — Run with Kubernetes

**Prerequisites:**
- Kubernetes cluster (Minikube, Docker Desktop, or cloud provider)
- `kubectl` configured and connected to your cluster
- Docker images built and available

**Quick Deploy:**

```bash
cd k8s

# On Linux/macOS
chmod +x deploy.sh
./deploy.sh

# On Windows
deploy.bat
```

**Manual Deployment:**

```bash
# Create namespace and deploy all resources
kubectl apply -f k8s/namespace.yaml
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml
kubectl apply -f k8s/mongodb-deployment.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/api-gateway-service.yaml
kubectl apply -f k8s/services-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml
kubectl apply -f k8s/ingress.yaml
```

**Access the Application:**

```bash
# Port forward to frontend
kubectl port-forward -n emedicare svc/frontend-service 3000:80

# Port forward to API gateway
kubectl port-forward -n emedicare svc/api-gateway-service 8085:8080
```

**Check Deployment Status:**

```bash
# View deployments
kubectl get deployments -n emedicare

# View services
kubectl get svc -n emedicare

# View pods
kubectl get pods -n emedicare

# View logs
kubectl logs -f deployment/api-gateway -n emedicare
```

**For detailed Kubernetes deployment instructions, see [k8s/DEPLOYMENT-GUIDE.md](k8s/DEPLOYMENT-GUIDE.md)**
curl http://localhost:5009/health
```

PowerShell-friendly quick data check:

```powershell
$d=((Invoke-WebRequest -UseBasicParsing http://localhost:5006/api/doctors).Content | ConvertFrom-Json).count
$a=((Invoke-WebRequest -UseBasicParsing http://localhost:5002/api/appointments).Content | ConvertFrom-Json).appointments.Count
$p=((Invoke-WebRequest -UseBasicParsing http://localhost:5007/api/patients).Content | ConvertFrom-Json).count
$pay=((Invoke-WebRequest -UseBasicParsing http://localhost:5003/api/payments).Content | ConvertFrom-Json).count
Write-Output "doctors=$d appointments=$a patients=$p payments=$pay"
```

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
| GET    | `/api/doctors`           | Doctor Service       | Get a list of verified doctors |
| GET    | `/api/patients/:id`      | Patient Service      | Retrieve patient profile details |
| POST   | `/api/telemedicine/room` | Telemedicine Service | Initialize a secure WebRTC room |
| GET    | `/api/admin/metrics`     | Admin Service        | Fetch platform operations metrics |
| POST   | `/api/notifications/say` | Notification Service | Trigger SMS/Email notifications |

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

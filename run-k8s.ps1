# eMediCare - Kubernetes Automated Deployment Script
Write-Host "Starting eMediCare Kubernetes Deployment..." -ForegroundColor Cyan

# 1. Build Docker Images
Write-Host "Building Docker images..." -ForegroundColor Yellow

$services = @(
    @{ name = "api-gateway"; file = "docker/api-gateway.Dockerfile"; path = "./api-gateway" },
    @{ name = "frontend"; file = "docker/frontend.Dockerfile"; path = "./frontend" },
    @{ name = "admin-service"; file = "docker/admin-service.Dockerfile"; path = "./services/admin-service" },
    @{ name = "doctor-service"; file = "docker/doctor-service.Dockerfile"; path = "./services/doctor-service" },
    @{ name = "auth-service"; file = "docker/services.Dockerfile"; path = "./services/auth-service" },
    @{ name = "appointment-service"; file = "docker/services.Dockerfile"; path = "./services/appointment-service" },
    @{ name = "payment-service"; file = "docker/services.Dockerfile"; path = "./services/payment-service" },
    @{ name = "notification-service"; file = "docker/services.Dockerfile"; path = "./services/notification-service" },
    @{ name = "ai-service"; file = "docker/services.Dockerfile"; path = "./services/ai-service" },
    @{ name = "patient-service"; file = "docker/services.Dockerfile"; path = "./services/patient-service" },
    @{ name = "telemedicine-service"; file = "docker/services.Dockerfile"; path = "./services/telemedicine-service" }
)

foreach ($svc in $services) {
    Write-Host "Building $($svc.name)..."
    docker build -t "emedicare/$($svc.name):latest" -f $($svc.file) $($svc.path)
}

# 2. Apply Kubernetes Manifests
Write-Host "Deploying to Kubernetes..." -ForegroundColor Yellow

kubectl apply -f k8s/emedicare-secrets.yaml
kubectl apply -f k8s/services-deployment.yaml
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/frontend-deployment.yaml

Write-Host "Deployment complete!" -ForegroundColor Green
Write-Host "Check status with: kubectl get pods"
Write-Host "Access App at: http://localhost"
Write-Host "Access API Gateway at: http://localhost:8080"

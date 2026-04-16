@echo off
REM eMediCare Kubernetes Deployment Script for Windows
REM This script deploys the application to Kubernetes

setlocal enabledelayedexpansion

echo ==================================
echo eMediCare Kubernetes Deployment
echo ==================================
echo.

set NAMESPACE=emedicare

echo Creating namespace...
kubectl create namespace %NAMESPACE% --dry-run=client -o yaml | kubectl apply -f -

echo Applying ConfigMaps and Secrets...
kubectl apply -f k8s\configmap.yaml
kubectl apply -f k8s\secrets.yaml

echo Deploying MongoDB...
kubectl apply -f k8s\mongodb-deployment.yaml

echo Waiting for MongoDB to be ready...
timeout /t 10 /nobreak

echo Deploying API Gateway...
kubectl apply -f k8s\api-gateway-deployment.yaml
kubectl apply -f k8s\api-gateway-service.yaml

echo Deploying Microservices...
kubectl apply -f k8s\services-deployment.yaml

echo Deploying Frontend...
kubectl apply -f k8s\frontend-deployment.yaml

echo Applying Ingress configuration...
kubectl apply -f k8s\ingress.yaml

echo.
echo ==================================
echo Deployment Complete!
echo ==================================
echo.

echo Checking deployment status...
kubectl get deployments -n %NAMESPACE%
echo.

echo Checking services...
kubectl get services -n %NAMESPACE%
echo.

echo To access the application:
echo   kubectl port-forward -n %NAMESPACE% svc/frontend-service 3000:80
echo   kubectl port-forward -n %NAMESPACE% svc/api-gateway-service 8085:8080
echo.

pause

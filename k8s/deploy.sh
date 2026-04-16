#!/bin/bash

# eMediCare Kubernetes Deployment Script
# This script builds Docker images, pushes them to a registry, and deploys to Kubernetes

set -e

echo "=================================="
echo "eMediCare Kubernetes Deployment"
echo "=================================="

# Configuration
REGISTRY="${1:-docker.io}"
IMAGE_PREFIX="${2:-emedicare}"
NAMESPACE="emedicare"

echo "Registry: $REGISTRY"
echo "Image Prefix: $IMAGE_PREFIX"
echo "Namespace: $NAMESPACE"
echo ""

# Step 1: Create namespace
echo "✓ Creating namespace..."
kubectl create namespace $NAMESPACE --dry-run=client -o yaml | kubectl apply -f -

# Step 2: Apply ConfigMaps and Secrets
echo "✓ Applying ConfigMaps and Secrets..."
kubectl apply -f k8s/configmap.yaml
kubectl apply -f k8s/secrets.yaml

# Step 3: Apply MongoDB deployment
echo "✓ Deploying MongoDB..."
kubectl apply -f k8s/mongodb-deployment.yaml

# Wait for MongoDB to be ready
echo "⏳ Waiting for MongoDB to be ready..."
kubectl wait --for=condition=ready pod -l app=mongo -n $NAMESPACE --timeout=300s 2>/dev/null || true
sleep 5

# Step 4: Apply API Gateway deployment and service
echo "✓ Deploying API Gateway..."
kubectl apply -f k8s/api-gateway-deployment.yaml
kubectl apply -f k8s/api-gateway-service.yaml

# Step 5: Apply microservices deployments
echo "✓ Deploying Microservices..."
kubectl apply -f k8s/services-deployment.yaml

# Step 6: Apply frontend deployment
echo "✓ Deploying Frontend..."
kubectl apply -f k8s/frontend-deployment.yaml

# Step 7: Apply ingress (optional, requires nginx-ingress controller)
echo "✓ Applying Ingress configuration..."
kubectl apply -f k8s/ingress.yaml || echo "⚠ Ingress requires nginx-ingress controller to be installed"

echo ""
echo "=================================="
echo "✓ Deployment Complete!"
echo "=================================="
echo ""
echo "Checking deployment status..."
kubectl get deployments -n $NAMESPACE
echo ""
echo "Checking services..."
kubectl get services -n $NAMESPACE
echo ""
echo "To view logs of a service:"
echo "  kubectl logs -f deployment/<service-name> -n $NAMESPACE"
echo ""
echo "To access the application:"
echo "  kubectl port-forward -n $NAMESPACE svc/frontend-service 3000:80"
echo "  kubectl port-forward -n $NAMESPACE svc/api-gateway-service 8085:8080"

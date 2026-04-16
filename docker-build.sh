#!/bin/bash

# eMediCare Docker Build Script
# Builds Docker images for all services and pushes them to a registry

set -e

REGISTRY="${1:-docker.io}"
IMAGE_PREFIX="${2:-emedicare}"
TAG="${3:-latest}"

echo "=================================="
echo "Building eMediCare Docker Images"
echo "=================================="
echo "Registry: $REGISTRY"
echo "Image Prefix: $IMAGE_PREFIX"
echo "Tag: $TAG"
echo ""

# List of services to build
SERVICES=(
  "api-gateway"
  "services/auth-service"
  "services/appointment-service"
  "services/payment-service"
  "services/notification-service"
  "services/ai-service"
  "services/doctor-service"
  "services/patient-service"
  "services/telemedicine-service"
  "services/admin-service"
  "frontend"
)

# Build each service
for service in "${SERVICES[@]}"; do
  SERVICE_NAME=$(basename "$service")
  IMAGE_NAME="$REGISTRY/$IMAGE_PREFIX/$SERVICE_NAME:$TAG"
  
  echo "🔨 Building $SERVICE_NAME..."
  
  if [ "$service" == "frontend" ]; then
    docker build -t "$IMAGE_NAME" -f docker/frontend.Dockerfile ./frontend
  else
    docker build -t "$IMAGE_NAME" -f docker/services.Dockerfile ./"$service"
  fi
  
  echo "✓ Built: $IMAGE_NAME"
  echo ""
done

echo ""
echo "=================================="
echo "✓ All images built successfully!"
echo "=================================="
echo ""

# Optional: Push to registry
read -p "Do you want to push images to registry? (y/n) " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
  echo "Pushing images to $REGISTRY..."
  for service in "${SERVICES[@]}"; do
    SERVICE_NAME=$(basename "$service")
    IMAGE_NAME="$REGISTRY/$IMAGE_PREFIX/$SERVICE_NAME:$TAG"
    echo "📤 Pushing $IMAGE_NAME..."
    docker push "$IMAGE_NAME"
    echo "✓ Pushed: $IMAGE_NAME"
  done
  echo ""
  echo "✓ All images pushed successfully!"
fi

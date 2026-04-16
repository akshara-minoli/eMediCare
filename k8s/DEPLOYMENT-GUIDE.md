# eMediCare Kubernetes Deployment Guide

## Prerequisites

Before deploying to Kubernetes, ensure you have:

1. **Kubernetes Cluster**: A running Kubernetes cluster (local or cloud)
   - Minikube (local development)
   - Docker Desktop with Kubernetes enabled
   - GKE, EKS, AKS (cloud providers)

2. **kubectl** installed and configured
3. **Docker** installed (for building images)
4. **Helm** (optional, for advanced deployments)

## Kubernetes Architecture

The eMediCare application is deployed with the following components:

```
┌─────────────────────────────────────────────────────────┐
│                  Kubernetes Cluster                      │
│  Namespace: emedicare                                    │
├─────────────────────────────────────────────────────────┤
│                                                           │
│  Frontend (React + Nginx)                               │
│    └─ Service: frontend-service (LoadBalancer)          │
│                                                           │
│  API Gateway (Node.js)                                  │
│    └─ Service: api-gateway-service (LoadBalancer)       │
│                                                           │
│  Microservices:                                         │
│    ├─ Auth Service (Port 5001)                          │
│    ├─ Appointment Service (Port 5002)                   │
│    ├─ Payment Service (Port 5003)                       │
│    ├─ Notification Service (Port 5004)                  │
│    ├─ AI Service (Port 5005)                            │
│    ├─ Doctor Service (Port 5006)                        │
│    ├─ Patient Service (Port 5007)                       │
│    ├─ Telemedicine Service (Port 5008)                  │
│    └─ Admin Service (Port 5009)                         │
│                                                           │
│  MongoDB Database                                        │
│    └─ Persistent Volume (5Gi)                           │
│                                                           │
└─────────────────────────────────────────────────────────┘
```

## Kubernetes Manifest Files

### Core Configuration Files

1. **namespace.yaml** - Creates the `emedicare` namespace
2. **configmap.yaml** - Environment configuration (non-sensitive)
3. **secrets.yaml** - Sensitive data (MongoDB URIs, JWT secrets)
4. **mongodb-deployment.yaml** - MongoDB deployment with persistent storage

### Application Deployments

5. **api-gateway-deployment.yaml** - API Gateway with 2 replicas
6. **frontend-deployment.yaml** - Frontend with LoadBalancer service
7. **services-deployment.yaml** - All microservices with ClusterIP services
8. **api-gateway-service.yaml** - API Gateway LoadBalancer service
9. **ingress.yaml** - Ingress for external routing (requires Ingress Controller)

## Deployment Steps

### Option 1: Using Automated Script (Recommended)

**For Linux/macOS:**
```bash
cd k8s
chmod +x deploy.sh
./deploy.sh
```

**For Windows:**
```bash
cd k8s
deploy.bat
```

### Option 2: Manual Deployment

1. **Create namespace:**
   ```bash
   kubectl create namespace emedicare
   ```

2. **Apply ConfigMaps and Secrets:**
   ```bash
   kubectl apply -f k8s/configmap.yaml
   kubectl apply -f k8s/secrets.yaml
   ```

3. **Deploy MongoDB:**
   ```bash
   kubectl apply -f k8s/mongodb-deployment.yaml
   kubectl wait --for=condition=ready pod -l app=mongo -n emedicare --timeout=300s
   ```

4. **Deploy API Gateway:**
   ```bash
   kubectl apply -f k8s/api-gateway-deployment.yaml
   kubectl apply -f k8s/api-gateway-service.yaml
   ```

5. **Deploy Microservices:**
   ```bash
   kubectl apply -f k8s/services-deployment.yaml
   ```

6. **Deploy Frontend:**
   ```bash
   kubectl apply -f k8s/frontend-deployment.yaml
   ```

7. **Deploy Ingress (optional):**
   ```bash
   kubectl apply -f k8s/ingress.yaml
   ```

## Accessing the Application

### Using kubectl port-forward

**Access Frontend:**
```bash
kubectl port-forward -n emedicare svc/frontend-service 3000:80
# Open http://localhost:3000
```

**Access API Gateway:**
```bash
kubectl port-forward -n emedicare svc/api-gateway-service 8085:8080
# Access http://localhost:8085
```

### Using LoadBalancer (if cloud provider supports it)

Get the external IP:
```bash
kubectl get svc -n emedicare
```

The `EXTERNAL-IP` column will show the public IP to access the services.

### Using Ingress (requires Ingress Controller)

1. Install NGINX Ingress Controller:
   ```bash
   helm repo add ingress-nginx https://kubernetes.github.io/ingress-nginx
   helm install nginx-ingress ingress-nginx/ingress-nginx
   ```

2. Access via ingress hostname:
   ```
   http://emedicare.local
   ```

## Monitoring Deployments

### Check deployment status:
```bash
kubectl get deployments -n emedicare
kubectl get pods -n emedicare
kubectl get svc -n emedicare
```

### View logs:
```bash
# Logs from a specific service
kubectl logs -f deployment/api-gateway -n emedicare

# Logs from a specific pod
kubectl logs -f pod/<pod-name> -n emedicare

# Follow logs in real-time
kubectl logs -f -l app=auth-service -n emedicare
```

### Describe pod for debugging:
```bash
kubectl describe pod <pod-name> -n emedicare
kubectl describe deployment <deployment-name> -n emedicare
```

## Scaling Services

Scale a deployment to multiple replicas:
```bash
kubectl scale deployment/auth-service --replicas=3 -n emedicare
```

## Updating Deployments

To update an image or configuration:
```bash
# Update image
kubectl set image deployment/api-gateway api-gateway=emedicare/api-gateway:v1.1 -n emedicare

# Apply updated manifest
kubectl apply -f k8s/api-gateway-deployment.yaml
```

## Deleting the Deployment

To remove all eMediCare resources:
```bash
# Delete namespace (deletes all resources within it)
kubectl delete namespace emedicare

# Or delete specific resources
kubectl delete -f k8s/
```

## Environment Configuration

### Update Secrets (MongoDB URIs, JWT)

Edit `k8s/secrets.yaml` and reapply:
```bash
kubectl apply -f k8s/secrets.yaml
```

### Update ConfigMaps (Service URLs)

Edit `k8s/configmap.yaml` and reapply:
```bash
kubectl apply -f k8s/configmap.yaml
```

Note: After updating secrets/configmaps, restart pods for changes to take effect:
```bash
kubectl rollout restart deployment/api-gateway -n emedicare
kubectl rollout restart statefulset/mongo -n emedicare
```

## Production Considerations

For production deployments:

1. **Use Private Container Registry**: Store images in Docker Hub, ECR, or GCR
2. **Update Secrets**: Change JWT_SECRET and MongoDB credentials
3. **Use TLS/SSL**: Configure Ingress with SSL certificates
4. **Resource Limits**: Set appropriate CPU/memory limits for all services
5. **Monitoring**: Deploy Prometheus and Grafana for monitoring
6. **Logging**: Set up centralized logging (ELK stack, Loki)
7. **Backup**: Configure persistent volume backups
8. **Autoscaling**: Enable Horizontal Pod Autoscaler (HPA)
9. **Network Policies**: Implement Kubernetes Network Policies
10. **RBAC**: Set up role-based access control

## Troubleshooting

### Pods not starting:
```bash
kubectl describe pod <pod-name> -n emedicare
kubectl logs <pod-name> -n emedicare
```

### Services not communicating:
```bash
# Test connectivity within cluster
kubectl run debug --image=busybox -it --rm -- /bin/sh
# Inside the pod: wget -O- http://auth-service:5001
```

### MongoDB connection issues:
```bash
kubectl exec -it deployment/mongo -n emedicare -- mongosh
```

### Check resource usage:
```bash
kubectl top nodes
kubectl top pods -n emedicare
```

## Additional Resources

- [Kubernetes Documentation](https://kubernetes.io/docs/)
- [kubectl Cheat Sheet](https://kubernetes.io/docs/reference/kubectl/cheatsheet/)
- [Kubernetes Best Practices](https://kubernetes.io/docs/concepts/configuration/overview/)

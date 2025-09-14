#!/bin/bash

# Kubernetes Deployment Script
# This script deploys the shortlink application to Kubernetes

set -e  # Exit on any error

echo "🚀 Starting Kubernetes deployment for shortlink application..."
echo "=================================================="

# Function to check if kubectl is available
check_kubectl() {
    if ! command -v kubectl &> /dev/null; then
        echo "❌ Error: kubectl is not installed or not in PATH"
        exit 1
    fi
    echo "✅ kubectl is available"
}

# Function to check if we can connect to cluster
check_cluster() {
    if ! kubectl cluster-info &> /dev/null; then
        echo "❌ Error: Cannot connect to Kubernetes cluster"
        echo "Please ensure your kubectl is configured correctly"
        exit 1
    fi
    echo "✅ Connected to Kubernetes cluster"
}

# Function to apply manifest with error handling
apply_manifest() {
    local file=$1
    local description=$2
    
    echo "📄 Applying $description..."
    if kubectl apply -f "$file"; then
        echo "✅ $description applied successfully"
    else
        echo "❌ Failed to apply $description"
        exit 1
    fi
}

# Main deployment function
deploy() {
    echo ""
    echo "1️⃣ Creating the namespace..."
    apply_manifest "kubernetes/namespace.yaml" "namespace"
    
    echo ""
    echo "2️⃣ Deploying the database components..."
    apply_manifest "kubernetes/postgres-secret.yaml" "PostgreSQL secret"
    apply_manifest "kubernetes/postgres-pvc.yaml" "PostgreSQL PVC"
    apply_manifest "kubernetes/postgres-deployment.yaml" "PostgreSQL deployment"
    apply_manifest "kubernetes/postgres-service.yaml" "PostgreSQL service"
    
    echo ""
    echo "3️⃣ Deploying the backend..."
    apply_manifest "kubernetes/backend-deployment.yaml" "Backend deployment"
    apply_manifest "kubernetes/backend-service.yaml" "Backend service"
    
    echo ""
    echo "4️⃣ Deploying the frontend and exposing the app..."
    apply_manifest "kubernetes/frontend-deployment.yaml" "Frontend deployment"
    apply_manifest "kubernetes/frontend-service.yaml" "Frontend service"
    apply_manifest "kubernetes/ingress.yaml" "Ingress"
    
    echo ""
    echo "🎉 Deployment completed successfully!"
    echo "=================================================="
    echo ""
    echo "📋 Next steps:"
    echo "   • Check pod status: kubectl get pods -n shortlink"
    echo "   • Check services: kubectl get svc -n shortlink"
    echo "   • Check ingress: kubectl get ingress -n shortlink"
    echo ""
    echo "🔗 To access the application:"
    echo "   • Port forward frontend: kubectl port-forward -n shortlink svc/frontend-service 3000:80"
    echo "   • Port forward backend: kubectl port-forward -n shortlink svc/backend-service 3001:80"
    echo "   • Then visit: http://localhost:3000"
}

# Run the deployment
main() {
    check_kubectl
    check_cluster
    deploy
}

# Execute main function
main "$@"

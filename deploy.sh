#!/bin/bash

# DIESEL Dashboard & API Deployment Script
# Production deployment to Vercel

set -e

echo "🚀 DIESEL Production Deployment Script"
echo "====================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if Vercel CLI is installed
if ! command -v vercel &> /dev/null; then
    echo -e "${RED}Error: Vercel CLI is not installed${NC}"
    echo "Install it with: npm i -g vercel"
    exit 1
fi

# Function to deploy API
deploy_api() {
    echo -e "\n${YELLOW}Deploying API Server...${NC}"
    cd api
    
    # Install dependencies
    echo "Installing API dependencies..."
    npm install
    
    # Build TypeScript
    echo "Building API..."
    npm run build
    
    # Deploy to Vercel
    echo "Deploying API to Vercel..."
    vercel --prod
    
    cd ..
    echo -e "${GREEN}✓ API deployed successfully${NC}"
}

# Function to deploy Dashboard
deploy_dashboard() {
    echo -e "\n${YELLOW}Deploying Dashboard...${NC}"
    cd dashboard
    
    # Install dependencies
    echo "Installing dashboard dependencies..."
    npm install
    
    # Build for production
    echo "Building dashboard..."
    npm run build
    
    # Deploy to Vercel
    echo "Deploying dashboard to Vercel..."
    vercel --prod
    
    cd ..
    echo -e "${GREEN}✓ Dashboard deployed successfully${NC}"
}

# Main deployment flow
echo "What would you like to deploy?"
echo "1) API Server only"
echo "2) Dashboard only"
echo "3) Both API and Dashboard"
read -p "Enter choice (1-3): " choice

case $choice in
    1)
        deploy_api
        ;;
    2)
        deploy_dashboard
        ;;
    3)
        deploy_api
        deploy_dashboard
        ;;
    *)
        echo -e "${RED}Invalid choice${NC}"
        exit 1
        ;;
esac

echo -e "\n${GREEN}🎉 Deployment complete!${NC}"
echo "====================================="
echo "Next steps:"
echo "1. Set environment variables in Vercel dashboard"
echo "2. Update CORS_ORIGIN in API settings"
echo "3. Update VITE_API_BASE_URL in dashboard settings"
echo "4. Test the production deployment"
#!/bin/bash

# =============================================================================
# Cercle Titans - VPS Deployment Script
# =============================================================================
# Usage: ./deploy.sh [production|staging]
# =============================================================================

set -e  # Exit on error

# Configuration - UPDATE THESE VALUES
VPS_USER="root"
VPS_HOST="your-vps-ip-or-domain.com"
VPS_PATH="/var/www/cercle-titans"
SSH_KEY="~/.ssh/id_rsa"  # Path to your SSH key

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Environment (default: production)
ENV=${1:-production}

echo -e "${BLUE}========================================${NC}"
echo -e "${BLUE}  Cercle Titans Deployment Script${NC}"
echo -e "${BLUE}  Environment: ${YELLOW}${ENV}${NC}"
echo -e "${BLUE}========================================${NC}"

# Step 1: Check if we're in the right directory
if [ ! -f "package.json" ]; then
    echo -e "${RED}Error: package.json not found. Run this script from project root.${NC}"
    exit 1
fi

# Step 2: Install dependencies
echo -e "\n${GREEN}[1/6] Installing dependencies...${NC}"
npm ci --silent

# Step 3: Build the project
echo -e "\n${GREEN}[2/6] Building project for ${ENV}...${NC}"
npm run build

if [ ! -d "dist" ]; then
    echo -e "${RED}Error: Build failed. dist/ folder not found.${NC}"
    exit 1
fi

echo -e "${GREEN}Build successful! dist/ folder created.${NC}"

# Step 4: Create logs directory if needed
mkdir -p logs

# Step 5: Sync files to VPS
echo -e "\n${GREEN}[3/6] Syncing files to VPS...${NC}"

rsync -avz --delete \
    --exclude 'node_modules' \
    --exclude '.git' \
    --exclude '.env.local' \
    --exclude '.env.development' \
    --exclude 'src' \
    --exclude '*.log' \
    -e "ssh -i ${SSH_KEY}" \
    dist/ \
    server.js \
    ecosystem.config.js \
    package.json \
    package-lock.json \
    "${VPS_USER}@${VPS_HOST}:${VPS_PATH}/"

echo -e "${GREEN}Files synced successfully!${NC}"

# Step 6: Install dependencies and restart on VPS
echo -e "\n${GREEN}[4/6] Installing production dependencies on VPS...${NC}"

ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" << EOF
    cd ${VPS_PATH}
    
    # Install only production dependencies
    npm ci --omit=dev --silent
    
    # Create logs directory
    mkdir -p logs
EOF

echo -e "\n${GREEN}[5/6] Restarting PM2 application...${NC}"

ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" << EOF
    cd ${VPS_PATH}
    
    # Check if app is already running in PM2
    if pm2 list | grep -q "cercle-titans"; then
        echo "Reloading existing application..."
        pm2 reload ecosystem.config.js --env ${ENV}
    else
        echo "Starting new application..."
        pm2 start ecosystem.config.js --env ${ENV}
    fi
    
    # Save PM2 process list
    pm2 save
    
    # Show status
    pm2 status
EOF

# Step 7: Verify deployment
echo -e "\n${GREEN}[6/6] Verifying deployment...${NC}"

ssh -i "${SSH_KEY}" "${VPS_USER}@${VPS_HOST}" << EOF
    cd ${VPS_PATH}
    
    # Wait for app to start
    sleep 3
    
    # Check if app is responding
    if curl -s -o /dev/null -w "%{http_code}" http://localhost:3000 | grep -q "200"; then
        echo "✓ Application is responding on port 3000"
    else
        echo "⚠ Warning: Application may not be responding correctly"
    fi
EOF

echo -e "\n${BLUE}========================================${NC}"
echo -e "${GREEN}  Deployment Complete!${NC}"
echo -e "${BLUE}========================================${NC}"
echo -e "Server: ${YELLOW}${VPS_USER}@${VPS_HOST}${NC}"
echo -e "Path: ${YELLOW}${VPS_PATH}${NC}"
echo -e "Environment: ${YELLOW}${ENV}${NC}"
echo -e "\n${BLUE}Useful commands on VPS:${NC}"
echo -e "  pm2 logs cercle-titans    # View logs"
echo -e "  pm2 monit                 # Monitor resources"
echo -e "  pm2 restart cercle-titans # Restart app"
echo -e "${BLUE}========================================${NC}"

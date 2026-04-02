#!/bin/bash

# Galaxy Cinema - Deployment Validation Script
# This script checks if all components are properly configured before deployment

set -e

echo "======================================"
echo "Galaxy Cinema - Pre-Deployment Checks"
echo "======================================"
echo ""

# Color codes
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

ERRORS=0
WARNINGS=0

# Function to check file existence
check_file() {
    if [ -f "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ERRORS=$((ERRORS + 1))
    fi
}

# Function to check directory existence
check_dir() {
    if [ -d "$1" ]; then
        echo -e "${GREEN}✓${NC} Found: $1"
    else
        echo -e "${RED}✗${NC} Missing: $1"
        ERRORS=$((ERRORS + 1))
    fi
}

# 1. Check Required Files
echo "1. Checking Required Files..."
check_file "docker-compose.deploy.yml"
check_file "Dockerfile"
check_file "backend/.env"
check_file "backend/index.php"
check_file "backend/router.php"
check_file "backend/database/schema.sql"
check_file "backend/database/seed_data.sql"
check_file "source-code/galaxy-cinema-hub-main/Dockerfile"
check_file "source-code/galaxy-cinema-hub-main/package.json"
echo ""

# 2. Check Required Directories
echo "2. Checking Required Directories..."
check_dir "backend"
check_dir "backend/config"
check_dir "backend/controllers"
check_dir "backend/models"
check_dir "backend/database"
check_dir "source-code/galaxy-cinema-hub-main"
check_dir "source-code/galaxy-cinema-hub-main/src"
echo ""

# 3. Validate docker-compose.yml syntax
echo "3. Validating docker-compose.deploy.yml syntax..."
if docker-compose -f docker-compose.deploy.yml config > /dev/null 2>&1; then
    echo -e "${GREEN}✓${NC} docker-compose.deploy.yml syntax is valid"
else
    echo -e "${RED}✗${NC} docker-compose.deploy.yml syntax is invalid"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 4. Check Docker and Docker Compose installation
echo "4. Checking Docker installation..."
if command -v docker &> /dev/null; then
    DOCKER_VERSION=$(docker --version)
    echo -e "${GREEN}✓${NC} Docker is installed: $DOCKER_VERSION"
else
    echo -e "${RED}✗${NC} Docker is not installed"
    ERRORS=$((ERRORS + 1))
fi

if command -v docker-compose &> /dev/null; then
    COMPOSE_VERSION=$(docker-compose --version)
    echo -e "${GREEN}✓${NC} Docker Compose is installed: $COMPOSE_VERSION"
else
    echo -e "${RED}✗${NC} Docker Compose is not installed"
    ERRORS=$((ERRORS + 1))
fi
echo ""

# 5. Check Environment Configuration
echo "5. Checking Environment Configuration..."

# Check backend .env
if [ -f "backend/.env" ]; then
    # Check critical env variables
    if grep -q "DB_HOST=" backend/.env; then
        DB_HOST=$(grep "DB_HOST=" backend/.env | cut -d '=' -f2)
        if [ "$DB_HOST" == "db" ]; then
            echo -e "${GREEN}✓${NC} DB_HOST is correctly set to 'db' for Docker"
        else
            echo -e "${YELLOW}⚠${NC} DB_HOST is set to '$DB_HOST' (should be 'db' for Docker deployment)"
            WARNINGS=$((WARNINGS + 1))
        fi
    else
        echo -e "${RED}✗${NC} DB_HOST not found in backend/.env"
        ERRORS=$((ERRORS + 1))
    fi
    
    if grep -q "JWT_SECRET=" backend/.env; then
        JWT_SECRET=$(grep "JWT_SECRET=" backend/.env | cut -d '=' -f2)
        if [ "$JWT_SECRET" == "galaxy_cinema_secret_key_2026_change_this_in_production" ]; then
            echo -e "${YELLOW}⚠${NC} JWT_SECRET is using default value (change for production)"
            WARNINGS=$((WARNINGS + 1))
        else
            echo -e "${GREEN}✓${NC} JWT_SECRET is customized"
        fi
    fi
    
    if grep -q "DB_PASSWORD=" backend/.env; then
        echo -e "${GREEN}✓${NC} DB_PASSWORD is set"
    else
        echo -e "${RED}✗${NC} DB_PASSWORD not found in backend/.env"
        ERRORS=$((ERRORS + 1))
    fi
fi

# Check root .env
if [ -f ".env" ]; then
    echo -e "${GREEN}✓${NC} Root .env file exists"
    if grep -q "MYSQL_ROOT_PASSWORD=" .env; then
        echo -e "${GREEN}✓${NC} MYSQL_ROOT_PASSWORD is set"
    else
        echo -e "${YELLOW}⚠${NC} MYSQL_ROOT_PASSWORD not found in .env (will use default)"
        WARNINGS=$((WARNINGS + 1))
    fi
else
    echo -e "${YELLOW}⚠${NC} Root .env file not found (will use defaults from docker-compose.deploy.yml)"
    WARNINGS=$((WARNINGS + 1))
fi
echo ""

# 6. Check SQL Files
echo "6. Checking Database Initialization Files..."
if [ -f "backend/database/schema.sql" ]; then
    SCHEMA_LINES=$(wc -l < backend/database/schema.sql)
    echo -e "${GREEN}✓${NC} schema.sql exists ($SCHEMA_LINES lines)"
    
    # Check if schema drops database
    if grep -q "DROP DATABASE" backend/database/schema.sql; then
        echo -e "${YELLOW}⚠${NC} schema.sql contains DROP DATABASE (will recreate DB on init)"
        WARNINGS=$((WARNINGS + 1))
    fi
fi

if [ -f "backend/database/seed_data.sql" ]; then
    SEED_LINES=$(wc -l < backend/database/seed_data.sql)
    echo -e "${GREEN}✓${NC} seed_data.sql exists ($SEED_LINES lines)"
fi
echo ""

# 7. Check Port Availability
echo "7. Checking Port Availability..."
check_port() {
    PORT=$1
    if lsof -Pi :$PORT -sTCP:LISTEN -t >/dev/null 2>&1 ; then
        echo -e "${YELLOW}⚠${NC} Port $PORT is already in use"
        WARNINGS=$((WARNINGS + 1))
    else
        echo -e "${GREEN}✓${NC} Port $PORT is available"
    fi
}

check_port 3307  # MySQL
check_port 8000  # Backend
check_port 8080  # Frontend
echo ""

# Summary
echo "======================================"
echo "Summary:"
echo "======================================"
echo -e "Errors: ${RED}$ERRORS${NC}"
echo -e "Warnings: ${YELLOW}$WARNINGS${NC}"
echo ""

if [ $ERRORS -eq 0 ]; then
    echo -e "${GREEN}✓ All critical checks passed!${NC}"
    echo ""
    echo "You can proceed with deployment:"
    echo "  docker-compose -f docker-compose.deploy.yml up -d --build"
    echo ""
    exit 0
else
    echo -e "${RED}✗ $ERRORS critical error(s) found. Please fix them before deployment.${NC}"
    echo ""
    exit 1
fi

# Galaxy Cinema - AWS Deployment Guide

## Overview
This guide covers deploying the Galaxy Cinema Booking System on AWS using Docker Compose.

## Prerequisites
- AWS EC2 instance (Ubuntu 20.04+ or Amazon Linux 2)
- Docker and Docker Compose installed
- At least 2GB RAM, 20GB storage
- Port 8000 (backend), 8080 (frontend), 3307 (MySQL) open in security group

## Quick Start

### 1. Clone Repository and Setup Environment
```bash
git clone <repository-url>
cd Cinema-Booking-System

# Create .env file from example
cp .env.deploy.example .env

# Edit .env with your values
nano .env
```

### 2. Configure Environment Variables

**Root .env file** (for docker-compose.deploy.yml):
```env
MYSQL_ROOT_PASSWORD=your_secure_password_here
MYSQL_DATABASE=galaxy_cinema
DB_PORT=3307
TZ=Asia/Ho_Chi_Minh
BACKEND_PORT=8000
FRONTEND_PORT=8080
VITE_API_URL=http://your-domain-or-ip:8000
```

**Backend .env file** (backend/.env):
```bash
cd backend
cp .env.example .env
nano .env
```

Update these critical values:
- `DB_HOST=db` (Docker service name)
- `DB_PASSWORD=` (must match MYSQL_ROOT_PASSWORD)
- `JWT_SECRET=` (change to random secure string)
- `SMTP_ENABLED=false` (or configure if using email)
- `APP_URL=` (your domain/IP)
- `FRONTEND_URL=` (your frontend URL)

### 3. Deploy with Docker Compose

```bash
# Build and start all services
docker-compose -f docker-compose.deploy.yml up -d --build

# Check logs
docker-compose -f docker-compose.deploy.yml logs -f

# Check service status
docker-compose -f docker-compose.deploy.yml ps
```

### 4. Verify Deployment

```bash
# Test backend health
curl http://localhost:8000/api/health

# Test database connection
docker exec galaxy_cinema_backend php -r "require '/app/config/Database.php'; \$db = Database::getInstance(); echo 'DB OK';"

# Test frontend
curl http://localhost:8080
```

## Service Architecture

### Services Overview
1. **db** (MySQL 8.0) - Port 3307 → 3306
   - Database with auto-initialization (schema.sql + seed_data.sql)
   - Persistent volume: `mysql_data`
   
2. **backend** (PHP 8.2) - Port 8000 → 8080
   - REST API built with PHP
   - Depends on DB health check
   
3. **frontend** (React + Vite) - Port 8080 → 80
   - React SPA served via Nginx
   - Depends on backend health check

## Default Credentials (from seed_data.sql)

| Role    | Email                    | Password |
|---------|-------------------------|----------|
| Admin   | admin@galaxy.vn         | password |
| Manager | manager@galaxy.vn       | password |
| Staff   | staff@galaxy.vn         | password |
| Member  | nguyenvana@gmail.com    | password |

**⚠️ IMPORTANT: Change these passwords immediately after first login!**

## Common Issues and Solutions

### Issue 1: Backend cannot connect to database
**Solution:**
```bash
# Check if DB is healthy
docker-compose -f docker-compose.deploy.yml ps

# Check DB logs
docker-compose -f docker-compose.deploy.yml logs db

# Ensure backend/.env has DB_HOST=db (not localhost)
```

### Issue 2: Frontend cannot reach backend
**Solution:**
- Update `VITE_API_URL` in root `.env` to your public IP/domain
- Rebuild frontend: `docker-compose -f docker-compose.deploy.yml up -d --build frontend`

### Issue 3: Database initialization fails
**Solution:**
```bash
# Remove volume and restart
docker-compose -f docker-compose.deploy.yml down -v
docker-compose -f docker-compose.deploy.yml up -d
```

### Issue 4: Port conflicts
**Solution:**
Edit `.env` and change port mappings:
```env
DB_PORT=3308  # if 3307 is taken
BACKEND_PORT=8001  # if 8000 is taken
FRONTEND_PORT=8081  # if 8080 is taken
```

## Production Deployment Checklist

- [ ] Change default database password
- [ ] Change JWT_SECRET to random secure string
- [ ] Change default user passwords
- [ ] Set SMTP_ENABLED=true and configure email (if needed)
- [ ] Update VITE_API_URL to production domain
- [ ] Configure domain/SSL (recommended: use Nginx reverse proxy + Let's Encrypt)
- [ ] Set up database backups
- [ ] Configure firewall rules
- [ ] Enable Docker restart policies (already set: `unless-stopped`)
- [ ] Review and update API keys (Pusher, MapTiler, etc.)
- [ ] Test all critical flows (register, login, booking)

## Maintenance Commands

```bash
# Stop all services
docker-compose -f docker-compose.deploy.yml stop

# Restart a specific service
docker-compose -f docker-compose.deploy.yml restart backend

# View logs
docker-compose -f docker-compose.deploy.yml logs -f backend

# Execute SQL directly
docker exec -it galaxy_cinema_db mysql -uroot -p galaxy_cinema

# Backup database
docker exec galaxy_cinema_db mysqldump -uroot -p"${MYSQL_ROOT_PASSWORD}" galaxy_cinema > backup_$(date +%Y%m%d).sql

# Restore database
docker exec -i galaxy_cinema_db mysql -uroot -p"${MYSQL_ROOT_PASSWORD}" galaxy_cinema < backup.sql

# Remove all containers and volumes (DESTRUCTIVE)
docker-compose -f docker-compose.deploy.yml down -v
```

## AWS EC2 Setup Example

```bash
# Update system
sudo apt update && sudo apt upgrade -y

# Install Docker
curl -fsSL https://get.docker.com -o get-docker.sh
sudo sh get-docker.sh
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Log out and back in for group changes
exit
```

## SSL/HTTPS Setup (Optional but Recommended)

Use Nginx as reverse proxy with Let's Encrypt:

```nginx
server {
    server_name your-domain.com;
    
    location / {
        proxy_pass http://localhost:8080;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
    
    location /api {
        proxy_pass http://localhost:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

Then use Certbot:
```bash
sudo apt install certbot python3-certbot-nginx
sudo certbot --nginx -d your-domain.com
```

## Monitoring

### Check Health Status
```bash
# Backend health
curl http://localhost:8000/api/health

# Frontend (should return HTML)
curl -I http://localhost:8080

# Database
docker exec galaxy_cinema_db mysqladmin ping -h localhost -uroot -p"${MYSQL_ROOT_PASSWORD}"
```

### Container Resource Usage
```bash
docker stats galaxy_cinema_db galaxy_cinema_backend galaxy_cinema_frontend
```

## Scaling Considerations

For production at scale:
1. Use managed RDS instead of containerized MySQL
2. Use load balancer for multiple backend instances
3. Serve frontend via CloudFront CDN
4. Store uploads in S3 (backend already supports Cloudinary)
5. Use ElastiCache for session/cache management

## Support

For issues or questions:
- Check logs: `docker-compose -f docker-compose.deploy.yml logs`
- Review backend error logs in container
- Check database connection and initialization

## License

[Add your license information here]

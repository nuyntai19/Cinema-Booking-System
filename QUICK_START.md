# 🎬 Galaxy Cinema - Quick Deployment Reference

## 🚀 Deploy in 3 Steps

### Step 1: Configure Environment
```bash
# Copy and edit environment files
cp .env.deploy.example .env
nano .env  # Update MYSQL_ROOT_PASSWORD and VITE_API_URL

# Ensure backend .env exists
cd backend && cp .env.example .env
nano .env  # Update DB_HOST=db, DB_PASSWORD, JWT_SECRET
cd ..
```

### Step 2: Validate Setup
```bash
./check_deployment.sh
```

### Step 3: Deploy
```bash
docker-compose -f docker-compose.deploy.yml up -d --build
```

---

## 📋 Quick Commands

### View Status
```bash
docker-compose -f docker-compose.deploy.yml ps
```

### View Logs
```bash
# All services
docker-compose -f docker-compose.deploy.yml logs -f

# Specific service
docker-compose -f docker-compose.deploy.yml logs -f backend
```

### Test Health
```bash
# Backend API
curl http://localhost:8000/api/health

# Frontend
curl -I http://localhost:8080

# Database
docker exec galaxy_cinema_db mysqladmin ping -h localhost -uroot -p
```

### Restart Services
```bash
# All services
docker-compose -f docker-compose.deploy.yml restart

# Single service
docker-compose -f docker-compose.deploy.yml restart backend
```

### Stop Services
```bash
docker-compose -f docker-compose.deploy.yml stop
```

### Start Services (after stop)
```bash
docker-compose -f docker-compose.deploy.yml start
```

### Remove Everything (DESTRUCTIVE)
```bash
# Keep volumes (data preserved)
docker-compose -f docker-compose.deploy.yml down

# Remove volumes too (DATA LOSS)
docker-compose -f docker-compose.deploy.yml down -v
```

---

## 🔑 Default Access

### Service URLs (localhost)
- Frontend: http://localhost:8080
- Backend API: http://localhost:8000
- Database: localhost:3307

### Default Accounts
| Role    | Email                | Password |
|---------|---------------------|----------|
| Admin   | admin@galaxy.vn     | password |
| Manager | manager@galaxy.vn   | password |
| Staff   | staff@galaxy.vn     | password |

**⚠️ CHANGE THESE PASSWORDS IMMEDIATELY!**

---

## 🔧 Database Access

### MySQL CLI
```bash
docker exec -it galaxy_cinema_db mysql -uroot -p galaxy_cinema
```

### Backup Database
```bash
docker exec galaxy_cinema_db mysqldump -uroot -p galaxy_cinema > backup_$(date +%Y%m%d).sql
```

### Restore Database
```bash
docker exec -i galaxy_cinema_db mysql -uroot -p galaxy_cinema < backup.sql
```

---

## 🐛 Troubleshooting

### Backend not starting
```bash
# Check logs
docker-compose -f docker-compose.deploy.yml logs backend

# Common fix: DB_HOST must be 'db' not 'localhost'
grep DB_HOST backend/.env  # Should show: DB_HOST=db
```

### Frontend can't reach backend
```bash
# Check VITE_API_URL in .env
grep VITE_API_URL .env

# Should point to your backend (e.g., http://your-ip:8000)
# Then rebuild frontend
docker-compose -f docker-compose.deploy.yml up -d --build frontend
```

### Database connection failed
```bash
# Check if DB is healthy
docker-compose -f docker-compose.deploy.yml ps

# Check DB logs
docker-compose -f docker-compose.deploy.yml logs db

# Ensure password matches in both .env files
grep MYSQL_ROOT_PASSWORD .env
grep DB_PASSWORD backend/.env
```

### Port already in use
```bash
# Change ports in .env
# Then restart
docker-compose -f docker-compose.deploy.yml up -d
```

---

## 📚 Documentation

- **Full Guide**: AWS_DEPLOYMENT_GUIDE.md
- **Review Report**: DEPLOYMENT_REVIEW.md
- **Validation**: ./check_deployment.sh

---

## ✅ Production Checklist

- [ ] Copy .env.deploy.example to .env
- [ ] Update MYSQL_ROOT_PASSWORD
- [ ] Update VITE_API_URL to production URL
- [ ] Update backend/.env (DB_HOST=db, JWT_SECRET)
- [ ] Run ./check_deployment.sh
- [ ] Deploy with docker-compose
- [ ] Change all default passwords
- [ ] Test registration, login, booking
- [ ] Configure SSL/HTTPS
- [ ] Set up database backups

---

**Need Help?** Check AWS_DEPLOYMENT_GUIDE.md for detailed instructions.

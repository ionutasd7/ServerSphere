# Deploying Windows Server Management Application on Debian 12

This guide will walk you through deploying the Windows Server Management application on a Debian 12 server.

## Prerequisites

- Debian 12 server with root or sudo access
- At least 2GB RAM and 10GB disk space
- Network access to your Windows Servers for WinRM connections
- Domain name (optional, for SSL setup)

## Step 1: System Update and Dependencies

Update your system and install essential packages:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget gnupg2 software-properties-common apt-transport-https ca-certificates git nginx
```

## Step 2: Install Node.js 20

Install Node.js 20 using NodeSource repository:

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
```

Verify installation:
```bash
node --version  # Should show v20.x.x
npm --version   # Should show 10.x.x
```

## Step 3: Install PostgreSQL

Install PostgreSQL 15:

```bash
sudo apt install -y postgresql postgresql-contrib
sudo systemctl start postgresql
sudo systemctl enable postgresql
```

Create database and user:

```bash
sudo -u postgres psql
```

In the PostgreSQL prompt:
```sql
CREATE DATABASE winserver_mgmt;
CREATE USER winserver_app WITH ENCRYPTED PASSWORD 'your_secure_password';
GRANT ALL PRIVILEGES ON DATABASE winserver_mgmt TO winserver_app;
ALTER USER winserver_app CREATEDB;
\q
```

## Step 4: Create Application User

Create a dedicated user for the application:

```bash
sudo adduser --system --group --home /opt/winserver-mgmt winserver
sudo usermod -aG winserver winserver
```

## Step 5: Deploy Application Code

Clone or upload your application code:

```bash
sudo mkdir -p /opt/winserver-mgmt
sudo chown winserver:winserver /opt/winserver-mgmt

# If using git:
sudo -u winserver git clone https://github.com/your-repo/winserver-mgmt.git /opt/winserver-mgmt

# Or copy your files to /opt/winserver-mgmt
```

Install dependencies and build:

```bash
cd /opt/winserver-mgmt
sudo -u winserver npm install
sudo -u winserver npm run build
```

## Step 6: Environment Configuration

Create environment file:

```bash
sudo -u winserver touch /opt/winserver-mgmt/.env
```

Add the following content to `.env`:

```env
# Database Configuration
DATABASE_URL=postgresql://winserver_app:your_secure_password@localhost:5432/winserver_mgmt
PGHOST=localhost
PGPORT=5432
PGUSER=winserver_app
PGPASSWORD=your_secure_password
PGDATABASE=winserver_mgmt

# Application Configuration
NODE_ENV=production
PORT=3000
SESSION_SECRET=your_very_long_random_session_secret_here

# Optional: Logging
LOG_LEVEL=info
```

Generate a secure session secret:
```bash
openssl rand -base64 32
```

Set proper permissions:
```bash
sudo chmod 600 /opt/winserver-mgmt/.env
sudo chown winserver:winserver /opt/winserver-mgmt/.env
```

## Step 7: Database Migration

Run database migrations:

```bash
cd /opt/winserver-mgmt
sudo -u winserver npm run db:push
```

## Step 8: Create Systemd Service

Create service file:

```bash
sudo tee /etc/systemd/system/winserver-mgmt.service > /dev/null << 'EOF'
[Unit]
Description=Windows Server Management Application
After=network.target postgresql.service
Requires=postgresql.service

[Service]
Type=simple
User=winserver
Group=winserver
WorkingDirectory=/opt/winserver-mgmt
Environment=NODE_ENV=production
EnvironmentFile=/opt/winserver-mgmt/.env
ExecStart=/usr/bin/npm run start
Restart=always
RestartSec=10
StandardOutput=syslog
StandardError=syslog
SyslogIdentifier=winserver-mgmt

# Security settings
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/opt/winserver-mgmt

[Install]
WantedBy=multi-user.target
EOF
```

Enable and start the service:

```bash
sudo systemctl daemon-reload
sudo systemctl enable winserver-mgmt
sudo systemctl start winserver-mgmt
```

Check status:
```bash
sudo systemctl status winserver-mgmt
```

## Step 9: Configure Nginx Reverse Proxy

Create Nginx configuration:

```bash
sudo tee /etc/nginx/sites-available/winserver-mgmt > /dev/null << 'EOF'
server {
    listen 80;
    server_name your-domain.com;  # Replace with your domain or server IP

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header Referrer-Policy "no-referrer-when-downgrade" always;
    add_header Content-Security-Policy "default-src 'self' http: https: data: blob: 'unsafe-inline'" always;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types
        text/plain
        text/css
        text/xml
        text/javascript
        application/javascript
        application/xml+rss
        application/json;

    # Main application
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 86400;
    }

    # WebSocket support for Socket.IO
    location /socket.io/ {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Static files caching
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
EOF
```

Enable the site:

```bash
sudo ln -s /etc/nginx/sites-available/winserver-mgmt /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## Step 10: SSL Configuration (Optional but Recommended)

Install Certbot for Let's Encrypt SSL:

```bash
sudo apt install -y snapd
sudo snap install core; sudo snap refresh core
sudo snap install --classic certbot
sudo ln -s /snap/bin/certbot /usr/bin/certbot
```

Obtain SSL certificate:

```bash
sudo certbot --nginx -d your-domain.com
```

Auto-renewal is configured automatically. Test it:
```bash
sudo certbot renew --dry-run
```

## Step 11: Firewall Configuration

Configure UFW firewall:

```bash
sudo ufw allow ssh
sudo ufw allow 'Nginx Full'
sudo ufw --force enable
```

## Step 12: Monitoring and Logs

View application logs:
```bash
# System logs
sudo journalctl -u winserver-mgmt -f

# Nginx logs
sudo tail -f /var/log/nginx/access.log
sudo tail -f /var/log/nginx/error.log
```

Monitor system resources:
```bash
htop
sudo systemctl status winserver-mgmt postgresql nginx
```

## Step 13: Maintenance Tasks

### Backup Database

Create backup script:
```bash
sudo tee /opt/winserver-mgmt/backup.sh > /dev/null << 'EOF'
#!/bin/bash
BACKUP_DIR="/opt/backups/winserver-mgmt"
DATE=$(date +%Y%m%d_%H%M%S)

mkdir -p $BACKUP_DIR
pg_dump -h localhost -U winserver_app winserver_mgmt > $BACKUP_DIR/backup_$DATE.sql
find $BACKUP_DIR -name "backup_*.sql" -mtime +7 -delete
EOF

sudo chmod +x /opt/winserver-mgmt/backup.sh
sudo chown winserver:winserver /opt/winserver-mgmt/backup.sh
```

Add to crontab for daily backups:
```bash
sudo -u winserver crontab -e
# Add this line:
0 2 * * * /opt/winserver-mgmt/backup.sh
```

### Update Application

```bash
cd /opt/winserver-mgmt
sudo systemctl stop winserver-mgmt
sudo -u winserver git pull  # Or upload new files
sudo -u winserver npm install
sudo -u winserver npm run build
sudo -u winserver npm run db:push  # Update database if needed
sudo systemctl start winserver-mgmt
```

## Troubleshooting

### Common Issues

1. **Service won't start**: Check logs with `sudo journalctl -u winserver-mgmt -n 50`
2. **Database connection issues**: Verify PostgreSQL is running and credentials are correct
3. **Nginx 502 errors**: Ensure the Node.js app is running on port 3000
4. **Permission issues**: Check file ownership and permissions in `/opt/winserver-mgmt`

### Health Checks

```bash
# Check if application is responding
curl http://localhost:3000/api/servers

# Check database connection
sudo -u postgres psql -d winserver_mgmt -c "SELECT version();"

# Check all services
sudo systemctl status postgresql nginx winserver-mgmt
```

## Security Considerations

1. **Keep system updated**: `sudo apt update && sudo apt upgrade` regularly
2. **Use strong passwords**: For database and session secrets
3. **Configure fail2ban**: To prevent brute force attacks
4. **Regular backups**: Automated daily database backups
5. **Monitor logs**: Check for unusual activity
6. **Network security**: Ensure WinRM connections use proper authentication
7. **User permissions**: Run application with minimal required privileges

## Windows Server Requirements

Ensure your Windows Servers have:
- WinRM enabled and configured
- Proper firewall rules for WinRM (ports 5985/5986)
- PowerShell remoting enabled
- Domain/local accounts with appropriate permissions

Your Windows Server Management application should now be running securely on Debian 12!

# AWS Trial Setup (Fresh)

This guide removes old AWS linkage and sets up a fresh EC2 deployment for this project.

## 1) AWS Account Basics
1. Log in to AWS Console with your new trial account.
2. Choose one region and keep everything there (example: `ap-south-1`).
3. Create billing alarm to avoid surprise charges.

## 2) Create EC2 Instance
1. EC2 -> Launch Instance.
2. Name: `lucent-app-prod`.
3. AMI: Ubuntu 22.04 LTS.
4. Instance type: `t2.micro` (free-tier eligible in most regions).
5. Key pair: create new key (do not commit this file to git).
6. Security group inbound rules:
- SSH: `22` (your IP only)
- HTTP: `80` (0.0.0.0/0)
- HTTPS: `443` (0.0.0.0/0)
- App port (optional): `3000` (your IP only, temporary)
- API port (optional): `5000` (your IP only, temporary)

## 3) Connect and Install Runtime
Run these commands on EC2:

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git nginx
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pm2
```

## 4) Deploy Code
```bash
sudo mkdir -p /var/www
sudo chown -R $USER:$USER /var/www
cd /var/www
git clone https://github.com/ankurkushwaha809/-KUREMEDI-LUCENT-Project.git lucent-app
cd lucent-app
```

## 5) Backend Setup
```bash
cd /var/www/lucent-app/backend
npm install
cp .env.example .env  # if available; else create .env manually
pm2 start index.js --name lucent-backend
pm2 save
```

Use your new environment values in `backend/.env` (Mongo, JWT, Twilio, Razorpay, etc.).

## 6) Website Setup (Next.js)
```bash
cd /var/www/lucent-app/Frontend/website
npm install
npm run build
pm2 start npm --name lucent-website -- start
pm2 save
```

## 6b) Admin Setup (Vite + React)
```bash
cd /var/www/lucent-app/Frontend/admin
npm install
npm run build
pm2 start npm --name lucent-admin -- start
pm2 save
```

## 7) Nginx Reverse Proxy
Create `/etc/nginx/sites-available/lucent-app`:

```nginx
server {
  listen 80;
  server_name _;

  location /api/ {
    proxy_pass http://127.0.0.1:5000/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location /admin/ {
    proxy_pass http://127.0.0.1:3008/;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }

  location / {
    proxy_pass http://127.0.0.1:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection 'upgrade';
    proxy_set_header Host $host;
    proxy_cache_bypass $http_upgrade;
  }
}
```

Enable and restart:

```bash
sudo ln -sf /etc/nginx/sites-available/lucent-app /etc/nginx/sites-enabled/lucent-app
sudo nginx -t
sudo systemctl restart nginx
```

## 8) Optional HTTPS (Recommended)
```bash
sudo apt install -y certbot python3-certbot-nginx
sudo certbot --nginx -d <your-domain>
```

## 9) Re-enable GitHub Auto Deploy (Optional)
Old workflow was removed. If you want CI deploy again, create a new workflow and set GitHub secrets:
- `EC2_HOST`
- `EC2_USER`
- `EC2_SSH_KEY`

## 10) Final Verification
- `pm2 list` (should show lucent-backend, lucent-website, lucent-admin)
- `curl http://127.0.0.1:5000/api/health` (or your API test route)
- Open website domain in browser
- Open `https://your-domain/admin/` to verify admin is running

## Security Notes
- Never commit `.env` files or `.pem` keys.
- Rotate any previously exposed credentials immediately.

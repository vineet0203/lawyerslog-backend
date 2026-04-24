#!/bin/bash
echo "🚀 Deploying backend..."
cd /var/www/lawyerslog-backend
git stash
git pull origin main
npm install
pm2 restart lawyerslog-backend
echo "✅ Backend deployed!"

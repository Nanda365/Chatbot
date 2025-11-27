# Deployment Guide

This guide covers various deployment options for the AI Support Platform frontend.

## Prerequisites

- Backend API deployed and accessible
- Environment variables configured
- Production build tested locally

## Environment Variables

Before deploying, ensure these environment variables are set:

```env
VITE_API_BASE_URL=https://your-backend-api.com
```

## Docker Deployment

### Building the Image

```bash
docker build -t ai-support-frontend:latest .
```

### Running Locally

```bash
docker run -p 80:80 \
  -e VITE_API_BASE_URL=http://localhost:3000 \
  ai-support-frontend:latest
```

### Deploying to Docker Hub

```bash
# Tag the image
docker tag ai-support-frontend:latest username/ai-support-frontend:latest

# Push to Docker Hub
docker push username/ai-support-frontend:latest
```

### Running in Production

```bash
docker run -d \
  -p 80:80 \
  --name ai-support-frontend \
  -e VITE_API_BASE_URL=https://api.yourcompany.com \
  --restart unless-stopped \
  username/ai-support-frontend:latest
```

## Vercel Deployment

### Quick Deploy

1. Install Vercel CLI:
```bash
npm i -g vercel
```

2. Deploy:
```bash
vercel
```

3. Follow the prompts to link your project

### Environment Variables

Add in Vercel dashboard under Settings > Environment Variables:
- `VITE_API_BASE_URL` - Your backend API URL

### Custom Domain

1. Go to Settings > Domains
2. Add your custom domain
3. Follow DNS configuration instructions

## Netlify Deployment

### Using Netlify CLI

1. Install Netlify CLI:
```bash
npm i -g netlify-cli
```

2. Initialize:
```bash
netlify init
```

3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`

4. Deploy:
```bash
netlify deploy --prod
```

### Using Git Integration

1. Push code to GitHub/GitLab
2. Connect repository in Netlify dashboard
3. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
4. Add environment variables in dashboard

### Environment Variables

Add in Netlify dashboard under Site settings > Environment variables:
- `VITE_API_BASE_URL` - Your backend API URL

## AWS S3 + CloudFront

### Build the Application

```bash
npm run build
```

### Deploy to S3

1. Create S3 bucket:
```bash
aws s3 mb s3://ai-support-frontend
```

2. Enable static website hosting:
```bash
aws s3 website s3://ai-support-frontend/ \
  --index-document index.html \
  --error-document index.html
```

3. Upload files:
```bash
aws s3 sync dist/ s3://ai-support-frontend/ \
  --delete \
  --cache-control max-age=31536000
```

4. Set bucket policy for public access

### CloudFront Configuration

1. Create CloudFront distribution
2. Set origin to S3 bucket
3. Configure error pages (404 → /index.html)
4. Set up SSL certificate
5. Configure caching behavior

## Nginx Deployment

### Build Application

```bash
npm run build
```

### Nginx Configuration

Create `/etc/nginx/sites-available/ai-support`:

```nginx
server {
    listen 80;
    server_name yourdomain.com;
    root /var/www/ai-support/dist;
    index index.html;

    # Gzip compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript text/xml application/xml application/xml+rss text/javascript;

    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Security headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
}
```

### Enable Site

```bash
ln -s /etc/nginx/sites-available/ai-support /etc/nginx/sites-enabled/
nginx -t
systemctl reload nginx
```

### SSL with Let's Encrypt

```bash
certbot --nginx -d yourdomain.com
```

## CI/CD with GitHub Actions

Create `.github/workflows/deploy.yml`:

```yaml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v3
      
      - name: Setup Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '20'
          
      - name: Install dependencies
        run: npm ci
        
      - name: Run tests
        run: npm test
        
      - name: Build
        run: npm run build
        env:
          VITE_API_BASE_URL: ${{ secrets.API_BASE_URL }}
          
      - name: Deploy to Vercel
        uses: amondnet/vercel-action@v20
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.ORG_ID }}
          vercel-project-id: ${{ secrets.PROJECT_ID }}
```

## Production Checklist

Before deploying to production:

- [ ] Environment variables configured
- [ ] Backend API accessible and CORS configured
- [ ] All tests passing
- [ ] Build succeeds without errors
- [ ] Security headers configured
- [ ] SSL certificate installed
- [ ] Error tracking setup (Sentry, etc.)
- [ ] Analytics configured (if needed)
- [ ] Performance monitoring setup
- [ ] Backup strategy in place

## Monitoring

### Recommended Tools

- **Uptime**: UptimeRobot, Pingdom
- **Error Tracking**: Sentry, LogRocket
- **Analytics**: Google Analytics, Plausible
- **Performance**: Lighthouse CI, WebPageTest

### Health Check

Create a simple health check endpoint that verifies:
- Application loads
- Backend API is reachable
- Critical assets load correctly

## Rollback Strategy

### Docker

```bash
# Tag current version
docker tag ai-support-frontend:latest ai-support-frontend:v1.0.0

# Rollback
docker run -d ai-support-frontend:v0.9.0
```

### Vercel/Netlify

Both platforms keep deployment history and allow instant rollback via dashboard.

## Performance Optimization

### Pre-deployment

- [ ] Run Lighthouse audit
- [ ] Optimize images
- [ ] Enable code splitting
- [ ] Configure CDN caching
- [ ] Minify assets
- [ ] Enable Brotli compression

### Post-deployment

- Monitor Core Web Vitals
- Check bundle size
- Verify caching headers
- Test loading speed from different regions

## Troubleshooting

### Build Fails

- Clear node_modules and reinstall
- Check Node.js version compatibility
- Verify environment variables

### Blank Page After Deployment

- Check browser console for errors
- Verify API URL is correct
- Check CORS configuration on backend
- Verify build artifacts are correct

### Authentication Issues

- Verify JWT token storage
- Check API endpoint URLs
- Confirm backend authentication is working

## Support

For deployment issues:
1. Check application logs
2. Review browser console
3. Verify backend connectivity
4. Check deployment platform status page

---

For additional help, consult platform-specific documentation or open an issue.

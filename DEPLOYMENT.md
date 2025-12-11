# Deployment Guide

## Deploy to Vercel

This application is configured for deployment on Vercel, which supports full-stack Node.js applications.

### Prerequisites

1. A Vercel account (sign up at https://vercel.com)
2. GitHub account with this repository
3. MySQL database (TiDB Cloud recommended for serverless)

### Step 1: Import Project to Vercel

1. Go to https://vercel.com/new
2. Click "Import Git Repository"
3. Select your GitHub account and choose `smart-lifestyle-assistant` repository
4. Click "Import"

### Step 2: Configure Project Settings

In the Vercel project configuration:

- **Framework Preset**: Other
- **Build Command**: `pnpm run build`
- **Output Directory**: `dist/public`
- **Install Command**: `pnpm install`

### Step 3: Configure Environment Variables

Add the following environment variables in Vercel dashboard (Settings → Environment Variables):

#### Required Variables

```
NODE_ENV=production

# Database Configuration
DATABASE_HOST=your-database-host
DATABASE_PORT=4000
DATABASE_USER=your-database-user
DATABASE_PASSWORD=your-database-password
DATABASE_NAME=your-database-name

# OAuth Configuration (Manus OAuth)
VITE_OAUTH_PORTAL_URL=https://oauth.manus.im
VITE_APP_ID=your-app-id
OAUTH_CLIENT_ID=your-oauth-client-id
OAUTH_CLIENT_SECRET=your-oauth-client-secret

# App Configuration
VITE_APP_TITLE=Smart Lifestyle Assistant
VITE_APP_LOGO=

# Optional: Analytics
VITE_ANALYTICS_ENDPOINT=
VITE_ANALYTICS_WEBSITE_ID=
```

### Step 4: Database Setup

1. Create a MySQL/TiDB database
2. Run database migrations:
   ```bash
   pnpm run db:push
   ```

### Step 5: Deploy

1. Click "Deploy" in Vercel dashboard
2. Wait for the build to complete
3. Your app will be available at `https://your-project.vercel.app`

### Troubleshooting

#### Build Errors

- Check that all environment variables are set correctly
- Verify database connection is accessible from Vercel's servers
- Review build logs in Vercel dashboard

#### Runtime Errors

- Check function logs in Vercel dashboard
- Verify OAuth callback URL is configured correctly
- Ensure database migrations are applied

### Local Development

To run locally:

```bash
# Install dependencies
pnpm install

# Set up environment variables
cp .env.example .env
# Edit .env with your configuration

# Run database migrations
pnpm run db:push

# Start development server
pnpm run dev
```

### Alternative Deployment Options

This application can also be deployed to:

- **Railway**: Full-stack deployment with built-in database
- **Render**: Web services with PostgreSQL support
- **Self-hosted**: Any server with Node.js 22+ and MySQL

For GitHub Pages deployment (static frontend only), see the GitHub Actions workflow in `.github/workflows/deploy.yml`. Note that this will not include backend functionality.

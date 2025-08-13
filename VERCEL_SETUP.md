# Vercel Deployment Setup

## Overview

This project now uses a simplified Express-based API for Vercel deployment, which eliminates the need for TypeScript compilation and complex module resolution issues.

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### Database Configuration (Optional for basic functionality)
```
POSTGRES_HOST=your-postgres-host
POSTGRES_PORT=5432
POSTGRES_USER=your-postgres-user
POSTGRES_PASSWORD=your-postgres-password
POSTGRES_DB=your-postgres-database
```

### JWT Secret (if using authentication)
```
JWT_SECRET=your-jwt-secret-key
```

### Google AI API Key (if using AI services)
```
GOOGLE_AI_API_KEY=your-google-ai-api-key
```

## Deployment Steps

1. **Set Environment Variables**: Add the above environment variables in your Vercel project settings (optional for basic functionality)
2. **Deploy**: Push your code to trigger deployment
3. **Test**: Visit your Vercel URL to test the API

## Troubleshooting

### Module Resolution Error
If you get "Cannot find module" errors:
1. **Check Dependencies**: Ensure all required packages are in package.json
2. **Check Vercel Logs**: Look for import errors in the Vercel function logs
3. **Environment Variables**: Ensure all required environment variables are set

### 404 Error
If you get a 404 error:
1. Check that all environment variables are set correctly
2. Verify the API endpoints are being called correctly
3. Check the Vercel function logs for errors

### Build Issues
If the deployment fails:
1. Check that all dependencies are installed
2. Verify the api/index.js file is properly formatted
3. Check Vercel deployment logs for specific errors

## API Endpoints

- `GET /` - Health check
- `POST /analizar-web` - Basic web analysis
- `POST /analizar-web-avanzado` - Advanced web analysis
- `POST /analizar-estructura-web` - Website structure analysis

## Architecture

This deployment uses:
- **Express.js** for the API framework
- **CORS** for cross-origin requests
- **Vercel Functions** for serverless deployment
- **No TypeScript compilation** required for deployment 
# Vercel Deployment Setup

## Environment Variables Required

Add these environment variables in your Vercel project settings:

### Database Configuration
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

1. **Set Environment Variables**: Add the above environment variables in your Vercel project settings
2. **Deploy**: Push your code to trigger deployment
3. **Test**: Visit your Vercel URL to test the API

## Troubleshooting

### Module Resolution Error
If you get "Cannot find module '../dist/app/app.module'":

1. **Check Build Process**: Ensure the build command runs successfully
2. **Verify dist Directory**: Make sure `dist/app/app.module.js` exists after build
3. **Check Vercel Logs**: Look for build errors in the Vercel deployment logs
4. **Environment Variables**: Ensure all required environment variables are set

### 404 Error
If you get a 404 error:
1. Check that all environment variables are set correctly
2. Verify the database connection is working
3. Check the Vercel function logs for errors

### Build Issues
If the build fails:
1. Run `npm run build` locally to test
2. Check that all dependencies are installed
3. Verify TypeScript configuration is correct

## API Endpoints

- `GET /` - Health check
- `POST /analizar-web` - Basic web analysis
- `POST /analizar-web-avanzado` - Advanced web analysis
- `POST /analizar-estructura-web` - Website structure analysis 
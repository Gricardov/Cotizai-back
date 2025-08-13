# Vercel Deployment Setup - Express.js

## Migration Complete ✅

The application has been successfully migrated from NestJS to Express.js to resolve compatibility issues with Vercel deployment.

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

### JWT Secret (for authentication)
```
JWT_SECRET=your-jwt-secret-key
```

### Google AI API Key (for AI services)
```
GOOGLE_AI_API_KEY=your-google-ai-api-key
GEMINI_API_KEY=your-gemini-api-key
```

## Deployment Steps

1. **Set Environment Variables**: Add the above environment variables in your Vercel project settings
2. **Deploy**: Push your code to trigger deployment
3. **Test**: Visit your Vercel URL to test the API

## Vercel Configuration

The application is configured to work with Vercel using:
- **Entry Point**: `api/index.js`
- **Build Command**: `npm run build`
- **Node Version**: 18.x

## Complete API Endpoints

### Health Check
- `GET /` - Health check endpoint

### Authentication Endpoints
- `POST /auth/login` - User login
- `POST /auth/register` - User registration
- `GET /auth/profile` - Get user profile (requires auth)
- `GET /auth/validate` - Validate JWT token (requires auth)

### Web Analysis (Public)
- `POST /analizar-web` - Basic web analysis (with 3-second simulation)
- `POST /analizar-web-avanzado` - Advanced web analysis with AI
- `POST /analizar-estructura-web` - Website structure analysis with AI

### Web Analysis (Authenticated)
- `POST /auth/analizar-web` - Basic web analysis (authenticated)
- `POST /auth/analizar-web-avanzado` - Advanced web analysis with AI (authenticated)
- `POST /auth/analizar-estructura-web` - Website structure analysis with AI (authenticated)

### Project Management (Public)
- `POST /generar-descripcion-proyecto` - Generate project descriptions
- `POST /analizar-tiempo-desarrollo` - Analyze development time with AI
- `POST /mejorar-requerimientos` - Improve technical requirements with AI

### Project Management (Authenticated)
- `POST /auth/generar-descripcion-proyecto` - Generate project descriptions (authenticated)
- `POST /auth/analizar-tiempo-desarrollo` - Analyze development time with AI (authenticated)
- `POST /auth/mejorar-requerimientos` - Improve technical requirements with AI (authenticated)

### Operations Management (Authenticated)
- `GET /auth/operaciones` - Get operations with pagination (requires auth)
- `GET /auth/areas` - Get available areas (requires auth)
- `POST /auth/operaciones` - Create operation (requires admin)
- `POST /auth/guardar-cotizacion` - Save quotation (requires auth)
- `GET /auth/operaciones/:id` - Get operation by ID (requires admin)
- `PUT /auth/operaciones/:id` - Update operation (requires admin)
- `DELETE /auth/operaciones/:id` - Delete operation (requires admin)

### Time Analysis
- `POST /analizar-tiempo` - Project time analysis (alternative endpoint)

## Request Examples

### Authentication
```bash
# Login
curl -X POST https://your-vercel-url.vercel.app/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username": "admin", "password": "12345", "area": "Administración"}'

# Register
curl -X POST https://your-vercel-url.vercel.app/auth/register \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nuevo Usuario", "username": "nuevo", "password": "12345", "rol": "cotizador", "area": "Comercial"}'

# Get Profile (requires Bearer token)
curl -X GET https://your-vercel-url.vercel.app/auth/profile \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Operations Management
```bash
# Get Operations (requires Bearer token)
curl -X GET "https://your-vercel-url.vercel.app/auth/operaciones?pagina=1&porPagina=9&area=todas" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"

# Save Quotation (requires Bearer token)
curl -X POST https://your-vercel-url.vercel.app/auth/guardar-cotizacion \
  -H "Authorization: Bearer YOUR_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Cotización ABC", "data": {"empresa": "ABC Corp", "proyecto": "Sitio web"}}'

# Create Operation (requires admin token)
curl -X POST https://your-vercel-url.vercel.app/auth/operaciones \
  -H "Authorization: Bearer ADMIN_JWT_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"nombre": "Nueva Operación", "fecha": "2024-01-01", "estado": "en_revision", "area": "Comercial"}'
```

### Web Analysis
```bash
# Generate Project Description
curl -X POST https://your-vercel-url.vercel.app/generar-descripcion-proyecto \
  -H "Content-Type: application/json" \
  -d '{"rubro": "Inmobiliario", "servicio": "Landing"}'

# Analyze Development Time
curl -X POST https://your-vercel-url.vercel.app/analizar-tiempo-desarrollo \
  -H "Content-Type: application/json" \
  -d '{"tiempoDesarrollo": "3 meses para completar el proyecto"}'

# Improve Requirements
curl -X POST https://your-vercel-url.vercel.app/mejorar-requerimientos \
  -H "Content-Type: application/json" \
  -d '{"requerimientos": "que se vea bonito y atractivo", "rubro": "Retail", "servicio": "E-Commerce"}'

# Advanced Web Analysis
curl -X POST https://your-vercel-url.vercel.app/analizar-web-avanzado \
  -H "Content-Type: application/json" \
  -d '{"url": "https://example.com", "rubro": "Inmobiliario", "servicio": "Landing", "tipo": "Renovación"}'
```

## Default Users

The system comes with default users for testing:

### Admin User
- **Username**: `admin`
- **Password**: `12345`
- **Role**: `admin`
- **Area**: `Administración`

### Cotizador User
- **Username**: `cotizador`
- **Password**: `12345`
- **Role**: `cotizador`
- **Area**: `Comercial`

## Authentication Flow

1. **Login**: POST `/auth/login` with username, password, and area
2. **Get Token**: Response includes `access_token` JWT
3. **Use Token**: Include `Authorization: Bearer YOUR_TOKEN` in subsequent requests
4. **Validate**: GET `/auth/validate` to check token validity

## Troubleshooting

### Module Resolution Error
If you get "Cannot find module" errors:
1. **Check Build Process**: Ensure the build command runs successfully
2. **Verify dist Directory**: Make sure `dist/main.js` exists after build
3. **Check Vercel Logs**: Look for build errors in the Vercel deployment logs

### 404 Error
If you get a 404 error:
1. Check that all environment variables are set correctly
2. Verify the database connection is working
3. Check the Vercel function logs for errors

### Authentication Errors
If you get authentication errors:
1. Verify JWT_SECRET is set in environment variables
2. Check that the token is being sent correctly in Authorization header
3. Ensure the token hasn't expired (24h default)

### Build Issues
If the build fails:
1. Run `npm run build` locally to test
2. Check that all dependencies are installed
3. Verify TypeScript configuration is correct

### Vercel Deployment Issues
If Vercel deployment fails:
1. Check that `api/index.js` exists and is properly configured
2. Verify `vercel.json` points to the correct entry point
3. Ensure all environment variables are set in Vercel dashboard

## Changes Made

- ✅ Migrated from NestJS to Express.js
- ✅ Removed NestJS dependencies and decorators
- ✅ Updated all controllers to Express routes
- ✅ Preserved ALL existing functionality
- ✅ Fixed Node.js compatibility issues
- ✅ Updated Vercel configuration for Express
- ✅ Added ALL missing endpoints from original controller
- ✅ Included helper functions for project descriptions
- ✅ Maintained error handling and fallback mechanisms
- ✅ Added complete authentication system with JWT
- ✅ Added operations management system
- ✅ Added middleware for authentication and admin authorization
- ✅ Created in-memory services for users and operations
- ✅ Added default users for testing
- ✅ Implemented proper error handling for all endpoints
- ✅ Created `api/index.js` for Vercel deployment
- ✅ Updated `vercel.json` configuration
- ✅ Modified main.ts to work with Vercel imports 
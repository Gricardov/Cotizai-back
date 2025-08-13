const { NestFactory } = require('@nestjs/core');

// Import the compiled NestJS application
let AppModule;
try {
  AppModule = require('../dist/app/app.module').AppModule;
} catch (error) {
  console.error('Failed to import AppModule from dist:', error);
  // Fallback: try to import from src (for development)
  try {
    AppModule = require('../src/app/app.module').AppModule;
  } catch (error2) {
    console.error('Failed to import AppModule from src:', error2);
    throw new Error('Could not import AppModule from any location');
  }
}

let app;

async function bootstrap() {
  if (!app) {
    try {
      app = await NestFactory.create(AppModule);
      
      // Enable CORS
      app.enableCors({
        origin: '*',
        credentials: true,
      });
      
      await app.init();
      console.log('NestJS app initialized successfully');
    } catch (error) {
      console.error('Failed to initialize NestJS app:', error);
      console.error('Error details:', {
        message: error.message,
        code: error.code,
        stack: error.stack
      });
      throw error;
    }
  }
  return app;
}

module.exports = async (req, res) => {
  try {
    const app = await bootstrap();
    const expressInstance = app.getHttpAdapter().getInstance();
    
    // Forward the request to the NestJS app
    expressInstance(req, res);
  } catch (error) {
    console.error('Error in Vercel function:', error);
    
    // Return a proper error response
    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message,
      code: error.code,
      timestamp: new Date().toISOString()
    });
  }
}; 
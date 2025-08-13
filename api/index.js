const { NestFactory } = require('@nestjs/core');
const { AppModule } = require('../dist/app/app.module');

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
      timestamp: new Date().toISOString()
    });
  }
}; 
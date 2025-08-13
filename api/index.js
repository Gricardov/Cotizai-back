let app;

try {
  console.log('Attempting to load dist/main.js...');
  
  // Try to load the compiled Express app
  const mainModule = require('../dist/main.js');
  console.log('Main module loaded successfully:', typeof mainModule);
  
  app = mainModule.default;
  console.log('Express app loaded successfully:', typeof app);
  
} catch (error) {
  console.error('Error loading app from dist/main.js:', error);
  console.error('Error details:', {
    message: error.message,
    code: error.code,
    stack: error.stack
  });
  
  // Fallback: create a basic Express app
  const express = require('express');
  const cors = require('cors');
  
  app = express();
  
  app.use(cors({
    origin: '*',
    credentials: true,
  }));
  app.use(express.json());
  
  // Basic health check
  app.get('/', (req, res) => {
    res.json({ 
      message: 'CotizAI API is running (fallback mode)',
      error: 'Build files not found, using fallback server',
      details: error.message
    });
  });
  
  // Catch-all route
  app.all('*', (req, res) => {
    res.status(404).json({ 
      error: 'Endpoint not found',
      message: 'Build files not available, please check deployment',
      path: req.path,
      method: req.method
    });
  });
}

// Export the Express app directly for Vercel
module.exports = app; 
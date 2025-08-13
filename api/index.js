const express = require('express');
const cors = require('cors');

const app = express();

// Enable CORS
app.use(cors({
  origin: '*',
  credentials: true,
}));

// Parse JSON bodies
app.use(express.json());

// Health check endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'CotizAI API is running',
    timestamp: new Date().toISOString(),
    status: 'healthy'
  });
});

// Basic web analysis endpoint
app.post('/analizar-web', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Simulate analysis that takes 3 seconds
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    res.json({
      analisis: `Análisis de la página web: ${url}

La estructura actual presenta oportunidades de mejora significativas que pueden impactar positivamente en la experiencia del usuario y el rendimiento comercial. Nuestro análisis preliminar identifica las siguientes áreas de optimización:

ARQUITECTURA Y NAVEGACIÓN:
• La navegación principal requiere reestructuración para mejorar la usabilidad
• Se recomienda implementar breadcrumbs para facilitar la orientación del usuario
• La jerarquía de información necesita reorganización según principios de UX moderno

DISEÑO Y EXPERIENCIA VISUAL:
• El diseño actual no refleja las últimas tendencias del sector
• Se requiere actualización de la paleta de colores y tipografías
• Los elementos visuales necesitan mayor coherencia y profesionalismo

PERFORMANCE Y OPTIMIZACIÓN:
• Los tiempos de carga pueden mejorarse significativamente
• Se requiere optimización de imágenes y recursos multimedia
• Implementación de mejores prácticas de SEO técnico

FUNCIONALIDADES RECOMENDADAS:
• Integración de formularios de contacto optimizados
• Sistema de búsqueda avanzada adaptado al sector
• Elementos interactivos que mejoren el engagement
• Compatibilidad móvil completa y responsive design

Esta renovación completa posicionará el sitio web como una herramienta competitiva y efectiva para el crecimiento del negocio.`,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in analizar-web:', error);
    res.status(500).json({
      error: 'Internal server error',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Advanced web analysis endpoint
app.post('/analizar-web-avanzado', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    res.json({
      success: true,
      data: {
        url,
        rubro,
        servicio,
        tipo,
        analysis: `Análisis avanzado para ${url} en el rubro ${rubro}`,
        recommendations: [
          'Optimización de SEO',
          'Mejora de UX/UI',
          'Optimización de performance',
          'Implementación de funcionalidades avanzadas'
        ]
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in analizar-web-avanzado:', error);
    res.status(500).json({
      success: false,
      error: 'No se pudo completar el análisis del sitio web',
      timestamp: new Date().toISOString()
    });
  }
});

// Website structure analysis endpoint
app.post('/analizar-estructura-web', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    res.json({
      success: true,
      data: {
        url,
        structure: {
          navigation: 'Análisis de navegación',
          content: 'Análisis de contenido',
          performance: 'Análisis de performance',
          seo: 'Análisis de SEO'
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error in analizar-estructura-web:', error);
    res.status(500).json({
      success: false,
      error: 'Error al analizar la estructura del sitio web',
      timestamp: new Date().toISOString()
    });
  }
});

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `The endpoint ${req.method} ${req.originalUrl} does not exist`,
    timestamp: new Date().toISOString()
  });
});

// Error handling middleware
app.use((error, req, res, next) => {
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

module.exports = app; 
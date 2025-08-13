import express from 'express';
import cors from 'cors';
import { WebCrawlerService } from './services/web-crawler.service';
import { AIWebAnalyzerService } from './services/ai-web-analyzer.service';
import { AITimeAnalyzerService } from './services/ai-time-analyzer.service';
import { AuthService } from './services/auth.service';
import { UserService, UserRole } from './services/user.service';
import { OperacionService, OperacionEstado } from './services/operacion.service';
import { authMiddleware, adminMiddleware, AuthenticatedRequest } from './middleware/auth.middleware';

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors({
  origin: '*',
  credentials: true,
}));
app.use(express.json());

// Initialize services
const webCrawlerService = new WebCrawlerService();
const aiWebAnalyzerService = new AIWebAnalyzerService();
const aiTimeAnalyzerService = new AITimeAnalyzerService();
const userService = new UserService();
const authService = new AuthService(userService);
const operacionService = new OperacionService();

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ message: 'CotizAI API is running' });
});

// ===== AUTH ENDPOINTS =====

// Login endpoint
app.post('/auth/login', async (req, res) => {
  try {
    const { username, password, area } = req.body;
    const user = await authService.validateUser(username, password);
    
    if (!user) {
      return res.status(401).json({ 
        success: false, 
        error: 'Credenciales inválidas' 
      });
    }

    const result = await authService.login(user, area);
    res.json(result);
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Register endpoint
app.post('/auth/register', async (req, res) => {
  try {
    const { nombre, username, password, rol, area } = req.body;
    const userData = {
      nombre,
      username,
      password,
      rol: rol as UserRole,
      area
    };
    
    const result = await authService.register(userData);
    res.json({
      success: true,
      user: result
    });
  } catch (error) {
    console.error('Error en registro:', error);
    res.status(400).json({ 
      success: false, 
      error: error instanceof Error ? error.message : 'Error en el registro' 
    });
  }
});

// Get profile endpoint
app.get('/auth/profile', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const profile = await authService.getProfile(req.user!.sub);
    if (!profile) {
      return res.status(404).json({ 
        success: false, 
        error: 'Usuario no encontrado' 
      });
    }
    res.json({
      success: true,
      user: profile
    });
  } catch (error) {
    console.error('Error obteniendo perfil:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Validate token endpoint
app.get('/auth/validate', authMiddleware, (req: AuthenticatedRequest, res) => {
  res.json({
    success: true,
    valid: true,
    user: {
      id: req.user!.sub,
      username: req.user!.username,
      rol: req.user!.rol,
      area: req.user!.area
    }
  });
});

// ===== AUTH WEB ANALYSIS ENDPOINTS =====

// Basic web analysis endpoint (auth)
app.post('/auth/analizar-web', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    // Simulate analysis that takes time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const analysis = `Análisis de la página web: ${url}

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

Esta renovación completa posicionará el sitio web como una herramienta competitiva y efectiva para el crecimiento del negocio.`;

    res.json({
      success: true,
      data: {
        analisis: analysis,
        timestamp: new Date().toISOString()
      }
    });
  } catch (error) {
    console.error('Error en análisis web:', error);
    res.json({
      success: false,
      data: webCrawlerService.generateFallbackAnalysis({
        url: req.body.url,
        rubro: req.body.rubro,
        servicio: req.body.servicio,
        tipo: req.body.tipo
      })
    });
  }
});

// Advanced web analysis endpoint (auth)
app.post('/auth/analizar-web-avanzado', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    const result = await webCrawlerService.analyzePage({
      url,
      rubro,
      servicio,
      tipo
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error en análisis web avanzado:', error);
    
    res.json({
      success: false,
      data: await webCrawlerService.analyzePage({
        url: req.body.url,
        rubro: req.body.rubro,
        servicio: req.body.servicio,
        tipo: req.body.tipo
      })
    });
  }
});

// Website structure analysis endpoint (auth)
app.post('/auth/analizar-estructura-web', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    const result = await aiWebAnalyzerService.analyzeWebsiteStructure({
      url,
      rubro,
      servicio,
      tipo
    });

    res.json({
      success: true,
      data: result
    });
  } catch (error) {
    console.error('Error en análisis de estructura web:', error);
    
    res.json({
      success: false,
      data: await aiWebAnalyzerService.analyzeWebsiteStructure({
        url: req.body.url,
        rubro: req.body.rubro,
        servicio: req.body.servicio,
        tipo: req.body.tipo
      })
    });
  }
});

// Generate project description endpoint (auth)
app.post('/auth/generar-descripcion-proyecto', async (req, res) => {
  try {
    const { rubro, servicio } = req.body;
    const descripcion = crearDescripcionProyecto(rubro, servicio);
    
    res.json({
      success: true,
      descripcion: descripcion
    });
  } catch (error) {
    console.error('Error generando descripción del proyecto:', error);
    
    res.json({
      success: false,
      descripcion: crearDescripcionProyecto(req.body.rubro, req.body.servicio)
    });
  }
});

// Analyze development time endpoint (auth)
app.post('/auth/analizar-tiempo-desarrollo', async (req, res) => {
  try {
    const { tiempoDesarrollo } = req.body;
    const tiempoAnalizado = await aiTimeAnalyzerService.analyzeProjectTime(tiempoDesarrollo);
    
    res.json({
      success: true,
      tiempoAnalizado
    });
  } catch (error) {
    console.error('Error analizando tiempo de desarrollo:', error);
    
    const tiempoAnalizado = aiTimeAnalyzerService.generateFallbackTimeAnalysis(req.body.tiempoDesarrollo);
    
    res.json({
      success: true,
      tiempoAnalizado
    });
  }
});

// Improve requirements endpoint (auth)
app.post('/auth/mejorar-requerimientos', async (req, res) => {
  try {
    const { requerimientos, rubro, servicio } = req.body;
    const requerimientosMejorados = await aiTimeAnalyzerService.mejorarRequerimientosTecnicos(
      requerimientos,
      rubro,
      servicio
    );
    
    res.json({
      success: true,
      requerimientosMejorados
    });
  } catch (error) {
    console.error('Error mejorando requerimientos:', error);
    
    const requerimientosMejorados = aiTimeAnalyzerService.generateFallbackRequerimientosMejorados(
      req.body.requerimientos,
      req.body.rubro,
      req.body.servicio
    );
    
    res.json({
      success: true,
      requerimientosMejorados
    });
  }
});

// ===== OPERATIONS MANAGEMENT ENDPOINTS =====

// Get operations with pagination
app.get('/auth/operaciones', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const userId = req.user!.sub;
    const pagina = parseInt(req.query.pagina as string) || 1;
    const porPagina = parseInt(req.query.porPagina as string) || 9;
    const area = (req.query.area as string) || 'todas';
    
    const result = await operacionService.getOperacionesConPaginacion(
      userId, 
      pagina, 
      porPagina, 
      area
    );
    
    res.json(result);
  } catch (error) {
    console.error('Error obteniendo operaciones:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Get areas
app.get('/auth/areas', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const areas = await operacionService.getAreasUnicas();
    res.json(areas);
  } catch (error) {
    console.error('Error obteniendo áreas:', error);
    res.json(['Comercial', 'Marketing', 'TI', 'Administración', 'Medios']);
  }
});

// Create operation (admin only)
app.post('/auth/operaciones', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { nombre, fecha, estado, area } = req.body;
    const operacionData = {
      nombre,
      fecha: new Date(fecha),
      estado: estado as OperacionEstado,
      userId: req.user!.sub,
      area: area || req.user!.area
    };
    
    const result = await operacionService.createOperacion(operacionData);
    res.json({
      success: true,
      operacion: result
    });
  } catch (error) {
    console.error('Error creando operación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Save quotation
app.post('/auth/guardar-cotizacion', authMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const { nombre, data } = req.body;
    const cotizacionData = {
      nombre,
      userId: req.user!.sub,
      area: req.user!.area,
      data
    };
    
    const result = await operacionService.createCotizacion(cotizacionData);
    res.json({
      success: true,
      cotizacion: result
    });
  } catch (error) {
    console.error('Error guardando cotización:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Get operation by ID (admin only)
app.get('/auth/operaciones/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const operacion = await operacionService.getOperacionById(id);
    
    if (!operacion) {
      return res.status(404).json({ 
        success: false, 
        error: 'Operación no encontrada' 
      });
    }
    
    res.json({
      success: true,
      operacion
    });
  } catch (error) {
    console.error('Error obteniendo operación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Update operation (admin only)
app.put('/auth/operaciones/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const { operacionData } = req.body;
    
    const result = await operacionService.updateOperacion(id, operacionData);
    
    if (!result) {
      return res.status(404).json({ 
        success: false, 
        error: 'Operación no encontrada' 
      });
    }
    
    res.json({
      success: true,
      operacion: result
    });
  } catch (error) {
    console.error('Error actualizando operación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// Delete operation (admin only)
app.delete('/auth/operaciones/:id', authMiddleware, adminMiddleware, async (req: AuthenticatedRequest, res) => {
  try {
    const id = parseInt(req.params.id);
    const success = await operacionService.deleteOperacion(id);
    
    if (!success) {
      return res.status(404).json({ 
        success: false, 
        error: 'Operación no encontrada' 
      });
    }
    
    res.json({
      success: true,
      message: 'Operación eliminada correctamente'
    });
  } catch (error) {
    console.error('Error eliminando operación:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error interno del servidor' 
    });
  }
});

// ===== PUBLIC ENDPOINTS (keeping the original ones) =====

// Basic web analysis endpoint
app.post('/analizar-web', async (req, res) => {
  try {
    const { url } = req.body;
    
    // Simulate analysis that takes time
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    const analysis = `Análisis de la página web: ${url}

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

Esta renovación completa posicionará el sitio web como una herramienta competitiva y efectiva para el crecimiento del negocio.`;

    res.json({
      analisis: analysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en análisis web:', error);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

// Advanced web analysis endpoint
app.post('/analizar-web-avanzado', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    const analysisResult = await webCrawlerService.analyzePage({
      url,
      rubro,
      servicio,
      tipo
    });

    res.json({
      success: true,
      data: analysisResult,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en análisis web avanzado:', error);
    
    res.json({
      success: false,
      error: 'No se pudo completar el análisis del sitio web',
      data: await webCrawlerService.analyzePage({
        url: req.body.url,
        rubro: req.body.rubro,
        servicio: req.body.servicio,
        tipo: req.body.tipo
      }),
      timestamp: new Date().toISOString()
    });
  }
});

// Website structure analysis endpoint
app.post('/analizar-estructura-web', async (req, res) => {
  try {
    const { url, rubro, servicio, tipo } = req.body;
    
    const structureAnalysis = await aiWebAnalyzerService.analyzeWebsiteStructure({
      url,
      rubro,
      servicio,
      tipo
    });

    res.json({
      success: true,
      data: structureAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en análisis de estructura web:', error);
    
    res.json({
      success: false,
      error: 'No se pudo completar el análisis de estructura del sitio web',
      data: await aiWebAnalyzerService.analyzeWebsiteStructure({
        url: req.body.url,
        rubro: req.body.rubro,
        servicio: req.body.servicio,
        tipo: req.body.tipo
      }),
      timestamp: new Date().toISOString()
    });
  }
});

// Generate project description endpoint
app.post('/generar-descripcion-proyecto', async (req, res) => {
  try {
    const { rubro, servicio } = req.body;
    const descripcion = crearDescripcionProyecto(rubro, servicio);
    
    res.json({
      success: true,
      descripcion: descripcion,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error generando descripción del proyecto:', error);
    
    res.json({
      success: false,
      error: 'No se pudo generar la descripción del proyecto',
      descripcion: crearDescripcionProyecto(req.body.rubro, req.body.servicio),
      timestamp: new Date().toISOString()
    });
  }
});

// Analyze development time endpoint
app.post('/analizar-tiempo-desarrollo', async (req, res) => {
  try {
    const { tiempoDesarrollo } = req.body;
    const tiempoAnalizado = await aiTimeAnalyzerService.analyzeProjectTime(tiempoDesarrollo);
    
    res.json({
      success: true,
      tiempoAnalizado,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error analizando tiempo de desarrollo:', error);
    
    // Use fallback if AI fails
    const tiempoAnalizado = aiTimeAnalyzerService.generateFallbackTimeAnalysis(req.body.tiempoDesarrollo);
    
    res.json({
      success: true,
      tiempoAnalizado,
      timestamp: new Date().toISOString()
    });
  }
});

// Improve requirements endpoint
app.post('/mejorar-requerimientos', async (req, res) => {
  try {
    const { requerimientos, rubro, servicio } = req.body;
    const requerimientosMejorados = await aiTimeAnalyzerService.mejorarRequerimientosTecnicos(
      requerimientos,
      rubro,
      servicio
    );
    
    res.json({
      success: true,
      requerimientosMejorados,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error mejorando requerimientos:', error);
    
    // Use fallback if AI fails
    const requerimientosMejorados = aiTimeAnalyzerService.generateFallbackRequerimientosMejorados(
      req.body.requerimientos,
      req.body.rubro,
      req.body.servicio
    );
    
    res.json({
      success: true,
      requerimientosMejorados,
      timestamp: new Date().toISOString()
    });
  }
});

// Time analysis endpoint (keeping the original one too)
app.post('/analizar-tiempo', async (req, res) => {
  try {
    const { userTimeDescription } = req.body;
    
    const timeAnalysis = await aiTimeAnalyzerService.analyzeProjectTime(userTimeDescription);

    res.json({
      success: true,
      data: timeAnalysis,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error en análisis de tiempo:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Error al analizar el tiempo del proyecto' 
    });
  }
});

// Helper function to create project descriptions
function crearDescripcionProyecto(rubro: string, servicio: string): string {
  const descripciones: Record<string, Record<string, string>> = {
    'Inmobiliario': {
      'Landing': `En un mercado inmobiliario en constante evolución, la presencia en línea se ha convertido en un elemento indispensable para el éxito y la competitividad de las empresas del sector. En este contexto, la renovación de su página web no solo es una necesidad, sino una oportunidad estratégica para destacarse y posicionarse de manera efectiva en el mercado.

Una página web renovada con técnicas avanzadas de diseño y desarrollo no solo es una plataforma para mostrar propiedades, sino una herramienta poderosa para atraer y cautivar a clientes potenciales. Este proyecto de landing page inmobiliaria incluirá una galería de propiedades destacadas, filtros de búsqueda personalizados, formularios de contacto optimizados y un diseño responsive que garantice una experiencia excepcional en todos los dispositivos.`,
      
      'E-Commerce': `En el competitivo sector inmobiliario, la digitalización de los procesos comerciales se ha convertido en una ventaja competitiva fundamental. Este proyecto de plataforma de comercio electrónico inmobiliario representa una oportunidad única para transformar la manera en que los clientes exploran, comparan y adquieren propiedades.

La implementación de un e-commerce especializado en el sector inmobiliario permitirá a los clientes navegar por un catálogo completo de propiedades con filtros avanzados, realizar tours virtuales, comparar opciones lado a lado y completar el proceso de reserva de manera segura y eficiente. La plataforma incluirá un sistema de pagos integrado, panel de usuario personalizado y herramientas de comunicación directa con asesores.`,
      
      'Aplicación': `En la era de la movilidad, el acceso a información inmobiliaria desde dispositivos móviles se ha convertido en una necesidad fundamental para los clientes del sector. Este proyecto de aplicación móvil inmobiliaria representa la evolución natural de la experiencia de usuario, llevando la funcionalidad de una plataforma web completa al bolsillo de cada cliente potencial.

La aplicación incluirá búsqueda geolocalizada de propiedades, notificaciones push sobre nuevas ofertas, tours virtuales en realidad aumentada, sistema de mensajería integrado con asesores y sincronización offline para acceso sin conexión. Esta herramienta móvil se convertirá en el punto de contacto principal entre la empresa y sus clientes, facilitando la toma de decisiones y mejorando significativamente la tasa de conversión.`
    },
    'Retail': {
      'E-Commerce': `En el dinámico mundo del retail, la transformación digital se ha convertido en el motor principal del crecimiento y la competitividad. Este proyecto de plataforma de comercio electrónico para retail representa una oportunidad estratégica para expandir el alcance del negocio y crear una experiencia de compra excepcional que supere las expectativas de los clientes.

La implementación de un e-commerce moderno incluirá un catálogo de productos con navegación intuitiva, sistema de carrito de compras optimizado, múltiples opciones de pago seguras, programa de lealtad integrado y sistema de reviews y ratings. La plataforma estará diseñada para maximizar la conversión de visitantes en compradores, ofreciendo una experiencia de usuario fluida y atractiva que refleje la calidad y profesionalismo de la marca.`,
      
      'Landing': `En el competitivo sector retail, la primera impresión digital puede marcar la diferencia entre un cliente potencial y un cliente perdido. Este proyecto de landing page para retail está diseñado para capturar la atención de los visitantes desde el primer momento y convertirlos en clientes comprometidos.

La landing page incluirá un diseño visual impactante que muestre los productos más destacados, sección de ofertas especiales, testimonios de clientes satisfechos, newsletter para captación de leads y formularios de contacto optimizados. El objetivo es crear una experiencia memorable que impulse la acción del usuario y genere conversiones significativas para el negocio.`,
      
      'Aplicación': `En la era del comercio móvil, tener una aplicación de retail se ha convertido en una ventaja competitiva esencial. Este proyecto de aplicación móvil para retail permitirá a los clientes acceder al catálogo completo de productos, realizar compras de manera intuitiva y recibir notificaciones personalizadas sobre ofertas y novedades.

La aplicación incluirá navegación por categorías, búsqueda avanzada de productos, sistema de wishlist, historial de compras, programa de puntos y recompensas, y notificaciones push estratégicas. Esta herramienta móvil se convertirá en el canal principal de interacción con los clientes, aumentando la frecuencia de compra y fortaleciendo la lealtad hacia la marca.`
    },
    'Financiero': {
      'Landing': `En el sector financiero, la confianza y la credibilidad son los pilares fundamentales de cualquier relación comercial. Este proyecto de landing page financiera está diseñado para transmitir estos valores esenciales mientras presenta los servicios de manera clara y profesional, estableciendo una base sólida para la confianza del cliente.

La landing page incluirá calculadoras financieras interactivas, simuladores de crédito, testimonios de clientes satisfechos, información sobre certificaciones de seguridad, centro de ayuda con FAQ y chat especializado para consultas. El diseño reflejará la seriedad y profesionalismo del sector financiero, mientras mantiene la accesibilidad y facilidad de uso que los clientes modernos esperan.`,
      
      'Aplicación': `En el mundo financiero digital, la seguridad y la accesibilidad son igualmente importantes. Este proyecto de aplicación financiera móvil representa la evolución de los servicios bancarios tradicionales, ofreciendo a los usuarios la capacidad de gestionar sus finanzas de manera segura y conveniente desde cualquier lugar.

La aplicación incluirá autenticación de dos factores, dashboard personalizado con resumen de productos, historial completo de transacciones, alertas y notificaciones personalizadas, generación de reportes financieros y soporte para múltiples monedas. La seguridad será la prioridad absoluta, implementando las mejores prácticas de encriptación y protección de datos para garantizar la confianza total de los usuarios.`,
      
      'Web Multiproyecto': `En el sector financiero, la complejidad de los servicios requiere una presencia digital integral que pueda manejar múltiples productos y funcionalidades bajo una marca cohesiva. Este proyecto de ecosistema web financiero representa una solución completa que integra todos los servicios de la institución en una plataforma unificada y profesional.

El ecosistema web incluirá múltiples módulos especializados: portal de clientes, calculadoras financieras avanzadas, simuladores de diferentes tipos de crédito, centro de ayuda integral, sistema de tickets de soporte, blog con contenido financiero educativo y integración con sistemas internos. La arquitectura será escalable y modular, permitiendo el crecimiento futuro y la adición de nuevos servicios sin afectar la experiencia del usuario.`
    }
  };

  return descripciones[rubro]?.[servicio] || `En el sector ${rubro.toLowerCase()}, la implementación de ${servicio.toLowerCase()} representa una oportunidad estratégica para mejorar la presencia digital y optimizar la experiencia del cliente. Este proyecto consistirá en el desarrollo de una plataforma moderna que cumpla con los estándares más altos de funcionalidad, diseño y seguridad, adaptándose a las demandas específicas del mercado y las expectativas de los usuarios modernos.`;
}

// Start server only if this is the main module (not when imported by Vercel)
if (require.main === module) {
  app.listen(port, () => {
    console.log(`🚀 Servidor ejecutándose en http://localhost:${port}`);
  });
}

export default app;

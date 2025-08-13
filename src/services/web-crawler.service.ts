import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';

interface CrawlAnalysisRequest {
  url: string;
  rubro: string;
  servicio: string;
  tipo: string;
}

interface AnalysisResult {
  url: string;
  title: string;
  description: string;
  missing_features: string[];
  recommendations: string[];
  seo_analysis: {
    has_meta_description: boolean;
    has_meta_keywords: boolean;
    has_h1_tags: boolean;
    has_alt_texts: boolean;
    page_speed_issues: string[];
  };
  design_analysis: {
    is_responsive: boolean;
    has_modern_design: boolean;
    navigation_issues: string[];
    ux_issues: string[];
  };
  content_analysis: {
    content_quality: string;
    missing_sections: string[];
    engagement_elements: string[];
  };
  technical_analysis: {
    has_ssl: boolean;
    has_contact_forms: boolean;
    has_social_media: boolean;
    has_analytics: boolean;
  };
  overall_score: number;
  detailed_analysis: string;
}

@Injectable()
export class WebCrawlerService {
  private readonly EXPECTED_PAGES: Record<string, Record<string, string[]>> = {
    'Inmobiliario': {
      'Landing': [
        'Inicio (Home)',
        'Nosotros',
        'Proyectos',
        'Detalle del Proyecto',
        'Vende tu Terreno',
        'Refiere y Gana',
        'Contacto'
      ],
      'E-Commerce': [
        'Catálogo de Propiedades',
        'Sistema de Reservas',
        'Panel de Usuario',
        'Comparador de Propiedades',
        'Chat en Vivo',
        'Sistema de Favoritos'
      ],
      'Aplicación': [
        'Búsqueda Geolocalizada',
        'Notificaciones Push',
        'Realidad Aumentada',
        'Sincronización Offline',
        'Sistema de Mensajería',
        'Calendario de Citas'
      ]
    },
    'Retail': {
      'E-Commerce': [
        'Catálogo de Productos',
        'Carrito de Compras',
        'Pasarela de Pagos',
        'Sistema de Inventario',
        'Programa de Lealtad',
        'Reviews y Ratings',
        'Wishlist'
      ],
      'Landing': [
        'Inicio (Home)',
        'Catálogo de Productos',
        'Ofertas y Promociones',
        'Newsletter',
        'Testimonios',
        'Comparador de Precios',
        'FAQ Section',
        'Contacto'
      ]
    },
    'Financiero': {
      'Landing': [
        'Inicio (Home)',
        'Calculadoras Financieras',
        'Simuladores de Crédito',
        'Información de Servicios',
        'Testimonios de Confianza',
        'Certificaciones de Seguridad',
        'Centro de Ayuda',
        'Chat Especializado',
        'Contacto'
      ],
      'Aplicación': [
        'Dashboard Personalizado',
        'Autenticación 2FA',
        'Historial de Transacciones',
        'Alertas y Notificaciones',
        'Reportes Financieros',
        'Soporte Multimoneda',
        'Backup de Seguridad'
      ]
    }
  };

  async analyzePage(request: CrawlAnalysisRequest): Promise<AnalysisResult> {
    try {
      // Verificar si la URL tiene protocolo
      let urlToAnalyze = request.url;
      if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
        urlToAnalyze = 'https://' + urlToAnalyze;
      }

      // Realizar el crawling
      const response = await axios.get(urlToAnalyze, {
        timeout: 10000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Análisis básico de la página
      const title = $('title').text() || 'Sin título';
      const metaDescription = $('meta[name="description"]').attr('content') || '';
      
      // Análisis SEO
      const seoAnalysis = {
        has_meta_description: !!metaDescription,
        has_meta_keywords: !!$('meta[name="keywords"]').attr('content'),
        has_h1_tags: $('h1').length > 0,
        has_alt_texts: $('img[alt]').length > $('img').length * 0.8,
        page_speed_issues: this.analyzePageSpeed($)
      };

      // Análisis de diseño
      const designAnalysis = {
        is_responsive: this.checkResponsiveDesign($),
        has_modern_design: this.checkModernDesign($),
        navigation_issues: this.analyzeNavigation($),
        ux_issues: this.analyzeUX($)
      };

      // Análisis de contenido
      const contentAnalysis = {
        content_quality: this.analyzeContentQuality($),
        missing_sections: this.findMissingSections($, request.rubro, request.servicio),
        engagement_elements: this.findEngagementElements($)
      };

      // Análisis técnico
      const technicalAnalysis = {
        has_ssl: urlToAnalyze.startsWith('https://'),
        has_contact_forms: $('form').length > 0,
        has_social_media: this.checkSocialMedia($),
        has_analytics: this.checkAnalytics($)
      };

      // Características esperadas según el rubro y servicio
      const expectedPages = this.EXPECTED_PAGES[request.rubro]?.[request.servicio] || [];
      const missingPages = this.findMissingPages($, expectedPages);

      // Generar recomendaciones
      const recommendations = this.generateRecommendations(
        seoAnalysis, 
        designAnalysis, 
        contentAnalysis, 
        technicalAnalysis, 
        missingPages,
        request
      );

      // Calcular score general
      const overallScore = this.calculateOverallScore(
        seoAnalysis, 
        designAnalysis, 
        contentAnalysis, 
        technicalAnalysis
      );

      // Generar análisis detallado
      const detailedAnalysis = this.generateDetailedAnalysis(
        request,
        missingPages,
        recommendations,
        overallScore
      );

      return {
        url: urlToAnalyze,
        title,
        description: metaDescription,
        missing_features: missingPages,
        recommendations,
        seo_analysis: seoAnalysis,
        design_analysis: designAnalysis,
        content_analysis: contentAnalysis,
        technical_analysis: technicalAnalysis,
        overall_score: overallScore,
        detailed_analysis: detailedAnalysis
      };

    } catch (error) {
      console.error('Error analyzing page:', error);
      
      // Retornar análisis genérico en caso de error
      return this.generateFallbackAnalysis(request);
    }
  }

  private analyzePageSpeed($: cheerio.CheerioAPI): string[] {
    const issues: string[] = [];
    
    if ($('script').length > 10) {
      issues.push('Exceso de scripts JavaScript pueden afectar la velocidad de carga');
    }
    
    if ($('img').length > 20) {
      issues.push('Gran cantidad de imágenes sin optimizar detectadas');
    }
    
    if ($('link[rel="stylesheet"]').length > 5) {
      issues.push('Múltiples archivos CSS externos pueden ralentizar la carga');
    }

    return issues;
  }

  private checkResponsiveDesign($: cheerio.CheerioAPI): boolean {
    const viewport = $('meta[name="viewport"]').attr('content');
    const hasMediaQueries = $('style, link[rel="stylesheet"]').text().includes('@media');
    return !!viewport || hasMediaQueries;
  }

  private checkModernDesign($: cheerio.CheerioAPI): boolean {
    const modernFrameworks = ['bootstrap', 'tailwind', 'material', 'chakra'];
    const pageContent = $.html().toLowerCase();
    return modernFrameworks.some(framework => pageContent.includes(framework));
  }

  private analyzeNavigation($: cheerio.CheerioAPI): string[] {
    const issues: string[] = [];
    
    const navElements = $('nav, .nav, .navigation, .menu').length;
    if (navElements === 0) {
      issues.push('No se detectó un sistema de navegación claro');
    }
    
    const menuItems = $('nav a, .nav a, .menu a').length;
    if (menuItems > 10) {
      issues.push('Demasiados elementos en el menú principal');
    }
    
    return issues;
  }

  private analyzeUX($: cheerio.CheerioAPI): string[] {
    const issues: string[] = [];
    
    if ($('button, .btn, input[type="submit"]').length < 2) {
      issues.push('Pocos elementos de llamada a la acción (CTA)');
    }
    
    if (!$('footer').length) {
      issues.push('Falta de información de contacto en footer');
    }
    
    return issues;
  }

  private analyzeContentQuality($: cheerio.CheerioAPI): string {
    const textContent = $('p, div, span').text();
    const wordCount = textContent.split(' ').length;
    
    if (wordCount < 300) return 'Contenido insuficiente';
    if (wordCount < 800) return 'Contenido básico';
    if (wordCount < 1500) return 'Contenido adecuado';
    return 'Contenido extenso';
  }

  private findMissingSections($: cheerio.CheerioAPI, rubro: string, servicio: string): string[] {
    const missing: string[] = [];
    const pageText = $.html().toLowerCase();
    
    const commonSections = ['about', 'sobre', 'contacto', 'contact', 'services', 'servicios'];
    commonSections.forEach(section => {
      if (!pageText.includes(section)) {
        missing.push(`Sección ${section}`);
      }
    });
    
    return missing;
  }

  private findEngagementElements($: cheerio.CheerioAPI): string[] {
    const elements: string[] = [];
    
    if ($('form').length > 0) elements.push('Formularios de contacto');
    if ($('.testimonial, .review').length > 0) elements.push('Testimonios');
    if ($('.social, .share').length > 0) elements.push('Redes sociales');
    if ($('video, iframe[src*="youtube"]').length > 0) elements.push('Contenido multimedia');
    
    return elements;
  }

  private checkSocialMedia($: cheerio.CheerioAPI): boolean {
    const socialPlatforms = ['facebook', 'twitter', 'instagram', 'linkedin', 'youtube'];
    const pageContent = $.html().toLowerCase();
    return socialPlatforms.some(platform => pageContent.includes(platform));
  }

  private checkAnalytics($: cheerio.CheerioAPI): boolean {
    const analyticsServices = ['google-analytics', 'gtag', 'ga(', 'facebook pixel'];
    const pageContent = $.html().toLowerCase();
    return analyticsServices.some(service => pageContent.includes(service));
  }

  private findMissingPages($: cheerio.CheerioAPI, expectedPages: string[]): string[] {
    const pageContent = $.html().toLowerCase();
    const navigationLinks = $('nav a, .nav a, .menu a, header a').map((i, el) => $(el).text().toLowerCase().trim()).get();
    const missing: string[] = [];
    
    // Mapeo de páginas esperadas a palabras clave de búsqueda
    const pageMappings: Record<string, string[]> = {
      'Inicio (Home)': ['inicio', 'home', 'principal'],
      'Nosotros': ['nosotros', 'about', 'sobre', 'empresa'],
      'Proyectos': ['proyectos', 'projects', 'propiedades', 'properties'],
      'Detalle del Proyecto': ['detalle', 'proyecto', 'propiedad'],
      'Vende tu Terreno': ['vende', 'terreno', 'referidos'],
      'Refiere y Gana': ['refiere', 'gana', 'blog', 'noticias'],
      'Contacto': ['contacto', 'contact', 'comunícate'],
      'Catálogo de Propiedades': ['catálogo', 'catalogo', 'propiedades', 'properties'],
      'Sistema de Reservas': ['reservas', 'reservar', 'booking'],
      'Panel de Usuario': ['panel', 'usuario', 'mi cuenta', 'dashboard'],
      'Comparador de Propiedades': ['comparador', 'comparar'],
      'Chat en Vivo': ['chat', 'vivo', 'ayuda'],
      'Sistema de Favoritos': ['favoritos', 'guardar', 'wishlist'],
      'Búsqueda Geolocalizada': ['geolocalizada', 'ubicación', 'mapa'],
      'Notificaciones Push': ['notificaciones', 'push', 'alertas'],
      'Realidad Aumentada': ['realidad', 'aumentada', 'ar'],
      'Sincronización Offline': ['offline', 'sincronización'],
      'Sistema de Mensajería': ['mensajería', 'mensajes', 'chat'],
      'Calendario de Citas': ['calendario', 'citas', 'agendar'],
      'Catálogo de Productos': ['catálogo', 'catalogo', 'productos', 'products'],
      'Carrito de Compras': ['carrito', 'compras', 'cart'],
      'Pasarela de Pagos': ['pagos', 'payment', 'checkout'],
      'Sistema de Inventario': ['inventario', 'stock'],
      'Programa de Lealtad': ['lealtad', 'puntos', 'recompensas'],
      'Reviews y Ratings': ['reviews', 'ratings', 'opiniones'],
      'Wishlist': ['wishlist', 'deseos', 'favoritos'],
      'Ofertas y Promociones': ['ofertas', 'promociones', 'descuentos'],
      'Newsletter': ['newsletter', 'suscribirse', 'email'],
      'Testimonios': ['testimonios', 'opiniones', 'clientes'],
      'Comparador de Precios': ['comparador', 'precios'],
      'FAQ Section': ['faq', 'preguntas', 'frecuentes'],
      'Calculadoras Financieras': ['calculadora', 'calculator', 'financiera'],
      'Simuladores de Crédito': ['simulador', 'crédito', 'préstamo'],
      'Información de Servicios': ['servicios', 'services', 'información'],
      'Testimonios de Confianza': ['testimonios', 'confianza', 'casos'],
      'Certificaciones de Seguridad': ['certificaciones', 'seguridad', 'ssl'],
      'Centro de Ayuda': ['ayuda', 'help', 'soporte'],
      'Chat Especializado': ['chat', 'especializado', 'asesor'],
      'Dashboard Personalizado': ['dashboard', 'personalizado', 'panel'],
      'Autenticación 2FA': ['2fa', 'autenticación', 'seguridad'],
      'Historial de Transacciones': ['historial', 'transacciones', 'movimientos'],
      'Alertas y Notificaciones': ['alertas', 'notificaciones'],
      'Reportes Financieros': ['reportes', 'financieros'],
      'Soporte Multimoneda': ['multimoneda', 'monedas'],
      'Backup de Seguridad': ['backup', 'respaldo', 'seguridad']
    };
    
    expectedPages.forEach((page: string) => {
      const keywords = pageMappings[page] || [page.toLowerCase()];
      const hasPageInNavigation = navigationLinks.some(link => 
        keywords.some(keyword => link.includes(keyword))
      );
      const hasPageInContent = keywords.some(keyword => 
        pageContent.includes(keyword)
      );
      
      if (!hasPageInNavigation && !hasPageInContent) {
        missing.push(page);
      }
    });
    
    return missing;
  }

  private generateRecommendations(
    seo: any,
    design: any,
    content: any,
    technical: any,
    missingPages: string[],
    request: CrawlAnalysisRequest
  ): string[] {
    const recommendations: string[] = [];
    
    if (!seo.has_meta_description) {
      recommendations.push('Agregar meta descripción optimizada para SEO');
    }
    
    if (!design.is_responsive) {
      recommendations.push('Implementar diseño responsive para dispositivos móviles');
    }
    
    if (content.content_quality === 'Contenido insuficiente') {
      recommendations.push('Ampliar el contenido con información relevante del sector');
    }
    
    if (!technical.has_ssl) {
      recommendations.push('Implementar certificado SSL para mayor seguridad');
    }
    
    if (missingPages.length > 0) {
      recommendations.push(`Agregar páginas/secciones específicas para ${request.rubro}: ${missingPages.slice(0, 3).join(', ')}`);
    }
    
    return recommendations;
  }

  private calculateOverallScore(seo: any, design: any, content: any, technical: any): number {
    let score = 0;
    
    // SEO (25%)
    if (seo.has_meta_description) score += 6.25;
    if (seo.has_h1_tags) score += 6.25;
    if (seo.has_alt_texts) score += 6.25;
    if (seo.has_meta_keywords) score += 6.25;
    
    // Diseño (25%)
    if (design.is_responsive) score += 12.5;
    if (design.has_modern_design) score += 12.5;
    
    // Contenido (25%)
    if (content.content_quality !== 'Contenido insuficiente') score += 25;
    
    // Técnico (25%)
    if (technical.has_ssl) score += 8.33;
    if (technical.has_contact_forms) score += 8.33;
    if (technical.has_analytics) score += 8.34;
    
    return Math.round(score);
  }

  private generateDetailedAnalysis(
    request: CrawlAnalysisRequest,
    missingPages: string[],
    recommendations: string[],
    score: number
  ): string {
    return `ANÁLISIS DETALLADO DE LA PÁGINA WEB: ${request.url}

EVALUACIÓN GENERAL:
Puntuación obtenida: ${score}/100 puntos

ANÁLISIS ESPECÍFICO PARA ${request.rubro.toUpperCase()} - ${request.servicio.toUpperCase()}:

La evaluación de su sitio web actual revela oportunidades significativas de mejora para optimizar su presencia digital en el sector ${request.rubro.toLowerCase()}. 

FUNCIONALIDADES FALTANTES CRÍTICAS:
${missingPages.length > 0 ? 
  missingPages.map(page => `• ${page}`).join('\n') : 
  '• Su sitio web cuenta con las páginas básicas esperadas'}

RECOMENDACIONES PRIORITARIAS:
${recommendations.map(rec => `• ${rec}`).join('\n')}

OPORTUNIDADES DE MEJORA:
• Optimización de la experiencia de usuario específica para ${request.rubro}
• Implementación de elementos de conversión más efectivos
• Mejora en la arquitectura de información y navegación
• Integración de herramientas analíticas avanzadas
• Optimización para motores de búsqueda con enfoque sectorial

PRÓXIMOS PASOS RECOMENDADOS:
Una renovación integral del sitio web, enfocada en las necesidades específicas del sector ${request.rubro}, permitirá aprovechar al máximo el potencial digital de su negocio y mejorar significativamente la experiencia de sus usuarios.

La implementación de las páginas faltantes y las mejoras recomendadas posicionará su sitio web como una herramienta competitiva y efectiva para el crecimiento de su negocio.`;
  }

  private generateFallbackAnalysis(request: CrawlAnalysisRequest): AnalysisResult {
    const expectedPages = this.EXPECTED_PAGES[request.rubro]?.[request.servicio] || [];
    
    return {
      url: request.url,
      title: 'Análisis no disponible',
      description: 'No se pudo acceder al sitio web para realizar el análisis',
      missing_features: expectedPages,
      recommendations: [
        'Verificar que el sitio web esté accesible',
        'Implementar páginas específicas del sector',
        'Mejorar la estructura y navegación del sitio',
        'Optimizar para dispositivos móviles',
        'Agregar elementos de confianza y credibilidad'
      ],
      seo_analysis: {
        has_meta_description: false,
        has_meta_keywords: false,
        has_h1_tags: false,
        has_alt_texts: false,
        page_speed_issues: ['No se pudo evaluar la velocidad de carga']
      },
      design_analysis: {
        is_responsive: false,
        has_modern_design: false,
        navigation_issues: ['No se pudo evaluar la navegación'],
        ux_issues: ['No se pudo evaluar la experiencia de usuario']
      },
      content_analysis: {
        content_quality: 'No evaluado',
        missing_sections: ['No se pudo evaluar el contenido'],
        engagement_elements: []
      },
      technical_analysis: {
        has_ssl: false,
        has_contact_forms: false,
        has_social_media: false,
        has_analytics: false
      },
      overall_score: 0,
      detailed_analysis: `ANÁLISIS DEL SITIO WEB: ${request.url}

No fue posible acceder al sitio web para realizar un análisis detallado. Esto puede deberse a:
• El sitio web no está disponible o accesible públicamente
• Problemas de conectividad temporal
• Restricciones de acceso del servidor

RECOMENDACIONES GENERALES PARA ${request.rubro.toUpperCase()} - ${request.servicio.toUpperCase()}:

Basándose en las mejores prácticas para el sector ${request.rubro.toLowerCase()}, se recomienda implementar:

FUNCIONALIDADES ESENCIALES:
${expectedPages.map(page => `• ${page}`).join('\n')}

ASPECTOS TÉCNICOS FUNDAMENTALES:
• Certificado SSL para seguridad
• Diseño responsive para dispositivos móviles
• Optimización de velocidad de carga
• Implementación de analíticas web
• Formularios de contacto optimizados

CONSIDERACIONES DE UX/UI:
• Navegación intuitiva y clara
• Llamadas a la acción efectivas
• Contenido relevante y de calidad
• Elementos de confianza y credibilidad

Una renovación completa del sitio web, considerando estos aspectos, mejorará significativamente su presencia digital y competitividad en el mercado.`
    };
  }
} 
import { Injectable } from '@nestjs/common';
import axios from 'axios';
import * as cheerio from 'cheerio';
import { GoogleGenerativeAI } from '@google/generative-ai';

interface SectionAnalysis {
  name: string;
  description: string;
  found: boolean;
  content_summary?: string;
  recommendations?: string[];
}

interface WebsiteStructure {
  url: string;
  title: string;
  existing_sections: SectionAnalysis[];
  missing_sections: SectionAnalysis[];
  recommended_sections: SectionAnalysis[];
  overall_analysis: string;
  score: number;
}

interface AIAnalysisRequest {
  url: string;
  rubro: string;
  servicio: string;
  tipo: string;
}

@Injectable()
export class AIWebAnalyzerService {
  private readonly genAI: GoogleGenerativeAI;

  constructor() {
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
  }

  private readonly SECTOR_SECTIONS: Record<string, Record<string, Array<{name: string, description: string, required: boolean}>>> = {
    'Inmobiliario': {
      'Landing': [
        {
          name: 'Inicio (Home)',
          description: 'Página principal con cabecera, slider de imágenes, proyectos destacados, filtro de búsqueda y formulario de cotización',
          required: true
        },
        {
          name: 'Nosotros',
          description: 'Historia de la empresa, valores, filosofía, línea de tiempo de proyectos y formulario de cotización',
          required: true
        },
        {
          name: 'Proyectos',
          description: 'Galería de proyectos con filtros avanzados, páginas individuales con detalles específicos',
          required: true
        },
        {
          name: 'Detalle del Proyecto',
          description: 'Slider del proyecto, presentación, detalles iconográficos, avances de obra, concepto, galerías, recorrido virtual, mapa y formulario de cotización',
          required: true
        },
        {
          name: 'Vende tu Terreno',
          description: 'Programa de referidos con premios, beneficios, pasos a seguir y formulario de datos',
          required: false
        },
        {
          name: 'Refiere y Gana',
          description: 'Blog o noticias sobre novedades, eventos y noticias del sector inmobiliario',
          required: false
        },
        {
          name: 'Contacto',
          description: 'Formulario de cotización, información de contacto y ubicación',
          required: true
        }
      ],
      'E-Commerce': [
        {
          name: 'Catálogo de Propiedades',
          description: 'Lista completa de propiedades con filtros avanzados, búsqueda y comparación',
          required: true
        },
        {
          name: 'Sistema de Reservas',
          description: 'Proceso de reserva online con pasarela de pagos y confirmación',
          required: true
        },
        {
          name: 'Panel de Usuario',
          description: 'Dashboard personalizado para gestionar reservas, favoritos y preferencias',
          required: true
        },
        {
          name: 'Comparador de Propiedades',
          description: 'Herramienta para comparar múltiples propiedades lado a lado',
          required: true
        },
        {
          name: 'Chat en Vivo',
          description: 'Sistema de chat para atención al cliente en tiempo real',
          required: true
        },
        {
          name: 'Sistema de Favoritos',
          description: 'Guardar propiedades favoritas para revisión posterior',
          required: true
        }
      ],
      'Aplicación': [
        {
          name: 'Búsqueda Geolocalizada',
          description: 'Búsqueda de propiedades por ubicación con GPS',
          required: true
        },
        {
          name: 'Notificaciones Push',
          description: 'Alertas sobre nuevas propiedades y ofertas especiales',
          required: true
        },
        {
          name: 'Realidad Aumentada',
          description: 'Visualización de propiedades en AR',
          required: false
        },
        {
          name: 'Sincronización Offline',
          description: 'Acceso a datos sin conexión',
          required: true
        },
        {
          name: 'Sistema de Mensajería',
          description: 'Chat interno con asesores',
          required: true
        },
        {
          name: 'Calendario de Citas',
          description: 'Agendar visitas a propiedades',
          required: true
        }
      ]
    },
    'Retail': {
      'E-Commerce': [
        {
          name: 'Catálogo de Productos',
          description: 'Lista completa de productos con categorías y filtros',
          required: true
        },
        {
          name: 'Carrito de Compras',
          description: 'Sistema de carrito con gestión de productos',
          required: true
        },
        {
          name: 'Pasarela de Pagos',
          description: 'Múltiples métodos de pago seguros',
          required: true
        },
        {
          name: 'Sistema de Inventario',
          description: 'Control de stock en tiempo real',
          required: true
        },
        {
          name: 'Programa de Lealtad',
          description: 'Sistema de puntos y recompensas',
          required: false
        },
        {
          name: 'Reviews y Ratings',
          description: 'Sistema de reseñas de productos',
          required: true
        },
        {
          name: 'Wishlist',
          description: 'Lista de deseos personalizada',
          required: true
        }
      ],
      'Landing': [
        {
          name: 'Catálogo de Productos',
          description: 'Productos destacados con galería',
          required: true
        },
        {
          name: 'Ofertas y Promociones',
          description: 'Sección de ofertas especiales',
          required: true
        },
        {
          name: 'Newsletter',
          description: 'Suscripción para ofertas exclusivas',
          required: true
        },
        {
          name: 'Testimonios',
          description: 'Opiniones de clientes satisfechos',
          required: true
        },
        {
          name: 'Comparador de Precios',
          description: 'Comparación de precios con competencia',
          required: false
        },
        {
          name: 'FAQ Section',
          description: 'Preguntas frecuentes',
          required: true
        }
      ]
    },
    'Financiero': {
      'Landing': [
        {
          name: 'Calculadoras Financieras',
          description: 'Herramientas para calcular préstamos, intereses y cuotas',
          required: true
        },
        {
          name: 'Simuladores de Crédito',
          description: 'Simulación de diferentes tipos de crédito',
          required: true
        },
        {
          name: 'Información de Servicios',
          description: 'Descripción detallada de productos financieros',
          required: true
        },
        {
          name: 'Testimonios de Confianza',
          description: 'Casos de éxito y testimonios de clientes',
          required: true
        },
        {
          name: 'Certificaciones de Seguridad',
          description: 'Información sobre seguridad y regulaciones',
          required: true
        },
        {
          name: 'Centro de Ayuda',
          description: 'FAQ y soporte al cliente',
          required: true
        },
        {
          name: 'Chat Especializado',
          description: 'Atención personalizada para consultas financieras',
          required: true
        }
      ],
      'Aplicación': [
        {
          name: 'Dashboard Personalizado',
          description: 'Vista general de productos y servicios financieros',
          required: true
        },
        {
          name: 'Autenticación 2FA',
          description: 'Seguridad de dos factores',
          required: true
        },
        {
          name: 'Historial de Transacciones',
          description: 'Registro completo de movimientos',
          required: true
        },
        {
          name: 'Alertas y Notificaciones',
          description: 'Notificaciones de movimientos y ofertas',
          required: true
        },
        {
          name: 'Reportes Financieros',
          description: 'Generación de reportes personalizados',
          required: true
        },
        {
          name: 'Soporte Multimoneda',
          description: 'Operaciones en diferentes monedas',
          required: false
        },
        {
          name: 'Backup de Seguridad',
          description: 'Respaldo seguro de información',
          required: true
        }
      ]
    }
  };

  async analyzeWebsiteStructure(request: AIAnalysisRequest): Promise<WebsiteStructure> {
    try {
      // Verificar si la URL tiene protocolo
      let urlToAnalyze = request.url;
      if (!urlToAnalyze.startsWith('http://') && !urlToAnalyze.startsWith('https://')) {
        urlToAnalyze = 'https://' + urlToAnalyze;
      }

      // Realizar el crawling
      const response = await axios.get(urlToAnalyze, {
        timeout: 15000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      const $ = cheerio.load(response.data);
      
      // Extraer información básica
      const title = $('title').text() || 'Sin título';
      
      // Extraer contenido de la página para análisis
      const pageContent = this.extractPageContent($);
      
      // Detectar secciones existentes usando IA
      const existingSections = await this.detectExistingSections($, request);
      
      // Obtener secciones esperadas para el rubro y servicio
      const expectedSections = this.getExpectedSections(request.rubro, request.servicio);
      
      // Analizar secciones faltantes
      const missingSections = this.analyzeMissingSections(existingSections, expectedSections);
      
      // Generar secciones recomendadas
      const recommendedSections = this.generateRecommendedSections(request, existingSections, missingSections);
      
      // Calcular score
      const score = this.calculateStructureScore(existingSections, expectedSections);
      
      // Generar análisis general usando Gemini AI
      const overallAnalysis = await this.generateOverallAnalysisWithAI(request, pageContent, existingSections, missingSections);

      return {
        url: urlToAnalyze,
        title,
        existing_sections: existingSections,
        missing_sections: missingSections,
        recommended_sections: recommendedSections,
        overall_analysis: overallAnalysis,
        score
      };

    } catch (error) {
      console.error('Error analyzing website structure:', error);
      
      // Si es un error de la API de Gemini, propagar el error 500
      if (error instanceof Error && error.message.includes('Error interno del servidor')) {
        throw error;
      }
      
      // Para otros errores, usar fallback
      return this.generateFallbackAnalysis(request);
    }
  }

  private extractPageContent($: cheerio.CheerioAPI): string {
    // Extraer contenido relevante de la página
    const content: string[] = [];
    
    // Título de la página
    const title = $('title').text();
    if (title) content.push(`Título: ${title}`);
    
    // Meta descripción
    const metaDescription = $('meta[name="description"]').attr('content');
    if (metaDescription) content.push(`Descripción: ${metaDescription}`);
    
    // Navegación
    const navigation = $('nav, .nav, .menu, header').text().trim();
    if (navigation) content.push(`Navegación: ${navigation.substring(0, 500)}`);
    
    // Contenido principal
    const mainContent = $('main, .main, .content, .container').text().trim();
    if (mainContent) content.push(`Contenido principal: ${mainContent.substring(0, 1000)}`);
    
    // Formularios
    const forms = $('form').length;
    content.push(`Formularios encontrados: ${forms}`);
    
    // Enlaces
    const links = $('a').map((i, el) => $(el).text().trim()).get().filter(text => text.length > 0);
    content.push(`Enlaces de navegación: ${links.slice(0, 20).join(', ')}`);
    
    // Imágenes
    const images = $('img').length;
    content.push(`Imágenes encontradas: ${images}`);
    
    return content.join('\n\n');
  }

  private async generateOverallAnalysisWithAI(
    request: AIAnalysisRequest,
    pageContent: string,
    existingSections: SectionAnalysis[],
    missingSections: SectionAnalysis[]
  ): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });
      
      // Combinar todas las secciones (existentes y faltantes)
      const allSections = [
        ...existingSections.map(section => ({ ...section, status: 'encontrada' })),
        ...missingSections.map(section => ({ ...section, status: 'faltante' }))
      ];
      
      const prompt = `Analiza el contenido de esta página web y genera un análisis de estructura web para el sector ${request.rubro} y servicio ${request.servicio}.

CONTENIDO DE LA PÁGINA:
${pageContent}

TODAS LAS SECCIONES (ENCONTRADAS Y FALTANTES):
${allSections.map(section => `- ${section.name}: ${section.description} (${section.status})`).join('\n')}

Genera un análisis estructurado en el siguiente formato exacto:

1. [Nombre de la sección]:
[Descripción de lo que contiene o debería contener la sección]
[Otra característica de la sección]
[Otra característica de la sección]

2. [Otra sección]:
[Descripción de lo que contiene o debería contener la sección]
[Otra característica de la sección]

[Continuar con TODAS las secciones relevantes para el sector, tanto las que existen como las que faltan]

IMPORTANTE:
- NO uses iconos ✅ o ❌
- NO incluyas scores o puntuaciones
- NO distingas entre secciones encontradas y faltantes en el texto
- Incluye TODAS las secciones relevantes para el sector
- Para secciones encontradas, describe lo que realmente contiene
- Para secciones faltantes, describe lo que debería contener
- Usa un lenguaje profesional y técnico
- Mantén el formato exacto solicitado
- No inventes contenido que no esté en el análisis de la página
- Combina las secciones de forma natural, sin mencionar si existen o faltan

Genera solo el análisis estructurado, sin introducciones ni conclusiones adicionales.`;

      const result = await model.generateContent({
        contents: [{
          role: "user",
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.1,
          topK: 32,
          topP: 1,
          maxOutputTokens: 8192,
        }
      });

      const response = await result.response;
      const candidates = response.candidates;
      
      if (candidates && candidates.length > 0 && candidates[0].content.parts.length > 0) {
        const text = candidates[0].content.parts[0].text;
        return text || 'No se pudo generar el análisis';
      } else {
        throw new Error('No response from Gemini AI');
      }

    } catch (error) {
      console.error('Error generating analysis with Gemini:', error);
      // Si falla la API, devolver error 500
      throw new Error('Error interno del servidor al analizar la página web');
    }
  }

  private async detectExistingSections($: cheerio.CheerioAPI, request: AIAnalysisRequest): Promise<SectionAnalysis[]> {
    const sections: SectionAnalysis[] = [];
    const pageContent = $.html().toLowerCase();
    
    // Detectar secciones comunes por navegación
    const navigationLinks = $('nav a, .nav a, .menu a, header a').map((i, el) => $(el).text().toLowerCase().trim()).get();
    
    // Detectar secciones por contenido
    const contentSections = this.detectSectionsByContent($, pageContent);
    
    // Combinar detecciones
    const allDetectedSections = [...new Set([...navigationLinks, ...contentSections])];
    
    // Mapear secciones detectadas a secciones estándar
    const sectionMappings: Record<string, string> = {
      'inicio': 'Inicio (Home)',
      'home': 'Inicio (Home)',
      'nosotros': 'Nosotros',
      'about': 'Nosotros',
      'proyectos': 'Proyectos',
      'projects': 'Proyectos',
      'propiedades': 'Proyectos',
      'properties': 'Proyectos',
      'contacto': 'Contacto',
      'contact': 'Contacto',
      'blog': 'Blog',
      'noticias': 'Blog',
      'news': 'Blog',
      'productos': 'Catálogo de Productos',
      'products': 'Catálogo de Productos',
      'catalogo': 'Catálogo de Productos',
      'catalog': 'Catálogo de Productos',
      'servicios': 'Servicios',
      'services': 'Servicios',
      'calculadora': 'Calculadoras Financieras',
      'calculator': 'Calculadoras Financieras',
      'simulador': 'Simuladores de Crédito',
      'simulator': 'Simuladores de Crédito'
    };

    for (const detectedSection of allDetectedSections) {
      const mappedSection = sectionMappings[detectedSection] || detectedSection;
      
      if (!sections.find(s => s.name === mappedSection)) {
        const sectionContent = this.extractSectionContent($, detectedSection);
        
        sections.push({
          name: mappedSection,
          description: this.getSectionDescription(mappedSection, request.rubro),
          found: true,
          content_summary: sectionContent,
          recommendations: this.generateSectionRecommendations(mappedSection, sectionContent, request)
        });
      }
    }

    return sections;
  }

  private detectSectionsByContent($: cheerio.CheerioAPI, pageContent: string): string[] {
    const sections: string[] = [];
    
    // Detectar por contenido específico
    if (pageContent.includes('formulario') || pageContent.includes('contact')) {
      sections.push('contacto');
    }
    
    if (pageContent.includes('proyecto') || pageContent.includes('propiedad')) {
      sections.push('proyectos');
    }
    
    if (pageContent.includes('nosotros') || pageContent.includes('about')) {
      sections.push('nosotros');
    }
    
    if (pageContent.includes('blog') || pageContent.includes('noticia')) {
      sections.push('blog');
    }
    
    if (pageContent.includes('calculadora') || pageContent.includes('simulador')) {
      sections.push('calculadora');
    }
    
    if (pageContent.includes('producto') || pageContent.includes('catalogo')) {
      sections.push('productos');
    }
    
    return sections;
  }

  private extractSectionContent($: cheerio.CheerioAPI, sectionName: string): string {
    // Buscar contenido relacionado con la sección
    const selectors = [
      `[class*="${sectionName}"]`,
      `[id*="${sectionName}"]`,
      `section:contains("${sectionName}")`,
      `div:contains("${sectionName}")`
    ];
    
    let content = '';
    selectors.forEach(selector => {
      const elements = $(selector);
      if (elements.length > 0) {
        content += elements.text().substring(0, 200) + '...';
      }
    });
    
    return content || 'Contenido no disponible';
  }

  private getSectionDescription(sectionName: string, rubro: string): string {
    const descriptions: Record<string, string> = {
      'Inicio (Home)': 'Página principal con navegación y contenido destacado',
      'Nosotros': 'Información sobre la empresa, historia y valores',
      'Proyectos': 'Galería y detalles de proyectos o productos',
      'Contacto': 'Información de contacto y formularios',
      'Blog': 'Artículos y noticias del sector',
      'Catálogo de Productos': 'Lista de productos o servicios disponibles',
      'Calculadoras Financieras': 'Herramientas de cálculo financiero',
      'Simuladores de Crédito': 'Simuladores de préstamos y créditos'
    };
    
    return descriptions[sectionName] || `Sección ${sectionName}`;
  }

  private getExpectedSections(rubro: string, servicio: string): any[] {
    return this.SECTOR_SECTIONS[rubro]?.[servicio] || [];
  }

  private analyzeMissingSections(existingSections: SectionAnalysis[], expectedSections: any[]): SectionAnalysis[] {
    const missing: SectionAnalysis[] = [];
    
    for (const expected of expectedSections) {
      const found = existingSections.find(section => 
        section.name.toLowerCase().includes(expected.name.toLowerCase()) ||
        expected.name.toLowerCase().includes(section.name.toLowerCase())
      );
      
      if (!found) {
        missing.push({
          name: expected.name,
          description: expected.description,
          found: false,
          recommendations: this.generateMissingSectionRecommendations(expected, existingSections)
        });
      }
    }
    
    return missing;
  }

  private generateRecommendedSections(
    request: AIAnalysisRequest, 
    existingSections: SectionAnalysis[], 
    missingSections: SectionAnalysis[]
  ): SectionAnalysis[] {
    const recommended: SectionAnalysis[] = [];
    
    // Agregar secciones faltantes críticas
    const criticalMissing = missingSections.filter(section => 
      this.isCriticalSection(section.name, request.rubro)
    );
    
    recommended.push(...criticalMissing);
    
    // Agregar secciones adicionales según el rubro
    const additionalSections = this.getAdditionalSections(request.rubro, request.servicio);
    
    for (const additional of additionalSections) {
      const alreadyExists = existingSections.find(section => 
        section.name.toLowerCase().includes(additional.name.toLowerCase())
      );
      
      if (!alreadyExists) {
        recommended.push({
          name: additional.name,
          description: additional.description,
          found: false,
          recommendations: [`Implementar ${additional.name} para mejorar la experiencia del usuario`]
        });
      }
    }
    
    return recommended;
  }

  private isCriticalSection(sectionName: string, rubro: string): boolean {
    const criticalSections: Record<string, string[]> = {
      'Inmobiliario': ['Inicio (Home)', 'Proyectos', 'Contacto'],
      'Retail': ['Catálogo de Productos', 'Contacto'],
      'Financiero': ['Calculadoras Financieras', 'Contacto']
    };
    
    return criticalSections[rubro]?.some(critical => 
      sectionName.toLowerCase().includes(critical.toLowerCase())
    ) || false;
  }

  private getAdditionalSections(rubro: string, servicio: string): any[] {
    const additional: any[] = [];
    
    if (rubro === 'Inmobiliario') {
      additional.push(
        { name: 'Vende tu Terreno', description: 'Programa de referidos inmobiliarios' },
        { name: 'Refiere y Gana', description: 'Blog de noticias del sector' }
      );
    }
    
    if (servicio === 'E-Commerce') {
      additional.push(
        { name: 'Carrito de Compras', description: 'Sistema de compras online' },
        { name: 'Pasarela de Pagos', description: 'Métodos de pago seguros' }
      );
    }
    
    return additional;
  }

  private generateSectionRecommendations(sectionName: string, content: string, request: AIAnalysisRequest): string[] {
    const recommendations: string[] = [];
    
    if (sectionName === 'Inicio (Home)') {
      if (!content.includes('slider') && !content.includes('carousel')) {
        recommendations.push('Agregar slider de imágenes o videos destacados');
      }
      if (!content.includes('formulario')) {
        recommendations.push('Incluir formulario de contacto o cotización');
      }
    }
    
    if (sectionName === 'Proyectos') {
      if (!content.includes('filtro')) {
        recommendations.push('Implementar filtros de búsqueda avanzados');
      }
      if (!content.includes('galería')) {
        recommendations.push('Agregar galería de imágenes de proyectos');
      }
    }
    
    if (sectionName === 'Contacto') {
      if (!content.includes('mapa')) {
        recommendations.push('Incluir mapa de ubicación');
      }
      if (!content.includes('teléfono') && !content.includes('email')) {
        recommendations.push('Agregar información de contacto completa');
      }
    }
    
    return recommendations;
  }

  private generateMissingSectionRecommendations(expectedSection: any, existingSections: SectionAnalysis[]): string[] {
    const recommendations: string[] = [];
    
    recommendations.push(`Implementar sección "${expectedSection.name}"`);
    recommendations.push(`Agregar contenido relevante: ${expectedSection.description}`);
    
    if (expectedSection.required) {
      recommendations.push('Esta sección es crítica para el sector seleccionado');
    }
    
    return recommendations;
  }

  private calculateStructureScore(existingSections: SectionAnalysis[], expectedSections: any[]): number {
    const totalExpected = expectedSections.length;
    const foundSections = existingSections.length;
    const criticalFound = existingSections.filter(section => 
      expectedSections.some(expected => 
        expected.name.toLowerCase().includes(section.name.toLowerCase()) && expected.required
      )
    ).length;
    
    const criticalExpected = expectedSections.filter(section => section.required).length;
    
    // Score basado en secciones encontradas (60%) y críticas (40%)
    const basicScore = (foundSections / totalExpected) * 60;
    const criticalScore = (criticalFound / criticalExpected) * 40;
    
    return Math.round(basicScore + criticalScore);
  }

  private generateFallbackAnalysis(request: AIAnalysisRequest): WebsiteStructure {
    const expectedSections = this.getExpectedSections(request.rubro, request.servicio);
    
    return {
      url: request.url,
      title: 'Análisis no disponible',
      existing_sections: [],
      missing_sections: expectedSections.map(section => ({
        name: section.name,
        description: section.description,
        found: false,
        recommendations: [`Implementar ${section.name} para mejorar la estructura del sitio`]
      })),
      recommended_sections: expectedSections.map(section => ({
        name: section.name,
        description: section.description,
        found: false,
        recommendations: [`Agregar ${section.name} como sección esencial`]
      })),
      overall_analysis: `No se pudo analizar la estructura de ${request.url}. Se recomienda implementar las secciones estándar para ${request.rubro.toLowerCase()}.`,
      score: 0
    };
  }
} 
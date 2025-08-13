import { Injectable } from '@nestjs/common';
import { GoogleGenerativeAI } from '@google/generative-ai';

@Injectable()
export class AITimeAnalyzerService {
  private genAI: GoogleGenerativeAI;

  constructor() {
    // En producción, usar variables de entorno
    this.genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || 'your-api-key-here');
  }

  async analyzeProjectTime(userTimeDescription: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
Analiza la siguiente descripción de tiempo de desarrollo de un proyecto web y genera una versión profesional y estructurada para una sección de condiciones de contrato.

Descripción del usuario: "${userTimeDescription}"

Genera una respuesta que incluya:
1. Duración estimada en días/meses
2. División en fases o sprints si es aplicable
3. Entregables por fase
4. Consideraciones sobre variaciones de tiempo

Formato de respuesta: Solo el texto estructurado, sin introducciones ni explicaciones adicionales.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      return response.text();
    } catch (error) {
      console.error('Error analizando tiempo con Gemini:', error);
      
      // Fallback si Gemini falla
      return this.generateFallbackTimeAnalysis(userTimeDescription);
    }
  }

  async generateFallbackTimeAnalysis(userTimeDescription: string): Promise<string> {
    // Análisis básico basado en palabras clave
    const description = userTimeDescription.toLowerCase();
    
    if (description.includes('mes') || description.includes('month')) {
      return '• El proyecto tiene una duración estimada de 3 meses (90 días calendario)\n• División en sprints de 2 semanas cada uno\n• Entregables cada 15 días con revisiones y ajustes\n• Seguimiento continuo del progreso del proyecto';
    } else if (description.includes('semana') || description.includes('week')) {
      return '• El proyecto tiene una duración estimada de 8-12 semanas\n• Entregables semanales con revisiones continuas\n• Cada fase incluye presentación de avances\n• Ajustes según requerimientos del cliente';
    } else if (description.includes('día') || description.includes('day')) {
      return '• El proyecto tiene una duración estimada de 60-90 días calendario\n• Entregables quincenales con seguimiento continuo\n• Revisión del progreso en tiempo real\n• Ajustes según feedback del cliente';
    } else {
      return '• El proyecto tendrá un tiempo de desarrollo de 3 meses o 90 días calendario\n• División en sprints de 2 semanas cada uno\n• Entregables cada 15 días con revisiones\n• Ajustes según el feedback del cliente';
    }
  }

  async mejorarRequerimientosTecnicos(requerimientos: string, rubro: string, servicio: string): Promise<string> {
    try {
      const model = this.genAI.getGenerativeModel({ model: "gemini-2.0-flash" });

      const prompt = `
Reescribe el requerimiento original y transformalo en una lista de máximo 5 items para que sea mas formal y profesional, pero manteniendo el mismo contenido. El requerimiento esta enfocado en una app o web.

Requerimientos original: "${requerimientos}"

Ejemplos:

Requerimientos original: que se vea bonito y atractivo

Posible respuesta tuya:
Diseño responsive para dispositivos móviles
Optimización de velocidad de carga
Integración con Google Analytics
Certificado SSL de seguridad
Sistema de gestión de contenido

NO DEVUELVAS SALUDOS, SOLO LA LISTA SOLICITADA, SIN GUIONES.
`;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      let text = response.text();
      
      // Eliminar asteriscos manualmente
      text = text.replace(/\*/g, '');
      
      // Limpiar líneas vacías y espacios extra
      text = text.split('\n')
        .map(line => line.trim())
        .filter(line => line.length > 0)
        .slice(0, 5) // Tomar solo los primeros 5 items
        .join('\n');
      
      return text;
    } catch (error) {
      console.error('Error mejorando requerimientos con Gemini:', error);
      
      // Fallback si Gemini falla
      return this.generateFallbackRequerimientosMejorados(requerimientos, rubro, servicio);
    }
  }

  generateFallbackRequerimientosMejorados(requerimientos: string, rubro: string, servicio: string): string {
    // Devolver solo características técnicas mejoradas, máximo 5 items sin asteriscos
    return `Diseño responsive para dispositivos móviles
Optimización de velocidad de carga
Integración con Google Analytics
Certificado SSL de seguridad
Sistema de gestión de contenido`;
  }
} 
export enum OperacionEstado {
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  DESESTIMADO = 'desestimado'
}

export interface Operacion {
  id: number;
  nombre: string;
  fecha: Date;
  estado: OperacionEstado;
  userId: number;
  area: string;
  data?: any;
  createdAt?: Date;
  updatedAt?: Date;
  user?: any;
}

export class OperacionService {
  private operaciones: Operacion[] = [];

  constructor() {
    this.initializeSampleOperaciones();
  }

  async createOperacion(operacionData: {
    nombre: string;
    fecha: Date;
    estado: OperacionEstado;
    userId: number;
    area: string;
    data?: any;
  }): Promise<Operacion> {
    const operacion: Operacion = {
      id: this.operaciones.length + 1,
      ...operacionData,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.operaciones.push(operacion);
    return operacion;
  }

  async createCotizacion(operacionData: {
    nombre: string;
    userId: number;
    area: string;
    data: any;
  }): Promise<Operacion> {
    const operacion: Operacion = {
      id: this.operaciones.length + 1,
      ...operacionData,
      fecha: new Date(),
      estado: OperacionEstado.EN_REVISION,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.operaciones.push(operacion);
    return operacion;
  }

  async getAllOperaciones(): Promise<Operacion[]> {
    return this.operaciones.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );
  }

  async getOperacionesByUserId(userId: number): Promise<Operacion[]> {
    return this.operaciones
      .filter(op => op.userId === userId)
      .sort((a, b) => 
        new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
      );
  }

  async getOperacionById(id: number): Promise<Operacion | null> {
    return this.operaciones.find(op => op.id === id) || null;
  }

  async updateOperacion(id: number, operacionData: Partial<Operacion>): Promise<Operacion | null> {
    const operacionIndex = this.operaciones.findIndex(op => op.id === id);
    if (operacionIndex === -1) return null;

    this.operaciones[operacionIndex] = {
      ...this.operaciones[operacionIndex],
      ...operacionData,
      updatedAt: new Date()
    };

    return this.operaciones[operacionIndex];
  }

  async deleteOperacion(id: number): Promise<boolean> {
    const operacionIndex = this.operaciones.findIndex(op => op.id === id);
    if (operacionIndex === -1) return false;

    this.operaciones.splice(operacionIndex, 1);
    return true;
  }

  async updateOperacionEstado(id: number, estado: OperacionEstado): Promise<Operacion | null> {
    return this.updateOperacion(id, { estado });
  }

  async getOperacionesConPaginacion(
    userId: number,
    pagina: number = 1,
    porPagina: number = 9,
    area: string = 'todas'
  ): Promise<{
    operaciones: Operacion[];
    totalOperaciones: number;
    totalPaginas: number;
    paginaActual: number;
  }> {
    let filteredOperaciones = this.operaciones;

    // Aplicar filtro por área si no es 'todas'
    if (area !== 'todas') {
      filteredOperaciones = filteredOperaciones.filter(op => op.area === area);
    }

    // Ordenar por fecha de creación descendente
    filteredOperaciones.sort((a, b) => 
      new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()
    );

    const totalOperaciones = filteredOperaciones.length;
    const totalPaginas = Math.ceil(totalOperaciones / porPagina);
    const skip = (pagina - 1) * porPagina;

    const operaciones = filteredOperaciones.slice(skip, skip + porPagina);

    return {
      operaciones,
      totalOperaciones,
      totalPaginas,
      paginaActual: pagina
    };
  }

  async getAreasUnicas(): Promise<string[]> {
    try {
      const areasSet = new Set<string>();
      this.operaciones.forEach(op => {
        if (op.area && op.area.trim() !== '') {
          areasSet.add(op.area);
        }
      });
      
      const areas = Array.from(areasSet).sort();
      
      if (areas.length === 0) {
        return ['Comercial', 'Marketing', 'TI', 'Administración', 'Medios'];
      }
      
      return areas;
    } catch (error) {
      console.error('Error getting areas:', error);
      return ['Comercial', 'Marketing', 'TI', 'Administración', 'Medios'];
    }
  }

  // Método para crear operaciones de ejemplo
  async initializeSampleOperaciones(): Promise<void> {
    const operaciones = [
      {
        nombre: 'Cotización para Empresa ABC',
        fecha: new Date(),
        estado: OperacionEstado.APROBADO,
        userId: 1,
        area: 'Comercial',
        data: { empresa: 'Empresa ABC', proyecto: 'Sitio web corporativo' }
      },
      {
        nombre: 'Análisis de sitio web XYZ',
        fecha: new Date(Date.now() - 86400000), // Ayer
        estado: OperacionEstado.EN_REVISION,
        userId: 1,
        area: 'Marketing',
        data: { empresa: 'Empresa XYZ', proyecto: 'Análisis SEO' }
      },
      {
        nombre: 'Propuesta comercial para Startup',
        fecha: new Date(Date.now() - 172800000), // Hace 2 días
        estado: OperacionEstado.DESESTIMADO,
        userId: 1,
        area: 'Comercial',
        data: { empresa: 'Startup Tech', proyecto: 'Aplicación móvil' }
      }
    ];

    for (const operacionData of operaciones) {
      const existingOperacion = this.operaciones.find(op => op.nombre === operacionData.nombre);
      if (!existingOperacion) {
        await this.createOperacion(operacionData);
      }
    }
  }
} 
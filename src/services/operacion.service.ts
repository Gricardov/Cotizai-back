import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, IsNull, Not } from 'typeorm';
import { Operacion, OperacionEstado } from '../entities/operacion.entity';

@Injectable()
export class OperacionService {
  constructor(
    @InjectRepository(Operacion)
    private operacionRepository: Repository<Operacion>,
  ) {}

  async createOperacion(operacionData: {
    nombre: string;
    fecha: Date;
    estado: OperacionEstado;
    userId: number;
    area: string;
    data?: any;
  }): Promise<Operacion> {
    const operacion = this.operacionRepository.create(operacionData);
    return await this.operacionRepository.save(operacion);
  }

  async createCotizacion(operacionData: {
    nombre: string;
    userId: number;
    area: string;
    data: any;
  }): Promise<Operacion> {
    const operacion = this.operacionRepository.create({
      ...operacionData,
      fecha: new Date(),
      estado: OperacionEstado.EN_REVISION
    });
    return await this.operacionRepository.save(operacion);
  }

  async getAllOperaciones(): Promise<Operacion[]> {
    return await this.operacionRepository.find({
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOperacionesByUserId(userId: number): Promise<Operacion[]> {
    return await this.operacionRepository.find({
      where: { userId },
      relations: ['user'],
      order: { createdAt: 'DESC' }
    });
  }

  async getOperacionById(id: number): Promise<Operacion | null> {
    return await this.operacionRepository.findOne({ 
      where: { id },
      relations: ['user']
    });
  }

  async updateOperacion(id: number, operacionData: Partial<Operacion>): Promise<Operacion | null> {
    await this.operacionRepository.update(id, operacionData);
    return await this.getOperacionById(id);
  }

  async deleteOperacion(id: number): Promise<boolean> {
    const result = await this.operacionRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  async updateOperacionEstado(id: number, estado: OperacionEstado): Promise<Operacion | null> {
    await this.operacionRepository.update(id, { estado });
    return await this.getOperacionById(id);
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
    const skip = (pagina - 1) * porPagina;
    
    // Construir query base - permitir ver todas las operaciones
    let query = this.operacionRepository.createQueryBuilder('operacion')
      .leftJoinAndSelect('operacion.user', 'user')
      .orderBy('operacion.createdAt', 'DESC');

    // Aplicar filtro por área si no es 'todas'
    if (area !== 'todas') {
      query = query.where('operacion.area = :area', { area });
    }

    // Obtener total de operaciones
    const totalOperaciones = await query.getCount();

    // Obtener operaciones paginadas
    const operaciones = await query
      .skip(skip)
      .take(porPagina)
      .getMany();

    const totalPaginas = Math.ceil(totalOperaciones / porPagina);

    return {
      operaciones,
      totalOperaciones,
      totalPaginas,
      paginaActual: pagina
    };
  }

  async getAreasUnicas(): Promise<string[]> {
    try {
      // Consulta simple para obtener todas las operaciones
      const operaciones = await this.operacionRepository.find();
      
      // Extraer áreas únicas
      const areasSet = new Set<string>();
      operaciones.forEach(op => {
        if (op.area && op.area.trim() !== '') {
          areasSet.add(op.area);
        }
      });
      
      // Convertir a array y ordenar
      const areas = Array.from(areasSet).sort();
      
      // Si no hay áreas, retornar las por defecto
      if (areas.length === 0) {
        return ['Comercial', 'Marketing', 'TI', 'Administración', 'Medios'];
      }
      
      return areas;
    } catch (error) {
      console.error('Error getting areas:', error);
      // Retornar áreas por defecto si hay error
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
      const existingOperacion = await this.operacionRepository.findOne({
        where: { nombre: operacionData.nombre }
      });

      if (!existingOperacion) {
        await this.operacionRepository.save(operacionData);
      }
    }
  }
} 
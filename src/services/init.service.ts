import { Injectable, OnModuleInit } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import { Operacion, OperacionEstado } from '../entities/operacion.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class InitService implements OnModuleInit {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    @InjectRepository(Operacion)
    private operacionRepository: Repository<Operacion>,
  ) {}

  async onModuleInit() {
    console.log('🔄 Inicializando base de datos...');
    
    try {
      await this.initializeDefaultUsers();
      await this.initializeSampleOperaciones();
      console.log('✅ Base de datos inicializada exitosamente');
    } catch (error) {
      console.error('❌ Error al inicializar la base de datos:', error);
    }
  }

  private async initializeDefaultUsers(): Promise<void> {
    const existingAdmin = await this.userRepository.findOne({ 
      where: { username: 'admin' } 
    });
    
    if (!existingAdmin) {
      const hashedPassword = await bcrypt.hash('12345', 10);
      const adminUser = this.userRepository.create({
        nombre: 'Administrador',
        username: 'admin',
        password: hashedPassword,
        rol: UserRole.ADMIN,
        area: 'Administración'
      });
      await this.userRepository.save(adminUser);
      console.log('✅ Usuario admin creado');
    }

    const existingCotizador = await this.userRepository.findOne({ 
      where: { username: 'cotizador' } 
    });
    
    if (!existingCotizador) {
      const hashedPassword = await bcrypt.hash('12345', 10);
      const cotizadorUser = this.userRepository.create({
        nombre: 'Cotizador',
        username: 'cotizador',
        password: hashedPassword,
        rol: UserRole.COTIZADOR,
        area: 'Comercial'
      });
      await this.userRepository.save(cotizadorUser);
      console.log('✅ Usuario cotizador creado');
    }
  }

  private async initializeSampleOperaciones(): Promise<void> {
    const existingOperaciones = await this.operacionRepository.count();
    
    if (existingOperaciones === 0) {
      const adminUser = await this.userRepository.findOne({ 
        where: { username: 'admin' } 
      });
      
      if (adminUser) {
        const operacion1 = this.operacionRepository.create({
          nombre: 'Cotización Web Inmobiliaria',
          fecha: new Date('2024-01-15'),
          estado: OperacionEstado.APROBADO,
          userId: 1,
          area: 'Comercial',
          data: {
            nombreEmpresa: 'Inmobiliaria Ejemplo SAC',
            rubro: 'Inmobiliario',
            servicio: 'Web Multiproyecto',
            tipo: 'Complejo'
          }
        });

        const operacion2 = this.operacionRepository.create({
          nombre: 'Desarrollo E-commerce Retail',
          fecha: new Date('2024-01-20'),
          estado: OperacionEstado.EN_REVISION,
          userId: 1,
          area: 'Marketing',
          data: {
            nombreEmpresa: 'Retail Digital SAC',
            rubro: 'Retail',
            servicio: 'E-Commerce',
            tipo: 'Complejo'
          }
        });

        const operacion3 = this.operacionRepository.create({
          nombre: 'Landing Page Financiera',
          fecha: new Date('2024-01-25'),
          estado: OperacionEstado.DESESTIMADO,
          userId: 1,
          area: 'TI',
          data: {
            nombreEmpresa: 'Banco Digital SAC',
            rubro: 'Financiero',
            servicio: 'Landing',
            tipo: 'Básico'
          }
        });

        for (const operacionData of [operacion1, operacion2, operacion3]) {
          await this.operacionRepository.save(operacionData);
        }
        console.log('✅ Operaciones de ejemplo creadas');
      }
    }
  }
} 
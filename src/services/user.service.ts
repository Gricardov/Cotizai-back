import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../entities/user.entity';
import * as bcrypt from 'bcryptjs';

@Injectable()
export class UserService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async createUser(userData: {
    nombre: string;
    username: string;
    password: string;
    rol: UserRole;
    area: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user = this.userRepository.create({
      ...userData,
      password: hashedPassword,
    });

    return await this.userRepository.save(user);
  }

  async findByUsername(username: string): Promise<User | null> {
    return await this.userRepository.findOne({ where: { username } });
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  async getAllUsers(): Promise<User[]> {
    return await this.userRepository.find();
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.userRepository.findOne({ where: { id } });
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    await this.userRepository.update(id, userData);
    return await this.getUserById(id);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.userRepository.delete(id);
    return result.affected ? result.affected > 0 : false;
  }

  // Método para inicializar usuarios por defecto
  async initializeDefaultUsers(): Promise<void> {
    const existingAdmin = await this.findByUsername('admin');
    if (!existingAdmin) {
      await this.createUser({
        nombre: 'Administrador',
        username: 'admin',
        password: '12345',
        rol: UserRole.ADMIN,
        area: 'Administración'
      });
    }

    const existingCotizador = await this.findByUsername('cotizador');
    if (!existingCotizador) {
      await this.createUser({
        nombre: 'Cotizador',
        username: 'cotizador',
        password: '12345',
        rol: UserRole.COTIZADOR,
        area: 'Comercial'
      });
    }
  }
} 
import { Injectable } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { UserService } from '../services/user.service';
import { User, UserRole } from '../entities/user.entity';

@Injectable()
export class AuthService {
  constructor(
    private userService: UserService,
    private jwtService: JwtService,
  ) {}

  async validateUser(username: string, password: string): Promise<any> {
    const user = await this.userService.validateUser(username, password);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any, selectedArea?: string) {
    const payload = { 
      username: user.username, 
      sub: user.id, 
      rol: user.rol,
      area: selectedArea || user.area 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        id: user.id,
        nombre: user.nombre,
        username: user.username,
        rol: user.rol,
        area: selectedArea || user.area
      }
    };
  }

  async register(userData: {
    nombre: string;
    username: string;
    password: string;
    rol: UserRole;
    area: string;
  }) {
    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const user = await this.userService.createUser(userData);
    const { password, ...result } = user;
    return result;
  }

  async getProfile(userId: number) {
    const user = await this.userService.getUserById(userId);
    if (user) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }
} 
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { UserService, UserRole } from './user.service';

export class AuthService {
  constructor(private userService: UserService) {}

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
    
    const token = jwt.sign(payload, process.env.JWT_SECRET || 'your-secret-key', {
      expiresIn: '24h'
    });
    
    return {
      access_token: token,
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
    rol: string;
    area: string;
  }) {
    const existingUser = await this.userService.findByUsername(userData.username);
    if (existingUser) {
      throw new Error('El usuario ya existe');
    }

    const user = await this.userService.createUser({
      ...userData,
      rol: userData.rol as UserRole
    });
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

  verifyToken(token: string): any {
    try {
      return jwt.verify(token, process.env.JWT_SECRET || 'your-secret-key');
    } catch (error) {
      return null;
    }
  }
} 
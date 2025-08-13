import bcrypt from 'bcryptjs';

export enum UserRole {
  ADMIN = 'admin',
  COTIZADOR = 'cotizador'
}

export interface User {
  id: number;
  nombre: string;
  username: string;
  password: string;
  rol: UserRole;
  area: string;
  createdAt?: Date;
  updatedAt?: Date;
}

export class UserService {
  private users: User[] = [];

  constructor() {
    this.initializeDefaultUsers();
  }

  async createUser(userData: {
    nombre: string;
    username: string;
    password: string;
    rol: UserRole;
    area: string;
  }): Promise<User> {
    const hashedPassword = await bcrypt.hash(userData.password, 10);
    
    const user: User = {
      id: this.users.length + 1,
      ...userData,
      password: hashedPassword,
      createdAt: new Date(),
      updatedAt: new Date()
    };

    this.users.push(user);
    return user;
  }

  async findByUsername(username: string): Promise<User | null> {
    return this.users.find(user => user.username === username) || null;
  }

  async validateUser(username: string, password: string): Promise<User | null> {
    const user = await this.findByUsername(username);
    if (!user) return null;

    const isValidPassword = await bcrypt.compare(password, user.password);
    return isValidPassword ? user : null;
  }

  async getAllUsers(): Promise<User[]> {
    return this.users;
  }

  async getUserById(id: number): Promise<User | null> {
    return this.users.find(user => user.id === id) || null;
  }

  async updateUser(id: number, userData: Partial<User>): Promise<User | null> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return null;

    this.users[userIndex] = {
      ...this.users[userIndex],
      ...userData,
      updatedAt: new Date()
    };

    return this.users[userIndex];
  }

  async deleteUser(id: number): Promise<boolean> {
    const userIndex = this.users.findIndex(user => user.id === id);
    if (userIndex === -1) return false;

    this.users.splice(userIndex, 1);
    return true;
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
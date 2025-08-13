import { DataSource, DataSourceOptions } from 'typeorm';
import { config } from 'dotenv';
import { User } from '../entities/user.entity';
import { Operacion } from '../entities/operacion.entity';

config();

export const dataSourceOptions: DataSourceOptions = {
  type: 'postgres',
  host: process.env.POSTGRES_HOST || 'localhost',
  port: parseInt(process.env.POSTGRES_PORT || '5432'),
  username: process.env.POSTGRES_USER || 'gricardov', // Usuario correcto para macOS
  password: process.env.POSTGRES_PASSWORD || '', // Sin contraseña en macOS por defecto
  database: process.env.POSTGRES_DB || 'cotizai',
  entities: [User, Operacion],
  migrations: ['src/config/migrations/*.ts'],
  synchronize: true, // Habilitamos temporalmente para crear las tablas
  logging: true, // Habilitamos logging para ver qué está pasando
};

const dataSource = new DataSource(dataSourceOptions);
export default dataSource; 
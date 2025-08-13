import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { User } from './user.entity';

export enum OperacionEstado {
  EN_REVISION = 'en_revision',
  APROBADO = 'aprobado',
  DESESTIMADO = 'desestimado'
}

@Entity('operaciones')
export class Operacion {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  nombre!: string;

  @Column({ type: 'timestamp' })
  fecha!: Date;

  @Column({
    type: 'enum',
    enum: OperacionEstado,
    default: OperacionEstado.EN_REVISION
  })
  estado!: OperacionEstado;

  @Column()
  userId!: number;

  @ManyToOne(() => User, user => user.id)
  @JoinColumn({ name: 'userId' })
  user!: User;

  @Column({ nullable: true })
  area!: string;

  @Column({ type: 'json', nullable: true })
  data!: any;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP' })
  createdAt!: Date;

  @Column({ type: 'timestamp', default: () => 'CURRENT_TIMESTAMP', onUpdate: 'CURRENT_TIMESTAMP' })
  updatedAt!: Date;
} 
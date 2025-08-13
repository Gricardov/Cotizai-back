import { MigrationInterface, QueryRunner } from 'typeorm';

export class UpdateOperacionEstados1700000000002 implements MigrationInterface {
  name = 'UpdateOperacionEstados1700000000002';

  public async up(queryRunner: QueryRunner): Promise<void> {
    // Primero actualizar los valores existentes
    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'en_revision' 
      WHERE estado IN ('pendiente', 'en_proceso')
    `);

    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'aprobado' 
      WHERE estado = 'completada'
    `);

    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'desestimado' 
      WHERE estado = 'cancelada'
    `);

    // Luego modificar el enum
    await queryRunner.query(`
      ALTER TABLE operaciones 
      MODIFY COLUMN estado ENUM('en_revision', 'aprobado', 'desestimado') 
      NOT NULL DEFAULT 'en_revision'
    `);
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    // Revertir los cambios
    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'pendiente' 
      WHERE estado = 'en_revision'
    `);

    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'completada' 
      WHERE estado = 'aprobado'
    `);

    await queryRunner.query(`
      UPDATE operaciones 
      SET estado = 'cancelada' 
      WHERE estado = 'desestimado'
    `);

    await queryRunner.query(`
      ALTER TABLE operaciones 
      MODIFY COLUMN estado ENUM('pendiente', 'en_proceso', 'completada', 'cancelada') 
      NOT NULL DEFAULT 'pendiente'
    `);
  }
} 
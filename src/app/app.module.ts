import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from '../auth/auth.module';
import { User } from '../entities/user.entity';
import { Operacion } from '../entities/operacion.entity';
import { WebCrawlerService } from '../services/web-crawler.service';
import { AIWebAnalyzerService } from '../services/ai-web-analyzer.service';
import { AITimeAnalyzerService } from '../services/ai-time-analyzer.service';
import { InitService } from '../services/init.service';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get('POSTGRES_HOST', 'localhost'),
        port: configService.get('POSTGRES_PORT', 5432),
        username: configService.get('POSTGRES_USER', 'gricardov'),
        password: configService.get('POSTGRES_PASSWORD', ''),
        database: configService.get('POSTGRES_DB', 'cotizai'),
        entities: [User, Operacion],
        synchronize: true, // Habilitamos temporalmente para crear las tablas
        logging: true, // Habilitamos logging para ver qué está pasando
        autoLoadEntities: true,
      }),
      inject: [ConfigService],
    }),
    TypeOrmModule.forFeature([User, Operacion]),
    AuthModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    WebCrawlerService,
    AIWebAnalyzerService,
    AITimeAnalyzerService,
    InitService,
  ],
})
export class AppModule {}

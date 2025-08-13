import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './jwt.strategy';
import { UserService } from '../services/user.service';
import { OperacionService } from '../services/operacion.service';
import { WebCrawlerService } from '../services/web-crawler.service';
import { AIWebAnalyzerService } from '../services/ai-web-analyzer.service';
import { AITimeAnalyzerService } from '../services/ai-time-analyzer.service';
import { User } from '../entities/user.entity';
import { Operacion } from '../entities/operacion.entity';

@Module({
  imports: [
    PassportModule,
    TypeOrmModule.forFeature([User, Operacion]),
    JwtModule.register({
      secret: process.env.JWT_SECRET || 'your-secret-key',
      signOptions: { expiresIn: '24h' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService,
    JwtStrategy,
    UserService,
    OperacionService,
    WebCrawlerService,
    AIWebAnalyzerService,
    AITimeAnalyzerService,
  ],
  exports: [AuthService],
})
export class AuthModule {} 
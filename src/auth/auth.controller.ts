import { Controller, Post, Get, Body, UseGuards, Request, UnauthorizedException, Put, Delete, Query } from '@nestjs/common';
import { AuthService } from './auth.service';
import { JwtAuthGuard } from './jwt-auth.guard';
import { UserService } from '../services/user.service';
import { OperacionService } from '../services/operacion.service';
import { WebCrawlerService } from '../services/web-crawler.service';
import { AIWebAnalyzerService } from '../services/ai-web-analyzer.service';
import { AITimeAnalyzerService } from '../services/ai-time-analyzer.service';
import { UserRole } from '../entities/user.entity';
import { OperacionEstado } from '../entities/operacion.entity';

@Controller('auth')
export class AuthController {
  constructor(
    private authService: AuthService,
    private userService: UserService,
    private operacionService: OperacionService,
    private webCrawlerService: WebCrawlerService,
    private aiWebAnalyzerService: AIWebAnalyzerService,
    private aiTimeAnalyzerService: AITimeAnalyzerService,
  ) {}

  @Post('login')
  async login(@Body() loginDto: { username: string; password: string; area: string }) {
    const user = await this.authService.validateUser(loginDto.username, loginDto.password);
    
    if (!user) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    // NO validamos el área, solo la guardamos en la sesión
    return this.authService.login(user, loginDto.area);
  }

  @Post('register')
  async register(@Body() registerDto: {
    nombre: string;
    username: string;
    password: string;
    rol: string;
    area: string;
  }) {
    const userData = {
      ...registerDto,
      rol: registerDto.rol as UserRole
    };
    return this.authService.register(userData);
  }

  @UseGuards(JwtAuthGuard)
  @Get('profile')
  getProfile(@Request() req: any) {
    return this.authService.getProfile(req.user.sub);
  }

  @UseGuards(JwtAuthGuard)
  @Get('validate')
  validateToken(@Request() req: any) {
    return {
      valid: true,
      user: {
        id: req.user.sub,
        username: req.user.username,
        rol: req.user.rol,
        area: req.user.area
      }
    };
  }

  // Endpoints existentes para análisis web
  @Post('analizar-web')
  async analizarWeb(@Body() data: { url: string; rubro: string; servicio: string; tipo: string }) {
    try {
      // @ts-ignore
      const result = await this.webCrawlerService.analyzeWebsite(data.url, data.rubro, data.servicio, data.tipo);
      return { success: true, data: result };
    } catch (error) {
      // @ts-ignore
      return { success: false, data: this.webCrawlerService.generateFallbackAnalysis(data.rubro, data.servicio, data.tipo) };
    }
  }

  @Post('analizar-web-avanzado')
  async analizarWebAvanzado(@Body() data: { url: string; rubro: string; servicio: string; tipo: string }) {
    try {
      // @ts-ignore
      const result = await this.aiWebAnalyzerService.analyzeWebsiteStructure(data.url, data.rubro, data.servicio, data.tipo);
      return { success: true, data: result };
    } catch (error) {
      // @ts-ignore
      return { success: false, data: this.aiWebAnalyzerService.generateFallbackAnalysis(data.rubro, data.servicio, data.tipo) };
    }
  }

  @Post('analizar-estructura-web')
  async analizarEstructuraWeb(@Body() data: { url: string; rubro: string; servicio: string; tipo: string }) {
    try {
      // @ts-ignore
      const result = await this.aiWebAnalyzerService.analyzeWebsiteStructure(data.url, data.rubro, data.servicio, data.tipo);
      return { success: true, data: result };
    } catch (error) {
      // @ts-ignore
      return { success: false, data: this.aiWebAnalyzerService.generateFallbackAnalysis(data.rubro, data.servicio, data.tipo) };
    }
  }

  @Post('generar-descripcion-proyecto')
  async generarDescripcionProyecto(@Body() data: { rubro: string; servicio: string }) {
    try {
      // @ts-ignore
      const descripcion = await this.aiTimeAnalyzerService.generateProjectDescription(data.rubro, data.servicio);
      return { descripcion };
    } catch (error) {
      // @ts-ignore
      return { descripcion: this.aiTimeAnalyzerService.generateFallbackProjectDescription(data.rubro, data.servicio) };
    }
  }

  @Post('analizar-tiempo-desarrollo')
  async analizarTiempoDesarrollo(@Body() data: { tiempoDesarrollo: string }) {
    try {
      const tiempoAnalizado = await this.aiTimeAnalyzerService.analyzeProjectTime(data.tiempoDesarrollo);
      return { tiempoAnalizado };
    } catch (error) {
      return { tiempoAnalizado: this.aiTimeAnalyzerService.generateFallbackTimeAnalysis(data.tiempoDesarrollo) };
    }
  }

  @Post('mejorar-requerimientos')
  async mejorarRequerimientos(@Body() data: { requerimientos: string; rubro: string; servicio: string }) {
    try {
      const requerimientosMejorados = await this.aiTimeAnalyzerService.mejorarRequerimientosTecnicos(data.requerimientos, data.rubro, data.servicio);
      return { requerimientosMejorados };
    } catch (error) {
      // @ts-ignore
      return { requerimientosMejorados: this.aiTimeAnalyzerService.generateFallbackRequerimientosMejorados(data.requerimientos) };
    }
  }

  // Nuevos endpoints para gestión de operaciones (solo admin)
  @UseGuards(JwtAuthGuard)
  @Get('operaciones')
  async getOperaciones(
    @Request() req: any,
    @Query('pagina') pagina: string = '1',
    @Query('porPagina') porPagina: string = '9',
    @Query('area') area: string = 'todas'
  ) {
    const userId = req.user.sub;
    const paginaNum = parseInt(pagina, 10);
    const porPaginaNum = parseInt(porPagina, 10);
    
    return this.operacionService.getOperacionesConPaginacion(
      userId, 
      paginaNum, 
      porPaginaNum, 
      area
    );
  }

  @UseGuards(JwtAuthGuard)
  @Get('areas')
  async getAreas(@Request() req: any) {
    // Retornar áreas por defecto para que funcione el filtro
    return ['Comercial', 'Marketing', 'TI', 'Administración', 'Medios'];
  }

  @UseGuards(JwtAuthGuard)
  @Post('operaciones')
  async createOperacion(@Request() req: any, @Body() operacionData: { nombre: string; fecha: Date; estado: string; area: string }) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Acceso denegado');
    }
    return await this.operacionService.createOperacion({
      ...operacionData,
      estado: operacionData.estado as OperacionEstado,
      userId: req.user.sub,
      area: operacionData.area || req.user.area
    });
  }

  @UseGuards(JwtAuthGuard)
  @Post('guardar-cotizacion')
  async guardarCotizacion(@Request() req: any, @Body() cotizacionData: { nombre: string; data: any }) {
    return await this.operacionService.createCotizacion({
      nombre: cotizacionData.nombre,
      userId: req.user.sub,
      area: req.user.area,
      data: cotizacionData.data
    });
  }

  @UseGuards(JwtAuthGuard)
  @Get('operaciones/:id')
  async getOperacion(@Request() req: any, @Body() data: { id: number }) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Acceso denegado');
    }
    return await this.operacionService.getOperacionById(data.id);
  }

  @UseGuards(JwtAuthGuard)
  @Put('operaciones/:id')
  async updateOperacion(@Request() req: any, @Body() data: { id: number; operacionData: any }) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Acceso denegado');
    }
    return await this.operacionService.updateOperacion(data.id, data.operacionData);
  }

  @UseGuards(JwtAuthGuard)
  @Delete('operaciones/:id')
  async deleteOperacion(@Request() req: any, @Body() data: { id: number }) {
    if (req.user.rol !== 'admin') {
      throw new UnauthorizedException('Acceso denegado');
    }
    return await this.operacionService.deleteOperacion(data.id);
  }
} 
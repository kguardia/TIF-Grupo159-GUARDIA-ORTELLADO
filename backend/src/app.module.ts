import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { JwtModule } from '@nestjs/jwt';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { TypeOrmModule } from '@nestjs/typeorm';
import { JwtAuthGuard } from './common/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { CONFIGURACION, Configuracion } from './config/configuracion';
import { ConfiguracionModule } from './config/configuracion.module';
import { ENTIDADES, Usuario } from './entities';
import { AlmacenamientoModule } from './modules/almacenamiento/almacenamiento.module';
import { AuthModule } from './modules/auth/auth.module';
import { CasosModule } from './modules/casos/casos.module';
import { CompartirModule } from './modules/compartir/compartir.module';
import { DirectorioModule } from './modules/directorio/directorio.module';
import { DonacionesModule } from './modules/donaciones/donaciones.module';
import { ModeracionModule } from './modules/moderacion/moderacion.module';
import { SaludModule } from './modules/salud/salud.module';
import { UsuariosModule } from './modules/usuarios/usuarios.module';
import { ZonasModule } from './modules/zonas/zonas.module';

@Module({
  imports: [
    ConfiguracionModule,
    TypeOrmModule.forRootAsync({
      inject: [CONFIGURACION],
      useFactory: (cfg: Configuracion) => ({
        type: 'mysql' as const,
        ...(cfg.bd.url ? { url: cfg.bd.url } : { host: cfg.bd.host, port: cfg.bd.puerto, username: cfg.bd.usuario, password: cfg.bd.clave, database: cfg.bd.nombre }),
        charset: 'utf8mb4',
        timezone: 'Z', // todas las fechas se guardan y leen en UTC
        entities: ENTIDADES,
        synchronize: false, // el esquema lo define database/schema.sql, no el código
        ssl: cfg.bd.ssl ? { rejectUnauthorized: false } : undefined,
        extra: { connectionLimit: 10 },
        retryAttempts: 10,
        retryDelay: 3000, // Railway puede tardar en levantar la base al despertar el servicio (RNF03)
      }),
    }),
    TypeOrmModule.forFeature([Usuario]), // lo necesita JwtAuthGuard para revalidar al usuario en cada pedido
    JwtModule.registerAsync({
      global: true,
      inject: [CONFIGURACION],
      useFactory: (cfg: Configuracion) => ({ secret: cfg.jwt.secreto, signOptions: { expiresIn: cfg.jwt.expiracion as never, algorithm: 'HS256' }, verifyOptions: { algorithms: ['HS256'] } }),
    }),
    // Límite general por IP; las rutas sensibles (login, publicar, seguimiento) tienen uno más estricto.
    ThrottlerModule.forRoot({ throttlers: [{ ttl: 60_000, limit: 120 }], skipIf: () => process.env.THROTTLE_DESACTIVADO === 'true' }),
    AlmacenamientoModule,
    AuthModule,
    UsuariosModule,
    ZonasModule,
    CasosModule,
    ModeracionModule,
    DirectorioModule,
    DonacionesModule,
    CompartirModule,
    SaludModule,
  ],
  providers: [
    // El orden importa: 1) límite de pedidos, 2) ¿tiene sesión?, 3) ¿su rol alcanza?
    { provide: APP_GUARD, useClass: ThrottlerGuard },
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
  ],
})
export class AppModule {}

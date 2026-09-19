import { Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { randomBytes, createHash } from 'node:crypto';
import * as bcrypt from 'bcryptjs';
import { PrismaService } from '../prisma/prisma.service.js';
import { JwtPayload } from './types/jwt-payload.interface.js';
import { REFRESH_TOKEN_TTL_MS } from './constants/auth.constants.js';

export interface AuthResult {
  accessToken: string;
  refreshToken: string;
  csrfToken: string;
  user: {
    id_usuario: number;
    nombre_usuario: string;
    roles: string[];
    permisos: string[];
  };
}

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
  ) {}

  private hashToken(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  private async loadUsuarioConRolesYPermisos(nombreUsuario: string) {
    return this.prisma.usuarios.findUnique({
      where: { nombre_usuario: nombreUsuario },
      include: {
        estados: true,
        usuario_roles: {
          include: {
            roles: {
              include: {
                rol_permisos: { include: { permisos: true } },
              },
            },
          },
        },
      },
    });
  }

  private buildPayload(
    usuario: NonNullable<
      Awaited<ReturnType<typeof this.loadUsuarioConRolesYPermisos>>
    >,
  ) {
    const roles = usuario.usuario_roles.map((ur) => ur.roles.nombre_rol);
    const permisos = [
      ...new Set(
        usuario.usuario_roles.flatMap((ur) =>
          ur.roles.rol_permisos.map((rp) => rp.permisos.nombre_permiso),
        ),
      ),
    ];
    return { roles, permisos };
  }

  private async issueTokens(
    usuarioId: number,
    payload: JwtPayload,
  ): Promise<AuthResult> {
    const accessToken = this.jwtService.sign(payload);

    const refreshTokenPlain = randomBytes(48).toString('hex');
    await this.prisma.refresh_tokens.create({
      data: {
        token_hash: this.hashToken(refreshTokenPlain),
        id_usuario: usuarioId,
        expires_at: new Date(Date.now() + REFRESH_TOKEN_TTL_MS),
      },
    });

    const csrfToken = randomBytes(32).toString('hex');

    return {
      accessToken,
      refreshToken: refreshTokenPlain,
      csrfToken,
      user: {
        id_usuario: usuarioId,
        nombre_usuario: payload.nombre_usuario,
        roles: payload.roles,
        permisos: payload.permisos,
      },
    };
  }

  async login(nombreUsuario: string, password: string): Promise<AuthResult> {
    const usuario = await this.loadUsuarioConRolesYPermisos(nombreUsuario);
    if (!usuario) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    const passwordOk = await bcrypt.compare(password, usuario.password);
    if (!passwordOk) {
      throw new UnauthorizedException('Usuario o contraseña incorrectos');
    }

    if (usuario.estados.nombreEstado.trim().toLowerCase() !== 'activo') {
      throw new UnauthorizedException('El usuario no está activo');
    }

    const { roles, permisos } = this.buildPayload(usuario);
    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      roles,
      permisos,
    };

    return this.issueTokens(usuario.id_usuario, payload);
  }

  async refresh(refreshTokenPlain: string): Promise<AuthResult> {
    const tokenHash = this.hashToken(refreshTokenPlain);
    const stored = await this.prisma.refresh_tokens.findUnique({
      where: { token_hash: tokenHash },
      include: { usuarios: true },
    });

    if (!stored || stored.revoked_at || stored.expires_at < new Date()) {
      throw new UnauthorizedException('Sesión inválida o expirada');
    }

    await this.prisma.refresh_tokens.update({
      where: { id_refresh_token: stored.id_refresh_token },
      data: { revoked_at: new Date() },
    });

    const usuario = await this.loadUsuarioConRolesYPermisos(
      stored.usuarios.nombre_usuario,
    );
    if (
      !usuario ||
      usuario.estados.nombreEstado.trim().toLowerCase() !== 'activo'
    ) {
      throw new UnauthorizedException('El usuario no está activo');
    }

    const { roles, permisos } = this.buildPayload(usuario);
    const payload: JwtPayload = {
      sub: usuario.id_usuario,
      nombre_usuario: usuario.nombre_usuario,
      roles,
      permisos,
    };

    return this.issueTokens(usuario.id_usuario, payload);
  }

  async logout(refreshTokenPlain: string): Promise<void> {
    const tokenHash = this.hashToken(refreshTokenPlain);
    await this.prisma.refresh_tokens.updateMany({
      where: { token_hash: tokenHash, revoked_at: null },
      data: { revoked_at: new Date() },
    });
  }
}

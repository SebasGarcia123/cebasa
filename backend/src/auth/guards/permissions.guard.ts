import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from '../decorators/permissions.decorator.js';
import { JwtPayload } from '../types/jwt-payload.interface.js';

@Injectable()
export class PermissionsGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredPermissions = this.reflector.getAllAndOverride<string[]>(
      PERMISSIONS_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredPermissions || requiredPermissions.length === 0) {
      return true;
    }

    const user: JwtPayload | undefined = context
      .switchToHttp()
      .getRequest().user;
    if (user?.es_administrador) {
      return true;
    }

    const hasPermission = requiredPermissions.every((permission) =>
      user?.permisos?.includes(permission),
    );
    if (!hasPermission) {
      throw new ForbiddenException(
        'No tenés los permisos necesarios para esta acción',
      );
    }
    return true;
  }
}

import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from '../decorators/roles.decorator.js';
import { JwtPayload } from '../types/jwt-payload.interface.js';

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<string[]>(
      ROLES_KEY,
      [context.getHandler(), context.getClass()],
    );
    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }

    const user: JwtPayload | undefined = context
      .switchToHttp()
      .getRequest().user;
    if (user?.es_administrador) {
      return true;
    }

    const hasRole = user?.roles?.some((role) => requiredRoles.includes(role));
    if (!hasRole) {
      throw new ForbiddenException(
        'No tenés el rol necesario para esta acción',
      );
    }
    return true;
  }
}

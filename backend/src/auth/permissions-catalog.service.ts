import { Injectable } from '@nestjs/common';
import { DiscoveryService, MetadataScanner, Reflector } from '@nestjs/core';
import { PERMISSIONS_KEY } from './decorators/permissions.decorator.js';

@Injectable()
export class PermissionsCatalogService {
  constructor(
    private readonly discoveryService: DiscoveryService,
    private readonly metadataScanner: MetadataScanner,
    private readonly reflector: Reflector,
  ) {}

  /**
   * Lee, via reflection, todos los @RequirePermissions(...) realmente
   * aplicados en el codigo. Es la unica fuente de verdad: si un permiso
   * no aparece aca, no protege nada, sin importar lo que diga la tabla `permisos`.
   */
  getAvailablePermissions(): string[] {
    const permissions = new Set<string>();

    for (const wrapper of this.discoveryService.getControllers()) {
      const instance = wrapper.instance;
      if (!instance) continue;

      const prototype = Object.getPrototypeOf(instance);
      for (const methodName of this.metadataScanner.getAllMethodNames(prototype)) {
        const handler = prototype[methodName];
        const methodPermissions = this.reflector.get<string[] | undefined>(
          PERMISSIONS_KEY,
          handler,
        );
        methodPermissions?.forEach((permission) => permissions.add(permission));
      }
    }

    return [...permissions].sort();
  }
}

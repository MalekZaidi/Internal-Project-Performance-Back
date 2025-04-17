import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ROLES_KEY } from './roles.decorator';

@Injectable()
export class RoleGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.get<string[]>(ROLES_KEY, context.getHandler());
    if (!requiredRoles) return true; 

    const request = context.switchToHttp().getRequest();
    const user = request.user;

    if (!user  ) {
      throw new ForbiddenException('You are not authenticated');
    } 

    if (!user.role) {
      throw new ForbiddenException('You do not have a role assigned')
    }
    console.log('🔑 User Role:', user.role);
    console.log('✅ Required Roles:', requiredRoles);
    
    if (!requiredRoles.includes(user.role)) {
      throw new ForbiddenException('You do not have the required permissions');
    }

    return true;
  }
}

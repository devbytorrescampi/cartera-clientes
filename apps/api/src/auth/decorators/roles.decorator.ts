import { SetMetadata } from '@nestjs/common';
import { Rol } from '@prisma/client';

export const ROLES_PERMITIDOS = 'rolesPermitidos';

export const Roles = (...roles: Rol[]) => SetMetadata(ROLES_PERMITIDOS, roles);

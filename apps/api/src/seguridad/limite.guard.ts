import { Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { Request } from 'express';

/** Rate limiting por IP real del cliente cuando el front la informa (ver verificarProxy). */
@Injectable()
export class LimiteGuard extends ThrottlerGuard {
  protected getTracker(req: Request): Promise<string> {
    return Promise.resolve(req.ipCliente ?? req.ip ?? 'desconocida');
  }
}

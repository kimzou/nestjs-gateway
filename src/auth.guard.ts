import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import { GqlExecutionContext } from '@nestjs/graphql';
import { AuthenticationError } from 'apollo-server-express';
import * as admin from 'firebase-admin';
import { Observable } from 'rxjs';

@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const ctx = GqlExecutionContext.create(context);
    const req = ctx.getContext().request;
    const sessionCookie = req.cookies
    console.log('------- GUARD')
    console.log('------- GUARD', { sessionCookie })
    return true;
  }

  async validateSessionCookie(cookie: string) {
    // let decodedClaims: admin.auth.DecodedIdToken

    try {
      const decodedClaims = await admin
        .auth()
        .verifySessionCookie(cookie, true /** checkRevoked */)
      console.log('guard', { decodedClaims })
    } catch (error) {
      new AuthenticationError(error)
    }
  }
}

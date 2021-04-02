import { Module } from '@nestjs/common';
import { GATEWAY_BUILD_SERVICE, GraphQLGatewayModule } from '@nestjs/graphql';
import { AuthenticationError } from 'apollo-server-express';
import * as admin from 'firebase-admin';
import AuthenticatedDataSource from './authenticated-data-source';
@Module({
  providers: [
    {
      provide: AuthenticatedDataSource,
      useValue: AuthenticatedDataSource
    },
    {
      provide: GATEWAY_BUILD_SERVICE,
      useFactory: AuthenticatedDataSource => {
        return ({ url }) => new AuthenticatedDataSource({ url });
      },
      inject: [AuthenticatedDataSource]
    }
  ],
  exports: [GATEWAY_BUILD_SERVICE]
})
class BuildServiceModule {}

@Module({
  imports: [
    GraphQLGatewayModule.forRootAsync({
      useFactory: async () => ({
        // fieldMiddleware: [validateSessionCookie],
        gateway: {
          serviceList: [
            { name: 'users', url: 'http://localhost:4000/graphql' },
            { name: 'auth', url: 'http://localhost:4002/graphql' }
            // { name: 'posts', url: 'http://localhost:4001/graphql' },
          ],
        },
        server: {
          context: async ({ req, res }) => {
            // console.log('%%%%% context')
            const session = req.cookies?.['session-cookie']
            // console.log('req.cookies', req.cookies)
            let decodedClaims: admin.auth.DecodedIdToken
            if (session) {
              try {
                decodedClaims = await admin
                  .auth()
                  .verifySessionCookie(session, true /** checkRevoked */)
                console.log('context', {decodedClaims})
              } catch (error) {
                new AuthenticationError(error)
              }
            }

            return {
              req,
              res,
              role: decodedClaims?.role,
              id: decodedClaims?.id,
            }
          }
        },
      }),
      imports: [BuildServiceModule],
      inject: [GATEWAY_BUILD_SERVICE]
    }),
  ],
})

export class AppModule {}

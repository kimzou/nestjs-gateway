import { RemoteGraphQLDataSource } from '@apollo/gateway';
import { Module } from '@nestjs/common';
import { GATEWAY_BUILD_SERVICE, GraphQLGatewayModule } from '@nestjs/graphql';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { GraphQLResponse } from 'apollo-server-types';
import * as admin from 'firebase-admin';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  // modify your gateway's requests to the implementing service before they're sent
  async willSendRequest({ request, context }) {
    // console.log('------ willSendRequest context?.req?.cookies', context?.req?.cookies) // cookies are set
    // console.log('------ willSendRequest context.req.headers', context.req?.headers) // session cookie not set, (appears in browser if refresh)
    console.log('------ willSendRequest context.jwt', context?.jwt)
    // const session = context?.session;
    // if (session) {
    //   admin
    //     .auth()
    //     .verifySessionCookie(session, true /** checkRevoked */)
    //     .then((decodedClaims) => {
    //       // request.http.headers.set('Authorization', session)
    //       console.log({decodedClaims})
    //       request.http.headers.set('x-user-id', decodedClaims)
    //     })
    //     .catch((error) => {
    //       new AuthenticationError(error)
    //     });
    // }
    console.log('------ willSendRequest request.http.headers', request.http.headers)
  }

  // modify the implementing service's responses before the gateway passes them along to the requesting client
  async didReceiveResponse({ request, response, context }): Promise<GraphQLResponse> {
    // response.http.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    console.log('++++++ didResponse response.http.headers', response.http.headers) // origin set from users cors origin

    // set response header origin to the request origin (CORS errors)
    context?.res?.set('Access-Control-Allow-Origin', context.req?.headers.origin)
    // append the cookie to the response to see it in the browser
    const sessionCookie = response.http.headers.get('set-cookie')
    if (sessionCookie) context.res.append('set-cookie', sessionCookie);
    // console.log('++++++ didResponse context?.res', context?.res)

    return response;
  }

  async errorFromResponse(response) {
    const message = `${response.status}: ${response.statusText}`;

    let error: ApolloError;
    if (response.status === 401) {
      error = new AuthenticationError(message);
    } else if (response.status === 403) {
      error = new ForbiddenError(message);
    } else {
      error = new ApolloError(message);
    }

    return error;
  }
}

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
        // cors: {
        //   // credentials: 'include',
        //   credentials: true,
        //   origin: 'http://localhost:3000'
        // },
        gateway: {
          serviceList: [
            { name: 'users', url: 'http://localhost:4000/graphql' },
            // { name: 'posts', url: 'http://localhost:4001/graphql' },
          ],
        },
        server: {
          // context: ({ req }) => ({
          //   // jwt: req.headers.authorization,
          //   jwt: req.signedCookies?.['session-cookie'],
          //   cors: true,
          // })
          context: async ({ req, res }) => {
            // console.log('%%%%% context')
            const session = req.cookies?.['session-cookie']
            console.log('req.cookies', req.cookies)
            let decodedClaims: admin.auth.DecodedIdToken
            let userId: string;
            if (session) {
              try {
                decodedClaims = await admin
                  .auth()
                  .verifySessionCookie(session, true /** checkRevoked */)
                console.log({decodedClaims})
                console.log('admin.auth().getUser(decodedClaims.uid)', await admin.auth().getUser(decodedClaims.uid))
              } catch (error) {
                new AuthenticationError(error)
              }
            }

            return {
              req,
              res,
              userId: decodedClaims?.uid
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

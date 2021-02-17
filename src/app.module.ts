import { RemoteGraphQLDataSource } from '@apollo/gateway';
import { Module } from '@nestjs/common';
import { GATEWAY_BUILD_SERVICE, GraphQLGatewayModule } from '@nestjs/graphql';
import {
  GraphQLResponse
} from 'apollo-server-types';
class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  // modify your gateway's requests to the implementing service before they're sent
  async willSendRequest({ request, context }) {
    console.log('------ willSendRequest request.http.headers', request.http.headers)
    // console.log('------ willSendRequest context?.req?.cookies', context?.req?.cookies) // cookies are set
    // console.log('------ willSendRequest context.req.headers', context.req?.headers) // session cookie not set, (appears in browser if refresh)
    console.log('------ willSendRequest request.http.cookies', request.http.headers)

    // const { userId } = await decode(context.jwt);
    // request.http.headers.set('Access-Control-Allow-Origin', context.req?.headers.origin);
    // request.http.headers.set('x-user-id', 'hello');
    // if (context.jwt) request.http.headers.set('session-cookie', context.jwt)
    // check req.signedCookies
  }

  // modify the implementing service's responses before the gateway passes them along to the requesting client
  async didReceiveResponse({ request, response, context }): Promise<GraphQLResponse> {
    // console.log('++++++ didResponse response.http.headers', response.http.headers)
    // request.http.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000')

    // set response header origin to the request origin (CORS errors)
    context?.res?.set('Access-Control-Allow-Origin', context.req?.headers.origin)
    // append the cookie to the response to see it in the browser
    const sessionCookie = response.http.headers.get('set-cookie')
    if (sessionCookie) context.res.append('set-cookie', sessionCookie);

    return response;
  }


  //TODO: handle errors
  // didEncounterError(error, request) {
  //   throw error;
  // }

  // async errorFromResponse(response) {
  //   const message = `${response.status}: ${response.statusText}`;

  //   let error: ApolloError;
  //   if (response.status === 401) {
  //     error = new AuthenticationError(message);
  //   } else if (response.status === 403) {
  //     error = new ForbiddenError(message);
  //   } else {
  //     error = new ApolloError(message);
  //   }

  //   return error;
  // }
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

            // { name: 'users', url: 'http://user-service/graphql' },
            // { name: 'posts', url: 'http://post-service/graphql' },
          ],
        },
        server: {
          // context: ({ req }) => ({
          //   // jwt: req.headers.authorization,
          //   jwt: req.signedCookies?.['session-cookie'],
          //   cors: true,
          // })
          // context: ({ req, res }) => {
          //   console.log('context headers', req.headers)
          //   console.log('context signedcookie', req.signedCookies)
          //   console.log('context user', req.user)
          // }
          context: ({ req, res }) => ({ req, res })
        },
      }),
      imports: [BuildServiceModule],
      inject: [GATEWAY_BUILD_SERVICE]
    }),
  ],
})

  // @Module({
  //   imports: [
  //     GraphQLGatewayModule.forRoot({
  //       server: {
  //         // ... Apollo server options
  //         cors: true,
  //       },
  //       gateway: {
  //         serviceList: [
  //           { name: 'users', url: 'http://localhost:4000/graphql' },
  //           { name: 'posts', url: 'http://localhost:4001/graphql' },
  //         ],
  //       },
  //     }),
  //   ],
  // })

export class AppModule {}

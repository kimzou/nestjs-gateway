import { RemoteGraphQLDataSource } from '@apollo/gateway';
import { ApolloError, AuthenticationError, ForbiddenError } from 'apollo-server-express';
import { GraphQLResponse } from 'apollo-server-types';
import * as csurf from 'csurf';

class AuthenticatedDataSource extends RemoteGraphQLDataSource {
  // modify your gateway's requests to the implementing service before they're sent
  async willSendRequest({ request, context }) {
    // console.log('------ willSendRequest context?.req?.cookies', context?.req?.cookies) // cookies are set
    // console.log('------ willSendRequest context.req.headers', context.req?.headers) // session cookie not set, (appears in browser if refresh)
    console.log('------ willSendRequest request.http.headers', request.http.headers)
    // console.log('------ willSendRequest request.csrfToken()', request.csrfToken())
    // if undefined, there is no request object coming from a client
    if (context.req === undefined) return
    request.http.headers.set('x-user-id', context?.id)
    request.http.headers.set('x-user-role', context?.role)
    request.http.headers.set('CSRF-Token', context?.csrfToken)
    // context.req.http.headers.set('x-user-uid', context?.userUid)

  }

  // modify the implementing service's responses before the gateway passes them along to the requesting client
  async didReceiveResponse({ request, response, context }): Promise<GraphQLResponse> {
    // response.http.headers.set('Access-Control-Allow-Origin', 'http://localhost:3000')
    console.log('++++++ didResponse request.http.headers', request.http.headers)
    // console.log('!!!!!!!!!       context?.csrfToken', context?.req?.csrfToken())
    // set response header origin to the request origin (CORS errors)
    context?.res?.set('Access-Control-Allow-Origin', context.req?.headers.origin)
    // const csrfToken = context?.req?.csrfToken()
    // if (csrfToken) response.http.headers.set('CSRF-Token', csrfToken)
    // append cookie to response to see it in the browser
    const sessionCookie = response.http.headers.get('set-cookie')
    if (sessionCookie) context.res.append('set-cookie', sessionCookie)
    console.log('++++++ didResponse response.http.headers', response.http.headers) // origin set from users cors origin
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
 export default AuthenticatedDataSource;
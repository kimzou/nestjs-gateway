import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import 'dotenv/config';
import * as admin from 'firebase-admin';
import * as csurf from 'csurf';
import * as helmet from 'helmet';

import { AppModule } from './app.module';
import { AuthGuard } from './auth.guard';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // firebase init
  admin.initializeApp({
    credential: admin.credential.cert({
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      projectId: process.env.FIREBASE_PROJECT_ID,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    })
  });
  app.use(helmet());
  // authorize cookies to be send
  app.enableCors({
    credentials: true,
    origin: ['http://localhost:3000', 'http://localhost:2000']
  })
    // gives no access to gateway playground
  // app.enableCors({
  //   origin: (origin, callback) => {
  //     console.log('!!!! ', {origin})
  //     const allowList = process.env.CLIENTS_URL.split(';')
  //     console.log({allowList})
  //     if (allowList.indexOf(origin) !== -1) {
  //       callback(null, true)
  //     } else {
  //       callback(new Error(`Origin not allowed by CORS for ${origin}`))
  //     }
  //   },
  //   allowedHeaders: 'x-user-uid, Content-Type, Accept, Observe',
  //   methods: 'GET,PUT,POST,DELETE,UPDATE,OPTIONS',
  //   credentials: true,
  // })
  app.use(cookieParser());
  // must be after cookieParser
  app.use(csurf({
    // value: (req) => {
    //   // get from context.req ?
    //   const headers  = req.headers
    //   console.log('---------------', {headers})
    //   console.log('in middleware req.csrfToken()', req.csrfToken())

    //   return req.csrfToken()
    // },
    // cookie: {
    //   httpOnly: true,
    //   // sameSite: true
    // }
    cookie: true
  }));
  app.useGlobalGuards(new AuthGuard());

  await app.listen(3001);
}
bootstrap();

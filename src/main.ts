import { NestFactory } from '@nestjs/core';
import * as cookieParser from 'cookie-parser';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // app.use(
    //   expressJwt({
      //     secret: "SNK",
      //     algorithms: ["HS256"],
      //     credentialsRequired: false
      //   })
      // );
      // app.enableCors()
      app.use(cookieParser());
      app.enableCors({
        credentials: true,
        origin: 'http://localhost:3000'
      })
      // app.enableCors({ origin: true })
      // app.enableCors({
      //   "origin": "*",
      //   "methods": "GET,HEAD,PUT,PATCH,POST,DELETE",
      //   "preflightContinue": false,
      //   "optionsSuccessStatus": 204,
      //   "credentials": true
      // })
  await app.listen(3001);
}
bootstrap();

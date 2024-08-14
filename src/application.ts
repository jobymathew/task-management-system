import {BootMixin} from '@loopback/boot';
import {ApplicationConfig} from '@loopback/core';
import {
  RestExplorerBindings,
  RestExplorerComponent,
} from '@loopback/rest-explorer';
import {RepositoryMixin} from '@loopback/repository';
import {RestApplication} from '@loopback/rest';
import {ServiceMixin} from '@loopback/service-proxy';
import path from 'path';
import {MySequence} from './sequence';
import { RedisServiceProvider } from './services/redis.service';
import cors from 'cors';

// Authentication Components
import { AuthenticationComponent } from '@loopback/authentication';
import {
  JWTAuthenticationComponent,
  UserServiceBindings,
} from '@loopback/authentication-jwt';
import { DbDataSource } from './datasources';
import { RateLimiterMemory } from 'rate-limiter-flexible';


export {ApplicationConfig};

export class TaskManagementSystemApplication extends BootMixin(
  ServiceMixin(RepositoryMixin(RestApplication)),
) {
  constructor(options: ApplicationConfig = {}) {
    super(options);

    // Set up the custom sequence
    this.sequence(MySequence);

    // Set up default home page
    this.static('/', path.join(__dirname, '../public'));

    // Customize @loopback/rest-explorer configuration 
    this.configure(RestExplorerBindings.COMPONENT).to({
      path: '/explorer',
    });
    this.component(RestExplorerComponent);

    this.projectRoot = __dirname;
    // Customize @loopback/boot Booter Conventions 
    this.bootOptions = {
      controllers: {
        // Customize ControllerBooter Conventions 
        dirs: ['controllers'],
        extensions: ['.controller.js'],
        nested: true,
      },
    };

    // Set up CORS options
    this.configure('rest').to({
      cors: {
        origin: 'http://localhost:8080',
        credentials: true,
      },
    });

    // Authenticaiton omponent
    this.component(AuthenticationComponent);
    this.component(JWTAuthenticationComponent);

    this.dataSource(DbDataSource, UserServiceBindings.DATASOURCE_NAME);

    // redis
    this.bind('services.RedisService').toProvider(RedisServiceProvider);

    // rate limiter
    const rateLimiter = new RateLimiterMemory({
      points: 10, // Number of points
      duration: 1, // Per second
    });


    // FIX THIS AT 2'0 CLOCK
    
    // this.middleware((ctx, next) => {
    //   return rateLimiter.consume(ctx.request.ip)
    //     .then(() => next())
    //     .catch(() => {
    //       ctx.response.status(429).send('Too Many Requests');
    //     });
    // });
  }

  

}

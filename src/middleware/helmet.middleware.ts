import {MiddlewareSequence, RequestContext} from '@loopback/rest';
import helmet from 'helmet';

export class MyMiddlewareSequence extends MiddlewareSequence {
  async handle(context: RequestContext) {
    // Apply Helmet middleware
    await new Promise<void>((resolve, reject) => {
      helmet()(context.request, context.response, (err?: unknown) => {
        if (err) reject(err);
        else resolve();
      });
    });

    // Continue with the default sequence
    await super.handle(context);
  }
}

export type RequestContext = {
  user: string;
  path: string;
};

export type Response = {
  status: number;
  body: unknown;
};

export type Handler = (ctx: RequestContext) => Promise<Response>;
export type Middleware = (next: Handler) => Handler;

export const chainMiddleware =
  (...middleware: readonly Middleware[]) =>
  (handler: Handler): Handler =>
    middleware.reduceRight((next, layer) => layer(next), handler);

export const requireUser = (): Middleware => (next) => async (ctx) => {
  if (ctx.user.trim() === "") {
    return { status: 401, body: { error: "unauthenticated" } };
  }
  return next(ctx);
};

export const auditPath =
  (events: string[]): Middleware =>
  (next) =>
  async (ctx) => {
    events.push(`${ctx.user} ${ctx.path}`);
    return next(ctx);
  };

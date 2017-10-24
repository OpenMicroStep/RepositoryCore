export type ModuleMultiDb = {
  type: "multidb",
  path: string,
  resolve_customer_uuid_url: string,
  resolve_customer_name_url: string,
  pg_option: any,
}
export type ModuleSingleDb = {
  type: "singledb",
  path: string,
}
export type SessionMongo = {
  type: "mongo",
  url: string,
  secret: string,
  collection: string,
  ttl: number,
  options: any,
}
export type SessionMemory = {
  type: "memory",
  secret: string,
  ttl: number,
}
export type Module = ModuleMultiDb | ModuleSingleDb;
export type Config = {
  modules: (ModuleMultiDb | ModuleSingleDb)[],
  session: (SessionMongo | SessionMemory),
  port: number,
}
export const config: Config = {
  modules: [
    {
      type: "singledb",
      path: "/",
    }
  ],
  session: {
    type: "memory",
    secret: 'keyboard cat',
    ttl: 1 * 24 * 60 * 60, // 1 Day
  },
  port: 8080,
};

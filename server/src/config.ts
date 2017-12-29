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
  pairing: {
    fingerprint: string,
    pki_dir?: string,
  }
  port: number,
}
export const config: Config = {
  modules: [
    {
      type: "multidb",
      path: "/",
      resolve_customer_uuid_url: "http://services:8803/admin/resolveCustomerUUID?uuid=",
      resolve_customer_name_url: "http://services:8803/admin/resolveCustomerName?customer=",
      pg_option: { max: 4 },
    }
  ],
  session: {
    type: "mongo",
    url: "mongodb://mongodb:27017/session",
    secret: 'keyboard cat',
    collection: "sessions",
    ttl: 1 * 24 * 60 * 60, // 1 Day
    options: { poolSize: 4 },
  },
  pairing: {
    fingerprint: "9F:9C:B3:65:6A:83:EB:22:63:76:7A:6B:7B:AA:E7:E8:E9:82:44:5E".replace(/:/g, ''),
    pki_dir: "/pki",
  },
  port: 8080,
}

import "server-only";
import { mkdirSync } from "node:fs";
import { dirname } from "node:path";
import { sql } from "drizzle-orm";
import * as schema from "./schema";

const DDL = [
  sql`CREATE TABLE IF NOT EXISTS registros (
    id SERIAL PRIMARY KEY,
    transcricao TEXT NOT NULL,
    categoria VARCHAR NOT NULL,
    subcategoria VARCHAR NOT NULL,
    tema VARCHAR NOT NULL,
    resumo TEXT NOT NULL,
    data_hora TIMESTAMP DEFAULT timezone('America/Sao_Paulo', now()),
    bairro VARCHAR NOT NULL,
    origem VARCHAR NOT NULL,
    telefone VARCHAR(20)
  )`,
  sql`CREATE TABLE IF NOT EXISTS limites (
    chave TEXT PRIMARY KEY,
    contagem INTEGER NOT NULL,
    janela_inicio TIMESTAMPTZ NOT NULL
  )`,
];

const conectar = async () => {
  const url = process.env.DB_URL;
  if (!url) throw new Error("DB_URL não configurada.");

  let db;
  if (url.startsWith("pglite:")) {
    const [{ PGlite }, { drizzle }] = await Promise.all([import("@electric-sql/pglite"), import("drizzle-orm/pglite")]);
    const pasta = url.slice("pglite:".length);
    mkdirSync(dirname(pasta), { recursive: true });
    db = drizzle(new PGlite(pasta), { schema });
  } else {
    const [{ Pool }, { drizzle }] = await Promise.all([import("pg"), import("drizzle-orm/node-postgres")]);
    db = drizzle(new Pool({ connectionString: url, max: 10, idleTimeoutMillis: 30000 }), { schema });
  }
  for (const ddl of DDL) await db.execute(ddl);
  return db;
};

export const getDb = () => (globalThis.__dbPromise ??= conectar().catch((e) => {
  globalThis.__dbPromise = undefined;
  throw e;
}));

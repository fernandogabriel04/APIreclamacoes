import "server-only";
import { createHash } from "node:crypto";
import { sql } from "drizzle-orm";
import { getDb } from "./db";

export const identificarCliente = (headers) => {
  const ip = headers.get("x-forwarded-for")?.split(",")[0].trim() || headers.get("x-real-ip") || "desconhecido";
  return createHash("sha256").update(`${process.env.AUTH_SECRET ?? ""}:${ip}`).digest("hex").slice(0, 32);
};

export async function dentroDoLimite(chave, maximo, janelaSegundos) {
  const db = await getDb();
  const resultado = await db.execute(sql`
    INSERT INTO limites (chave, contagem, janela_inicio)
    VALUES (${chave}, 1, now())
    ON CONFLICT (chave) DO UPDATE SET
      contagem = CASE WHEN limites.janela_inicio < now() - make_interval(secs => ${janelaSegundos}::double precision)
                      THEN 1 ELSE limites.contagem + 1 END,
      janela_inicio = CASE WHEN limites.janela_inicio < now() - make_interval(secs => ${janelaSegundos}::double precision)
                           THEN now() ELSE limites.janela_inicio END
    RETURNING contagem
  `);
  return Number(resultado.rows[0].contagem) <= maximo;
}

import { cacheLife, cacheTag } from "next/cache";
import { getRegistros } from "./api";

export async function getDados() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  cacheTag("registros");

  const registros = await getRegistros();
  return {
    geradoEm: Date.now(),
    registros: registros.map(({ transcricao, ...resto }) => resto),
  };
}

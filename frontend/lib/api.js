import { cacheLife, cacheTag } from "next/cache";
import { listarRegistros } from "./server/relatos";

export async function getRegistros() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  cacheTag("registros");

  return listarRegistros();
}

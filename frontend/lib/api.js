import { cacheLife, cacheTag } from "next/cache";

const apiOrigin = () => {
  if (process.env.API_URL) return process.env.API_URL.replace(/\/$/, "");
  return new URL(process.env.NEXT_PUBLIC_API_URL ?? "http://localhost:5001").origin;
};

export async function getRegistros() {
  "use cache";
  cacheLife({ stale: 30, revalidate: 60, expire: 600 });
  cacheTag("registros");

  const res = await fetch(`${apiOrigin()}/api/dashboard/registros`, {
    headers: { "X-Access-Key": process.env.ACCESS_KEY ?? "" },
  });
  if (!res.ok) throw new Error(`API respondeu ${res.status}`);
  return res.json();
}

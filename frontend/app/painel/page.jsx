import { Suspense } from "react";
import { cookies } from "next/headers";
import SiteHeader from "../components/SiteHeader";
import SiteFooter from "../components/SiteFooter";
import { COOKIE_SESSAO, sessaoValida } from "../../lib/auth";
import { getDados } from "../../lib/dashboard";
import { sair } from "./actions";
import Login from "./_components/Login";
import Painel from "./_components/Painel";

export const metadata = { title: "Painel da Ouvidoria", robots: { index: false } };

const um = (v) => (Array.isArray(v) ? v[0] : v) ?? "";

export default function PainelPage({ searchParams }) {
  return (
    <Suspense fallback={<Esqueleto />}>
      <Conteudo searchParams={searchParams} />
    </Suspense>
  );
}

async function Conteudo({ searchParams }) {
  const autenticado = sessaoValida((await cookies()).get(COOKIE_SESSAO)?.value);
  if (!autenticado) {
    return (
      <>
        <Login />
        <SiteFooter />
      </>
    );
  }

  const sp = await searchParams;
  const filtros = Object.fromEntries(["ano", "origem", "categoria", "subcategoria", "bairro", "mes", "q"].map((k) => [k, um(sp[k])]));

  let dados;
  try {
    dados = await getDados();
  } catch {
    return (
      <>
        <Topo />
        <main className="flex-1 mx-auto max-w-3xl px-4 py-16 text-center">
          <h1 className="text-2xl font-extrabold text-maceio-navy">Não foi possível carregar os dados</h1>
          <p className="mt-2 text-maceio-muted">Verifique se a API está no ar e se a chave de acesso confere. Depois, atualize a página.</p>
        </main>
        <SiteFooter />
      </>
    );
  }

  return (
    <>
      <Topo />
      <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8">
        <Painel registros={dados.registros} geradoEm={dados.geradoEm} inicial={filtros} />
      </main>
      <SiteFooter />
    </>
  );
}

function Topo() {
  return (
    <SiteHeader>
      <form action={sair}>
        <button className="rounded-lg bg-maceio-navy px-3 py-1.5 text-sm font-bold text-white hover:bg-maceio-deep transition">Sair</button>
      </form>
    </SiteHeader>
  );
}

function Esqueleto() {
  return (
    <main className="flex-1 mx-auto w-full max-w-7xl px-4 sm:px-6 py-8" aria-busy="true">
      <div className="h-9 w-72 animate-pulse rounded-lg bg-maceio-line" />
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {[0, 1, 2, 3].map((i) => <div key={i} className="h-28 animate-pulse rounded-2xl bg-maceio-line" />)}
      </div>
      <div className="mt-6 h-80 animate-pulse rounded-2xl bg-maceio-line" />
    </main>
  );
}

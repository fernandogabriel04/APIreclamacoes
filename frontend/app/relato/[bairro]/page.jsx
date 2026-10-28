import Link from "next/link";
import { notFound } from "next/navigation";
import SiteHeader from "../../components/SiteHeader";
import SiteFooter from "../../components/SiteFooter";
import Recorder from "../../components/Recorder";
import { BAIRROS, bairroPorSlug, slugify } from "../../../lib/bairros";

export function generateStaticParams() {
  return BAIRROS.map((b) => ({ bairro: slugify(b) }));
}

export async function generateMetadata({ params }) {
  const bairro = bairroPorSlug((await params).bairro);
  return { title: bairro ? `Relato em ${bairro}` : "Relato" };
}

const dicas = [
  "Fale com calma, em um lugar sem muito barulho.",
  "Diga o problema e o endereço ou ponto de referência.",
  "O assunto precisa ser sobre o município de Maceió.",
];

export default async function RelatoPage({ params }) {
  const bairro = bairroPorSlug((await params).bairro);
  if (!bairro) notFound();

  return (
    <>
      <SiteHeader />
      <main className="flex-1 mx-auto w-full max-w-6xl px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-wrap items-center gap-3">
          <span className="inline-flex items-center gap-2 rounded-full bg-maceio-sky px-4 py-2 text-sm font-bold text-maceio-navy">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" aria-hidden><path d="M12 2a7 7 0 0 0-7 7c0 5.2 7 13 7 13s7-7.8 7-13a7 7 0 0 0-7-7Zm0 9.5A2.5 2.5 0 1 1 12 6.5a2.5 2.5 0 0 1 0 5Z" /></svg>
            {bairro}
          </span>
          <Link href="/" className="text-sm font-bold text-maceio-blue hover:underline">Trocar bairro</Link>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-5">
          <section className="lg:col-span-3 bg-white rounded-3xl shadow-card p-6 sm:p-10">
            <h1 className="text-3xl font-extrabold text-maceio-navy">Conte o que está acontecendo</h1>
            <p className="mt-2 text-maceio-muted">Toque no microfone e fale por até 1 minuto.</p>
            <Recorder bairro={bairro} />
          </section>

          <aside className="lg:col-span-2 bg-maceio-navy text-white rounded-3xl p-6 sm:p-8 self-start">
            <h2 className="text-lg font-extrabold">Antes de gravar</h2>
            <ul className="mt-4 space-y-4">
              {dicas.map((d) => (
                <li key={d} className="flex gap-3">
                  <span className="mt-1 h-2.5 w-2.5 shrink-0 rounded-full bg-maceio-orange" aria-hidden />
                  <span className="text-white/90">{d}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm text-white/70">Permita o uso do microfone quando o navegador pedir.</p>
          </aside>
        </div>
      </main>
      <SiteFooter />
    </>
  );
}

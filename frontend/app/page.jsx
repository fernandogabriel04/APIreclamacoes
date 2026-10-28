import SiteHeader from "./components/SiteHeader";
import SiteFooter from "./components/SiteFooter";
import LocalizacaoGate from "./components/LocalizacaoGate";

const passos = [
  { n: "1", titulo: "Diga onde você está", texto: "Usamos sua localização ou você escolhe o bairro." },
  { n: "2", titulo: "Grave seu áudio", texto: "Fale por até 1 minuto sobre o que pode melhorar." },
  { n: "3", titulo: "Pronto", texto: "Transcrevemos e encaminhamos para a área responsável." },
];

export default function HomePage() {
  return (
    <>
      <SiteHeader />
      <main className="flex-1">
        <section className="relative overflow-hidden bg-gradient-to-br from-maceio-deep via-maceio-navy to-maceio-blue text-white">
          <div className="absolute -right-24 -top-24 h-96 w-96 rounded-full bg-maceio-orange/20 blur-3xl" aria-hidden />
          <div className="relative mx-auto max-w-6xl px-4 sm:px-6 py-14 sm:py-20 grid lg:grid-cols-2 gap-10 items-center">
            <div>
              <p className="inline-block rounded-full bg-white/15 px-4 py-1.5 text-sm font-semibold">Ouvidoria Inteligente</p>
              <h1 className="mt-5 text-4xl sm:text-5xl font-extrabold leading-tight">
                Sua voz ajuda a<br />
                <span className="text-maceio-orange">melhorar Maceió.</span>
              </h1>
              <p className="mt-5 text-lg text-white/85 max-w-xl">
                Grave um áudio contando o que acontece no seu bairro: buraco, iluminação, limpeza, saúde, transporte.
                Nós ouvimos, organizamos e levamos para quem pode resolver.
              </p>
            </div>
            <div className="flex lg:justify-end">
              <LocalizacaoGate />
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-6xl px-4 sm:px-6 py-12">
          <h2 className="text-2xl font-extrabold text-maceio-navy">Como funciona</h2>
          <ol className="mt-6 grid gap-4 sm:grid-cols-3">
            {passos.map((p) => (
              <li key={p.n} className="bg-white rounded-2xl shadow-card p-6">
                <span className="flex h-10 w-10 items-center justify-center rounded-full bg-maceio-orange font-extrabold text-white">{p.n}</span>
                <p className="mt-4 font-bold text-maceio-navy">{p.titulo}</p>
                <p className="mt-1 text-maceio-muted">{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>
      </main>
      <SiteFooter />
    </>
  );
}

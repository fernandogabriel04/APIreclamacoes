import { cacheLife } from "next/cache";

export default async function SiteFooter() {
  "use cache";
  cacheLife("days");

  return (
    <footer className="mt-auto bg-maceio-deep text-white/80">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 py-6 text-sm flex flex-col sm:flex-row gap-2 justify-between">
        <p>© {new Date().getFullYear()} Prefeitura de Maceió. Todos os direitos reservados.</p>
        <p>Desenvolvido por FGC Desenvolvimento e Tecnologia</p>
      </div>
    </footer>
  );
}

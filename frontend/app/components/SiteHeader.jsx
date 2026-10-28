import Link from "next/link";

export default function SiteHeader({ children }) {
  return (
    <header className="bg-white border-b border-maceio-line">
      <div className="mx-auto max-w-6xl px-4 sm:px-6 h-20 flex items-center justify-between gap-4">
        <Link href="/" aria-label="Prefeitura de Maceió, início" className="flex items-center gap-3">
          <img src="/logo.svg" alt="Prefeitura de Maceió" className="h-14 w-auto" />
        </Link>
        <div className="flex items-center gap-4">
          <span className="hidden sm:block text-sm font-semibold text-maceio-navy">Ouvidoria Inteligente</span>
          {children}
        </div>
      </div>
      <div className="h-1 bg-gradient-to-r from-maceio-navy via-maceio-blue to-maceio-orange" />
    </header>
  );
}

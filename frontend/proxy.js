import { NextResponse } from "next/server";

const PAINEL = "/painel";

export function proxy(request) {
  const host = request.headers.get("host") ?? "";
  const { pathname } = request.nextUrl;
  const noPainel = host.startsWith("dashboard.");
  // *.vercel.app não aceita subdomínios, então o painel fica acessível por /painel.
  const dominioVercel = host.split(":")[0].endsWith(".vercel.app");

  if (noPainel) {
    if (pathname === PAINEL || pathname.startsWith(`${PAINEL}/`)) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = pathname === "/" ? PAINEL : `${PAINEL}${pathname}`;
    return NextResponse.rewrite(url);
  }

  if (pathname === PAINEL || pathname.startsWith(`${PAINEL}/`)) {
    return dominioVercel ? NextResponse.next() : NextResponse.redirect(new URL("/", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/|.*\\..*).*)"],
};

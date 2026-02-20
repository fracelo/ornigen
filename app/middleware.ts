import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const rotaAtual = url.pathname;

  // 🔹 REGRA DE OURO: Liberar impressão sem checar cookies
  if (rotaAtual.includes("imprimir")) {
    return NextResponse.next();
  }

  const rotasLivres = ["/login", "/empresa", "/convite-empresa"];
  if (rotasLivres.some((rota) => rotaAtual.startsWith(rota))) {
    return NextResponse.next();
  }

  const empresaId = req.cookies.get("empresaId")?.value;

  if (!empresaId) {
    url.pathname = "/empresa";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next|api|public).*)"],
};
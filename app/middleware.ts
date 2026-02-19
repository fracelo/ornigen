import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();

  // Recupera empresaId salvo em cookie (ou outra forma de sessão)
  const empresaId = req.cookies.get("empresaId")?.value;

  // Rotas que não precisam de empresa vinculada
  const rotasLivres = ["/login", "/empresa", "/convite-empresa"];

  const rotaAtual = url.pathname;

  // Se não tiver empresa vinculada e não estiver em rota livre → redireciona
  if (!empresaId && !rotasLivres.some((rota) => rotaAtual.startsWith(rota))) {
    url.pathname = "/empresa";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

// Configura quais rotas o middleware deve interceptar
export const config = {
  matcher: ["/((?!_next|api|public).*)"], // protege todas rotas exceto assets e API
};
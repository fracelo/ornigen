"use client";

import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useEmpresa } from "../context/empresaContext";
import CadastroEmpresaPage from "../empresas/page";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function SelecaoEmpresaPage() {
  const { setEmpresaId } = useEmpresa();
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [mostrarCadastro, setMostrarCadastro] = useState(false);

  useEffect(() => {
    const carregarEmpresas = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      const { data, error } = await supabase
        .from("usuario_empresa")
        .select("empresa_id, empresas(nome)")
        .eq("usuario_id", user.id);

      if (error || !data || data.length === 0) {
        setMostrarCadastro(true); // 🔹 sem empresas → abre cadastro
        return;
      }

      setEmpresas(data);

      if (data.length === 1) {
        setEmpresaId(data[0].empresa_id); // 🔹 seta direto se só tiver uma
      }
    };

    carregarEmpresas();
  }, []);

  if (mostrarCadastro) {
    return <CadastroEmpresaPage />; // 🔹 abre cadastro automático
  }

  return (
    <div>
      <h3>Selecione a empresa</h3>
      <select onChange={(e) => setEmpresaId(e.target.value)}>
        <option value="">-- escolha --</option>
        {empresas.map((e) => (
          <option key={e.empresa_id} value={e.empresa_id}>
            {e.empresas.nome}
          </option>
        ))}
      </select>
    </div>
  );
}
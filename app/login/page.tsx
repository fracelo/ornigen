"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEmpresa } from "../context/empresaContext";
import { useAuth } from "../context/authContext";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const router = useRouter();
  const { setEmpresaId, setNomeEmpresa } = useEmpresa();
  const { setUsuarioLogado } = useAuth();

  const handleLogin = async () => {
    setLoading(true);
    setMensagem("");

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem("Erro ao fazer login: " + error.message);
    } else {
      const user = data.user;

      const { data: empresas } = await supabase
        .from("empresa_usuarios")
        .select("empresa_id")
        .eq("usuario_id", user.id);

      if (!empresas || empresas.length === 0) {
        setUsuarioLogado(true);
        router.push("/empresas/app");
      } else if (empresas.length === 1) {
        const empresaId = empresas[0].empresa_id;

        const { data: empresaData } = await supabase
          .from("empresas")
          .select("razao_social")
          .eq("id", empresaId)
          .single();

        setEmpresaId(empresaId);
        setNomeEmpresa(empresaData?.razao_social);
        setUsuarioLogado(true);
        router.push("/inicial_page");
      } else {
        setUsuarioLogado(true);
        router.push("/selecionar-empresa");
      }
    }

    setLoading(false);
  };

  return (
    <div
      style={{
        backgroundColor: "#fff",
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      <h2 style={{ color: "#0d47a1", marginBottom: "20px" }}>Acessar Conta</h2>
      <img
        src="/logo-ornigen.png"
        alt="Logo"
        style={{ width: "150px", marginBottom: "20px" }}
      />

      <div
        style={{
          display: "flex",
          flexDirection: "column",
          gap: "15px",
          width: "300px",
        }}
      >
        <label htmlFor="email">E-mail</label>
        <input
          id="email"
          type="email"
          placeholder="Digite seu e-mail"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <label htmlFor="senha">Senha</label>
        <input
          id="senha"
          type="password"
          placeholder="Digite sua senha"
          value={senha}
          onChange={(e) => setSenha(e.target.value)}
        />

        <button onClick={handleLogin} disabled={loading}>
          {loading ? "Entrando..." : "Entrar"}
        </button>
      </div>

      {mensagem && <p style={{ color: "red", marginTop: "15px" }}>{mensagem}</p>}
    </div>
  );
}
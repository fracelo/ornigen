"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

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
      setMensagem("Login realizado com sucesso!");
      router.push("/inicial_page"); // 🔹 redireciona após login
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Logo */}
      <div className="logo-area">
        <img src="/logo-ornigen.png" alt="Logo" className="logo" />
      </div>

      {/* Card de login */}
      <div className="card login-card">
        <h2 className="login-title">Acessar Conta</h2>

        <div className="form-group">
          <input
            type="email"
            className="input"
            placeholder="Digite seu e-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />

          <input
            type="password"
            className="input"
            placeholder="Digite sua senha"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleLogin}
          disabled={loading}
        >
          {loading ? "Entrando..." : "Entrar"}
        </button>

        {mensagem && <p>{mensagem}</p>}

        {/* Links adicionais */}
        <div className="login-links">
          <a href="/registro">Novo registro</a>
          <a href="/recuperar-senha">Recuperar senha</a>
        </div>
      </div>
    </div>
  );
}
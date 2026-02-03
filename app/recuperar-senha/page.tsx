"use client";

import { useState } from "react";
import { supabase } from "../lib/supabaseClient";

export default function RecuperarSenhaPage() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const [loading, setLoading] = useState(false);

  const handleRecuperarSenha = async () => {
    setLoading(true);
    setMensagem("");

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/nova-senha`,
    });

    if (error) {
      setMensagem("Erro ao enviar e-mail: " + error.message);
    } else {
      setMensagem("Verifique sua caixa de entrada para redefinir a senha.");
    }

    setLoading(false);
  };

  return (
    <div className="login-container">
      {/* Logo acima do card */}
      <div className="logo-area">
        <img src="/logo-ornigen.png" alt="Logo Origen" className="logo" />
      </div>

      {/* Card de recuperação */}
      <div className="card login-card">
        <h2 className="login-title">Recuperar Senha</h2>

        <div className="form-group">
          <label htmlFor="email">Digite o e-mail cadastrado:</label>
          <input
            id="email"
            type="email"
            className="input"
            placeholder="exemplo@dominio.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="off"
          />
        </div>

        <button
          type="button"
          className="btn"
          onClick={handleRecuperarSenha}
          disabled={loading}
        >
          {loading ? "Enviando..." : "Enviar link de recuperação"}
        </button>

        {mensagem && <p>{mensagem}</p>}

        <div className="login-links">
          <a href="/login">Voltar ao login</a>
          <a href="/registro">Novo registro</a>
        </div>
      </div>
    </div>
  );
}
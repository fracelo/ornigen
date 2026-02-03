"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TextField, Button } from "@mui/material";
import { useEmpresa } from "../context/empresaContext";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginEmpresaPage() {
  const { setEmpresaId } = useEmpresa();
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [mensagem, setMensagem] = useState("");

  const handleLogin = async () => {
    // 🔹 autentica empresa pelo Supabase Auth
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password: senha,
    });

    if (error) {
      setMensagem("Erro ao logar: " + error.message);
      return;
    }

    // 🔹 busca empresa vinculada ao usuário logado
    const { data: empresa, error: empresaError } = await supabase
      .from("empresas")
      .select("id")
      .eq("email", email)
      .single();

    if (empresaError || !empresa) {
      setMensagem("Empresa não encontrada.");
      return;
    }

    // 🔹 seta empresaId no contexto global
    setEmpresaId(empresa.id);

    setMensagem("Login realizado com sucesso!");
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>Login da Empresa</h2>
      <TextField
        label="Email da empresa"
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Senha"
        type="password"
        value={senha}
        onChange={(e) => setSenha(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleLogin}
        fullWidth
      >
        Entrar
      </Button>

      {mensagem && <p style={{ marginTop: "1rem" }}>{mensagem}</p>}
    </div>
  );
}
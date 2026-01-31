"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { TextField, Button } from "@mui/material";
import { useEmpresa } from "../context/empresaContext"; // 🔹 contexto da empresa logada

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ConvitePage() {
  const [email, setEmail] = useState("");
  const [mensagem, setMensagem] = useState("");
  const { empresaId } = useEmpresa(); // 🔹 pega empresa logada

  const gerarToken = () => Math.floor(1000 + Math.random() * 9000).toString();

  const handleEnviarConvite = async () => {
    if (!empresaId) {
      setMensagem("Erro: nenhuma empresa logada.");
      return;
    }

    const token = gerarToken();

    // 1. Salvar convite no banco
    const { error } = await supabase.from("convites").insert([
      {
        empresa_id: empresaId,
        usuario_email: email,
        token,
        status: "pendente",
      },
    ]);

    if (error) {
      setMensagem("Erro ao salvar convite: " + error.message);
      return;
    }

    // 2. Enviar e-mail via Supabase Functions (SMTP já configurado)
    const res = await fetch("/functions/v1/enviarConvite", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, token }),
    });

    if (res.ok) {
      setMensagem(`Convite enviado para ${email}.`);
    } else {
      setMensagem("Erro ao enviar e-mail.");
    }
  };

  return (
    <div style={{ maxWidth: "400px", margin: "auto", padding: "2rem" }}>
      <h2>Convidar Usuário</h2>
      <TextField
        label="Email do usuário"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        fullWidth
        margin="normal"
      />
      <Button
        variant="contained"
        color="primary"
        onClick={handleEnviarConvite}
        fullWidth
      >
        Enviar Convite
      </Button>

      {mensagem && <p style={{ marginTop: "1rem" }}>{mensagem}</p>}
    </div>
  );
}
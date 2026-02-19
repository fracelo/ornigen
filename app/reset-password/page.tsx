"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import { useRouter } from "next/navigation";
import { Box, Typography, TextField, Button } from "@mui/material";

export default function ResetPasswordPage() {
  const [novaSenha, setNovaSenha] = useState("");
  const [confirmarSenha, setConfirmarSenha] = useState("");
  const [mensagem, setMensagem] = useState("");
  const router = useRouter();

  useEffect(() => {
    // 🔹 Captura a sessão temporária do Supabase
    supabase.auth.getSession().then(({ data }) => {
      if (!data.session) {
        setMensagem("Link inválido ou expirado. Solicite novamente a recuperação de senha.");
      }
    });
  }, []);

  const handleAtualizarSenha = async () => {
    if (novaSenha !== confirmarSenha) {
      setMensagem("As senhas não conferem.");
      return;
    }

    const { error } = await supabase.auth.updateUser({ password: novaSenha });

    if (error) {
      setMensagem("Erro ao atualizar senha: " + error.message);
    } else {
      setMensagem("Senha atualizada com sucesso! Você já pode acessar sua conta.");
      setTimeout(() => router.push("/login"), 3000);
    }
  };

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        bgcolor: "#fff",
      }}
    >
      <Box
        sx={{
          width: 400,
          p: 4,
          boxShadow: 6,
          borderRadius: 2,
          border: "2px solid darkblue",
          backgroundColor: "#fff",
        }}
      >
        <Typography
          variant="h5"
          sx={{
            color: "darkblue",
            fontWeight: "bold",
            textAlign: "center",
            mb: 3,
          }}
        >
          Atualizar Senha
        </Typography>

        <Box sx={{ display: "flex", flexDirection: "column", gap: 2 }}>
          <TextField
            label="Nova Senha"
            type="password"
            value={novaSenha}
            onChange={(e) => setNovaSenha(e.target.value)}
            fullWidth
          />

          <TextField
            label="Confirmar Senha"
            type="password"
            value={confirmarSenha}
            onChange={(e) => setConfirmarSenha(e.target.value)}
            fullWidth
          />

          <Button
            variant="contained"
            sx={{ backgroundColor: "darkblue", "&:hover": { backgroundColor: "#0d47a1" } }}
            onClick={handleAtualizarSenha}
          >
            Atualizar Senha
          </Button>
        </Box>

        {mensagem && (
          <Typography sx={{ mt: 2, textAlign: "center", color: "darkblue" }}>
            {mensagem}
          </Typography>
        )}
      </Box>
    </Box>
  );
}
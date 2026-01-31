"use client";

import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import { Card, CardContent, TextField, Button, Typography, Link } from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function LoginEmpresasPage() {
  const [documento, setDocumento] = useState("");
  const [senha, setSenha] = useState("");
  const router = useRouter();

  const handleLoginEmpresa = async () => {
    const { data, error } = await supabase
      .from("empresas")
      .select("id, razao_social")
      .eq("documento", documento)
      .eq("senha", senha)
      .single();

    if (error || !data) {
      alert("Documento ou senha inválidos!");
      return;
    }

    router.push(`/login?empresaId=${data.id}`);
  };

  return (
    <div style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
      backgroundColor: "#f5f5f5"
    }}>
      <Card sx={{ width: 350, boxShadow: 6 }}>
        <CardContent>
          <Typography variant="h6" align="center" gutterBottom>
            Login de Empresa
          </Typography>

          <TextField
            label="CPF ou CNPJ"
            variant="outlined"
            fullWidth
            margin="normal"
            value={documento}
            onChange={(e) => setDocumento(e.target.value)}
          />

          <TextField
            label="Senha"
            type="password"
            variant="outlined"
            fullWidth
            margin="normal"
            value={senha}
            onChange={(e) => setSenha(e.target.value)}
          />

          <Button
            variant="contained"
            color="primary"
            fullWidth
            sx={{ mt: 2 }}
            onClick={handleLoginEmpresa}
          >
            Logar
          </Button>

          <Typography align="center" sx={{ mt: 2 }}>
            <Link href="/recuperar-senha" underline="hover">
              Recuperar senha
            </Link>
          </Typography>

         <Typography align="center" sx={{ mt: 1 }}>
            <Link href="/empresas?novo=true" underline="hover">
              Cadastrar nova empresa
            </Link>

          </Typography>
        </CardContent>
      </Card>
    </div>
  );
}
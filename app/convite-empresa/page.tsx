"use client";

import { useState, useEffect } from "react";
import { supabase } from "../lib/supabaseClient";
import {
  Box,
  Typography,
  TextField,
  Button,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
} from "@mui/material";

export default function ConviteEmpresaPage() {
  const [empresas, setEmpresas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  useEffect(() => {
    const carregarEmpresas = async () => {
      let query = supabase
        .from("empresas")
        .select("id, nome_fantasia, razao_social, cidade, estado");

      if (busca.trim() !== "") {
        // 🔹 Busca tanto por nome fantasia quanto por razão social
        query = query.or(
          `nome_fantasia.ilike.%${busca}%,razao_social.ilike.%${busca}%`
        );
      }

      const { data, error } = await query;
      if (!error && data) {
        setEmpresas(data);
      } else {
        console.error(error);
      }
    };

    carregarEmpresas();
  }, [busca]);

  const solicitarConvite = async (empresaId: string) => {
    const { data: userData } = await supabase.auth.getUser();
    const usuarioId = userData?.user?.id;

    if (!usuarioId) {
      alert("Usuário não autenticado.");
      return;
    }

    // 🔹 Cria registro em empresa_usuarios com status pendente
    const { error } = await supabase.from("empresa_usuarios").insert({
      empresa_id: empresaId,
      usuario_id: usuarioId,
      status: "pendente",
    });

    if (error) {
      alert("Erro ao solicitar convite: " + error.message);
    } else {
      alert("Solicitação enviada! Aguarde aprovação do responsável da empresa.");
    }
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h5"
        sx={{ color: "darkblue", fontWeight: "bold", mb: 3 }}
      >
        Solicitar Convite para Empresa
      </Typography>

      <TextField
        label="Buscar por Nome Fantasia / Razão Social"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        fullWidth
        sx={{ mb: 3 }}
      />

      <Table>
        <TableHead>
          <TableRow>
            <TableCell><b>Nome / Razão Social</b></TableCell>
            <TableCell><b>Cidade</b></TableCell>
            <TableCell><b>Estado</b></TableCell>
            <TableCell align="right"><b>Ações</b></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {empresas.map((empresa) => (
            <TableRow key={empresa.id}>
              <TableCell>
                {empresa.nome_fantasia}
                {empresa.razao_social ? ` / ${empresa.razao_social}` : ""}
              </TableCell>
              <TableCell>{empresa.cidade}</TableCell>
              <TableCell>{empresa.estado}</TableCell>
              <TableCell align="right">
                <Button
                  variant="contained"
                  sx={{
                    backgroundColor: "darkblue",
                    "&:hover": { backgroundColor: "#0d47a1" },
                  }}
                  onClick={() => solicitarConvite(empresa.id)}
                >
                  Solicitar Convite
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}

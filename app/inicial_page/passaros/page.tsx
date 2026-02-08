"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import {
  Box,
  Button,
  TextField,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Typography,
} from "@mui/material";
import { useEmpresa } from "../../context/empresaContext"; // 🔹 importa o contexto da empresa

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ListaPassaros() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();
  const { empresaId } = useEmpresa(); // 🔹 pega empresa logada

  useEffect(() => {
    if (empresaId) {
      carregarRegistros();
    }
  }, [empresaId]);

  const carregarRegistros = async () => {
    const { data, error } = await supabase
      .from("passaros")
      .select(`
        id,
        nome,
        anilha,
        sexo,
        especies (nome_portugues),
        criadouros (nome_fantasia, razao_social)
      `)
      .eq("empresa_id", empresaId) // 🔹 filtra pela empresa logada
      .order("id", { ascending: true });

    if (!error && data) {
      setRegistros(data);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter(
      (r) =>
        r.nome.toLowerCase().includes(busca.toLowerCase()) ||
        r.anilha.toLowerCase().includes(busca.toLowerCase())
    );
  };

  const editarRegistro = (id: number) => {
    router.push(`/passaros/${id}`); // 🔹 abre tela de edição dinâmica
  };

  const novoRegistro = () => {
    router.push("/passaros/novo"); // 🔹 abre tela de inclusão
  };

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        sx={{
          mb: 3,
          color: "#0D47A1",
          fontWeight: "bold",
          textAlign: "center",
        }}
      >
        Lista de Pássaros
      </Typography>

      {/* Barra de busca + botão novo */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Pesquisar por Nome ou Anilha"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ flex: 1 }}
        />
        <Button
          variant="contained"
          color="primary"
          size="large"
          onClick={novoRegistro}
          sx={{ minWidth: 180, height: 56 }}
        >
          Novo
        </Button>
      </Box>

      {/* Tabela de registros */}
      <Table>
        <TableHead>
          <TableRow sx={{ backgroundColor: "#1976d2" }}>
            <TableCell sx={{ fontWeight: "bold", color: "#fff", width: "25%" }}>Nome</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff", width: "20%" }}>Anilha</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff", width: "25%" }}>Espécie</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff", width: "10%" }}>Sexo</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff", width: "20%" }}>Origem</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filtrarRegistros().map((r, index) => (
            <TableRow
              key={r.id}
              hover
              onClick={() => editarRegistro(r.id)}
              sx={{
                cursor: "pointer",
                backgroundColor: index % 2 === 0 ? "#e3f2fd" : "#90caf9",
                "& td": { borderBottom: "1px solid #000" },
              }}
            >
              <TableCell>{r.nome}</TableCell>
              <TableCell>{r.anilha}</TableCell>
              <TableCell>{r.especies?.nome_portugues || "-"}</TableCell>
              <TableCell>{r.sexo}</TableCell>
              <TableCell>{r.criadouros?.nome_fantasia || r.criadouros?.razao_social || "-"}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
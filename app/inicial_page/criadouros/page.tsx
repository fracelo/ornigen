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

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function ListaCriadouros() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    const { data, error } = await supabase.from("criadouros").select("*");
    if (!error && data) {
      setRegistros(data);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter((r) =>
      r.razao_social.toLowerCase().includes(busca.toLowerCase())
    );
  };

  const editarRegistro = (id: number) => {
    router.push(`/inicial_page/criadouros/${id}`); // abre tela de edição
  };

 const novoRegistro = () => {
  router.push("/inicial_page/criadouros/novo");
};

  return (
    <Box sx={{ p: 4 }}>
      <Typography
        variant="h4"
        sx={{ mb: 3, color: "#0D47A1", fontWeight: "bold", textAlign: "center" }}
      >
        Lista de Criadouros
      </Typography>

      {/* Barra de busca + botão novo */}
      <Box sx={{ display: "flex", gap: 2, mb: 2 }}>
        <TextField
          label="Pesquisar por Razão Social"
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
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Razão Social</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Responsável</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>Cidade</TableCell>
            <TableCell sx={{ fontWeight: "bold", color: "#fff" }}>UF</TableCell>
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
                backgroundColor: index % 2 === 0 ? "#e3f2fd" : "#90caf9", // alterna azul claro
                "& td": {
                  borderBottom: "1px solid #000", // separador preto
                },
              }}
            >
              <TableCell>{r.razao_social}</TableCell>
              <TableCell>{r.responsavel_nome}</TableCell>
              <TableCell>{r.cidade}</TableCell>
              <TableCell>{r.estado}</TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Box>
  );
}
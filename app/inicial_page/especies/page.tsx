"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import {
  Box, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, Typography, Paper, TableContainer, InputAdornment
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

export default function ListaEspecies() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();

  const larguraGrid = "1200px";

  useEffect(() => {
    carregarEspecies();
  }, []);

  const carregarEspecies = async () => {
    const { data, error } = await supabase
      .from("especies_sispass")
      .select("*")
      .order("nome_cientifico");
    if (!error && data) setRegistros(data);
  };

  const filtrarRegistros = () => {
    return registros.filter((r) =>
      r.nome_cientifico?.toLowerCase().includes(busca.toLowerCase()) ||
      r.nomes_comuns?.some((n: string) => n.toLowerCase().includes(busca.toLowerCase()))
    );
  };

  return (
    <Box sx={{ width: "100%", py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "900", color: "#1e293b" }}>
        Espécies SISPASS
      </Typography>

      <Box sx={{ display: "flex", alignItems: "center", gap: 2, mb: 3, width: "100%", maxWidth: larguraGrid }}>
        <TextField
          placeholder="Pesquisar por nome comum ou científico..."
          size="small"
          fullWidth
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
          sx={{ bgcolor: "#fff", borderRadius: 1, flex: 1 }}
        />
        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/inicial_page/especies/novo")}
          sx={{ minWidth: 180, bgcolor: "#1976d2", fontWeight: "bold", height: "40px", textTransform: 'none' }}
        >
          Nova Espécie
        </Button>
      </Box>

      <TableContainer component={Paper} elevation={0} sx={{ border: "1px solid #e2e8f0", borderRadius: 3, width: "100%", maxWidth: larguraGrid, overflow: "hidden" }}>
        <Table sx={{ tableLayout: "fixed" }} size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              <TableCell sx={{ fontWeight: "900", width: "150px", color: "#475569" }}>Cód. SISPASS</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "400px", color: "#475569" }}>Nome Comum</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "400px", color: "#475569" }}>Nome Científico</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "250px", color: "#475569" }} align="center">Diâmetro Anilha (mm)</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrarRegistros().map((r, index) => (
              <TableRow
                key={r.id}
                hover
                onClick={() => router.push(`/inicial_page/especies/${r.id}`)}
                sx={{ cursor: "pointer", backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc" }}
              >
                <TableCell sx={{ fontWeight: "bold", color: "#1e293b" }}>{r.codigo_sispass}</TableCell>
                <TableCell sx={{ color: "#475569" }}>{r.nomes_comuns?.join(", ")}</TableCell>
                <TableCell sx={{ color: "#1e293b", fontStyle: 'italic' }}>{r.nome_cientifico}</TableCell>
                <TableCell align="center" sx={{ fontWeight: "bold", color: "#1976d2" }}>{r.diametro_anilha} mm</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
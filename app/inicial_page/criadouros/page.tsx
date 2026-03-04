"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
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
  Paper,
  TableContainer,
  InputAdornment,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import AddIcon from "@mui/icons-material/Add";

export default function ListaCriadouros() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();

  useEffect(() => {
    carregarRegistros();
  }, []);

  const carregarRegistros = async () => {
    const { data, error } = await supabase.from("criadouros").select("*").order("razao_social");
    if (!error && data) {
      setRegistros(data);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter((r) =>
      r.razao_social?.toLowerCase().includes(busca.toLowerCase())
    );
  };

  // 📐 GRID PADRONIZADO EM 1200px
  const larguraTotalTabela = "1200px"; 

  return (
    <Box sx={{ width: "100%", py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "900", color: "#1e293b", textAlign: 'center' }}>
        Gestão de Criadouros
      </Typography>

      {/* 🟢 AREA DE BUSCA E BOTÃO - ALINHADOS AO GRID */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center",
        gap: 2, 
        mb: 3, 
        width: "100%",
        maxWidth: larguraTotalTabela, 
      }}>
        <TextField
          placeholder="Pesquisar por Razão Social..."
          size="small"
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
          sx={{ 
            bgcolor: "#fff", 
            borderRadius: 1,
            flex: 1 // 🚀 Ocupa o espaço entre o início da tabela e o botão
          }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/inicial_page/criadouros/novo")}
          sx={{ 
            minWidth: 180, // 🔹 Garante espaço para o texto em uma linha
            bgcolor: "#1976d2", 
            fontWeight: "bold", 
            borderRadius: 1.5,
            textTransform: 'none',
            height: "40px",
            whiteSpace: "nowrap" // 🚀 Impede quebra de linha
          }}
        >
          Novo Criadouro
        </Button>
      </Box>

      {/* 🔵 TABELA CENTRALIZADA */}
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 3,
          width: "100%",
          maxWidth: larguraTotalTabela, 
          overflow: "hidden"
        }}
      >
        <Table sx={{ tableLayout: "fixed" }}>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              {/* Colunas usando larguras fixas dentro do total de 1200px */}
              <TableCell sx={{ fontWeight: "900", width: "550px", color: "#475569" }}>Razão Social / Nome</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "350px", color: "#475569" }}>Cidade</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "80px", color: "#475569" }} align="center">UF</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "220px", color: "#475569" }}>SISPASS</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrarRegistros().map((r, index) => (
              <TableRow
                key={r.id}
                hover
                onClick={() => router.push(`/inicial_page/criadouros/${r.id}`)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc",
                  "&:hover": { backgroundColor: "#f1f5f9 !important" }
                }}
              >
                <TableCell sx={{ 
                  fontWeight: "600", 
                  color: "#334155",
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}>
                  {r.razao_social}
                </TableCell>

                <TableCell sx={{ 
                  color: "#64748b",
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}>
                  {r.cidade}
                </TableCell>

                <TableCell align="center" sx={{ color: "#64748b", fontWeight: "bold" }}>
                  {r.estado}
                </TableCell>

                <TableCell sx={{ color: "#64748b", fontFamily: 'monospace', letterSpacing: 0.5 }}>
                  {r.registro_sispass || "---"}
                </TableCell>
              </TableRow>
            ))}
            {filtrarRegistros().length === 0 && (
              <TableRow>
                <TableCell colSpan={4} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                  Nenhum criadouro localizado.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useRouter } from "next/navigation";
import { useEmpresa } from "@/context/empresaContext";
import { formataDados } from "@/lib/formataDados";
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

export default function ListaEntidades() {
  const [busca, setBusca] = useState("");
  const [registros, setRegistros] = useState<any[]>([]);
  const router = useRouter();
  const { empresaId } = useEmpresa();

  useEffect(() => {
    if (empresaId) carregarRegistros();
  }, [empresaId]);

  const carregarRegistros = async () => {
    const { data, error } = await supabase
      .from("entidades")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");
    
    if (!error && data) {
      setRegistros(data);
    }
  };

  const filtrarRegistros = () => {
    return registros.filter((r) =>
      r.nome?.toLowerCase().includes(busca.toLowerCase()) ||
      r.sigla?.toLowerCase().includes(busca.toLowerCase())
    );
  };

  // 📐 GRID DE 1200px CENTRALIZADO
  const larguraGrid = "1200px"; 

  return (
    <Box sx={{ width: "100%", py: 2, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
      
      <Typography variant="h4" sx={{ mb: 4, fontWeight: "900", color: "#1e293b" }}>
        Gestão de Clubes e Federações
      </Typography>

      {/* 🟢 BUSCA E BOTÃO - Começam exatamente no limite dos 1200px */}
      <Box sx={{ 
        display: "flex", 
        alignItems: "center",
        gap: 2, 
        mb: 2,
        width: "100%",
        maxWidth: larguraGrid, 
      }}>
        <TextField
          placeholder="Pesquisar entidade por nome ou sigla..."
          size="small"
          fullWidth
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
            flex: 1 // Estende até o botão
          }}
        />

        <Button
          variant="contained"
          startIcon={<AddIcon />}
          onClick={() => router.push("/inicial_page/entidades/novo")}
          sx={{ 
            minWidth: 180, 
            bgcolor: "#1976d2", 
            fontWeight: "bold", 
            textTransform: 'none',
            height: "40px",
            whiteSpace: "nowrap"
          }}
        >
          Nova Entidade
        </Button>
      </Box>

      {/* 🔵 TABELA - Também inicia exatamente no limite dos 1200px */}
      <TableContainer 
        component={Paper} 
        elevation={0} 
        sx={{ 
          border: "1px solid #e2e8f0", 
          borderRadius: 3,
          width: "100%",
          maxWidth: larguraGrid, 
          overflow: "hidden"
        }}
      >
        <Table sx={{ tableLayout: "fixed", width: "100%" }} size="small">
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f8fafc" }}>
              {/* Coluna 1: Agora é o Nome, alinhada com o Campo de Busca */}
              <TableCell sx={{ fontWeight: "900", width: "35%", color: "#475569" }}>Nome / Entidade</TableCell>
              
              <TableCell sx={{ fontWeight: "900", width: "10%", color: "#475569" }}>Sigla</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "25%", color: "#475569" }}>Cidade / UF</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "15%", color: "#475569" }}>Contato</TableCell>
              <TableCell sx={{ fontWeight: "900", width: "15%", color: "#475569" }}>Telefone</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filtrarRegistros().map((r, index) => (
              <TableRow
                key={r.id}
                hover
                onClick={() => router.push(`/inicial_page/entidades/${r.id}`)}
                sx={{
                  cursor: "pointer",
                  backgroundColor: index % 2 === 0 ? "#fff" : "#f8fafc",
                  "&:hover": { backgroundColor: "#f1f5f9 !important" }
                }}
              >
                <TableCell sx={{ 
                  fontWeight: "600", 
                  color: "#1e293b", 
                  whiteSpace: "nowrap", 
                  overflow: "hidden", 
                  textOverflow: "ellipsis" 
                }}>
                  {r.nome}
                </TableCell>
                <TableCell sx={{ color: "#64748b", fontWeight: "bold" }}>{r.sigla || "---"}</TableCell>
                <TableCell sx={{ color: "#64748b" }}>{r.cidade ? `${r.cidade} - ${r.uf}` : "---"}</TableCell>
                <TableCell sx={{ color: "#64748b" }}>{r.contato_nome || "---"}</TableCell>
                <TableCell sx={{ color: "#64748b", fontFamily: 'monospace' }}>
                  {r.telefone ? formataDados(r.telefone, "celular") : "---"}
                </TableCell>
              </TableRow>
            ))}
            {filtrarRegistros().length === 0 && (
              <TableRow>
                <TableCell colSpan={5} align="center" sx={{ py: 6, color: "#94a3b8" }}>
                  Nenhuma entidade encontrada.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Box>
  );
}
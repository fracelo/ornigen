"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  TextField, InputAdornment, CircularProgress, Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import CategoryIcon from "@mui/icons-material/Category";

export default function ListaGruposAlimentos() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [grupos, setGrupos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const carregarGrupos = useCallback(async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await supabase
        .from("alimentos_grupos")
        .select("*")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      if (error) throw error;
      setGrupos(data || []);
    } catch (err) {
      console.error("Erro ao carregar grupos:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { carregarGrupos(); }, [carregarGrupos]);

  const gruposFiltrados = grupos.filter(g =>
    g.nome?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1" }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <CategoryIcon sx={{ fontSize: 40, color: "#1e293b" }} />
            <Box>
              <Typography variant="h5" fontWeight="900">Grupos de Alimentos</Typography>
              <Typography variant="caption" color="text.secondary">Organize sementes, farinhadas, extrusados e outros</Typography>
            </Box>
          </Stack>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/alimentos/grupos/novo")}
            sx={{ bgcolor: "#1e293b", fontWeight: 'bold' }}
          >
            Novo Grupo
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar grupo..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start"><SearchIcon /></InputAdornment>
            ),
          }}
        />

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome do Grupo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {gruposFiltrados.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={3} align="center" sx={{ py: 5 }}>Nenhum grupo cadastrado.</TableCell>
                </TableRow>
              ) : (
                gruposFiltrados.map((g) => (
                  <TableRow key={g.id} hover>
                    <TableCell sx={{ fontWeight: '500' }}>{g.nome}</TableCell>
                    <TableCell>{g.descricao || "-"}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => router.push(`/inicial_page/alimentos/grupos/${g.id}`)}>
                        <EditIcon fontSize="small" color="primary" />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
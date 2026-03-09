"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, IconButton,
  TextField, InputAdornment, CircularProgress, Stack, Chip
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import FastfoodIcon from "@mui/icons-material/Fastfood";

export default function ListaAlimentos() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [alimentos, setAlimentos] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const carregarAlimentos = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("alimentos")
        .select("*, alimentos_grupos(nome)")
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      if (error) throw error;
      setAlimentos(data || []);
    } catch (err) {
      console.error("Erro ao carregar alimentos:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { carregarAlimentos(); }, [carregarAlimentos]);

  const filtrados = alimentos.filter(a =>
    a.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    a.marca?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1" }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <FastfoodIcon sx={{ fontSize: 40, color: "#1e293b" }} />
            <Box>
              <Typography variant="h5" fontWeight="900">Cadastro de Alimentos</Typography>
              <Typography variant="caption" color="text.secondary">Gerencie o estoque e valores de sementes e insumos</Typography>
            </Box>
          </Stack>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/alimentos/cadastro/novo")}
            sx={{ bgcolor: "#1e293b", fontWeight: 'bold' }}
          >
            Novo Alimento
          </Button>
        </Box>

        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar por nome ou marca..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon /></InputAdornment>,
          }}
        />

        <TableContainer>
          <Table>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Nome / Marca</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Grupo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Estoque Atual</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Custo (un)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Venda (un)</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtrados.length === 0 ? (
                <TableRow><TableCell colSpan={6} align="center">Nenhum alimento encontrado.</TableCell></TableRow>
              ) : (
                filtrados.map((a) => (
                  <TableRow key={a.id} hover>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{a.nome}</Typography>
                      <Typography variant="caption" color="text.secondary">{a.marca || "Sem marca"}</Typography>
                    </TableCell>
                    <TableCell><Chip label={a.alimentos_grupos?.nome || 'S/G'} size="small" variant="outlined" /></TableCell>
                    <TableCell>
                      <Typography variant="body2" color={Number(a.estoque_atual) <= Number(a.estoque_minimo) ? "error.main" : "inherit"}>
                        {a.estoque_atual} {a.unidade_medida}
                      </Typography>
                    </TableCell>
                    <TableCell>R$ {Number(a.valor_unitario_custo || 0).toFixed(2)}</TableCell>
                    <TableCell>R$ {Number(a.valor_unitario_venda || 0).toFixed(2)}</TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => router.push(`/inicial_page/alimentos/cadastro/${a.id}`)}>
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
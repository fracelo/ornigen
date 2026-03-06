"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip,
  IconButton, TextField, InputAdornment, CircularProgress, Stack
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import SwapHorizIcon from "@mui/icons-material/SwapHoriz";
import CallMadeIcon from "@mui/icons-material/CallMade"; // Ícone de Saída
import CallReceivedIcon from "@mui/icons-material/CallReceived"; // Ícone de Entrada
import VisibilityIcon from "@mui/icons-material/Visibility";

export default function ListaTransferencias() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [transferencias, setTransferencias] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const carregarTransferencias = useCallback(async () => {
    if (!empresaId) return;
    try {
      const { data, error } = await supabase
        .from("transferencias_passaros")
        .select(`
          *,
          origem:criadouros!transferencias_passaros_origem_id_fkey(razao_social),
          destino:criadouros!transferencias_passaros_destino_id_fkey(razao_social)
        `)
        .eq("empresa_id", empresaId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setTransferencias(data || []);
    } catch (err) {
      console.error("Erro ao carregar transferências:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    carregarTransferencias();
  }, [carregarTransferencias]);

  const transferenciasFiltradas = transferencias.filter(t =>
    t.nome_passaro?.toLowerCase().includes(busca.toLowerCase()) ||
    t.anilha_passaro?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderWidth: "2px" }}>
        
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <SwapHorizIcon sx={{ fontSize: 40, color: "#1e293b" }} />
            <Box>
              <Typography variant="h5" fontWeight="900">Histórico de Movimentações</Typography>
              <Typography variant="caption" color="text.secondary">Registro de entradas e saídas de pássaros</Typography>
            </Box>
          </Stack>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/passaros/transferencias/novo")}
            sx={{ bgcolor: "#1e293b", fontWeight: 'bold' }}
          >
            Nova Transferência
          </Button>
        </Box>

        {/* Filtros */}
        <TextField
          fullWidth
          variant="outlined"
          size="small"
          placeholder="Buscar por nome ou anilha do pássaro..."
          value={busca}
          onChange={(e) => setBusca(e.target.value)}
          sx={{ mb: 3 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon />
              </InputAdornment>
            ),
          }}
        />

        {/* Tabela */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: "#f8fafc" }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Data</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Pássaro / Anilha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Origem</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Destino</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {transferenciasFiltradas.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 10 }}>
                    <Typography color="text.secondary">Nenhuma movimentação encontrada.</Typography>
                  </TableCell>
                </TableRow>
              ) : (
                transferenciasFiltradas.map((t) => (
                  <TableRow key={t.id} hover>
                    <TableCell>
                      {new Date(t.created_at).toLocaleDateString('pt-BR')}
                    </TableCell>
                    <TableCell>
                      {t.tipo === 'E' ? (
                        <Chip 
                          icon={<CallReceivedIcon style={{ color: '#16a34a' }} />} 
                          label="Entrada" 
                          variant="outlined"
                          sx={{ borderColor: '#16a34a', color: '#16a34a', fontWeight: 'bold' }}
                        />
                      ) : (
                        <Chip 
                          icon={<CallMadeIcon style={{ color: '#dc2626' }} />} 
                          label="Saída" 
                          variant="outlined"
                          sx={{ borderColor: '#dc2626', color: '#dc2626', fontWeight: 'bold' }}
                        />
                      )}
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2" fontWeight="bold">{t.nome_passaro}</Typography>
                      <Typography variant="caption" color="text.secondary">{t.anilha_passaro}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{t.origem?.razao_social || "N/I"}</Typography>
                    </TableCell>
                    <TableCell>
                      <Typography variant="body2">{t.destino?.razao_social || "N/I"}</Typography>
                    </TableCell>
                    <TableCell align="center">
                      <IconButton onClick={() => router.push(`/inicial_page/passaros/${t.passaro_id}`)}>
                        <VisibilityIcon fontSize="small" />
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
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Stack, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, CircularProgress, Tooltip
} from "@mui/material";

// Ícones
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";
import ScienceIcon from "@mui/icons-material/Science";

export default function ListaCasaisPage() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [casais, setCasais] = useState<any[]>([]);

  const carregarCasais = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

    // Busca casais e conta quantos ovos "Em incubação" existem para cada um
    const { data, error } = await supabase
      .from("casais")
      .select(`
        *,
        pai:pai_id(nome, anilha),
        mae:mae_id(nome, anilha),
        posturas:casais_posturas(count)
      `)
      .eq("empresa_id", empresaId)
      .eq("status", "Ativo")
      .order("created_at", { ascending: false });

    if (!error) setCasais(data || []);
    setLoading(false);
  }, [empresaId]);

  useEffect(() => { carregarCasais(); }, [carregarCasais]);

  const getCorConsanguinidade = (v: number) => {
    if (v >= 25) return "error";
    if (v >= 12) return "warning";
    return "success";
  };

  if (loading) return <Box p={10} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 2 }}>
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
        <Box>
          <Typography variant="h6" fontWeight="900" color="primary">Reprodução</Typography>
          <Typography variant="caption" color="text.secondary">Gestão de casais ativos e índices genéticos</Typography>
        </Box>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />} 
          onClick={() => router.push("/inicial_page/reproducao/novo")}
          size="small"
        >
          Novo Casal
        </Button>
      </Stack>

      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, border: '1px solid #e0e0e0' }}>
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Macho</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Fêmea</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>% Consang.</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Efetivação</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Prev. 1º Ovo</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Ovos Atual</TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {casais.map((casal) => (
              <TableRow key={casal.id} hover sx={{ '&:not(:last-child)': { borderBottom: '1px solid #eeeeee' } }}>
                <TableCell sx={{ fontSize: '0.72rem', py: 1 }}>
                   <b>{casal.pai?.nome}</b> <br/> <span style={{ color: '#666' }}>{casal.pai?.anilha}</span>
                </TableCell>
                <TableCell sx={{ fontSize: '0.72rem', py: 1 }}>
                   <b>{casal.mae?.nome}</b> <br/> <span style={{ color: '#666' }}>{casal.mae?.anilha}</span>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${casal.indice_consanguinidade}%`} 
                    size="small" 
                    color={getCorConsanguinidade(Number(casal.indice_consanguinidade))}
                    variant="filled"
                    sx={{ fontSize: '0.65rem', height: 18, fontWeight: 'bold' }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem' }}>
                  {new Date(casal.data_efetivacao).toLocaleDateString()}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem', color: 'secondary.main', fontWeight: '500' }}>
                  {casal.data_prevista_ovos ? new Date(casal.data_prevista_ovos).toLocaleDateString() : '-'}
                </TableCell>
                <TableCell align="center">
                  <Typography variant="body2" fontWeight="900" sx={{ fontSize: '0.8rem' }}>
                    {casal.posturas?.[0]?.count || 0}
                  </Typography>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0.5} justifyContent="flex-end">
                    <Tooltip title="Ver Detalhes / Ninho">
                      <IconButton size="small" color="primary" onClick={() => router.push(`/inicial_page/reproducao/${casal.id}`)}>
                        <VisibilityIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desfazer Casal">
                      <IconButton size="small" color="error">
                        <HeartBrokenIcon fontSize="inherit" />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
            {casais.length === 0 && (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 4 }}>
                  <Typography variant="caption" color="textSecondary">Nenhum casal em reprodução ativa.</Typography>
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Stack, Button, Table, TableBody,
  TableCell, TableContainer, TableHead, TableRow, Chip, IconButton, 
  CircularProgress, Tooltip
} from "@mui/material";

// Ícones
import AddIcon from "@mui/icons-material/Add";
import VisibilityIcon from "@mui/icons-material/Visibility";
import HeartBrokenIcon from "@mui/icons-material/HeartBroken";

export default function ListaCasaisPage() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [casais, setCasais] = useState<any[]>([]);

  const carregarCasais = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);

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
      <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2} sx={{ maxWidth: '1000px', mx: 'auto' }}>
        <Box>
          <Typography variant="h6" fontWeight="900" color="primary" sx={{ fontSize: '1.1rem' }}>Reprodução</Typography>
          <Typography variant="caption" color="text.secondary">Casais ativos</Typography>
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

      <TableContainer 
        component={Paper} 
        variant="outlined" 
        sx={{ 
          borderRadius: 2, 
          maxWidth: '1000px', // Limita a largura total da tabela para não espalhar os dados
          mx: 'auto', 
          overflow: 'hidden' 
        }}
      >
        <Table size="small">
          <TableHead sx={{ bgcolor: "#f8f9fa" }}>
            <TableRow>
              {/* Pai e Mãe com largura fixa menor */}
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '180px' }}>Macho</TableCell>
              <TableCell sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '180px' }}>Fêmea</TableCell>
              
              {/* Colunas técnicas com largura exata para o título em uma linha */}
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '110px', whiteSpace: 'nowrap' }}>% Consanguinidade</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '100px', whiteSpace: 'nowrap' }}>Efetivação</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '100px', whiteSpace: 'nowrap' }}>Prev. 1º Ovo</TableCell>
              <TableCell align="center" sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '90px', whiteSpace: 'nowrap' }}>Ovos Atual</TableCell>
              <TableCell align="right" sx={{ fontSize: '0.75rem', fontWeight: 'bold', width: '80px' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {casais.map((casal) => (
              <TableRow key={casal.id} hover sx={{ '&:not(:last-child)': { borderBottom: '1.5px solid #f5f5f5' } }}>
                <TableCell sx={{ fontSize: '0.72rem', py: 0.5 }}>
                   <Typography variant="inherit" fontWeight="bold" noWrap>{casal.pai?.nome}</Typography>
                   <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{casal.pai?.anilha}</Typography>
                </TableCell>
                <TableCell sx={{ fontSize: '0.72rem', py: 0.5 }}>
                   <Typography variant="inherit" fontWeight="bold" noWrap>{casal.mae?.nome}</Typography>
                   <Typography variant="caption" sx={{ fontSize: '0.65rem', color: 'text.secondary' }}>{casal.mae?.anilha}</Typography>
                </TableCell>
                <TableCell align="center">
                  <Chip 
                    label={`${casal.indice_consanguinidade}%`} 
                    size="small" 
                    color={getCorConsanguinidade(Number(casal.indice_consanguinidade))}
                    sx={{ fontSize: '0.65rem', height: 18, fontWeight: '900' }}
                  />
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem' }}>
                  {new Date(casal.data_efetivacao).toLocaleDateString('pt-BR')}
                </TableCell>
                <TableCell align="center" sx={{ fontSize: '0.72rem', color: 'secondary.main', fontWeight: '600' }}>
                  {casal.data_prevista_ovos ? new Date(casal.data_prevista_ovos).toLocaleDateString('pt-BR') : '-'}
                </TableCell>
                <TableCell align="center">
                  <Box sx={{ 
                    bgcolor: '#e3f2fd', 
                    color: '#1565c0', 
                    borderRadius: '4px', 
                    fontWeight: '900', 
                    fontSize: '0.75rem',
                    display: 'inline-block',
                    minWidth: '24px',
                    textAlign: 'center'
                  }}>
                    {casal.posturas?.[0]?.count || 0}
                  </Box>
                </TableCell>
                <TableCell align="right">
                  <Stack direction="row" spacing={0} justifyContent="flex-end">
                    <Tooltip title="Ver Ninho">
                      <IconButton size="small" color="primary" onClick={() => router.push(`/inicial_page/reproducao/${casal.id}`)}>
                        <VisibilityIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Tooltip>
                    <Tooltip title="Desfazer Casal">
                      <IconButton size="small" color="error">
                        <HeartBrokenIcon sx={{ fontSize: '1.1rem' }} />
                      </IconButton>
                    </Tooltip>
                  </Stack>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>
    </Container>
  );
}
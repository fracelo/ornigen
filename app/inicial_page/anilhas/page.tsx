"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Typography, Paper, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, 
  Chip, TextField, InputAdornment, IconButton, Button,
  CircularProgress, Tooltip, Stack
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import EditIcon from "@mui/icons-material/Edit";
import AddIcon from "@mui/icons-material/Add";
import { useRouter } from "next/navigation";

export default function ListaAnilhasPage() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [anilhas, setAnilhas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const carregarAnilhas = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("anilhas")
        .select(`
          *,
          femea:passaro_femea_id(nome, anilha),
          filhote:passaro_filhote_id(nome)
        `)
        .eq("empresa_id", empresaId)
        .order("data_entrada", { ascending: false });

      if (error) throw error;
      setAnilhas(data || []);
    } catch (err) {
      console.error("Erro ao carregar anilhas:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { carregarAnilhas(); }, [carregarAnilhas]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Livre": return "success";
      case "Utilizada": return "primary";
      case "Descartada": return "error";
      case "Extraviada": return "warning";
      default: return "default";
    }
  };

  const anilhasFiltradas = anilhas.filter(a => 
    a.numero.toLowerCase().includes(busca.toLowerCase()) ||
    a.femea?.nome.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid #e0e0e0' }}>
        
        {/* CABEÇALHO E AÇÕES */}
        <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems={{ md: 'center' }} spacing={2} mb={4}>
          <Box>
            <Typography variant="h5" fontWeight="bold" sx={{ color: '#1e3a8a' }}>
              Estoque de Anilhas
            </Typography>
            <Typography variant="body2" color="textSecondary">Gerencie suas anilhas e vínculos com fêmeas</Typography>
          </Box>

          <Stack direction="row" spacing={2} alignItems="center">
            <TextField 
              size="small"
              placeholder="Buscar anilha ou fêmea..."
              value={busca}
              onChange={(e) => setBusca(e.target.value)}
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <SearchIcon fontSize="small" />
                  </InputAdornment>
                ),
              }}
              sx={{ width: 250 }}
            />
            <Button 
              variant="contained" 
              startIcon={<AddIcon />}
              onClick={() => router.push("/inicial_page/anilhas/novo")}
              sx={{ bgcolor: '#1e3a8a', '&:hover': { bgcolor: '#172554' } }}
            >
              Inserir Anilha
            </Button>
          </Stack>
        </Stack>

        {/* TABELA DE DADOS */}
        <TableContainer>
          <Table sx={{ minWidth: 650 }}>
            <TableHead sx={{ bgcolor: '#f8fafc' }}>
              <TableRow>
                <TableCell sx={{ fontWeight: 'bold' }}>Número da Anilha</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Ano REF</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Status</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Fêmea (Mãe)</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Data Entrada</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>Uso</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {anilhasFiltradas.map((row) => (
                <TableRow key={row.id} hover>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{row.numero}</Typography>
                  </TableCell>
                  <TableCell>{row.ano_referencia}</TableCell>
                  <TableCell>
                    <Chip 
                      label={row.status} 
                      size="small" 
                      color={getStatusColor(row.status) as any}
                      sx={{ fontWeight: 'bold', fontSize: '11px' }}
                    />
                  </TableCell>
                  <TableCell>
                    {row.femea ? (
                      <Box>
                        <Typography variant="body2">{row.femea.nome}</Typography>
                        <Typography variant="caption" color="textSecondary">{row.femea.anilha}</Typography>
                      </Box>
                    ) : (
                      <Typography variant="caption" color="textDisabled">Avulsa</Typography>
                    )}
                  </TableCell>
                  <TableCell>{row.data_entrada ? new Date(row.data_entrada).toLocaleDateString('pt-BR') : '-'}</TableCell>
                  <TableCell>
                    {row.filhote?.nome ? (
                      <Typography variant="caption" sx={{ color: '#1e40af', fontWeight: 'bold' }}>
                        Filhote: {row.filhote.nome}
                      </Typography>
                    ) : row.status === 'Livre' ? (
                      <Typography variant="caption" color="success.main">Disponível</Typography>
                    ) : (
                      "-"
                    )}
                  </TableCell>
                  <TableCell align="right">
                    <Tooltip title="Editar Anilha">
                      <IconButton 
                        size="small" 
                        onClick={() => router.push(`/inicial_page/anilhas/${row.id}`)}
                        sx={{ color: '#1e3a8a' }}
                      >
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              ))}
              {anilhasFiltradas.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} align="center" sx={{ py: 5 }}>
                    <Typography color="textSecondary">Nenhuma anilha encontrada.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, Typography, Paper, Chip, Checkbox, IconButton, CircularProgress, 
  TableContainer, Avatar, MenuItem, Select, FormControl, InputLabel, Container,
  TablePagination, Tooltip
} from "@mui/material";
import { useEmpresa } from "@/context/empresaContext";

// Ícones
import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import ScienceIcon from "@mui/icons-material/Science";
import StarIcon from "@mui/icons-material/Star";

function ListaPassarosContent() {
  const [busca, setBusca] = useState("");
  const [filtroStatus, setFiltroStatus] = useState("Ativo");
  const [registros, setRegistros] = useState<any[]>([]);
  const [selecionados, setSelecionados] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);

  // Estados de Paginação
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);

  const router = useRouter();
  const { empresaId } = useEmpresa();

  const carregarRegistros = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data: passaros, error: errP } = await supabase
        .from("passaros")
        .select(`id, nome, anilha, sexo, laudo_url, status, especie_id, pai_id, mae_id, especies_sispass:especie_id (nomes_comuns)`)
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      if (errP) throw errP;

      const { data: fotos } = await supabase
        .from("passaros_midia")
        .select("passaro_id, url, principal")
        .eq("empresa_id", empresaId)
        .eq("tipo", "foto")
        .order("principal", { ascending: false });

      const mapaFotos: Record<number, { url: string; principal: boolean }> = {};
      fotos?.forEach(f => { 
        if (!mapaFotos[f.passaro_id]) {
          mapaFotos[f.passaro_id] = { url: f.url, principal: f.principal || false };
        }
      });

      setRegistros(passaros?.map((p: any) => ({
        ...p,
        foto_url: mapaFotos[p.id]?.url || null,
        tem_estrela: mapaFotos[p.id]?.principal || false,
        especie_nome: p.especies_sispass?.nomes_comuns?.[0] || "Não informada",
        status: p.status || "Ativo"
      })) || []);

    } catch (err) { 
      console.error("Erro ao carregar lista:", err); 
    } finally { 
      setLoading(false); 
    }
  }, [empresaId]);

  useEffect(() => { carregarRegistros(); }, [carregarRegistros]);

  const registrosFiltrados = registros.filter(r => {
    const matchesBusca = r.nome?.toLowerCase().includes(busca.toLowerCase()) || r.anilha?.toLowerCase().includes(busca.toLowerCase());
    const matchesStatus = filtroStatus === "Todos" ? true : r.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  const registrosPaginados = registrosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleEdit = (id: number) => router.push(`/inicial_page/passaros/${id}`);

  // 🔹 ESTILO DA LINHA SEPARADORA (AZUL ESCURO)
  const cellStyle = { 
    borderBottom: '2.5px solid #1565C0', // Azul Marinho/Royal (Escuro e elegante)
    py: 1.8 // Aumentei o respiro vertical para a linha respirar melhor
  };

  return (
    <Container maxWidth="lg" sx={{ py: { xs: 2, md: 3 } }}>
      {/* HEADER OPERACIONAL */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: "#0D47A1", fontWeight: "900", letterSpacing: '-0.5px' }}>
          PLANTEL ORNIGEN
        </Typography>
        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button variant="outlined" size="small" disabled={selecionados.length === 0} startIcon={<BadgeIcon />}>
            Imprimir Crachás ({selecionados.length})
          </Button>
          <Button 
            variant="contained" 
            size="small" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/passaros/novo")}
          >
            Novo Pássaro
          </Button>
        </Box>
      </Box>

      {/* FILTROS */}
      <Paper variant="outlined" sx={{ p: 1.5, mb: 2, borderRadius: 2, display: 'flex', gap: 2, bgcolor: '#fbfcfe' }}>
        <TextField 
          placeholder="Buscar por nome ou anilha..." 
          value={busca} 
          onChange={(e) => { setBusca(e.target.value); setPage(0); }} 
          sx={{ flexGrow: 1 }} 
          size="small" 
          InputProps={{ startAdornment: <SearchIcon sx={{ color: 'gray', mr: 1, fontSize: 20 }} /> }} 
        />
        <FormControl size="small" sx={{ minWidth: 160 }}>
          <InputLabel>Filtrar Status</InputLabel>
          <Select value={filtroStatus} label="Filtrar Status" onChange={(e) => { setFiltroStatus(e.target.value); setPage(0); }}>
            <MenuItem value="Ativo">Ativos</MenuItem>
            <MenuItem value="Morto">Mortos</MenuItem>
            <MenuItem value="Fuga">Fugas</MenuItem>
            <MenuItem value="Transferido">Transferidos</MenuItem>
            <MenuItem value="Todos">Todos os Registros</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* TABELA DE GESTÃO */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2, maxHeight: 'calc(100vh - 280px)' }}>
        <Table size="small" stickyHeader>
          <TableHead>
            <TableRow>
              <TableCell padding="checkbox" sx={{ bgcolor: "#f8f9fa", fontWeight: "bold", borderBottom: '3px solid #0D47A1' }}>
                <Checkbox 
                  size="small" 
                  indeterminate={selecionados.length > 0 && selecionados.length < registrosFiltrados.length}
                  checked={registrosFiltrados.length > 0 && selecionados.length === registrosFiltrados.length}
                  onChange={(e) => setSelecionados(e.target.checked ? registrosFiltrados.map(r => r.id) : [])} 
                />
              </TableCell>
              <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa", borderBottom: '3px solid #0D47A1' }}>Ave</TableCell>
              <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa", borderBottom: '3px solid #0D47A1' }}>Identificação</TableCell>
              <TableCell sx={{ fontWeight: "bold", bgcolor: "#f8f9fa", borderBottom: '3px solid #0D47A1' }}>Situação</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold", bgcolor: "#f8f9fa", borderBottom: '3px solid #0D47A1' }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : registrosFiltrados.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Nenhum pássaro encontrado.</TableCell></TableRow>
            ) : registrosPaginados.map((r) => {
              const inativo = r.status !== "Ativo";
              const isMacho = r.sexo === 'M';

              return (
                <TableRow key={r.id} hover sx={{ opacity: inativo ? 0.7 : 1 }}>
                  <TableCell padding="checkbox" sx={cellStyle}>
                    <Checkbox 
                      size="small" 
                      checked={selecionados.includes(r.id)} 
                      onChange={() => setSelecionados(prev => prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id])} 
                    />
                  </TableCell>

                  {/* AVE: FOTO E NOME CLICÁVEIS */}
                  <TableCell sx={cellStyle}>
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                      <Tooltip title="Editar Ficha">
                        <Box 
                          sx={{ position: 'relative', cursor: 'pointer', transition: '0.2s', '&:hover': { transform: 'scale(1.1)' } }}
                          onClick={() => handleEdit(r.id)}
                        >
                          <Avatar 
                            src={r.foto_url} 
                            variant="rounded" 
                            sx={{ 
                              width: 46, 
                              height: 46, 
                              border: r.tem_estrela ? '2px solid #ffb300' : '1px solid #ddd',
                              bgcolor: '#f0f0f0'
                            }}
                          >
                            🐦
                          </Avatar>
                          {r.tem_estrela && (
                            <StarIcon sx={{ 
                              position: 'absolute', top: -6, right: -6, fontSize: 16, 
                              color: '#ffb300', bgcolor: 'white', borderRadius: '50%',
                              boxShadow: '0 1px 3px rgba(0,0,0,0.2)'
                            }} />
                          )}
                        </Box>
                      </Tooltip>
                      <Box 
                        sx={{ cursor: 'pointer', '&:hover': { opacity: 0.6 } }}
                        onClick={() => handleEdit(r.id)}
                      >
                        <Typography variant="body2" sx={{ fontWeight: 800, color: '#1976D2', textDecoration: inativo ? 'line-through' : 'none', lineHeight: 1.1 }}>
                          {r.nome}
                        </Typography>
                        <Typography variant="caption" color="textSecondary" sx={{ fontSize: '0.65rem' }}>
                          {r.especie_nome}
                        </Typography>
                      </Box>
                    </Box>
                  </TableCell>

                  {/* IDENTIFICAÇÃO */}
                  <TableCell sx={cellStyle}>
                    <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                        <Typography variant="caption" sx={{ fontWeight: 'bold', color: isMacho ? '#1976d2' : '#d81b60', fontSize: '0.75rem' }}>
                          {isMacho ? '♂ Macho' : '♀ Fêmea'}
                        </Typography>
                        {r.laudo_url && <ScienceIcon sx={{ fontSize: 14, color: '#4caf50' }} />}
                      </Box>
                      <Typography variant="caption" sx={{ fontWeight: 900, bgcolor: '#f5f5f5', px: 0.8, borderRadius: 0.5, border: '1px solid #ddd', width: 'fit-content', fontSize: '0.7rem' }}>
                        {r.anilha}
                      </Typography>
                    </Box>
                  </TableCell>

                  {/* SITUAÇÃO */}
                  <TableCell sx={cellStyle}>
                    <Chip 
                      label={r.status} 
                      size="small" 
                      sx={{ height: 18, fontSize: '0.6rem', fontWeight: 'bold' }} 
                      color={r.status === 'Ativo' ? 'success' : 'default'} 
                    />
                  </TableCell>

                  {/* AÇÕES */}
                  <TableCell align="right" sx={cellStyle}>
                    <Tooltip title="Editar Ficha">
                      <IconButton size="small" onClick={() => handleEdit(r.id)} color="primary">
                        <EditIcon fontSize="small" />
                      </IconButton>
                    </Tooltip>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </TableContainer>

      {/* PAGINAÇÃO */}
      <TablePagination
        component="div"
        count={registrosFiltrados.length}
        page={page}
        onPageChange={(e, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Pássaros por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}-${to} de ${count}`}
      />
    </Container>
  );
}

export default function ListaPassarosPage() {
  return (
    <Suspense fallback={<Box p={5} textAlign="center"><CircularProgress /></Box>}>
      <ListaPassarosContent />
    </Suspense>
  );
}
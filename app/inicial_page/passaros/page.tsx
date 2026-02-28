"use client";

import { useState, useEffect, Suspense, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Button, TextField, Table, TableHead, TableRow, TableCell,
  TableBody, Typography, Paper, Chip, Checkbox, IconButton, CircularProgress, 
  TableContainer, Avatar, MenuItem, Select, FormControl, InputLabel, Container,
  TablePagination
} from "@mui/material";
import { useEmpresa } from "@/context/empresaContext";

// Ícones
import AddIcon from "@mui/icons-material/Add";
import BadgeIcon from "@mui/icons-material/Badge";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";

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
        .select(`id, nome, anilha, sexo, status, especie_id, especies_sispass:especie_id (nomes_comuns)`)
        .eq("empresa_id", empresaId)
        .order("nome", { ascending: true });

      if (errP) throw errP;

      const { data: fotos } = await supabase
        .from("passaros_midia")
        .select("passaro_id, url, principal")
        .eq("empresa_id", empresaId)
        .eq("tipo", "foto")
        .order("principal", { ascending: false });

      const mapaFotos: Record<number, string> = {};
      fotos?.forEach((f: any) => { 
        if (!mapaFotos[f.passaro_id]) {
          mapaFotos[f.passaro_id] = f.url;
        }
      });

      setRegistros(passaros?.map((p: any) => ({
        ...p,
        foto_url: mapaFotos[p.id] || null,
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

  // --- LÓGICA DE FILTRO E PAGINAÇÃO ---
  
  const handleEdit = (id: number) => router.push(`/inicial_page/passaros/${id}`);

  const registrosFiltrados = registros.filter((r: any) => {
    const term = busca.toLowerCase();
    const matchesBusca = r.nome?.toLowerCase().includes(term) || r.anilha?.toLowerCase().includes(term);
    const matchesStatus = filtroStatus === "Todos" ? true : r.status === filtroStatus;
    return matchesBusca && matchesStatus;
  });

  const registrosPaginados = registrosFiltrados.slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleImprimirLote = () => {
    if (selecionados.length === 0) return;
    const ids = selecionados.join(",");
    window.open(`/inicial_page/passaros/imprimir-crachas?ids=${ids}`, "_blank");
  };

  const cellStyle = { py: 1.5, borderBottom: '1px solid #e0e0e0' };

  return (
    <Container maxWidth="lg" sx={{ py: 3 }}>
      {/* CABEÇALHO COM BOTÕES */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5" sx={{ color: "#0D47A1", fontWeight: "900" }}>
          PLANTEL ORNIGEN
        </Typography>

        <Box sx={{ display: 'flex', gap: 1 }}>
          <Button 
            variant="outlined" 
            size="small" 
            color="secondary"
            disabled={selecionados.length === 0} 
            startIcon={<BadgeIcon />}
            sx={{ fontWeight: 'bold' }}
            onClick={handleImprimirLote}
          >
            Imprimir Selecionados ({selecionados.length})
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
          <InputLabel>Status</InputLabel>
          <Select 
            value={filtroStatus} 
            label="Status" 
            onChange={(e) => { setFiltroStatus(e.target.value); setPage(0); }}
          >
            <MenuItem value="Ativo">Ativos</MenuItem>
            <MenuItem value="Morto">Mortos</MenuItem>
            <MenuItem value="Fuga">Fugas</MenuItem>
            <MenuItem value="Transferido">Transferidos</MenuItem>
            <MenuItem value="Todos">Todos</MenuItem>
          </Select>
        </FormControl>
      </Paper>

      {/* TABELA */}
      <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
        <Table size="small">
          <TableHead>
            <TableRow sx={{ bgcolor: "#f8f9fa" }}>
              <TableCell padding="checkbox">
                <Checkbox 
                  size="small" 
                  indeterminate={selecionados.length > 0 && selecionados.length < registrosFiltrados.length}
                  checked={registrosFiltrados.length > 0 && selecionados.length === registrosFiltrados.length}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelecionados(registrosFiltrados.map((r) => r.id));
                    } else {
                      setSelecionados([]);
                    }
                  }} 
                />
              </TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Ave</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Identificação</TableCell>
              <TableCell sx={{ fontWeight: "bold" }}>Situação</TableCell>
              <TableCell align="right" sx={{ fontWeight: "bold" }}>Ações</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}><CircularProgress size={24} /></TableCell></TableRow>
            ) : registrosFiltrados.length === 0 ? (
              <TableRow><TableCell colSpan={5} align="center" sx={{ py: 5 }}>Nenhum pássaro encontrado.</TableCell></TableRow>
            ) : registrosPaginados.map((r: any) => (
              <TableRow key={r.id} hover sx={{ opacity: r.status !== "Ativo" ? 0.7 : 1 }}>
                <TableCell padding="checkbox" sx={cellStyle}>
                  <Checkbox 
                    size="small" 
                    checked={selecionados.includes(r.id)} 
                    onChange={() => {
                      setSelecionados(prev => 
                        prev.includes(r.id) ? prev.filter(i => i !== r.id) : [...prev, r.id]
                      );
                    }} 
                  />
                </TableCell>
                <TableCell sx={cellStyle}>
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
                    <Avatar src={r.foto_url} variant="rounded" sx={{ width: 44, height: 44 }}>🐦</Avatar>
                    <Box>
                      <Typography variant="body2" sx={{ fontWeight: 700, color: '#1A237E' }}>{r.nome}</Typography>
                      <Typography variant="caption" color="textSecondary">{r.especie_nome}</Typography>
                    </Box>
                  </Box>
                </TableCell>
                <TableCell sx={cellStyle}>
                  <Typography variant="caption" sx={{ fontWeight: 'bold', color: r.sexo === 'M' ? '#1976D2' : '#D81B60', display: 'block' }}>
                    {r.sexo === 'M' ? '♂ Macho' : '♀ Fêmea'}
                  </Typography>
                  <Typography variant="caption" sx={{ fontWeight: 800, bgcolor: '#f0f0f0', px: 0.7, borderRadius: 1 }}>
                    {r.anilha}
                  </Typography>
                </TableCell>
                <TableCell sx={cellStyle}>
                  <Chip 
                    label={r.status} 
                    size="small" 
                    color={r.status === 'Ativo' ? 'success' : 'default'} 
                    sx={{ height: 20, fontSize: '0.65rem' }} 
                  />
                </TableCell>
                <TableCell align="right" sx={cellStyle}>
                  <IconButton size="small" onClick={() => handleEdit(r.id)} color="primary">
                    <EditIcon fontSize="small" />
                  </IconButton>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableContainer>

      <TablePagination
        component="div"
        count={registrosFiltrados.length}
        page={page}
        onPageChange={(_, p) => setPage(p)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
        rowsPerPageOptions={[10, 25, 50]}
        labelRowsPerPage="Exibir:"
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
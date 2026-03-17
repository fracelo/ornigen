"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, 
  Stack, Chip, CircularProgress, TextField, InputAdornment 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";
import SearchIcon from "@mui/icons-material/Search";
import ReceiptIcon from "@mui/icons-material/Receipt";

export default function ListaNotasVenda() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(true);
  const [notas, setNotas] = useState<any[]>([]);
  const [busca, setBusca] = useState("");

  const carregarNotas = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      // Buscamos a nota e o nome do cliente (criadouro) relacionado
      const { data, error } = await supabase
        .from("nota_venda")
        .select(`
          *,
          criadouros ( nome )
        `)
        .eq("empresa_id", empresaId)
        .order("data_pedido", { ascending: false });

      if (error) throw error;
      setNotas(data || []);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => { carregarNotas(); }, [carregarNotas]);

  const filtradas = notas.filter(n => 
    n.criadouros?.nome?.toLowerCase().includes(busca.toLowerCase()) ||
    n.status?.toLowerCase().includes(busca.toLowerCase())
  );

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 4, borderWidth: "4px", borderColor: "#cbd5e1" }}>
        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Stack direction="row" spacing={2} alignItems="center">
            <ReceiptIcon sx={{ fontSize: 40, color: "#1e293b" }} />
            <Box>
              <Typography variant="h5" fontWeight="900">Notas de Venda</Typography>
              <Typography variant="caption" color="text.secondary">Histórico de saídas e orçamentos</Typography>
            </Box>
          </Stack>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/vendas/nota_venda/novo")}
            sx={{ bgcolor: "#1e293b", fontWeight: 'bold' }}
          >
            Nova Venda (Checkout)
          </Button>
        </Box>

        <TextField
          fullWidth
          size="small"
          placeholder="Buscar por cliente ou status..."
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
                <TableCell sx={{ fontWeight: 'bold' }}>DATA</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>CLIENTE</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }}>STATUS</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">TOTAL PROD.</TableCell>
                <TableCell sx={{ fontWeight: 'bold' }} align="right">TOTAL NOTA</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>AÇÕES</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {filtradas.map((n) => (
                <TableRow key={n.id} hover>
                  <TableCell>{new Date(n.data_pedido).toLocaleDateString('pt-BR')}</TableCell>
                  <TableCell>
                    <Typography variant="body2" fontWeight="bold">{n.criadouros?.nome || "Não identificado"}</Typography>
                  </TableCell>
                  <TableCell>
                    <Chip 
                      label={n.status} 
                      size="small" 
                      color={n.status === 'Finalizado' ? 'success' : 'warning'} 
                      variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="right">
                    R$ {Number(n.total_produtos).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="right" sx={{ fontWeight: 'bold' }}>
                    R$ {Number(n.total_itens).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => router.push(`/inicial_page/vendas/nota_venda/${n.id}`)}>
                      <EditIcon fontSize="small" color="primary" />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>
    </Container>
  );
}
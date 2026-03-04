"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Container, Paper, Typography, Button, Table, TableBody, 
  TableCell, TableContainer, TableHead, TableRow, IconButton, Chip 
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import EditIcon from "@mui/icons-material/Edit";

export default function ListaCategorias() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [categorias, setCategorias] = useState<any[]>([]);

  const carregarCategorias = useCallback(async () => {
    if (!empresaId) return;
    const { data } = await supabase
      .from("categorias")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("tipo", { ascending: false }) // C antes de D
      .order("descricao", { ascending: true });

    if (data) {
      // Função para organizar a hierarquia na lista
      const listaOrganizada: any[] = [];
      const pais = data.filter(i => i.nivel === 0);
      pais.forEach(p => {
        listaOrganizada.push(p);
        const filhos = data.filter(f => f.pai_id === p.id);
        filhos.forEach(f => {
          listaOrganizada.push(f);
          const netos = data.filter(n => n.pai_id === f.id);
          netos.forEach(n => listaOrganizada.push(n));
        });
      });
      setCategorias(listaOrganizada);
    }
  }, [empresaId]);

  useEffect(() => { carregarCategorias(); }, [carregarCategorias]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper sx={{ p: 3, borderRadius: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3, alignItems: 'center' }}>
          <Typography variant="h5" fontWeight="900">Plano de Contas (Categorias)</Typography>
          <Button 
            variant="contained" 
            startIcon={<AddIcon />} 
            onClick={() => router.push("/inicial_page/financeiro/categorias/novo")}
            sx={{ bgcolor: "#1e293b" }}
          >
            Nova Categoria
          </Button>
        </Box>

        <TableContainer>
          <Table size="small">
            <TableHead>
              <TableRow sx={{ bgcolor: "#f8fafc" }}>
                <TableCell sx={{ fontWeight: 'bold' }}>Descrição / Hierarquia</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Tipo</TableCell>
                <TableCell align="center" sx={{ fontWeight: 'bold' }}>Nível</TableCell>
                <TableCell align="right" sx={{ fontWeight: 'bold' }}>Ações</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categorias.map((cat) => (
                <TableRow key={cat.id} hover sx={{ cursor: 'pointer' }} onClick={() => router.push(`/inicial_page/financeiro/categorias/${cat.id}`)}>
                  <TableCell sx={{ pl: cat.nivel * 4 + 2 }}>
                    {cat.nivel > 0 ? "— ".repeat(cat.nivel) : ""}
                    <Typography component="span" fontWeight={cat.nivel === 0 ? "bold" : "normal"}>
                      {cat.descricao}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Chip 
                      label={cat.tipo === 'C' ? 'Crédito' : 'Débito'} 
                      color={cat.tipo === 'C' ? 'success' : 'error'} 
                      size="small" variant="outlined" 
                    />
                  </TableCell>
                  <TableCell align="center">{cat.nivel}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small"><EditIcon fontSize="small" /></IconButton>
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
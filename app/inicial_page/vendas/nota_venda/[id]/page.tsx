"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { 
  Box, Paper, Typography, TextField, Button, Stack, Divider, 
  Autocomplete, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, IconButton, Modal, CircularProgress
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart";
import DeleteIcon from "@mui/icons-material/Delete";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";

export default function CheckoutNotaVenda() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [clientes, setClientes] = useState<any[]>([]);
  const [produtos, setProdutos] = useState<any[]>([]);
  const [itens, setItens] = useState<any[]>([]);
  
  const [clienteSel, setClienteSel] = useState<any>(null);
  const [produtoSel, setProdutoSel] = useState<any>(null);
  const [codBarrasBusca, setCodBarrasBusca] = useState("");
  const [observacoes, setObservacoes] = useState("");

  const [openModal, setOpenModal] = useState(false);
  const [tempItem, setTempItem] = useState({
    quantidade: 1,
    valor_venda: 0,
    subtotal: 0,
    desconto: 0,
    total: 0
  });

  const carregarDadosBase = useCallback(async () => {
    if (!empresaId) return;
    try {
      setLoading(true);
      const [resClientes, resProdutos] = await Promise.all([
        // 🔹 Filtro atualizado para buscar apenas TIPO_CLIENTE
        supabase
          .from("criadouros")
          .select("id, nome_fantasia")
          .eq("empresa_uuid", empresaId)
          .eq("e_proprio", false)
          .eq("tipo_cliente", true) 
          .order("nome_fantasia"),
        
        supabase
          .from("alimentos")
          .select("*")
          .eq("empresa_id", empresaId)
          .order("nome")
      ]);

      setClientes(resClientes.data || []);
      setProdutos(resProdutos.data || []);
      
      if (!isNovo) {
        const { data: nota } = await supabase.from("nota_venda").select("*, criadouros(nome_fantasia)").eq("id", id).single();
        if (nota) {
          setClienteSel(nota.criadouros);
          setObservacoes(nota.observacoes || "");
          const { data: itensNota } = await supabase.from("nota_venda_itens").select("*").eq("pedido_id", id);
          if (itensNota) {
            setItens(itensNota.map(i => ({
              produto_id: i.produto_id,
              descricao_item: i.descricao_item,
              quantidade: Number(i.quantidade),
              valor_venda: Number(i.valor_venda),
              subtotal: Number(i.total_produto),
              desconto: Number(i.desconto),
              total: Number(i.total_item)
            })));
          }
        }
      }
    } finally {
      setLoading(false);
    }
  }, [empresaId, id, isNovo]);

  useEffect(() => { carregarDadosBase(); }, [carregarDadosBase]);

  const recalcularModal = (campo: string, valor: number) => {
    const novoEstadoBase = { ...tempItem, [campo]: valor };
    let { quantidade, valor_venda, desconto, total } = novoEstadoBase;
    const subtotal = quantidade * valor_venda;

    if (campo === 'quantidade' || campo === 'valor_venda') {
      desconto = 0;
      total = subtotal;
    } else if (campo === 'desconto') {
      total = subtotal - desconto;
    } else if (campo === 'total') {
      desconto = subtotal - total;
    }
    setTempItem({ quantidade, valor_venda, subtotal, desconto, total });
  };

  const confirmarItem = () => {
    setItens([...itens, { 
      produto_id: produtoSel.id, 
      descricao_item: `${produtoSel.nome} ${produtoSel.marca || ""}`, 
      ...tempItem 
    }]);
    setOpenModal(false);
    setProdutoSel(null);
    setCodBarrasBusca("");
  };

  const handleFinalizar = async () => {
    if (!empresaId || !clienteSel || itens.length === 0) return alert("Dados incompletos!");
    setSalvando(true);
    try {
      const payloadNota = {
        empresa_id: empresaId,
        cliente_criadouro_id: clienteSel.id,
        total_produtos: itens.reduce((a, c) => a + c.subtotal, 0),
        total_descontos: itens.reduce((a, c) => a + c.desconto, 0),
        total_itens: itens.reduce((a, c) => a + c.total, 0),
        status: 'Finalizado',
        observacoes,
        data_pedido: new Date().toISOString()
      };

      const { data: nota, error } = await supabase.from("nota_venda").insert([payloadNota]).select().single();
      if (error) throw error;

      const payloadItens = itens.map(item => ({
        pedido_id: nota.id,
        produto_id: item.produto_id,
        descricao_item: item.descricao_item,
        quantidade: item.quantidade,
        valor_venda: item.valor_venda,
        total_produto: item.subtotal,
        desconto: item.desconto,
        total_item: item.total,
        baixa_estoque: true
      }));

      await supabase.from("nota_venda_itens").insert(payloadItens);
      router.push("/inicial_page/venda/nota_venda");
    } catch (err) {
      alert("Erro ao salvar.");
    } finally {
      setSalvando(false);
    }
  };

  if (loading) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2, p: 2, height: 'calc(100vh - 80px)' }}>
      <Paper variant="outlined" sx={{ flex: '1 1 320px', p: 3, borderRadius: 4, borderColor: '#cbd5e1' }}>
        <Stack spacing={3}>
          <Typography variant="h6" fontWeight="900">Checkout</Typography>
          <Autocomplete
            options={clientes}
            getOptionLabel={(o) => o.nome_fantasia || ""}
            value={clienteSel}
            onChange={(_, v) => setClienteSel(v)}
            renderInput={(p) => <TextField {...p} label="Cliente (Tipo Cliente)" size="small" />}
          />
          <TextField label="Observações" multiline rows={2} value={observacoes} onChange={(e) => setObservacoes(e.target.value)} />
          <Box sx={{ bgcolor: '#1e293b', p: 2, borderRadius: 3, color: '#fff' }}>
            <Typography variant="h4" fontWeight="900">
              R$ {itens.reduce((acc, curr) => acc + curr.total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </Typography>
          </Box>
          <Button variant="contained" fullWidth onClick={handleFinalizar} disabled={salvando} sx={{ bgcolor: '#1e293b' }}>
            FINALIZAR
          </Button>
        </Stack>
      </Paper>

      <Paper variant="outlined" sx={{ flex: '2 1 600px', p: 3, borderRadius: 4, borderColor: '#cbd5e1' }}>
        <Box sx={{ display: 'flex', gap: 1.5, mb: 2 }}>
          <Autocomplete
            sx={{ flexGrow: 1 }}
            options={produtos}
            getOptionLabel={(o) => `${o.nome} ${o.marca || ""}`}
            value={produtoSel}
            onChange={(_, v) => { setProdutoSel(v); if(v) setOpenModal(true); }}
            renderInput={(p) => <TextField {...p} label="Pesquisar Produto" size="small" />}
          />
        </Box>
        <TableContainer>
          <Table size="small">
            <TableHead><TableRow>
                <TableCell>PRODUTO</TableCell>
                <TableCell align="right">QTD</TableCell>
                <TableCell align="right">TOTAL</TableCell>
                <TableCell align="center">#</TableCell>
            </TableRow></TableHead>
            <TableBody>
              {itens.map((item, index) => (
                <TableRow key={index}>
                  <TableCell>{item.descricao_item}</TableCell>
                  <TableCell align="right">{item.quantidade}</TableCell>
                  <TableCell align="right">{item.total.toFixed(2)}</TableCell>
                  <TableCell align="center">
                    <IconButton onClick={() => setItens(itens.filter((_, i) => i !== index))}><DeleteIcon color="error" /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      </Paper>

      <Modal open={openModal} onClose={() => setOpenModal(false)}>
        <Box sx={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', width: 350, bgcolor: '#fff', p: 4, borderRadius: 4 }}>
          <Typography fontWeight="bold" mb={2}>Adicionar Item</Typography>
          <Stack spacing={2}>
            <TextField label="Quantidade" type="number" value={tempItem.quantidade} onChange={(e) => recalcularModal('quantidade', Number(e.target.value))} />
            <TextField label="Desconto (R$)" type="number" value={tempItem.desconto} onChange={(e) => recalcularModal('desconto', Number(e.target.value))} />
            <TextField label="Total" type="number" value={tempItem.total} onChange={(e) => recalcularModal('total', Number(e.target.value))} />
            <Button variant="contained" fullWidth onClick={confirmarItem} sx={{ bgcolor: '#1e293b' }}>Adicionar</Button>
          </Stack>
        </Box>
      </Modal>
    </Box>
  );
}
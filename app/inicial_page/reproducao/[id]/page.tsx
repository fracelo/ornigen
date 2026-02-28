"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, Container, Paper, Typography, Stack, Button, Autocomplete, 
  TextField, FormControlLabel, Checkbox, Divider, Chip, CircularProgress, 
  Alert, Tabs, Tab, Table, TableBody, TableCell, TableContainer, TableHead, 
  TableRow, IconButton, Dialog, DialogTitle, DialogContent, DialogActions,
  Select, MenuItem, InputLabel, FormControl, Tooltip
} from "@mui/material";

// Ícones
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import EggIcon from "@mui/icons-material/Egg";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import WarningIcon from "@mui/icons-material/Warning";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import ScienceIcon from "@mui/icons-material/Science";

export default function CasalDetalhesPage() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isNovo = id === "novo";

  const [tab, setTab] = useState(0);
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  
  const [machos, setMachos] = useState<any[]>([]);
  const [femeas, setFemeas] = useState<any[]>([]);
  const [anilhasMae, setAnilhasMae] = useState<any[]>([]);
  
  const [casal, setCasal] = useState<any>(null);
  const [analise, setAnalise] = useState({ percentual: 0, cor: "success", msg: "Aves sem parentesco" });

  const [ovos, setOvos] = useState<any[]>([]);
  const [modalNascimento, setModalNascimento] = useState({ aberto: false, ovo: null as any });
  const [formFilhote, setFormFilhote] = useState({ nome: "", anilha: "", sexo: "---" });
  const [modalAnilhaRapida, setModalAnilhaRapida] = useState(false);
  const [novaAnilhaNum, setNovaAnilhaNum] = useState("");

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    
    // Busca Reprodutores
    const { data: passaros } = await supabase.from("passaros")
      .select("*, especies_sispass(*)")
      .eq("empresa_id", empresaId)
      .eq("reprodutor", true);
      
    if (passaros) {
      setMachos(passaros.filter(p => p.sexo === 'M'));
      setFemeas(passaros.filter(p => p.sexo === 'F'));
    }

    if (!isNovo) {
      const { data: c } = await supabase.from("casais")
        .select("*, pai:pai_id(*), mae:mae_id(*, especies_sispass(*))")
        .eq("id", id).single();
      
      if (c) {
        setCasal(c);
        const { data: o } = await supabase.from("casais_posturas")
          .select("*").eq("casal_id", id).order("ordem_ovo", { ascending: true });
        setOvos(o || []);
        
        const { data: ani } = await supabase.from("anilhas")
          .select("*").eq("passaro_femea_id", c.mae_id).eq("status", 1);
        setAnilhasMae(ani || []);
      }
    } else {
      setCasal({ 
        data_formacao: new Date().toISOString().split('T')[0],
        data_efetivacao: new Date().toISOString().split('T')[0], 
        confirmacao_gala: false, 
        status: 'Ativo',
        indice_consanguinidade: 0
      });
    }
    setLoading(false);
  }, [id, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  // Cálculo de Consanguinidade
  useEffect(() => {
    if (casal?.pai_id && casal?.mae_id) {
      const p = machos.find(x => x.id === casal.pai_id);
      const m = femeas.find(x => x.id === casal.mae_id);
      if (p && m) {
        let pct = 0; let c = "success"; let msg = "Acoplamento Seguro";
        if (p.id === m.pai_id || m.id === p.mae_id) { pct = 25; c = "error"; msg = "Cruzamento Direto (Incesto)"; }
        else if (p.pai_id === m.pai_id && p.mae_id === m.mae_id && p.pai_id) { pct = 25; c = "error"; msg = "Irmãos Próprios"; }
        else if (p.pai_id === m.pai_id || p.mae_id === m.mae_id) { pct = 12.5; c = "warning"; msg = "Meio-irmãos"; }
        setAnalise({ percentual: pct, cor: c, msg });
      }
    }
  }, [casal?.pai_id, casal?.mae_id, machos, femeas]);

  const handleSalvarCasal = async () => {
    setSalvando(true);
    const payload = { ...casal, empresa_id: empresaId, indice_consanguinidade: analise.percentual };
    const { data, error } = isNovo 
      ? await supabase.from("casais").insert([payload]).select().single()
      : await supabase.from("casais").update(payload).eq("id", id);

    if (!error) {
      alert("Casal salvo com sucesso!");
      if (isNovo) router.push(`/inicial_page/reproducao/${data.id}`);
    }
    setSalvando(false);
  };

  const handleAddOvo = async () => {
    const ordem = ovos.length + 1;
    const incubacao = casal.mae?.especies_sispass?.tempo_incubacao || 13;
    const prevista = new Date();
    prevista.setDate(prevista.getDate() + incubacao);

    await supabase.from("casais_posturas").insert([{
      casal_id: id,
      empresa_id: empresaId,
      ordem_ovo: ordem,
      data_bota: new Date().toISOString().split('T')[0],
      periodo_incubacao: incubacao,
      data_prevista_nascimento: prevista.toISOString().split('T')[0],
      status: 'Em incubação'
    }]);
    carregarDados();
  };

  const handleMarcarFalha = async (ovoId: number, motivo: string) => {
    await supabase.from("casais_posturas").update({ 
      status: motivo, 
      data_finalizacao: new Date().toISOString().split('T')[0] 
    }).eq("id", ovoId);
    carregarDados();
  };

  const handleSalvarAnilhaRapida = async () => {
    if (!novaAnilhaNum || !casal?.mae_id) return;
    await supabase.from("anilhas").insert([{ 
      numero: novaAnilhaNum, 
      empresa_id: empresaId, 
      passaro_femea_id: casal.mae_id, 
      status: 1 
    }]);
    setNovaAnilhaNum("");
    setModalAnilhaRapida(false);
    carregarDados();
  };

  const handleFinalizarNascimento = async () => {
    setSalvando(true);
    try {
      const { data: f, error: errP } = await supabase.from("passaros").insert([{
        nome: formFilhote.nome,
        anilha: formFilhote.anilha,
        sexo: formFilhote.sexo,
        especie_id: casal.mae.especie_id,
        pai_id: casal.pai_id,
        mae_id: casal.mae_id,
        empresa_id: empresaId,
        data_nascimento: new Date().toISOString().split('T')[0],
        status: 'Ativo'
      }]).select().single();

      if (errP) throw errP;

      await supabase.from("casais_posturas").update({
        status: 'Sucesso',
        data_finalizacao: new Date().toISOString().split('T')[0],
        filhote_passaro_id: f.id,
        nome_filhote: formFilhote.nome,
        anilha_numero: formFilhote.anilha,
        sexo_filhote: formFilhote.sexo
      }).eq("id", modalNascimento.ovo.id);

      await supabase.from("anilhas").update({ status: 2, passaro_filhote_id: f.id }).eq("numero", formFilhote.anilha);

      setModalNascimento({ aberto: false, ovo: null });
      carregarDados();
    } catch (e) { alert("Erro no registro."); }
    setSalvando(false);
  };

  if (loading) return <Box p={10} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      <Stack direction="row" justifyContent="space-between" mb={2}>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/reproducao")}>Voltar</Button>
        <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvarCasal} disabled={salvando}>Salvar Ficha</Button>
      </Stack>

      <Paper sx={{ borderRadius: 4, overflow: 'hidden', border: '1px solid #ddd' }}>
        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" indicatorColor="primary">
          <Tab label="Dados do Casal" />
          <Tab label="Ninho e Posturas" disabled={isNovo} />
        </Tabs>

        <Box p={3}>
          {tab === 0 && (
            <Stack spacing={3}>
              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 2 }}>
                <Autocomplete
                  options={machos}
                  getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
                  value={machos.find(m => m.id === casal.pai_id) || null}
                  onChange={(_, v) => setCasal({ ...casal, pai_id: v?.id })}
                  renderInput={(p) => <TextField {...p} label="Macho Reprodutor" size="small" />}
                />
                <Autocomplete
                  options={femeas}
                  getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
                  value={femeas.find(f => f.id === casal.mae_id) || null}
                  onChange={(_, v) => setCasal({ ...casal, mae_id: v?.id })}
                  renderInput={(p) => <TextField {...p} label="Fêmea Reprodutora" size="small" />}
                />
              </Box>

              {casal.pai_id && casal.mae_id && (
                <Alert severity={analise.cor as any} icon={<ScienceIcon />}>
                  <Typography variant="subtitle2">Consanguinidade: <b>{analise.percentual}%</b></Typography>
                  <Typography variant="caption">{analise.msg}</Typography>
                </Alert>
              )}

              <Divider>Controle de Datas</Divider>

              <Box sx={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 2 }}>
                <TextField type="date" label="Formação do Casal" InputLabelProps={{ shrink: true }} size="small" value={casal.data_formacao} onChange={(e) => setCasal({ ...casal, data_formacao: e.target.value })} />
                <TextField type="date" label="Data da Gala" InputLabelProps={{ shrink: true }} size="small" value={casal.data_efetivacao} onChange={(e) => setCasal({ ...casal, data_efetivacao: e.target.value })} />
                <FormControlLabel control={<Checkbox checked={casal.confirmacao_gala} onChange={(e) => setCasal({ ...casal, confirmacao_gala: e.target.checked })} />} label="Gala Confirmada" />
              </Box>
            </Stack>
          )}

          {tab === 1 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6" fontWeight="bold">Ovos no Ninho</Typography>
                <Button variant="contained" color="primary" startIcon={<AddIcon />} onClick={handleAddOvo}>Registrar Ovo</Button>
              </Stack>

              <TableContainer>
                <Table size="small">
                  <TableHead><TableRow>
                    <TableCell><b>Ordem</b></TableCell>
                    <TableCell><b>Bota</b></TableCell>
                    <TableCell><b>Previsão</b></TableCell>
                    <TableCell><b>Status</b></TableCell>
                    <TableCell align="right"><b>Ações</b></TableCell>
                  </TableRow></TableHead>
                  <TableBody>
                    {ovos.map((ovo) => (
                      <TableRow key={ovo.id} sx={{ bgcolor: ovo.status === 'Sucesso' ? '#f0fff4' : 'inherit' }}>
                        <TableCell><b>{ovo.ordem_ovo}º Ovo</b></TableCell>
                        <TableCell>{new Date(ovo.data_bota).toLocaleDateString()}</TableCell>
                        <TableCell>{new Date(ovo.data_prevista_nascimento).toLocaleDateString()}</TableCell>
                        <TableCell><Chip label={ovo.status} size="small" variant="outlined" color={ovo.status === 'Sucesso' ? 'success' : 'default'} /></TableCell>
                        <TableCell align="right">
                          {ovo.status === 'Em incubação' && (
                            <Stack direction="row" spacing={1} justifyContent="flex-end">
                              <Button size="small" variant="contained" color="success" onClick={() => setModalNascimento({ aberto: true, ovo })}>Nascer</Button>
                              <Tooltip title="Ovo Branco/Gado"><IconButton size="small" color="warning" onClick={() => handleMarcarFalha(ovo.id, 'Gado')}><CancelIcon /></IconButton></Tooltip>
                            </Stack>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* MODAL NASCIMENTO */}
      <Dialog open={modalNascimento.aberto} onClose={() => setModalNascimento({ aberto: false, ovo: null })}>
        <DialogTitle>Registrar Nascimento - {modalNascimento.ovo?.ordem_ovo}º Ovo</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1, minWidth: 350 }}>
            <TextField label="Nome do Filhote" fullWidth size="small" value={formFilhote.nome} onChange={(e) => setFormFilhote({ ...formFilhote, nome: e.target.value })} />
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControl fullWidth size="small">
                <InputLabel>Anilha (Estoque Mãe)</InputLabel>
                <Select value={formFilhote.anilha} label="Anilha (Estoque Mãe)" onChange={(e) => setFormFilhote({ ...formFilhote, anilha: e.target.value })}>
                  {anilhasMae.map(a => <MenuItem key={a.id} value={a.numero}>{a.numero}</MenuItem>)}
                </Select>
              </FormControl>
              <Tooltip title="Cadastrar nova anilha rápida"><IconButton color="primary" onClick={() => setModalAnilhaRapida(true)}><AddIcon /></IconButton></Tooltip>
            </Box>
            <FormControl fullWidth size="small">
              <InputLabel>Sexo</InputLabel>
              <Select value={formFilhote.sexo} label="Sexo" onChange={(e) => setFormFilhote({ ...formFilhote, sexo: e.target.value })}>
                <MenuItem value="---">Não Identificado</MenuItem>
                <MenuItem value="M">Macho (♂)</MenuItem>
                <MenuItem value="F">Fêmea (♀)</MenuItem>
              </Select>
            </FormControl>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalNascimento({ aberto: false, ovo: null })}>Sair</Button>
          <Button variant="contained" onClick={handleFinalizarNascimento} disabled={salvando}>Gravar Filhote</Button>
        </DialogActions>
      </Dialog>

      {/* MODAL ANILHA RÁPIDA */}
      <Dialog open={modalAnilhaRapida} onClose={() => setModalAnilhaRapida(false)}>
        <DialogTitle>Nova Anilha para a Mãe</DialogTitle>
        <DialogContent>
          <TextField label="Número da Anilha" fullWidth size="small" sx={{ mt: 1 }} value={novaAnilhaNum} onChange={(e) => setNovaAnilhaNum(e.target.value)} />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAnilhaRapida(false)}>Voltar</Button>
          <Button variant="contained" onClick={handleSalvarAnilhaRapida}>Adicionar</Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}
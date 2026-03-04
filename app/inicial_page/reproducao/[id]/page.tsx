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
  Select, MenuItem, InputLabel, FormControl, AlertColor
} from "@mui/material";

// Ícones
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AddIcon from "@mui/icons-material/Add";
import CancelIcon from "@mui/icons-material/Cancel";
import ScienceIcon from "@mui/icons-material/Science";
import StarIcon from "@mui/icons-material/Star";

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
  const [analise, setAnalise] = useState<{ percentual: number; cor: AlertColor; msg: string }>({ 
    percentual: 0, cor: "success", msg: "Aves sem parentesco" 
  });

  const [ovos, setOvos] = useState<any[]>([]);
  const [modalNascimento, setModalNascimento] = useState({ aberto: false, ovo: null as any });
  const [formFilhote, setFormFilhote] = useState({ nome: "", anilha: "", sexo: "---" });
  
  const [modalConfirmarOvo, setModalConfirmarOvo] = useState(false);
  const [modalTermino, setModalTermino] = useState(false);
  const [dadosTermino, setDadosTermino] = useState({
    data_fim: new Date().toISOString().split('T')[0],
    desfecho: "Sucesso",
    observacoes: ""
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    
    const { data: passaros } = await supabase.from("passaros")
      .select("*, especies_sispass(*)")
      .eq("empresa_id", empresaId)
      .order("reprodutor", { ascending: false })
      .order("nome", { ascending: true });
      
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
        confirmacao_gala: false, status: 'Ativo', indice_consanguinidade: 0
      });
    }
    setLoading(false);
  }, [id, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  useEffect(() => {
    if (casal?.pai_id && casal?.mae_id) {
      const p = machos.find(x => x.id === casal.pai_id);
      const m = femeas.find(x => x.id === casal.mae_id);
      if (p && m) {
        let pct = 0; let c: AlertColor = "success"; let msg = "Acoplamento Seguro";
        if (p.id === m.pai_id || m.id === p.mae_id) { pct = 25; c = "error"; msg = "Cruzamento Direto (Incesto)"; }
        else if (p.pai_id === m.pai_id && p.mae_id === m.mae_id && p.pai_id) { pct = 25; c = "error"; msg = "Irmãos Próprios"; }
        else if (p.pai_id === m.pai_id || p.mae_id === m.mae_id) { pct = 12.5; c = "warning"; msg = "Meio-irmãos"; }
        setAnalise({ percentual: pct, cor: c, msg });

        const tempoPostura = m.especies_sispass?.tempo_postura_ovos || 10;
        const dataRef = new Date(casal.data_efetivacao);
        dataRef.setDate(dataRef.getDate() + tempoPostura);
        setCasal((prev: any) => ({ ...prev, data_prevista_ovos: dataRef.toISOString().split('T')[0] }));
      }
    }
  }, [casal?.pai_id, casal?.mae_id, casal?.data_efetivacao, machos, femeas]);

  const handleSalvarCasal = async () => {
    if (isNovo && casal.mae_id) {
      const { data: ex } = await supabase.from("casais").select("id").eq("mae_id", casal.mae_id).eq("status", "Ativo").maybeSingle();
      if (ex) return alert("Fêmea já vinculada a outro casal ativo.");
    }
    setSalvando(true);
    const payload = { ...casal, empresa_id: empresaId, indice_consanguinidade: analise.percentual };
    const { data, error } = isNovo 
      ? await supabase.from("casais").insert([payload]).select().single()
      : await supabase.from("casais").update(payload).eq("id", id);

    if (!error) {
      alert("Casal salvo!");
      if (isNovo) router.push(`/inicial_page/reproducao/casais/${data.id}`);
    }
    setSalvando(false);
  };

  const confirmarAddOvo = async () => {
    setModalConfirmarOvo(false);
    const ordem = ovos.length + 1;
    const incubacao = casal.mae?.especies_sispass?.tempo_incubacao || 13;
    const prevista = new Date();
    prevista.setDate(prevista.getDate() + incubacao);

    await supabase.from("casais_posturas").insert([{
      casal_id: id, empresa_id: empresaId, ordem_ovo: ordem,
      data_bota: new Date().toISOString().split('T')[0],
      periodo_incubacao: incubacao, data_prevista_nascimento: prevista.toISOString().split('T')[0],
      status: 'Em incubação'
    }]);
    carregarDados();
  };

  const handleFinalizarCiclo = async () => {
    setSalvando(true);
    const { error } = await supabase.from("casais").update({
      status: 'Desfeito', data_fim: dadosTermino.data_fim,
      motivo_fim: `${dadosTermino.desfecho}: ${dadosTermino.observacoes}`
    }).eq("id", id);
    if (!error) router.push("/inicial_page/reproducao");
    setSalvando(false);
  };

  const handleFinalizarNascimento = async () => {
    setSalvando(true);
    try {
      const { data: f, error: errP } = await supabase.from("passaros").insert([{
        nome: formFilhote.nome, anilha: formFilhote.anilha, sexo: formFilhote.sexo,
        especie_id: casal.mae.especie_id, pai_id: casal.pai_id, mae_id: casal.mae_id,
        empresa_id: empresaId, data_nascimento: new Date().toISOString().split('T')[0], status: 'Ativo'
      }]).select().single();
      if (errP) throw errP;
      await supabase.from("casais_posturas").update({
        status: 'Sucesso', data_finalizacao: new Date().toISOString().split('T')[0],
        filhote_passaro_id: f.id, nome_filhote: formFilhote.nome, anilha_numero: formFilhote.anilha, sexo_filhote: formFilhote.sexo
      }).eq("id", modalNascimento.ovo.id);
      await supabase.from("anilhas").update({ status: 2, passaro_filhote_id: f.id }).eq("numero", formFilhote.anilha);
      setModalNascimento({ aberto: false, ovo: null });
      carregarDados();
    } catch (e) { alert("Erro ao gravar filhote."); }
    setSalvando(false);
  };

  if (loading) return <Box p={10} textAlign="center"><CircularProgress /></Box>;

  return (
    <Container maxWidth="md" sx={{ py: 3 }}>
      {/* 🚀 BOX PRINCIPAL PADRONIZADO COM BORDA DE 4PX */}
      <Paper 
        variant="outlined" 
        elevation={0}
        sx={{ 
          p: 4, 
          borderRadius: 4, 
          borderColor: "#cbd5e1", 
          borderWidth: "4px",
          borderStyle: "solid",
          bgcolor: "#ffffff"
        }}
      >
        {/* Cabeçalho com Ícone de 96px */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 3 }}>
            <Box component="img" src="/icons/casais.png" alt="Ícone Casal" sx={{ width: 96, height: 96, objectFit: 'contain' }} />
            <Typography variant="h4" fontWeight="900" color="#1e293b">
              {isNovo ? "Criar Casal" : "Casal Formado"}
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.push("/inicial_page/reproducao")}
            sx={{ fontWeight: "bold", color: "#64748b", textTransform: 'none' }}
          >
            Voltar
          </Button>
        </Box>

        <Tabs value={tab} onChange={(_, v) => setTab(v)} variant="fullWidth" sx={{ mb: 3, borderBottom: 1, borderColor: 'divider' }}>
          <Tab label="Dados do Casal" />
          <Tab label="Ninho (Posturas)" disabled={isNovo} />
        </Tabs>

        <Box>
          {tab === 0 && (
            <Stack spacing={3}>
              {!isNovo && <Alert severity="warning"><b>Genética Travada:</b> Pais e mães não podem ser alterados após a formação do casal.</Alert>}
              {casal.status === 'Desfeito' && <Alert severity="info">Ciclo finalizado em {new Date(casal.data_fim).toLocaleDateString()}. Motivo: {casal.motivo_fim}</Alert>}
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Autocomplete
                  disabled={!isNovo || casal.status === 'Desfeito'}
                  options={machos}
                  getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
                  value={machos.find(m => m.id === casal.pai_id) || null}
                  onChange={(_, v) => setCasal((p: any) => ({ ...p, pai_id: v?.id }))}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box component="li" key={key} {...optionProps} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2">{option.nome} ({option.anilha})</Typography>
                        {option.reprodutor && <StarIcon sx={{ color: '#fbc02d', fontSize: 18 }} />}
                      </Box>
                    );
                  }}
                  renderInput={(p) => <TextField {...p} label="Macho (Pai)" size="small" />}
                />
                <Autocomplete
                  disabled={!isNovo || casal.status === 'Desfeito'}
                  options={femeas}
                  getOptionLabel={(o) => `${o.nome} (${o.anilha})`}
                  value={femeas.find(f => f.id === casal.mae_id) || null}
                  onChange={(_, v) => setCasal((p: any) => ({ ...p, mae_id: v?.id }))}
                  renderOption={(props, option) => {
                    const { key, ...optionProps } = props;
                    return (
                      <Box component="li" key={key} {...optionProps} sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%' }}>
                        <Typography variant="body2">{option.nome} ({option.anilha})</Typography>
                        {option.reprodutor && <StarIcon sx={{ color: '#fbc02d', fontSize: 18 }} />}
                      </Box>
                    );
                  }}
                  renderInput={(p) => <TextField {...p} label="Fêmea (Mãe)" size="small" />}
                />
              </Box>

              {casal.pai_id && casal.mae_id && (
                <Alert severity={analise.cor} icon={<ScienceIcon />}>
                  <Typography variant="subtitle2">Análise de Consanguinidade: <b>{analise.percentual}%</b></Typography>
                  <Typography variant="caption">{analise.msg}</Typography>
                </Alert>
              )}

              <Divider sx={{ my: 1 }}>DATAS E GALA</Divider>
              
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr 1fr' }, gap: 2 }}>
                <TextField disabled={casal.status === 'Desfeito'} type="date" label="Formação do Casal" InputLabelProps={{ shrink: true }} size="small" value={casal.data_formacao} onChange={(e) => setCasal((p: any) => ({ ...p, data_formacao: e.target.value }))} />
                <TextField disabled={casal.status === 'Desfeito'} type="date" label="Data da Gala" InputLabelProps={{ shrink: true }} size="small" value={casal.data_efetivacao} onChange={(e) => setCasal((p: any) => ({ ...p, data_efetivacao: e.target.value }))} />
                <FormControlLabel disabled={casal.status === 'Desfeito'} control={<Checkbox checked={casal.confirmacao_gala} onChange={(e) => setCasal((p: any) => ({ ...p, confirmacao_gala: e.target.checked }))} />} label="Gala Confirmada" />
              </Box>

              {/* Botões de Ação no Final do Bloco */}
              <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                {!isNovo && casal.status === 'Ativo' && (
                  <Button variant="outlined" color="error" onClick={() => setModalTermino(true)}>Encerrar Ciclo</Button>
                )}
                <Button 
                  variant="contained" 
                  startIcon={<SaveIcon />} 
                  onClick={handleSalvarCasal} 
                  disabled={salvando || casal.status === 'Desfeito'}
                  sx={{ px: 6, bgcolor: "#1e293b", fontWeight: "900", borderRadius: 2 }}
                >
                  Salvar Ficha
                </Button>
              </Box>
            </Stack>
          )}

          {tab === 1 && (
            <Box>
              <Stack direction="row" justifyContent="space-between" mb={2} alignItems="center">
                <Typography variant="h6" fontWeight="bold">Histórico de Posturas</Typography>
                {casal.status === 'Ativo' && <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalConfirmarOvo(true)}>Registrar Ovo</Button>}
              </Stack>
              <TableContainer component={Paper} variant="outlined" sx={{ borderRadius: 2 }}>
                <Table size="small">
                  <TableHead>
                    <TableRow sx={{ bgcolor: '#f8fafc' }}>
                      <TableCell><b>Ordem</b></TableCell>
                      <TableCell><b>Data Bota</b></TableCell>
                      <TableCell><b>Previsão</b></TableCell>
                      <TableCell><b>Status</b></TableCell>
                      <TableCell align="right"><b>Ações</b></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {ovos.length === 0 ? (
                      <TableRow><TableCell colSpan={5} align="center">Nenhum ovo registrado neste ninho.</TableCell></TableRow>
                    ) : (
                      ovos.map((ovo) => (
                        <TableRow key={ovo.id} sx={{ bgcolor: ovo.status === 'Sucesso' ? '#f0fff4' : 'inherit' }}>
                          <TableCell><b>{ovo.ordem_ovo}º</b></TableCell>
                          <TableCell>{new Date(ovo.data_bota).toLocaleDateString()}</TableCell>
                          <TableCell>{new Date(ovo.data_prevista_nascimento).toLocaleDateString()}</TableCell>
                          <TableCell><Chip label={ovo.status} size="small" variant="outlined" color={ovo.status === 'Sucesso' ? 'success' : 'default'} /></TableCell>
                          <TableCell align="right">
                            {ovo.status === 'Em incubação' && casal.status === 'Ativo' && (
                              <Stack direction="row" spacing={1} justifyContent="flex-end">
                                <Button size="small" variant="contained" color="success" onClick={() => setModalNascimento({ aberto: true, ovo })}>Nascer</Button>
                                <IconButton size="small" color="warning" onClick={() => { supabase.from("casais_posturas").update({ status: 'Gado' }).eq("id", ovo.id).then(() => carregarDados()) }}>
                                  <CancelIcon fontSize="small"/>
                                </IconButton>
                              </Stack>
                            )}
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          )}
        </Box>
      </Paper>

      {/* MODAIS (MANTIDOS) */}
      <Dialog open={modalConfirmarOvo} onClose={() => setModalConfirmarOvo(false)}>
        <DialogTitle>Novo Ovo Detectado?</DialogTitle>
        <DialogContent><Typography>Deseja registrar o {ovos.length + 1}º ovo para este casal hoje?</Typography></DialogContent>
        <DialogActions><Button onClick={() => setModalConfirmarOvo(false)}>Cancelar</Button><Button variant="contained" onClick={confirmarAddOvo}>Confirmar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalTermino} onClose={() => setModalTermino(false)}>
        <DialogTitle sx={{ color: 'error.main', fontWeight: 'bold' }}>Finalizar Ciclo Reprodutivo</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1, minWidth: 350 }}>
          <TextField type="date" label="Data de Encerramento" fullWidth InputLabelProps={{ shrink: true }} value={dadosTermino.data_fim} onChange={(e) => setDadosTermino({...dadosTermino, data_fim: e.target.value})}/>
          <FormControl fullWidth><InputLabel>Motivo do Desmanche</InputLabel><Select value={dadosTermino.desfecho} label="Motivo do Desmanche" onChange={(e) => setDadosTermino({...dadosTermino, desfecho: e.target.value})}>
            <MenuItem value="Sucesso">Ciclo de Sucesso (Fim de temporada)</MenuItem>
            <MenuItem value="Incompatibilidade">Incompatibilidade / Briga</MenuItem>
            <MenuItem value="Falha">Falha Total (Ovos brancos)</MenuItem>
            <MenuItem value="Interrupção">Interrupção Forçada</MenuItem>
          </Select></FormControl>
          <TextField label="Observações" fullWidth multiline rows={2} value={dadosTermino.observacoes} onChange={(e) => setDadosTermino({...dadosTermino, observacoes: e.target.value})}/>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setModalTermino(false)}>Voltar</Button><Button variant="contained" color="error" disabled={!dadosTermino.observacoes} onClick={handleFinalizarCiclo}>Confirmar Encerramento</Button></DialogActions>
      </Dialog>

      <Dialog open={modalNascimento.aberto} onClose={() => setModalNascimento({ aberto: false, ovo: null })}>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Registro de Filhote</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1, minWidth: 350 }}>
          <TextField label="Nome do Filhote" placeholder="Ex: Filhote 01" fullWidth size="small" value={formFilhote.nome} onChange={(e) => setFormFilhote({...formFilhote, nome: e.target.value})}/>
          <FormControl fullWidth size="small"><InputLabel>Anilha do Estoque</InputLabel><Select value={formFilhote.anilha} label="Anilha do Estoque" onChange={(e) => setFormFilhote({...formFilhote, anilha: e.target.value})}>
            {anilhasMae.map(a => <MenuItem key={a.id} value={a.numero}>{a.numero}</MenuItem>)}
          </Select></FormControl>
          <FormControl fullWidth size="small"><InputLabel>Sexo</InputLabel><Select value={formFilhote.sexo} label="Sexo" onChange={(e) => setFormFilhote({...formFilhote, sexo: e.target.value})}><MenuItem value="---">Não Identificado</MenuItem><MenuItem value="M">Macho</MenuItem><MenuItem value="F">Fêmea</MenuItem></Select></FormControl>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setModalNascimento({ aberto: false, ovo: null })}>Cancelar</Button><Button variant="contained" color="success" onClick={handleFinalizarNascimento}>Confirmar Nascimento</Button></DialogActions>
      </Dialog>
    </Container>
  );
}
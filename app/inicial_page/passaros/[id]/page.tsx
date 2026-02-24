"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import {
  Box, TextField, Button, Typography, CircularProgress, Paper, Container, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton,
  Autocomplete, Radio, RadioGroup, FormControlLabel,
  Stack, Divider, Select, MenuItem, InputLabel, FormControl,
  Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Avatar, Checkbox
} from "@mui/material";

// Ícones
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import PrintIcon from "@mui/icons-material/Print";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import VisibilityIcon from "@mui/icons-material/Visibility";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import EmojiEventsIcon from "@mui/icons-material/EmojiEvents";
import CorporateFareIcon from "@mui/icons-material/CorporateFare";
import AddIcon from "@mui/icons-material/Add";
import AddModeratorIcon from "@mui/icons-material/AddModerator";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";

import CrachaPassaro from "@/components/CrachaPassaro";

function PassaroFormContent() {
  const params = useParams();
  const idUrl = params.id as string;
  const isNovo = idUrl === "novo";
  
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [form, setForm] = useState<any>(null);
  
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);
  const [midias, setMidias] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [todasEntidades, setTodasEntidades] = useState<any[]>([]);
  const [entidadesVinculadas, setEntidadesVinculadas] = useState<any[]>([]);
  const [torneios, setTorneios] = useState<any[]>([]);
  const [estoqueAnilhasGlobal, setEstoqueAnilhasGlobal] = useState<any[]>([]);

  // Estados de Saúde
  const [saude, setSaude] = useState<any[]>([]);
  const [medicamentos, setMedicamentos] = useState<any[]>([]);
  const [modalSaudeAberto, setModalSaudeAberto] = useState(false);
  const [novaSaude, setNovaSaude] = useState({ 
    medicamento_id: "", 
    data_programada: new Date().toISOString().split('T')[0], 
    dose: "" 
  });

  // Estados de Modais e UI
  const [exibirEstoque, setExibirEstoque] = useState(false);
  const [modalAnilhaRapida, setModalAnilhaRapida] = useState(false);
  const [novaAnilhaNum, setNovaAnilhaNum] = useState("");
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [tipoMidia, setTipoMidia] = useState('foto');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [modalTorneioAberto, setModalTorneioAberto] = useState(false);
  const [modalEntidadeAberto, setModalEntidadeAberto] = useState(false);
  const [novoTorneio, setNovoTorneio] = useState<any>({ data_inicio: "", categoria: "", colocacao: "" });
  const [novoVinculo, setNovoVinculo] = useState({ entidade_id: "", numero_socio: "", data_registro: "" });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      const [resP, resM, resA, resE, resEnt, resMed] = await Promise.all([
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
        supabase.from("anilhas").select("*").eq("empresa_id", empresaId).eq("status", 1).is("passaro_filhote_id", null),
        supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns'),
        supabase.from("entidades").select("*").eq("empresa_id", empresaId).order('nome'),
        supabase.from("medicamentos").select("*").eq("empresa_id", empresaId).order('nome')
      ]);

      setPais(resP.data || []);
      setMaes(resM.data || []);
      setEstoqueAnilhasGlobal(resA.data || []);
      setEspecies(resE.data || []);
      setTodasEntidades(resEnt.data || []);
      setMedicamentos(resMed.data || []);

      if (isNovo) {
        setForm((prev: any) => prev || {
          nome: "", anilha: "", sexo: "M", status: "Ativo", especie_id: "",
          data_nascimento: new Date().toISOString().split('T')[0],
          mae_id: null, pai_id: null, laboratorio: "", reprodutor: false
        });
      } else {
        const passaroId = Number(idUrl);
        const { data: passaro } = await supabase.from("passaros").select(`*`).eq("id", passaroId).single();
        if (passaro) {
          setForm(passaro);
          const [resMid, resVinculo, resTor, resSaude] = await Promise.all([
            supabase.from("passaros_midia").select("*").eq("passaro_id", passaroId).order('created_at', { ascending: false }),
            supabase.from("passaros_entidades").select("*, entidades(nome, sigla, logo_url)").eq("passaro_id", passaroId),
            supabase.from("passaros_torneios").select("*, entidades(nome, sigla)").eq("passaro_id", passaroId).order('data_inicio', { ascending: false }),
            supabase.from("passaros_saude").select("*, medicamentos(nome, tipo)").eq("passaro_id", passaroId).order('data_programada', { ascending: false })
          ]);
          setMidias(resMid.data || []);
          setEntidadesVinculadas(resVinculo.data || []);
          setTorneios(resTor.data || []);
          setSaude(resSaude.data || []);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [idUrl, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvarPassaro = async () => {
    if (salvando || !form) return;
    if (isNovo && !form.anilha) { alert("Selecione uma anilha."); return; }
    setSalvando(true);
    try {
      const formFinal = { ...form, reprodutor: !!form.reprodutor };
      if (isNovo) {
        const { data: novoPassaro, error: errPassaro } = await supabase.from("passaros").insert([{ ...formFinal, empresa_id: empresaId, usuario_id: usuarioId }]).select().single();
        if (errPassaro) throw errPassaro;
        await supabase.from("anilhas").update({ status: 2, passaro_filhote_id: novoPassaro.id, data_utilizacao: new Date().toISOString() }).eq("numero", form.anilha).eq("empresa_id", empresaId);
        router.push(`/inicial_page/passaros/${novoPassaro.id}`);
      } else {
        const { error: errUpdate } = await supabase.from("passaros").update(formFinal).eq("id", form.id);
        if (errUpdate) throw errUpdate;
        alert("Pássaro atualizado!");
        carregarDados();
      }
    } catch (err) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const handleConfirmarDose = async (registro: any) => {
    if (!confirm("Confirmar aplicação? O estoque será atualizado.")) return;
    try {
      const dataAgora = new Date().toISOString();
      await supabase.from("passaros_saude").update({ data_aplicacao: dataAgora }).eq("id", registro.id);
      const { data: med } = await supabase.from("medicamentos").select("estoque_atual").eq("id", registro.medicamento_id).single();
      if (med) {
        const novoEstoque = Number(med.estoque_atual || 0) - 1;
        await supabase.from("medicamentos").update({ estoque_atual: novoEstoque }).eq("id", registro.medicamento_id);
        await supabase.from("medicamentos_estoque_mov").insert({ 
          empresa_id: empresaId, 
          medicamento_id: registro.medicamento_id, 
          tipo_mov: 'saida', 
          quantidade: 1, 
          motivo: `Aplicação: ${form.anilha}` 
        });
      }
      carregarDados();
    } catch (err) { alert("Erro ao processar dose."); }
  };

  const handleAgendarSaude = async () => {
    await supabase.from("passaros_saude").insert([{ ...novaSaude, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalSaudeAberto(false);
    carregarDados();
  };

  const handleSalvarAnilhaRapida = async () => {
    if (!novaAnilhaNum || !form?.mae_id) return;
    try {
      await supabase.from("anilhas").insert([{ numero: novaAnilhaNum, empresa_id: empresaId, passaro_femea_id: form.mae_id, status: 1 }]);
      setNovaAnilhaNum(""); setModalAnilhaRapida(false); carregarDados();
    } catch (err) { alert("Erro ao cadastrar anilha"); }
  };

  const handleUploadMidia = async () => {
    if (!arquivo || !form?.id || !empresaId) return;
    setSalvando(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const filePath = `${empresaId}/${form.id}/${Date.now()}.${fileExt}`;
      await supabase.storage.from('laudos').upload(filePath, arquivo);
      const { data: urlData } = supabase.storage.from('laudos').getPublicUrl(filePath);
      await supabase.from('passaros_midia').insert([{ passaro_id: form.id, empresa_id: empresaId, url: urlData.publicUrl, tipo: tipoMidia }]);
      setModalMidiaAberto(false); setArquivo(null); carregarDados();
    } catch (err) { alert("Erro no upload"); } finally { setSalvando(false); }
  };

  const handleAddTorneio = async () => {
    await supabase.from("passaros_torneios").insert([{ ...novoTorneio, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalTorneioAberto(false); carregarDados();
  };

  const handleAddEntidade = async () => {
    await supabase.from("passaros_entidades").insert([{ ...novoVinculo, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalEntidadeAberto(false); carregarDados();
  };

  const anilhasDisponiveis = estoqueAnilhasGlobal.filter(a => a.passaro_femea_id === form?.mae_id);

  if (loading || !form) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      {/* HEADER */}
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">{isNovo ? "NOVO FILHOTE" : "FICHA TÉCNICA"}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/passaros")} size="small">Voltar</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="primary">IDENTIFICAÇÃO E LAUDO</Typography>
              <FormControlLabel
                control={<Checkbox size="small" checked={!!form.reprodutor} onChange={(e) => setForm({...form, reprodutor: e.target.checked})} />}
                label={<Typography variant="caption" fontWeight="bold">{form.sexo === 'F' ? "REPRODUTORA" : "REPRODUTOR"}</Typography>}
              />
            </Box>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
              <Box sx={{ gridColumn: 'span 12' }}><TextField label="Nome" fullWidth size="small" value={form.nome || ""} onChange={(e) => setForm({...form, nome: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField label="Anilha" fullWidth size="small" value={form.anilha || ""} disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#d32f2f", fontWeight: '900' } }} /></Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sexo</InputLabel>
                  <Select value={form.sexo || "M"} label="Sexo" onChange={(e) => setForm({...form, sexo: e.target.value})}><MenuItem value="M">Macho (♂)</MenuItem><MenuItem value="F">Fêmea (♀)</MenuItem></Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField type="date" label="Nascimento" fullWidth size="small" value={form.data_nascimento || ""} onChange={(e) => setForm({...form, data_nascimento: e.target.value})} InputLabelProps={{ shrink: true }} /></Box>
              <Box sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Espécie</InputLabel>
                  <Select value={form.especie_id || ""} label="Espécie" onChange={(e: any) => setForm({...form, especie_id: e.target.value})}>
                    {especies.map(e => <MenuItem key={e.id} value={e.id}>{e.nomes_comuns?.[0]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 8' }}><TextField label="Laboratório" fullWidth size="small" value={form.laboratorio || ""} onChange={(e) => setForm({...form, laboratorio: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><Button variant="contained" component="label" fullWidth color="info" size="small" startIcon={<CloudUploadIcon />} sx={{ height: '38px' }}>PDF<input type="file" hidden /></Button></Box>
            </Box>
          </Paper>

          {/* SEÇÃO 2: GENEALOGIA */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block', mb: 2 }}>GENEALOGIA</Typography>
            <Stack spacing={2}>
              <Autocomplete options={pais} getOptionLabel={(o) => `${o.nome} (${o.anilha})`} value={pais.find(p => p.id === form.pai_id) || null} onChange={(_, v) => setForm({...form, pai_id: v?.id})} renderInput={(params) => <TextField {...params} label="Pai" size="small" />} />
              <Stack direction="row" spacing={1}>
                <Autocomplete sx={{ flex: 1 }} options={maes} getOptionLabel={(o) => `${o.nome} (${o.anilha})`} value={maes.find(m => m.id === form.mae_id) || null} onChange={(_, v) => { setForm({...form, mae_id: v?.id, anilha: ""}); setExibirEstoque(false); }} renderInput={(params) => <TextField {...params} label="Mãe" size="small" />} />
                <Button variant="outlined" size="small" onClick={() => setExibirEstoque(!exibirEstoque)} disabled={!form.mae_id}>Anilhas</Button>
                <IconButton color="primary" size="small" onClick={() => setModalAnilhaRapida(true)} disabled={!form.mae_id} sx={{ border: '1px solid #ddd' }}><AddIcon /></IconButton>
              </Stack>
              {exibirEstoque && (
                <Box sx={{ p: 1.5, bgcolor: '#f0f7ff', borderRadius: 2, border: '1px dashed #2196f3' }}>
                  <RadioGroup row value={form.anilha} onChange={(e) => setForm({...form, anilha: e.target.value})}>
                    {anilhasDisponiveis.map((an: any) => (<FormControlLabel key={an.id} value={an.numero} control={<Radio size="small" />} label={<Typography variant="caption">{an.numero}</Typography>} />))}
                  </RadioGroup>
                </Box>
              )}
            </Stack>
          </Paper>

          {/* SEÇÃO 3: SAÚDE */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" spacing={1} alignItems="center"><AddModeratorIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary">SAÚDE E MEDICAMENTOS</Typography></Stack>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setModalSaudeAberto(true)}>Agendar</Button>
              </Stack>
              <TableContainer><Table size="small"><TableBody>
                {saude.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell sx={{ fontSize: '0.7rem' }}>
                      <b>{new Date(item.data_programada).toLocaleDateString()}</b>
                      <Typography sx={{ fontSize: '0.6rem', color: item.data_aplicacao ? 'success.main' : 'warning.main' }}>{item.data_aplicacao ? 'Aplicado' : 'Pendente'}</Typography>
                    </TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}><b>{item.medicamentos?.nome}</b><br/>{item.dose}</TableCell>
                    <TableCell align="right">
                      {item.data_aplicacao ? <CheckCircleIcon color="success" sx={{ fontSize: 18 }} /> : <Button size="small" variant="contained" color="warning" sx={{ fontSize: '0.6rem', py: 0 }} onClick={() => handleConfirmarDose(item)}>Dose</Button>}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </Paper>
          )}

          {/* SEÇÃO 4: FILIAÇÕES */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" spacing={1} alignItems="center"><CorporateFareIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary">FILIAÇÕES EM CLUBES</Typography></Stack>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModalEntidadeAberto(true)} disabled={isNovo}>Vincular</Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {entidadesVinculadas.map((v) => (
                <Tooltip key={v.id} title={`Sócio: ${v.numero_socio}`}>
                  <Paper variant="outlined" sx={{ px: 1, py: 0.5, bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: 1 }}>
                    <Avatar src={v.entidades?.logo_url} sx={{ width: 18, height: 18 }} />
                    <Typography variant="caption" fontWeight="bold">{v.entidades?.sigla || v.entidades?.nome}</Typography>
                    <IconButton size="small" color="error" onClick={async () => { if(confirm("Remover?")) { await supabase.from("passaros_entidades").delete().eq("id", v.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 12 }} /></IconButton>
                  </Paper>
                </Tooltip>
              ))}
            </Box>
          </Paper>

          {/* SEÇÃO 5: TORNEIOS */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" spacing={1} alignItems="center"><EmojiEventsIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary">TORNEIOS</Typography></Stack>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setModalTorneioAberto(true)}>Novo</Button>
              </Stack>
              <TableContainer><Table size="small"><TableBody>
                {torneios.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontSize: '0.7rem' }}>{new Date(t.data_inicio).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}><b>{t.colocacao}</b> - {t.categoria}</TableCell>
                    <TableCell align="right"><IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_torneios").delete().eq("id", t.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </Paper>
          )}

          {/* SEÇÃO 6: MÍDIAS */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary">MÍDIAS</Typography>
                <Button startIcon={<CloudUploadIcon />} size="small" variant="contained" onClick={() => setModalMidiaAberto(true)}>Add</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 1.5, overflowX: 'auto', pb: 1 }}>
                {midias.map((m) => (
                  <Paper key={m.id} variant="outlined" sx={{ minWidth: 80, p: 0.5, textAlign: 'center' }}>
                    {m.tipo === 'foto' ? <Box component="img" src={m.url} width="60" height="45" sx={{ objectFit: 'cover', borderRadius: 0.5 }} /> : <VideoLibraryIcon color="action" sx={{ fontSize: 30 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'center' }}>
                      <IconButton size="small" onClick={() => window.open(m.url, '_blank')} color="primary"><VisibilityIcon sx={{ fontSize: 14 }} /></IconButton>
                      <IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_midia").delete().eq("id", m.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

          {/* BOTÕES DE SALVAR */}
          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', py: 2 }}>
            <Button variant="outlined" onClick={() => router.push("/inicial_page/passaros")}>Cancelar</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvarPassaro} disabled={salvando}>{salvando ? "Salvando..." : "Salvar"}</Button>
          </Box>
        </Box>

        {/* COLUNA LATERAL - CARD E ATALHOS */}
        <Box sx={{ position: 'sticky', top: 10 }}>
          <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#f9f9f9' }}><CrachaPassaro form={form} /></Paper>
          <Button variant="contained" fullWidth color="secondary" startIcon={<PrintIcon />} sx={{ mt: 2 }} disabled={isNovo} onClick={() => router.push(`/inicial_page/passaros/${idUrl}/pedigree`)}>Pedigree</Button>
          <Button variant="outlined" fullWidth startIcon={<AccountTreeIcon />} sx={{ mt: 1 }} disabled={isNovo} onClick={() => router.push(`/inicial_page/passaros/${idUrl}/genealogia-visual`)}>Genealogia</Button>
        </Box>
      </Box>

      {/* --- MODAIS FORMATADOS --- */}

      {/* 1. Modal Saúde */}
      <Dialog open={modalSaudeAberto} onClose={() => setModalSaudeAberto(false)}>
        <DialogTitle sx={{ fontSize: '1rem', fontWeight: 'bold' }}>Agendar Saúde</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Medicamento</InputLabel>
              <Select 
                value={novaSaude.medicamento_id} 
                label="Medicamento" 
                onChange={(e) => setNovaSaude({...novaSaude, medicamento_id: e.target.value})}
              >
                {medicamentos.map(med => (
                  <MenuItem key={med.id} value={med.id}>{med.nome} ({med.tipo})</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              type="date" 
              label="Data" 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              value={novaSaude.data_programada} 
              onChange={(e) => setNovaSaude({...novaSaude, data_programada: e.target.value})} 
            />
            <TextField 
              label="Dose" 
              fullWidth 
              size="small" 
              value={novaSaude.dose} 
              onChange={(e) => setNovaSaude({...novaSaude, dose: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalSaudeAberto(false)}>Sair</Button>
          <Button variant="contained" onClick={handleAgendarSaude}>Gravar</Button>
        </DialogActions>
      </Dialog>

      {/* 2. Modal Anilha Rápida */}
      <Dialog open={modalAnilhaRapida} onClose={() => setModalAnilhaRapida(false)}>
        <DialogTitle>Nova Anilha no Estoque</DialogTitle>
        <DialogContent>
          <TextField 
            label="Número" 
            fullWidth 
            sx={{ mt: 1 }} 
            value={novaAnilhaNum} 
            onChange={(e) => setNovaAnilhaNum(e.target.value)} 
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalAnilhaRapida(false)}>Sair</Button>
          <Button variant="contained" onClick={handleSalvarAnilhaRapida}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* 3. Modal Clube */}
      <Dialog open={modalEntidadeAberto} onClose={() => setModalEntidadeAberto(false)}>
        <DialogTitle>Vincular Clube</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth size="small">
              <InputLabel>Entidade</InputLabel>
              <Select 
                value={novoVinculo.entidade_id} 
                onChange={(e) => setNovoVinculo({...novoVinculo, entidade_id: e.target.value as string})}
              >
                {todasEntidades.map(ent => (
                  <MenuItem key={ent.id} value={ent.id}>{ent.nome}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField 
              label="Nº Registro" 
              fullWidth 
              size="small" 
              onChange={(e) => setNovoVinculo({...novoVinculo, numero_socio: e.target.value})} 
            />
            <TextField 
              type="date" 
              label="Data Registro" 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              onChange={(e) => setNovoVinculo({...novoVinculo, data_registro: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalEntidadeAberto(false)}>Sair</Button>
          <Button variant="contained" onClick={handleAddEntidade}>Salvar</Button>
        </DialogActions>
      </Dialog>

      {/* 4. Modal Torneio */}
      <Dialog open={modalTorneioAberto} onClose={() => setModalTorneioAberto(false)}>
        <DialogTitle>Resultado de Torneio</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField 
              type="date" 
              label="Data" 
              fullWidth 
              size="small" 
              InputLabelProps={{ shrink: true }} 
              onChange={(e) => setNovoTorneio({...novoTorneio, data_inicio: e.target.value})} 
            />
            <TextField 
              label="Categoria" 
              fullWidth 
              size="small" 
              onChange={(e) => setNovoTorneio({...novoTorneio, categoria: e.target.value})} 
            />
            <TextField 
              label="Colocação" 
              fullWidth 
              size="small" 
              onChange={(e) => setNovoTorneio({...novoTorneio, colocacao: e.target.value})} 
            />
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalTorneioAberto(false)}>Sair</Button>
          <Button variant="contained" onClick={handleAddTorneio}>Gravar</Button>
        </DialogActions>
      </Dialog>

      {/* 5. Modal Mídia */}
      <Dialog open={modalMidiaAberto} onClose={() => setModalMidiaAberto(false)}>
        <DialogTitle>Adicionar Mídia</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <Select 
              value={tipoMidia} 
              onChange={(e) => setTipoMidia(e.target.value as string)} 
              size="small"
            >
              <MenuItem value="foto">Foto</MenuItem>
              <MenuItem value="video">Vídeo</MenuItem>
            </Select>
            <Button variant="outlined" component="label" fullWidth startIcon={<CloudUploadIcon />}>
              {arquivo ? arquivo.name : "Arquivo"}
              <input type="file" hidden onChange={(e: any) => setArquivo(e.target.files?.[0])} />
            </Button>
          </Stack>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setModalMidiaAberto(false)}>Sair</Button>
          <Button variant="contained" onClick={handleUploadMidia} disabled={!arquivo}>Upload</Button>
        </DialogActions>
      </Dialog>
      
    </Container>
  );
}

export default function PassaroPage() { return <Suspense fallback={<CircularProgress />}><PassaroFormContent /></Suspense>; }
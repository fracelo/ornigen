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
  Table, TableBody, TableCell, TableContainer, TableRow, Tooltip, Avatar
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
  const [historicoStatus, setHistoricoStatus] = useState<any[]>([]);
  const [estoqueAnilhasGlobal, setEstoqueAnilhasGlobal] = useState<any[]>([]);

  const [todasEntidades, setTodasEntidades] = useState<any[]>([]);
  const [entidadesVinculadas, setEntidadesVinculadas] = useState<any[]>([]);
  const [torneios, setTorneios] = useState<any[]>([]);
  
  const [exibirEstoque, setExibirEstoque] = useState(false);
  const [modalAnilhaRapida, setModalAnilhaRapida] = useState(false);
  const [novaAnilhaNum, setNovaAnilhaNum] = useState("");
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [tipoMidia, setTipoMidia] = useState('foto');
  const [arquivo, setArquivo] = useState<File | null>(null);

  const [modalTorneioAberto, setModalTorneioAberto] = useState(false);
  const [modalEntidadeAberto, setModalEntidadeAberto] = useState(false);
  const [novoTorneio, setNovoTorneio] = useState<any>({ data_inicio: "", categoria: "", colocacao: "", entidade_id: "" });
  const [novoVinculo, setNovoVinculo] = useState({ entidade_id: "", numero_socio: "" });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      const [resP, resM, resA, resE, resEnt] = await Promise.all([
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
        supabase.from("anilhas").select("*").eq("empresa_id", empresaId).eq("status", 1).is("passaro_filhote_id", null),
        supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns'),
        supabase.from("entidades").select("*").eq("empresa_id", empresaId).order('nome')
      ]);

      setPais(resP.data || []);
      setMaes(resM.data || []);
      setEstoqueAnilhasGlobal(resA.data || []);
      setEspecies(resE.data || []);
      setTodasEntidades(resEnt.data || []);

      if (isNovo && !form) {
        setForm({
          nome: "", anilha: "", sexo: "M", status: "Ativo", especie_id: "",
          data_nascimento: new Date().toISOString().split('T')[0],
          mae_id: null, pai_id: null, laboratorio: ""
        });
      } else if (!isNovo) {
        const passaroId = Number(idUrl);
        const { data: passaro } = await supabase.from("passaros").select(`*`).eq("id", passaroId).single();
        if (passaro) {
          setForm(passaro);
          const [resMid, resHis, resVinculo, resTor] = await Promise.all([
            supabase.from("passaros_midia").select("*").eq("passaro_id", passaroId).order('created_at', { ascending: false }),
            supabase.from("passaros_status_historico").select("*").eq("passaro_id", passaroId).order('created_at', { ascending: false }),
            supabase.from("passaros_entidades").select("*, entidades(nome, sigla, logo_url)").eq("passaro_id", passaroId),
            supabase.from("passaros_torneios").select("*, entidades(nome, sigla)").eq("passaro_id", passaroId).order('data_inicio', { ascending: false })
          ]);
          setMidias(resMid.data || []);
          setHistoricoStatus(resHis.data || []);
          setEntidadesVinculadas(resVinculo.data || []);
          setTorneios(resTor.data || []);
        }
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [idUrl, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvarPassaro = async () => {
    if (salvando) return;
    if (isNovo && !form.anilha) { alert("Selecione uma anilha."); return; }
    setSalvando(true);
    try {
      if (isNovo) {
        const { data: novoPassaro, error: errPassaro } = await supabase.from("passaros").insert([{ ...form, empresa_id: empresaId, usuario_id: usuarioId }]).select().single();
        if (errPassaro) throw errPassaro;
        await supabase.from("anilhas").update({ status: 2, passaro_filhote_id: novoPassaro.id, data_utilizacao: new Date().toISOString() }).eq("numero", form.anilha).eq("empresa_id", empresaId);
        router.push(`/inicial_page/passaros/${novoPassaro.id}`);
      } else {
        await supabase.from("passaros").update(form).eq("id", form.id);
        alert("Pássaro atualizado!");
      }
    } catch (err) { alert("Erro ao salvar."); } finally { setSalvando(false); }
  };

  const handleUploadMidia = async () => {
    if (!arquivo || !form?.id || !empresaId) return;
    setSalvando(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const filePath = `${empresaId}/${form.id}/${Date.now()}.${fileExt}`;
      await supabase.storage.from('laudos').upload(filePath, arquivo);
      const { data: urlData } = supabase.storage.from('laudos').getPublicUrl(filePath);
      await supabase.from('passaros_midia').insert([{ 
        passaro_id: form.id, empresa_id: empresaId, url: urlData.publicUrl, tipo: tipoMidia 
      }]);
      setModalMidiaAberto(false);
      setArquivo(null);
      carregarDados();
    } catch (err) { alert("Erro no upload"); } finally { setSalvando(false); }
  };

  const handleAddTorneio = async () => {
    await supabase.from("passaros_torneios").insert([{ ...novoTorneio, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalTorneioAberto(false);
    carregarDados();
  };

  const handleAddEntidade = async () => {
    await supabase.from("passaros_entidades").insert([{ ...novoVinculo, passaro_id: Number(idUrl), empresa_id: empresaId }]);
    setModalEntidadeAberto(false);
    carregarDados();
  };

  const anilhasDisponiveis = estoqueAnilhasGlobal.filter(a => a.passaro_femea_id === form?.mae_id);

  if (loading || !form) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="bold" color="primary">{isNovo ? "NOVO FILHOTE" : "FICHA TÉCNICA"}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/passaros")} size="small">Voltar</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* SEÇÃO 1: IDENTIFICAÇÃO E LAUDO */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block', mb: 2 }}>IDENTIFICAÇÃO E LAUDO</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
              <Box sx={{ gridColumn: 'span 12' }}>
                <TextField label="Nome" fullWidth size="small" value={form.nome || ""} onChange={(e) => setForm({...form, nome: e.target.value})} />
              </Box>
              
              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField label="Anilha" fullWidth size="small" value={form.anilha || ""} disabled sx={{ "& .MuiInputBase-input.Mui-disabled": { WebkitTextFillColor: "#d32f2f", fontWeight: '900' } }} />
              </Box>
              
              <Box sx={{ gridColumn: 'span 4' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Sexo</InputLabel>
                  <Select value={form.sexo || "M"} label="Sexo" onChange={(e) => setForm({...form, sexo: e.target.value})}>
                    <MenuItem value="M">Macho (♂)</MenuItem>
                    <MenuItem value="F">Fêmea (♀)</MenuItem>
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ gridColumn: 'span 4' }}>
                <TextField type="date" label="Nascimento" fullWidth size="small" value={form.data_nascimento || ""} onChange={(e) => setForm({...form, data_nascimento: e.target.value})} InputLabelProps={{ shrink: true }} />
              </Box>

              <Box sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth size="small">
                  <InputLabel>Espécie</InputLabel>
                  <Select value={form.especie_id || ""} label="Espécie" onChange={(e: any) => setForm({...form, especie_id: e.target.value})}>
                    {especies.map(e => <MenuItem key={e.id} value={e.id}>{e.nomes_comuns?.[0]}</MenuItem>)}
                  </Select>
                </FormControl>
              </Box>

              <Box sx={{ gridColumn: 'span 8' }}>
                <TextField label="Laboratório / Sexagem" fullWidth size="small" value={form.laboratorio || ""} onChange={(e) => setForm({...form, laboratorio: e.target.value})} />
              </Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <Button variant="contained" component="label" fullWidth color="info" size="small" startIcon={<CloudUploadIcon />} sx={{ height: '38px' }}>
                  PDF<input type="file" hidden />
                </Button>
              </Box>
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

          {/* SEÇÃO 3: FILIAÇÕES */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <Stack direction="row" justifyContent="space-between" mb={1.5}>
              <Stack direction="row" spacing={1} alignItems="center"><CorporateFareIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary">FILIAÇÕES EM CLUBES / FEDERAÇÕES</Typography></Stack>
              <Button size="small" startIcon={<AddIcon />} onClick={() => setModalEntidadeAberto(true)} disabled={isNovo}>Vincular</Button>
            </Stack>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1 }}>
              {entidadesVinculadas.map((v) => (
                <Tooltip key={v.id} title={`Nº Registro: ${v.numero_socio}`}>
                  <Paper variant="outlined" sx={{ px: 1, py: 0.5, bgcolor: '#f8f9fa', display: 'flex', alignItems: 'center', gap: 1, border: '1px solid #e0e0e0' }}>
                    <Avatar src={v.entidades?.logo_url} sx={{ width: 20, height: 20 }} />
                    <Typography variant="caption" fontWeight="bold">{v.entidades?.sigla || v.entidades?.nome}</Typography>
                    <IconButton size="small" color="error" onClick={async () => { if(confirm("Remover filiação?")) { await supabase.from("passaros_entidades").delete().eq("id", v.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton>
                  </Paper>
                </Tooltip>
              ))}
            </Box>
          </Paper>

          {/* SEÇÃO 4: TORNEIOS */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Stack direction="row" justifyContent="space-between" mb={1.5}>
                <Stack direction="row" spacing={1} alignItems="center"><EmojiEventsIcon color="primary" fontSize="small" /><Typography variant="caption" fontWeight="bold" color="primary">HISTÓRICO DE TORNEIOS</Typography></Stack>
                <Button size="small" startIcon={<AddIcon />} onClick={() => setModalTorneioAberto(true)}>Novo Registro</Button>
              </Stack>
              <TableContainer><Table size="small"><TableBody>
                {torneios.map((t) => (
                  <TableRow key={t.id}>
                    <TableCell sx={{ fontSize: '0.75rem' }}>{new Date(t.data_inicio).toLocaleDateString()}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }}><b>{t.colocacao}</b> - {t.categoria}</TableCell>
                    <TableCell sx={{ fontSize: '0.75rem' }} color="text.secondary">{t.entidades?.sigla || 'Geral'}</TableCell>
                    <TableCell align="right"><IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_torneios").delete().eq("id", t.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 14 }} /></IconButton></TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </Paper>
          )}

          {/* SEÇÃO 5: MÍDIAS */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="caption" fontWeight="bold" color="primary">MÍDIAS (FOTOS E VÍDEOS)</Typography>
                <Button startIcon={<CloudUploadIcon />} size="small" variant="contained" onClick={() => setModalMidiaAberto(true)}>Adicionar</Button>
              </Box>
              <Box sx={{ display: 'flex', gap: 2, overflowX: 'auto', pb: 1 }}>
                {midias.map((m) => (
                  <Paper key={m.id} variant="outlined" sx={{ minWidth: 100, p: 0.5, textAlign: 'center' }}>
                    {m.tipo === 'foto' ? <img src={m.url} width="80" height="60" style={{ objectFit: 'cover', borderRadius: 4 }} /> : <VideoLibraryIcon color="action" sx={{ fontSize: 40 }} />}
                    <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.5 }}>
                      <IconButton size="small" onClick={() => window.open(m.url, '_blank')} color="primary"><VisibilityIcon sx={{ fontSize: 16 }} /></IconButton>
                      <IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_midia").delete().eq("id", m.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 16 }} /></IconButton>
                    </Box>
                  </Paper>
                ))}
              </Box>
            </Paper>
          )}

          {/* SEÇÃO 6: HISTÓRICO STATUS */}
          {!isNovo && (
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ display: 'block', mb: 1 }}>HISTÓRICO DE STATUS</Typography>
              <TableContainer sx={{ maxHeight: 150 }}><Table size="small" stickyHeader><TableBody>
                {historicoStatus.map((h: any) => (
                  <TableRow key={h.id}>
                    <TableCell sx={{ fontSize: '0.7rem' }}>{new Date(h.data_alteracao).toLocaleString()}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem', fontWeight: 'bold' }}>{h.status_novo}</TableCell>
                    <TableCell sx={{ fontSize: '0.7rem' }}>{h.observacao || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody></Table></TableContainer>
            </Paper>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', py: 2 }}>
            <Button variant="outlined" onClick={() => router.push("/inicial_page/passaros")}>Cancelar</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvarPassaro} disabled={salvando}>Salvar Pássaro</Button>
          </Box>
        </Box>

        <Box sx={{ position: 'sticky', top: 10 }}>
          <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#f9f9f9' }}><CrachaPassaro form={form} /></Paper>
          <Button variant="contained" fullWidth color="secondary" startIcon={<PrintIcon />} sx={{ mt: 2 }} disabled={isNovo}>Pedigree</Button>
          <Button variant="outlined" fullWidth startIcon={<AccountTreeIcon />} sx={{ mt: 1 }} disabled={isNovo} onClick={() => router.push(`/inicial_page/passaros/${idUrl}/genealogia-visual`)}>Genealogia</Button>
        </Box>
      </Box>

      {/* MODAL MÍDIA, TORNEIO E ENTIDADE */}
      <Dialog open={modalMidiaAberto} onClose={() => setModalMidiaAberto(false)}>
        <DialogTitle>Nova Mídia</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
          <Select value={tipoMidia} onChange={(e) => setTipoMidia(e.target.value as string)} size="small">
            <MenuItem value="foto">Foto</MenuItem><MenuItem value="video">Vídeo</MenuItem>
          </Select>
          <Button variant="outlined" component="label" fullWidth>Selecionar Arquivo<input type="file" hidden onChange={(e: any) => setArquivo(e.target.files?.[0])} /></Button>
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setModalMidiaAberto(false)}>Sair</Button><Button variant="contained" onClick={handleUploadMidia} disabled={!arquivo}>Enviar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalTorneioAberto} onClose={() => setModalTorneioAberto(false)}>
        <DialogTitle>Registrar Torneio</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
          <TextField type="date" label="Data" fullWidth size="small" InputLabelProps={{ shrink: true }} onChange={(e) => setNovoTorneio({...novoTorneio, data_inicio: e.target.value})} />
          <FormControl fullWidth size="small"><InputLabel>Organizador</InputLabel><Select label="Organizador" value={novoTorneio.entidade_id} onChange={(e) => setNovoTorneio({...novoTorneio, entidade_id: e.target.value})}>{todasEntidades.map(ent => <MenuItem key={ent.id} value={ent.id}>{ent.nome}</MenuItem>)}</Select></FormControl>
          <TextField label="Categoria" fullWidth size="small" onChange={(e) => setNovoTorneio({...novoTorneio, categoria: e.target.value})} /><TextField label="Colocação" fullWidth size="small" onChange={(e) => setNovoTorneio({...novoTorneio, colocacao: e.target.value})} />
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setModalTorneioAberto(false)}>Sair</Button><Button variant="contained" onClick={handleAddTorneio}>Gravar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalEntidadeAberto} onClose={() => setModalEntidadeAberto(false)}>
        <DialogTitle>Vincular a Clube</DialogTitle>
        <DialogContent><Stack spacing={2} sx={{ mt: 1 }}>
          <FormControl fullWidth size="small"><InputLabel>Entidade</InputLabel><Select label="Entidade" value={novoVinculo.entidade_id} onChange={(e) => setNovoVinculo({...novoVinculo, entidade_id: e.target.value as string})}>{todasEntidades.map(ent => <MenuItem key={ent.id} value={ent.id}>{ent.nome} ({ent.sigla})</MenuItem>)}</Select></FormControl>
          <TextField label="Nº Registro" fullWidth size="small" onChange={(e) => setNovoVinculo({...novoVinculo, numero_socio: e.target.value})} />
        </Stack></DialogContent>
        <DialogActions><Button onClick={() => setModalEntidadeAberto(false)}>Sair</Button><Button variant="contained" onClick={handleAddEntidade}>Confirmar</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function PassaroPage() { return <Suspense fallback={<CircularProgress />}><PassaroFormContent /></Suspense>; }
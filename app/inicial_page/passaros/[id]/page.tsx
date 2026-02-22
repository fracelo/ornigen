"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import {
  Box, TextField, Button, Typography, FormControl, InputLabel,
  Select, MenuItem, CircularProgress, Paper, Container, 
  Dialog, DialogTitle, DialogContent, DialogActions, IconButton, Divider,
  Table, TableHead, TableRow, TableCell, TableBody, TableContainer, Chip
} from "@mui/material";

// Ícones MUI 5
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import AddIcon from "@mui/icons-material/Add";
import VideoLibraryIcon from "@mui/icons-material/VideoLibrary";
import GraphicEqIcon from "@mui/icons-material/GraphicEq";
import VisibilityIcon from "@mui/icons-material/Visibility";
import DeleteIcon from "@mui/icons-material/Delete";
import BadgeIcon from "@mui/icons-material/Badge";
import AccountTreeIcon from "@mui/icons-material/AccountTree";
import CollectionsIcon from "@mui/icons-material/Collections";
import StarIcon from "@mui/icons-material/Star";
import HistoryIcon from "@mui/icons-material/History";
import ScienceIcon from "@mui/icons-material/Science";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import PrintIcon from "@mui/icons-material/Print";

import CrachaPassaro from "@/components/CrachaPassaro";

function PassaroFormContent() {
  const params = useParams();
  const idUrl = params.id;
  const isNovo = idUrl === "novo";
  
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();

  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<any>(null);
  const [midias, setMidias] = useState<any[]>([]);
  const [historicoStatus, setHistoricoStatus] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);

  // Modais e Estados
  const [modalStatusAberto, setModalStatusAberto] = useState(false);
  const [novoStatusTemp, setNovoStatusTemp] = useState("");
  const [dataOcorrencia, setDataOcorrencia] = useState(new Date().toISOString().split('T')[0]);
  const [obsStatus, setObsStatus] = useState("");
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [tipoMidia, setTipoMidia] = useState('foto');
  const [arquivo, setArquivo] = useState<File | null>(null);
  const [mediaView, setMediaView] = useState<any>(null);
  const [subindoSexagem, setSubindoSexagem] = useState(false);

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;
    try {
      const [resP, resM, resE] = await Promise.all([
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
        supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
        supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns')
      ]);
      setPais(resP.data || []);
      setMaes(resM.data || []);
      setEspecies(resE.data || []);

      if (isNovo) {
        setForm({ nome: "", anilha: "", sexo: "M", status: "Ativo", especie_id: "", codigo_sispass_ave: "", data_sexagem: "", laboratorio: "", laudo_url: "" });
      } else {
        const { data: passaro } = await supabase.from("passaros").select(`*`).eq("id", idUrl).single();
        if (passaro) {
          setForm(passaro);
          const [resMid, resHis] = await Promise.all([
            supabase.from("passaros_midia").select("*").eq("passaro_id", passaro.id).neq("tipo", "sexagem").order('principal', { ascending: false }),
            supabase.from("passaros_status_historico").select("*").eq("passaro_id", passaro.id).order('created_at', { ascending: false })
          ]);
          setMidias(resMid.data || []);
          setHistoricoStatus(resHis.data || []);
        }
      }
    } catch (err) { console.error("Erro carga:", err); } finally { setLoading(false); }
  }, [idUrl, empresaId, isNovo]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvar = async () => {
    setLoading(true);
    const { especies_sispass, ...payload } = form;
    const finalPayload = { ...payload, empresa_id: empresaId, usuario_id: usuarioId };
    try {
      if (isNovo) {
        const { data, error } = await supabase.from("passaros").insert([finalPayload]).select().single();
        if (error) throw error;
        router.push(`/inicial_page/passaros/${data.id}`);
      } else {
        await supabase.from("passaros").update(finalPayload).eq("id", form.id);
        router.push("/inicial_page/passaros");
      }
    } catch (err) { alert("Erro ao salvar"); setLoading(false); }
  };

  const handleUploadSexagem = async (e: any) => {
    const file = e.target.files?.[0];
    if (!file || isNovo) return;
    setSubindoSexagem(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${empresaId}/${form.id}/sexagem_${Date.now()}.${fileExt}`;
      const { error: upErr } = await supabase.storage.from('laudos').upload(filePath, file);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('laudos').getPublicUrl(filePath);
      await supabase.from("passaros").update({ laudo_url: publicUrl }).eq("id", form.id);
      await supabase.from("passaros_midia").insert([{
        passaro_id: parseInt(form.id), empresa_id: empresaId, url: publicUrl, tipo: 'sexagem', principal: false
      }]);
      setForm({ ...form, laudo_url: publicUrl });
      alert("Laudo importado com sucesso!");
    } catch (err: any) { alert(`Erro no laudo: ${err.message}`); } finally { setSubindoSexagem(false); }
  };

  const handleUploadMidia = async () => {
    if (!arquivo || !form?.id) return;
    setLoading(true);
    try {
      const fileExt = arquivo.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${empresaId}/${form.id}/${fileName}`;
      const { error: upErr } = await supabase.storage.from('laudos').upload(filePath, arquivo);
      if (upErr) throw upErr;
      const { data: { publicUrl } } = supabase.storage.from('laudos').getPublicUrl(filePath);
      await supabase.from("passaros_midia").insert([{
        passaro_id: parseInt(form.id), empresa_id: empresaId, url: publicUrl, tipo: tipoMidia, principal: false
      }]);
      setModalMidiaAberto(false);
      setArquivo(null);
      carregarDados();
    } catch (err: any) { alert(`Erro: ${err.message}`); } finally { setLoading(false); }
  };

  const confirmarMudancaStatus = async () => {
    if (!form?.id) return;
    try {
      await supabase.from("passaros_status_historico").insert([{
        passaro_id: parseInt(form.id), empresa_id: empresaId, status_anterior: form.status,
        status_novo: novoStatusTemp, data_alteracao: dataOcorrencia, observacao: obsStatus
      }]);
      await supabase.from("passaros").update({ status: novoStatusTemp }).eq("id", form.id);
      setForm({ ...form, status: novoStatusTemp });
      setModalStatusAberto(false);
      carregarDados();
    } catch (err) { alert("Erro status"); }
  };

  const abrirPedigree = () => {
    if (isNovo) {
      alert("Salve o pássaro primeiro para gerar o pedigree.");
      return;
    }
    window.open(`/inicial_page/passaros/${form.id}/pedigree`, '_blank');
  };

  const TituloSecao = ({ icon, children, action }: any) => (
    <Box sx={{ mb: 1 }}>
      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 0.5 }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
          <Box sx={{ color: '#1976d2', display: 'flex' }}>{icon}</Box>
          <Typography variant="caption" fontWeight="bold" sx={{ color: '#1976d2', textTransform: 'uppercase' }}>{children}</Typography>
        </Box>
        {action}
      </Box>
      <Divider sx={{ mb: 1 }} />
    </Box>
  );

  if (loading || !form) return <Box textAlign="center" p={10}><CircularProgress /></Box>;

  return (
    <Container maxWidth="lg" sx={{ py: 2 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6" fontWeight="900" color="primary">{isNovo ? "NOVO PÁSSARO" : "FICHA TÉCNICA"}</Typography>
        <Button startIcon={<ArrowBackIcon />} onClick={() => router.push("/inicial_page/passaros")} size="small">Voltar</Button>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 380px' }, gap: 2 }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          
          {/* Identificação */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <TituloSecao icon={<BadgeIcon fontSize="small" />}>Identificação</TituloSecao>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 1.5 }}>
              <Box sx={{ gridColumn: 'span 12' }}><TextField label="Nome" fullWidth size="small" value={form.nome || ""} onChange={(e) => setForm({...form, nome: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 6' }}>
                <FormControl fullWidth size="small"><InputLabel>Sexo</InputLabel><Select value={form.sexo || "M"} label="Sexo" onChange={(e) => setForm({...form, sexo: e.target.value})}><MenuItem value="M">Macho ♂</MenuItem><MenuItem value="F">Fêmea ♀</MenuItem></Select></FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 6' }}>
                <FormControl fullWidth size="small"><InputLabel>Status</InputLabel><Select value={form.status || "Ativo"} label="Status" onChange={(e) => { if(isNovo) setForm({...form, status: e.target.value}); else { setNovoStatusTemp(e.target.value); setModalStatusAberto(true); } }}>
                  <MenuItem value="Ativo">Ativo</MenuItem><MenuItem value="Morto">Morto</MenuItem><MenuItem value="Fuga">Fuga</MenuItem><MenuItem value="Transferido">Transferido</MenuItem>
                </Select></FormControl>
              </Box>
              <Box sx={{ gridColumn: 'span 6' }}><TextField label="Anilha" fullWidth size="small" value={form.anilha || ""} onChange={(e) => setForm({...form, anilha: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 6' }}><TextField type="date" label="Nascimento" fullWidth size="small" value={form.data_nascimento || ""} onChange={(e) => setForm({...form, data_nascimento: e.target.value})} InputLabelProps={{ shrink: true }} /></Box>
              <Box sx={{ gridColumn: 'span 12' }}><FormControl fullWidth size="small"><InputLabel>Espécie</InputLabel><Select value={form.especie_id || ""} label="Espécie" onChange={(e) => setForm({...form, especie_id: e.target.value})}>{especies.map(e => <MenuItem key={e.id} value={e.id}>{e.nomes_comuns?.[0]}</MenuItem>)}</Select></FormControl></Box>
            </Box>
          </Paper>

          {/* Ancestralidade */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <TituloSecao icon={<AccountTreeIcon fontSize="small" />}>Ancestralidade</TituloSecao>
            <Box sx={{ display: 'flex', gap: 2 }}>
              <FormControl fullWidth size="small"><InputLabel>Pai</InputLabel><Select value={form.pai_id || ""} label="Pai" onChange={(e) => setForm({...form, pai_id: e.target.value})}><MenuItem value="">Desconhecido</MenuItem>{pais.map(p => <MenuItem key={p.id} value={p.id}>{p.nome}</MenuItem>)}</Select></FormControl>
              <FormControl fullWidth size="small"><InputLabel>Mãe</InputLabel><Select value={form.mae_id || ""} label="Mãe" onChange={(e) => setForm({...form, mae_id: e.target.value})}><MenuItem value="">Desconhecida</MenuItem>{maes.map(m => <MenuItem key={m.id} value={m.id}>{m.nome}</MenuItem>)}</Select></FormControl>
            </Box>
          </Paper>

          {/* Sexagem */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
            <TituloSecao 
              icon={<ScienceIcon fontSize="small" />} 
              action={form.laudo_url && <Button size="small" startIcon={<VisibilityIcon />} onClick={() => window.open(form.laudo_url, '_blank')} sx={{ fontSize: '0.65rem' }}>Ver Laudo</Button>}
            > Sexagem </TituloSecao>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <TextField label="Laboratório" sx={{ flex: 2 }} size="small" value={form.laboratorio || ""} onChange={(e) => setForm({...form, laboratorio: e.target.value})} />
              <TextField type="date" label="Data" sx={{ flex: 1.2 }} size="small" value={form.data_sexagem || ""} onChange={(e) => setForm({...form, data_sexagem: e.target.value})} InputLabelProps={{ shrink: true }} />
              <Button variant="contained" component="label" color="info" startIcon={subindoSexagem ? <CircularProgress size={16} color="inherit" /> : <CloudUploadIcon />} disabled={isNovo || subindoSexagem} sx={{ height: 40, flex: 1, fontSize: '0.75rem' }}>
                {subindoSexagem ? "..." : "Importar"}
                <input type="file" hidden accept="image/*,application/pdf" onChange={handleUploadSexagem} />
              </Button>
            </Box>
          </Paper>

          {!isNovo && (
            <>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <TituloSecao icon={<CollectionsIcon fontSize="small" />} action={<Button variant="contained" size="small" startIcon={<AddIcon />} onClick={() => setModalMidiaAberto(true)} sx={{height:26, fontSize:'0.7rem'}}>Adicionar</Button>}>Galeria</TituloSecao>
                <Box sx={{ display: 'flex', gap: 1.5, flexWrap: 'wrap', mt: 1 }}>
                  {midias.map((m) => (
                    <Box key={m.id} sx={{ width: 100, textAlign: 'center' }}>
                      <Box sx={{ height: 80, bgcolor: '#eee', borderRadius: 1, overflow: 'hidden', border: m.principal ? '2px solid #ffb300' : '1px solid #ddd', cursor:'pointer', display:'flex', alignItems:'center', justifyContent:'center' }} onClick={() => setMediaView(m)}>
                        {m.tipo === 'foto' ? <img src={m.url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : m.tipo === 'video' ? <VideoLibraryIcon color="action" /> : <GraphicEqIcon color="primary" />}
                      </Box>
                      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 0.2 }}>
                        <IconButton size="small" onClick={async () => { await supabase.from("passaros_midia").update({ principal: false }).eq("passaro_id", form.id); await supabase.from("passaros_midia").update({ principal: true }).eq("id", m.id); carregarDados(); }} color={m.principal ? "warning" : "default"}><StarIcon sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" onClick={() => setMediaView(m)}><VisibilityIcon sx={{ fontSize: 18 }} /></IconButton>
                        <IconButton size="small" color="error" onClick={async () => { if(confirm("Excluir?")) { await supabase.from("passaros_midia").delete().eq("id", m.id); carregarDados(); } }}><DeleteIcon sx={{ fontSize: 18 }} /></IconButton>
                      </Box>
                    </Box>
                  ))}
                </Box>
              </Paper>

              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <TituloSecao icon={<HistoryIcon fontSize="small" />}>Histórico</TituloSecao>
                <TableContainer sx={{ maxHeight: 150 }}><Table size="small" stickyHeader><TableHead><TableRow><TableCell sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Data</TableCell><TableCell sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Mudança</TableCell><TableCell sx={{ fontSize: '0.65rem', fontWeight: 'bold' }}>Obs</TableCell></TableRow></TableHead><TableBody>{historicoStatus.map((h) => (<TableRow key={h.status_id}><TableCell sx={{ fontSize: '0.65rem' }}>{new Date(h.data_alteracao).toLocaleDateString('pt-BR')}</TableCell><TableCell><Chip label={`${h.status_anterior} ➔ ${h.status_novo}`} size="small" sx={{ fontSize: '0.6rem', height: 16 }} /></TableCell><TableCell sx={{ fontSize: '0.65rem' }}>{h.observacao || "-"}</TableCell></TableRow>))}</TableBody></Table></TableContainer>
              </Paper>
            </>
          )}

          <Box sx={{ display: 'flex', gap: 2, justifyContent: 'flex-end', pb: 5 }}>
            <Button variant="outlined" onClick={() => router.push("/inicial_page/passaros")}>Cancelar</Button>
            <Button variant="contained" startIcon={<SaveIcon />} onClick={handleSalvar}>Salvar Registro</Button>
          </Box>
        </Box>

        {/* Lado Direito: Barra Lateral Sticky */}
        <Box sx={{ position: 'sticky', top: 10, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <Paper variant="outlined" sx={{ p: 1, textAlign: 'center', bgcolor: '#f9f9f9' }}>
            <CrachaPassaro form={form} />
          </Paper>

          {/* 🔹 BOTÃO IMPRIMIR PEDIGREE */}
          <Button 
            variant="contained" 
            fullWidth 
            color="secondary" 
            startIcon={<PrintIcon />} 
            onClick={abrirPedigree}
            disabled={isNovo}
            sx={{ 
              fontWeight: 'bold', 
              height: 45,
              boxShadow: '0 4px 10px rgba(0,0,0,0.1)'
            }}
          >
            Imprimir Pedigree
          </Button>

          <Button
              variant="outlined"
              fullWidth
              startIcon={<AccountTreeIcon />}
              // Alterado de 'id' para 'idUrl' e adicionado check de 'isNovo'
              onClick={() => router.push(`/inicial_page/passaros/${idUrl}/genealogia-visual`)}
              disabled={isNovo} 
              sx={{
                mt: 2,
                fontWeight: 'bold',
                color: isNovo ? 'text.disabled' : '#1565C0',
                borderColor: isNovo ? 'divider' : '#1565C0',
                '&:hover': {
                  borderWidth: 2,
                  bgcolor: 'rgba(21, 101, 192, 0.04)'
                }
              }}
            >
              Editor de Genealogia Visual
            </Button>
          
          {isNovo && (
            <Typography variant="caption" color="textSecondary" textAlign="center">
              * Salve para habilitar o Pedigree
            </Typography>
          )}
        </Box>
      </Box>

      {/* MODAIS (Mídia, Status, Visualizador) */}
      <Dialog open={modalMidiaAberto} onClose={() => setModalMidiaAberto(false)}>
        <DialogTitle>Nova Mídia</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <FormControl fullWidth size="small"><InputLabel>Tipo</InputLabel><Select value={tipoMidia} label="Tipo" onChange={(e) => setTipoMidia(e.target.value)}><MenuItem value="foto">Foto</MenuItem><MenuItem value="video">Vídeo</MenuItem><MenuItem value="audio">Áudio</MenuItem></Select></FormControl>
          <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>{arquivo ? arquivo.name : "Selecionar"}<input type="file" hidden onChange={(e) => setArquivo(e.target.files?.[0] || null)} /></Button>
        </DialogContent>
        <DialogActions><Button onClick={() => setModalMidiaAberto(false)}>Fechar</Button><Button variant="contained" onClick={handleUploadMidia}>Upload</Button></DialogActions>
      </Dialog>

      <Dialog open={!!mediaView} onClose={() => setMediaView(null)} maxWidth="md" fullWidth>
        <DialogContent sx={{ bgcolor: '#000', p: 0, display: 'flex', justifyContent: 'center', alignItems:'center', minHeight: '300px' }}>
          {mediaView && (
            mediaView.tipo === 'foto' ? <img src={mediaView.url} style={{ maxWidth: '100%', maxHeight: '80vh', objectFit: 'contain' }} /> :
            mediaView.tipo === 'video' ? <video src={mediaView.url} controls autoPlay style={{ width: '100%' }} /> :
            mediaView.tipo === 'audio' ? <Box p={5} textAlign="center"><GraphicEqIcon sx={{ fontSize: 80, color: '#fff', mb: 2 }} /><audio src={mediaView.url} controls autoPlay style={{ width: '100%' }} /></Box> :
            <Box p={5} textAlign="center" sx={{color:'#fff'}}><PictureAsPdfIcon sx={{fontSize:80}}/><Typography>Documento PDF</Typography><Button variant="contained" sx={{mt:2}} onClick={() => window.open(mediaView.url, '_blank')}>Abrir</Button></Box>
          )}
        </DialogContent>
        <DialogActions sx={{ bgcolor: '#000' }}><Button onClick={() => setMediaView(null)} sx={{ color: '#fff' }}>Fechar</Button></DialogActions>
      </Dialog>

      <Dialog open={modalStatusAberto} onClose={() => setModalStatusAberto(false)} fullWidth maxWidth="xs">
        <DialogTitle sx={{ fontWeight: 'bold' }}>Alterar Status</DialogTitle>
        <DialogContent sx={{ display: 'flex', flexDirection: 'column', gap: 2, pt: 1 }}>
          <TextField type="date" label="Data" fullWidth size="small" value={dataOcorrencia} onChange={(e) => setDataOcorrencia(e.target.value)} InputLabelProps={{ shrink: true }} />
          <TextField label="Observação" fullWidth multiline rows={2} size="small" value={obsStatus} onChange={(e) => setObsStatus(e.target.value)} />
        </DialogContent>
        <DialogActions><Button onClick={() => setModalStatusAberto(false)}>Sair</Button><Button variant="contained" onClick={confirmarMudancaStatus}>Gravar</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function PassaroPage() { return <Suspense fallback={<CircularProgress />}><PassaroFormContent /></Suspense>; }
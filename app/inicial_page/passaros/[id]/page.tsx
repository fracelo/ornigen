"use client";

import { useState, useEffect, useCallback, Suspense } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { useAuth } from "@/context/authContext";
import {
  Box, TextField, Button, Typography, FormControl, InputLabel,
  Select, MenuItem, Checkbox, FormControlLabel,
  CircularProgress, Paper, Divider, Container, IconButton, Avatar,
  Dialog, DialogTitle, DialogContent, DialogActions, Tooltip
} from "@mui/material";

// Ícones
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import DeleteIcon from "@mui/icons-material/Delete";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import LocationOnIcon from "@mui/icons-material/LocationOn";
import PersonIcon from "@mui/icons-material/Person";

import CrachaPassaro from "@/components/CrachaPassaro";

function PassaroFormContent() {
  const { id } = useParams();
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();
  const router = useRouter();

  // Estados
  const [form, setForm] = useState<any>(null);
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);
  const [criadouros, setCriadouros] = useState<any[]>([]);
  const [especies, setEspecies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [midias, setMidias] = useState<any[]>([]);
  const [fotoAtiva, setFotoAtiva] = useState(0);

  // Estados do Modal
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [subindoArquivo, setSubindoArquivo] = useState(false);
  const [dadosMidia, setDadosMidia] = useState({
    tipo: 'foto', descricao: '', local_registro: '', autor_registro: '',
    data_registro: new Date().toISOString().split('T')[0]
  });

  const carregarDados = useCallback(async () => {
    if (!empresaId) return;

    const [resPais, resMaes, resCriadouros, resEspecies] = await Promise.all([
      supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "M"),
      supabase.from("passaros").select("id, nome, anilha").eq("empresa_id", empresaId).eq("sexo", "F"),
      supabase.from("criadouros").select("id, nome_fantasia, razao_social").eq("empresa_uuid", empresaId),
      supabase.from("especies_sispass").select("id, nomes_comuns").order('nomes_comuns')
    ]);

    setPais(resPais.data || []);
    setMaes(resMaes.data || []);
    setEspecies(resEspecies.data || []);
    setCriadouros(resCriadouros.data || []);

    if (id !== "novo") {
      const { data } = await supabase.from("passaros").select(`*, especies_sispass:especie_id(nomes_comuns)`).eq("id", id).single();
      if (data) {
        setForm({ ...data, especie_nome: data.especies_sispass?.nomes_comuns?.[0] || "" });
        const { data: resMidias } = await supabase.from("passaros_midia").select("*").eq("passaro_id", id).order('created_at', { ascending: false });
        setMidias(resMidias || []);
      }
    } else {
      setForm({
        nome: "", anilha: "", codigo_sispass_ave: "", tipo_anilha: "Fechada",
        data_nascimento: "", especie_id: "", status_sispass: "Ativo",
        sexo: "M", pai_id: null, mae_id: null, origem_id: "", laudo_url: ""
      });
    }
    setLoading(false);
  }, [id, empresaId]);

  useEffect(() => { carregarDados(); }, [carregarDados]);

  const handleSalvarMidia = async () => {
    if (!arquivoSelecionado || !empresaId) return;
    setSubindoArquivo(true);
    try {
      const path = `${empresaId}/midias/${Date.now()}_${arquivoSelecionado.name}`;
      await supabase.storage.from('laudos').upload(path, arquivoSelecionado);
      const { data: urlData } = supabase.storage.from('laudos').getPublicUrl(path);

      const { data: nova } = await supabase.from("passaros_midia").insert([{
        ...dadosMidia, url: urlData.publicUrl, passaro_id: id, empresa_id: empresaId
      }]).select().single();

      setMidias([nova, ...midias]);
      setModalMidiaAberto(false);
      setPreviewUrl(null);
      setArquivoSelecionado(null);
    } catch (e) { alert("Erro ao subir mídia"); }
    setSubindoArquivo(false);
  };

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm((prev: any) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  if (loading || !form) return <Box sx={{ display: 'flex', justifyContent: 'center', p: 10 }}><CircularProgress /></Box>;

  return (
    <Container maxWidth="xl" sx={{ py: 4 }}>
      
      {/* 1. HEADER DE ELITE (HERO SECTION) */}
      <Paper elevation={0} sx={{ 
        p: 4, mb: 4, borderRadius: 5, bgcolor: '#0D47A1', color: 'white',
        display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 3,
        background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 100%)',
        boxShadow: '0 15px 35px rgba(13, 71, 161, 0.3)'
      }}>
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
          <Avatar 
            src={midias.find(m => m.tipo === 'foto')?.url || ""} 
            sx={{ width: 110, height: 110, border: '4px solid rgba(255,255,255,0.3)', boxShadow: 4 }}
          />
          <Box>
            <Typography variant="h3" fontWeight="900" sx={{ letterSpacing: -1 }}>{form.nome || "Novo Pássaro"}</Typography>
            <Box sx={{ display: 'flex', gap: 2, mt: 1, opacity: 0.9 }}>
              <Typography variant="h6" fontWeight="300">Anilha: <b>{form.anilha || "S/N"}</b></Typography>
              <Typography variant="h6" fontWeight="300">| {form.especie_nome}</Typography>
            </Box>
          </Box>
        </Box>
        <Button 
          startIcon={<ArrowBackIcon />} 
          onClick={() => router.back()}
          sx={{ color: 'white', border: '1px solid rgba(255,255,255,0.4)', borderRadius: 3, px: 3 }}
        >
          Voltar
        </Button>
      </Paper>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 420px' }, gap: 4 }}>
        
        {/* COLUNA ESQUERDA: GALERIA E FORMULÁRIO */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* CARROSSEL DE FOTOS "FORA DA CAIXA" */}
          <Paper variant="outlined" sx={{ p: 2, borderRadius: 5, bgcolor: '#fcfcfc', border: '1px solid #e0e0e0' }}>
            <Box sx={{ position: 'relative', height: 450, borderRadius: 4, overflow: 'hidden', bgcolor: '#000', boxShadow: 'inset 0 0 50px rgba(0,0,0,0.5)' }}>
              {midias.filter(m => m.tipo === 'foto').length > 0 ? (
                <>
                  <img 
                    src={midias.filter(m => m.tipo === 'foto')[fotoAtiva]?.url} 
                    style={{ width: '100%', height: '100%', objectFit: 'contain' }} 
                  />
                  <Box sx={{ position: 'absolute', bottom: 0, width: '100%', p: 3, background: 'linear-gradient(transparent, rgba(0,0,0,0.8))', color: 'white' }}>
                    <Typography variant="h6">{midias.filter(m => m.tipo === 'foto')[fotoAtiva]?.descricao || "Registro Visual"}</Typography>
                    <Box sx={{ display: 'flex', gap: 2, mt: 0.5, opacity: 0.8 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><LocationOnIcon fontSize="small"/> {midias.filter(m => m.tipo === 'foto')[fotoAtiva]?.local_registro}</Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}><PersonIcon fontSize="small"/> {midias.filter(m => m.tipo === 'foto')[fotoAtiva]?.autor_registro}</Box>
                    </Box>
                  </Box>
                </>
              ) : (
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#999' }}>
                  <CloudUploadIcon sx={{ fontSize: 70, mb: 2, opacity: 0.3 }} />
                  <Typography>Nenhuma foto cadastrada</Typography>
                </Box>
              )}
            </Box>
            
            {/* MINIATURAS E CANTOS */}
            <Box sx={{ display: 'flex', gap: 2, mt: 2, p: 1, overflowX: 'auto', alignItems: 'center' }}>
              {midias.filter(m => m.tipo === 'foto').map((m, index) => (
                <Avatar 
                  key={m.id} src={m.url} variant="rounded"
                  onClick={() => setFotoAtiva(index)}
                  sx={{ width: 70, height: 70, cursor: 'pointer', borderRadius: 2, border: fotoAtiva === index ? '3px solid #0D47A1' : '2px solid transparent', transition: '0.2s' }} 
                />
              ))}
              <Tooltip title="Adicionar Foto ou Canto">
                <IconButton onClick={() => setModalMidiaAberto(true)} sx={{ width: 70, height: 70, border: '2px dashed #ccc', borderRadius: 2 }}><AddIcon /></IconButton>
              </Tooltip>
              <Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
              {/* PLAYERS DE ÁUDIO RÁPIDOS */}
              <Box sx={{ display: 'flex', gap: 1 }}>
                {midias.filter(m => m.tipo === 'audio').map((m) => (
                  <Tooltip key={m.id} title={m.descricao}>
                    <Avatar sx={{ bgcolor: '#E3F2FD', color: '#0D47A1', cursor: 'pointer' }} onClick={() => new Audio(m.url).play()}>
                      <MusicNoteIcon />
                    </Avatar>
                  </Tooltip>
                ))}
              </Box>
            </Box>
          </Paper>

          {/* DADOS BÁSICOS ESTILIZADOS */}
          <Paper variant="outlined" sx={{ p: 4, borderRadius: 5 }}>
            <Typography variant="h6" fontWeight="bold" sx={{ mb: 4, color: '#0D47A1' }}>Informações Cadastrais</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(12, 1fr)', gap: 3 }}>
              <Box sx={{ gridColumn: 'span 12' }}><TextField label="Nome do Pássaro" name="nome" value={form.nome} onChange={handleChange} fullWidth variant="filled" /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField label="Anilha" name="anilha" value={form.anilha} onChange={handleChange} fullWidth /></Box>
              <Box sx={{ gridColumn: 'span 4' }}><TextField label="Data Nascimento" type="date" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} fullWidth InputLabelProps={{ shrink: true }} /></Box>
              <Box sx={{ gridColumn: 'span 4' }}>
                <FormControl fullWidth><InputLabel>Sexo</InputLabel>
                  <Select name="sexo" value={form.sexo} label="Sexo" onChange={handleChange}>
                    <MenuItem value="M">♂ Macho</MenuItem><MenuItem value="F">♀ Fêmea</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </Box>
          </Paper>
        </Box>

        {/* COLUNA DIREITA: CRACHÁ, GENEALOGIA E SEXAGEM */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* PREVIEW DO CRACHÁ */}
          <Box sx={{ position: 'sticky', top: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
            <Paper elevation={0} sx={{ p: 3, borderRadius: 5, border: '1px solid #e0e0e0', bgcolor: '#fff', textAlign: 'center' }}>
              <Typography variant="caption" fontWeight="bold" color="primary" sx={{ letterSpacing: 2, mb: 2, display: 'block' }}>PEDIGREE DIGITAL</Typography>
              <CrachaPassaro form={form} />
            </Paper>

            {/* GENEALOGIA VISUAL */}
            <Paper variant="outlined" sx={{ p: 3, borderRadius: 5 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ mb: 2 }}>LINHAGEM</Typography>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <Box sx={{ p: 2, bgcolor: '#F0F7FF', borderRadius: 3, borderLeft: '6px solid #1976D2' }}>
                  <Typography variant="caption" color="primary" fontWeight="bold">PAI</Typography>
                  <Typography variant="body1" fontWeight="bold">{pais.find(p => p.id === form.pai_id)?.nome || "Desconhecido"}</Typography>
                </Box>
                <Box sx={{ p: 2, bgcolor: '#FFF0F5', borderRadius: 3, borderLeft: '6px solid #D81B60' }}>
                  <Typography variant="caption" color="secondary" fontWeight="bold">MÃE</Typography>
                  <Typography variant="body1" fontWeight="bold">{maes.find(m => m.id === form.mae_id)?.nome || "Desconhecida"}</Typography>
                </Box>
              </Box>
            </Paper>

            {/* BOTÃO SALVAR GIGANTE */}
            <Button 
              variant="contained" size="large" fullWidth 
              onClick={(e) => { /* Chamar função de salvar */ }}
              sx={{ height: 80, borderRadius: 4, fontWeight: '900', fontSize: '1.2rem', boxShadow: '0 10px 30px rgba(0,0,0,0.1)' }}
            >
              SALVAR ALTERAÇÕES
            </Button>
          </Box>
        </Box>
      </Box>

      {/* MODAL DE MÍDIA - O MESMO QUE CRIAMOS ANTES */}
      <Dialog open={modalMidiaAberto} onClose={() => setModalMidiaAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle sx={{ fontWeight: 'bold' }}>Adicionar Mídia ao Histórico</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 4 }}>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              <TextField select label="Tipo" fullWidth value={dadosMidia.tipo} onChange={(e) => setDadosMidia({...dadosMidia, tipo: e.target.value})}>
                <MenuItem value="foto">📷 Foto</MenuItem><MenuItem value="audio">🎵 Canto</MenuItem>
              </TextField>
              <TextField label="Onde foi gravado?" fullWidth value={dadosMidia.local_registro} onChange={(e) => setDadosMidia({...dadosMidia, local_registro: e.target.value})} />
              <TextField label="Quem registrou?" fullWidth value={dadosMidia.autor_registro} onChange={(e) => setDadosMidia({...dadosMidia, autor_registro: e.target.value})} />
              <TextField label="Descrição" multiline rows={2} fullWidth value={dadosMidia.descricao} onChange={(e) => setDadosMidia({...dadosMidia, descricao: e.target.value})} />
            </Box>
            <Box sx={{ border: '2px dashed #ddd', borderRadius: 3, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa' }}>
               {previewUrl ? (
                 <Box sx={{ p: 1, textAlign: 'center' }}>
                   {dadosMidia.tipo === 'foto' ? <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: 200, borderRadius: 8 }} /> : <MusicNoteIcon sx={{ fontSize: 60 }} />}
                   <Button color="error" onClick={() => setPreviewUrl(null)} sx={{ mt: 1, display: 'block', mx: 'auto' }}>Trocar</Button>
                 </Box>
               ) : (
                 <Button variant="outlined" component="label" startIcon={<CloudUploadIcon />}>Selecionar<input type="file" hidden onChange={(e) => {
                    const f = e.target.files?.[0]; if(f){ setArquivoSelecionado(f); setPreviewUrl(URL.createObjectURL(f)); }
                 }} /></Button>
               )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 3 }}><Button onClick={() => setModalMidiaAberto(false)}>Sair</Button><Button variant="contained" onClick={handleSalvarMidia}>Gravar na Ficha</Button></DialogActions>
      </Dialog>
    </Container>
  );
}

export default function PassaroPage() {
  return (
    <Suspense fallback={<Box textAlign="center" p={10}><CircularProgress /></Box>}>
      <PassaroFormContent />
    </Suspense>
  );
}
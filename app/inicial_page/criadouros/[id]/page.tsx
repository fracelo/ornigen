"use client";

import { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Button, TextField, Typography, Paper, MenuItem, 
  CircularProgress, IconButton, Avatar, Dialog, DialogTitle, 
  DialogContent, DialogActions
} from "@mui/material";

import { useEmpresa } from "@/context/empresaContext";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SaveIcon from "@mui/icons-material/Save";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";
import PictureAsPdfIcon from "@mui/icons-material/PictureAsPdf";
import MusicNoteIcon from "@mui/icons-material/MusicNote";
import PlayArrowIcon from "@mui/icons-material/PlayArrow";
import AddIcon from "@mui/icons-material/Add";

export default function AlterarPassaroPage() {
  const router = useRouter();
  const { id } = useParams();
  const { empresaId } = useEmpresa();
  
  const [loading, setLoading] = useState(true);
  const [salvando, setSalvando] = useState(false);
  const [subindoArquivo, setSubindoArquivo] = useState(false);
  const [midias, setMidias] = useState<any[]>([]);

  // Estados do Modal de Mídia
  const [modalMidiaAberto, setModalMidiaAberto] = useState(false);
  const [arquivoSelecionado, setArquivoSelecionado] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [dadosMidia, setDadosMidia] = useState({
    tipo: 'foto',
    descricao: '',
    local_registro: '',
    autor_registro: '',
    data_registro: new Date().toISOString().split('T')[0]
  });

  const [formData, setFormData] = useState({
    nome: "",
    anilha: "",
    sexo: "",
    especie_id: "",
    data_sexagem: "",
    laboratorio_sexagem: "",
    laudo_url: "",
  });

  useEffect(() => {
    if (id) {
        carregarDados();
        carregarMidias();
    }
  }, [id]);

  const carregarDados = async () => {
    const { data } = await supabase.from("passaros").select("*").eq("id", id).single();
    if (data) {
        setFormData(data);
        setLoading(false);
    }
  };

  const carregarMidias = async () => {
    const { data } = await supabase.from("passaros_midia").select("*").eq("passaro_id", id).order('created_at', { ascending: false });
    if (data) setMidias(data);
  };

  // --- LÓGICA DE UPLOAD DA MÍDIA (MODAL) ---
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setArquivoSelecionado(file);
      setPreviewUrl(URL.createObjectURL(file));
    }
  };

  const handleSalvarMidia = async () => {
    if (!arquivoSelecionado || !empresaId) return;
    setSubindoArquivo(true);

    try {
      const fileExt = arquivoSelecionado.name.split('.').pop();
      const fileName = `${Date.now()}.${fileExt}`;
      const filePath = `${empresaId}/midias/${fileName}`;

      const { error: uploadError } = await supabase.storage.from('laudos').upload(filePath, arquivoSelecionado);
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from('laudos').getPublicUrl(filePath);

      const { error: dbError } = await supabase.from("passaros_midia").insert([{
        passaro_id: id,
        empresa_id: empresaId,
        url: urlData.publicUrl,
        ...dadosMidia
      }]);

      if (dbError) throw dbError;

      setModalMidiaAberto(false);
      setArquivoSelecionado(null);
      setPreviewUrl(null);
      carregarMidias();
    } catch (error) {
      alert("Erro ao salvar mídia");
    } finally {
      setSubindoArquivo(false);
    }
  };

  const deletarMidia = async (midiaId: number) => {
    if (!confirm("Excluir esta mídia permanentemente?")) return;
    await supabase.from("passaros_midia").delete().eq("id", midiaId);
    carregarMidias();
  };

  const handleSalvarPassaro = async () => {
    setSalvando(true);
    await supabase.from("passaros").update(formData).eq("id", id);
    router.push("/inicial_page/passaros");
  };

  if (loading) return <Box sx={{ p: 4, textAlign: 'center' }}><CircularProgress /></Box>;

  return (
    <Box sx={{ p: { xs: 2, md: 4 } }}>
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <IconButton onClick={() => router.back()}><ArrowBackIcon /></IconButton>
        <Typography variant="h4" sx={{ color: "#0D47A1", fontWeight: "800" }}>Ficha do Pássaro</Typography>
      </Box>

      <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', lg: '1fr 350px' }, gap: 4, alignItems: 'start' }}>
        
        {/* COLUNA PRINCIPAL: DADOS E GALERIA */}
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Typography variant="h6" sx={{ mb: 3, fontWeight: 'bold' }}>Dados Cadastrais</Typography>
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: 'repeat(12, 1fr)' }, gap: 3 }}>
              <Box sx={{ gridColumn: 'span 6' }}><TextField label="Nome" fullWidth value={formData.nome} onChange={(e) => setFormData({...formData, nome: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 3' }}><TextField label="Anilha" fullWidth value={formData.anilha} onChange={(e) => setFormData({...formData, anilha: e.target.value})} /></Box>
              <Box sx={{ gridColumn: 'span 3' }}>
                <TextField select label="Sexo" fullWidth value={formData.sexo} onChange={(e) => setFormData({...formData, sexo: e.target.value})}>
                  <MenuItem value="M">Macho</MenuItem><MenuItem value="F">Fêmea</MenuItem>
                </TextField>
              </Box>
            </Box>
          </Paper>

          {/* GALERIA DE MÍDIAS */}
          <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
              <Typography variant="h6" sx={{ fontWeight: 'bold' }}>Histórico de Fotos e Cantos</Typography>
              <Button variant="contained" startIcon={<AddIcon />} onClick={() => setModalMidiaAberto(true)}>Adicionar Mídia</Button>
            </Box>

            <Box sx={{ display: 'grid', gridTemplateColumns: '1fr', gap: 2 }}>
              {midias.map((m) => (
                <Paper key={m.id} sx={{ p: 2, display: 'flex', gap: 2, alignItems: 'center', bgcolor: '#fcfcfc' }}>
                  <Avatar variant="rounded" src={m.tipo === 'foto' ? m.url : ''} sx={{ width: 60, height: 60, bgcolor: '#e3f2fd' }}>
                    {m.tipo === 'audio' ? <MusicNoteIcon color="primary" /> : <PlayArrowIcon />}
                  </Avatar>
                  <Box sx={{ flexGrow: 1 }}>
                    <Typography variant="body2" sx={{ fontWeight: 'bold' }}>{m.descricao || 'Sem descrição'}</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: '#666' }}>
                      📅 {new Date(m.data_registro).toLocaleDateString()} | 📍 {m.local_registro || 'Local não informado'}
                    </Typography>
                  </Box>
                  <IconButton color="error" onClick={() => deletarMidia(m.id)}><DeleteIcon /></IconButton>
                </Paper>
              ))}
              {midias.length === 0 && <Typography variant="body2" sx={{ color: '#999', textAlign: 'center', py: 4 }}>Nenhuma mídia registrada.</Typography>}
            </Box>
          </Paper>
        </Box>

        {/* COLUNA LATERAL: LAUDO DE SEXAGEM */}
        <Paper variant="outlined" sx={{ p: 3, borderRadius: 2, position: 'sticky', top: 20 }}>
          <Typography variant="subtitle1" sx={{ fontWeight: 'bold', mb: 2 }}>Certificado de Sexagem</Typography>
          <Box sx={{ border: '2px dashed #ccc', borderRadius: 2, p: 2, textAlign: 'center', bgcolor: '#f9f9f9' }}>
            {formData.laudo_url ? (
               <Box>
                 {formData.laudo_url.toLowerCase().endsWith('.pdf') ? <PictureAsPdfIcon sx={{ fontSize: 60, color: '#c62828' }} /> : <img src={formData.laudo_url} style={{ width: '100%', borderRadius: 8 }} />}
                 <Button color="error" size="small" onClick={() => setFormData({...formData, laudo_url: ""})} sx={{ mt: 1 }}>Remover</Button>
               </Box>
            ) : (
               <Typography variant="caption" sx={{ color: '#999' }}>Nenhum laudo anexado</Typography>
            )}
          </Box>
          <Button variant="contained" fullWidth sx={{ mt: 4, height: 50 }} onClick={handleSalvarPassaro} startIcon={<SaveIcon />}>Salvar Tudo</Button>
        </Paper>
      </Box>

      {/* MODAL DE DUAS COLUNAS (O SEU PEDIDO) */}
      <Dialog open={modalMidiaAberto} onClose={() => setModalMidiaAberto(false)} maxWidth="md" fullWidth>
        <DialogTitle>Novo Registro de Mídia</DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1.2fr 1fr' }, gap: 4 }}>
            {/* LADO ESQUERDO: METADADOS */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                <TextField select label="Tipo" fullWidth value={dadosMidia.tipo} onChange={(e) => setDadosMidia({...dadosMidia, tipo: e.target.value})}>
                    <MenuItem value="foto">Imagem</MenuItem><MenuItem value="audio">Áudio/Canto</MenuItem>
                </TextField>
                <TextField label="Descrição" fullWidth value={dadosMidia.descricao} onChange={(e) => setDadosMidia({...dadosMidia, descricao: e.target.value})} />
                <TextField label="Local" fullWidth value={dadosMidia.local_registro} onChange={(e) => setDadosMidia({...dadosMidia, local_registro: e.target.value})} />
                <TextField label="Autor" fullWidth value={dadosMidia.autor_registro} onChange={(e) => setDadosMidia({...dadosMidia, autor_registro: e.target.value})} />
                <TextField label="Data" type="date" fullWidth InputLabelProps={{ shrink: true }} value={dadosMidia.data_registro} onChange={(e) => setDadosMidia({...dadosMidia, data_registro: e.target.value})} />
            </Box>
            {/* LADO DIREITO: PREVIEW */}
            <Box sx={{ border: '1px solid #ddd', borderRadius: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', bgcolor: '#fafafa', minHeight: 250 }}>
                {previewUrl ? (
                    <Box sx={{ width: '100%', p: 1, textAlign: 'center' }}>
                        {dadosMidia.tipo === 'foto' ? <img src={previewUrl} style={{ maxWidth: '100%', maxHeight: 200 }} /> : <audio controls src={previewUrl} style={{ width: '100%' }} />}
                        <Button color="error" size="small" onClick={() => setPreviewUrl(null)}>Trocar Arquivo</Button>
                    </Box>
                ) : (
                    <Button variant="outlined" component="label">Escolher Arquivo<input type="file" hidden onChange={handleFileSelect} /></Button>
                )}
            </Box>
          </Box>
        </DialogContent>
        <DialogActions sx={{ p: 2 }}>
          <Button onClick={() => setModalMidiaAberto(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleSalvarMidia} disabled={subindoArquivo || !arquivoSelecionado}>
            {subindoArquivo ? <CircularProgress size={24} /> : "Salvar Mídia"}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
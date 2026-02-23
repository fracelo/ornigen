"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import {
  Box, TextField, Button, Typography, Paper, Container, 
  Autocomplete, Stack, Divider, CircularProgress, Avatar, Alert, IconButton
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import AddIcon from "@mui/icons-material/Add";
import BusinessIcon from "@mui/icons-material/Business";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import DeleteIcon from "@mui/icons-material/Delete";

export default function EntidadesPage() {
  const { empresaId } = useEmpresa();
  const [loading, setLoading] = useState(false);
  const [entidades, setEntidades] = useState<any[]>([]);
  const [entidadeSelecionada, setEntidadeSelecionada] = useState<any>(null);
  const [uploading, setUploading] = useState(false);
  
  const [form, setForm] = useState({
    nome: "",
    sigla: "",
    tipo: "",
    logo_url: ""
  });

  const carregarLista = async () => {
    if (!empresaId) return;
    const { data } = await supabase
      .from("entidades")
      .select("*")
      .eq("empresa_id", empresaId)
      .order("nome");
    setEntidades(data || []);
  };

  useEffect(() => { carregarLista(); }, [empresaId]);

  const handleSelecionar = (event: any, newValue: any) => {
    setEntidadeSelecionada(newValue);
    if (newValue) {
      setForm({
        nome: newValue.nome,
        sigla: newValue.sigla || "",
        tipo: newValue.tipo || "",
        logo_url: newValue.logo_url || ""
      });
    } else {
      setForm({ nome: "", sigla: "", tipo: "", logo_url: "" });
    }
  };

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0 || !empresaId) return;
      setUploading(true);

      const file = event.target.files[0];
      const fileExt = file.name.split('.').pop();
      // Nome padronizado: logo_entidade + timestamp para evitar cache do navegador
      const fileName = `${empresaId}/logo_entidade_${Date.now()}.${fileExt}`;

      // Upload para o bucket 'logos'
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, file);

      if (uploadError) throw uploadError;

      // Pegar URL Pública
      const { data: urlData } = supabase.storage.from('logos').getPublicUrl(fileName);
      
      setForm(prev => ({ ...prev, logo_url: urlData.publicUrl }));
      
    } catch (error: any) {
      alert("Erro ao carregar logo: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  const handleSalvar = async () => {
    if (!form.nome || !empresaId) return;
    setLoading(true);
    try {
      if (entidadeSelecionada) {
        await supabase.from("entidades").update(form).eq("id", entidadeSelecionada.id);
        alert("Entidade atualizada!");
      } else {
        await supabase.from("entidades").insert([{ ...form, empresa_id: empresaId }]);
        alert("Entidade cadastrada!");
      }
      // Resetar estados
      setEntidadeSelecionada(null);
      setForm({ nome: "", sigla: "", tipo: "", logo_url: "" });
      carregarLista();
    } catch (err) {
      alert("Erro ao salvar dados.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Paper variant="outlined" sx={{ p: 3, borderRadius: 2 }}>
        <Stack direction="row" spacing={2} alignItems="center" mb={3}>
          <BusinessIcon color="primary" fontSize="large" />
          <Typography variant="h5" fontWeight="bold">Cadastro de Clubes / Federações</Typography>
        </Stack>

        <Box sx={{ mb: 4, bgcolor: '#f8f9fa', p: 2, borderRadius: 1, border: '1px solid #e0e0e0' }}>
          <Typography variant="caption" fontWeight="bold" color="text.secondary">
            EDITAR ENTIDADE EXISTENTE
          </Typography>
          <Autocomplete
            options={entidades}
            getOptionLabel={(o) => `${o.nome} ${o.sigla ? `(${o.sigla})` : ""}`}
            value={entidadeSelecionada}
            onChange={handleSelecionar}
            renderInput={(params) => <TextField {...params} placeholder="Pesquise por nome ou sigla..." size="small" />}
            fullWidth
          />
        </Box>

        <Divider sx={{ mb: 3 }} />

        <Stack spacing={3}>
          {/* ÁREA DO LOGO */}
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <Box sx={{ position: 'relative' }}>
              <Avatar 
                src={form.logo_url} 
                variant="rounded" 
                sx={{ width: 120, height: 120, border: '2px dashed #ccc', bgcolor: '#fff' }}
              >
                <BusinessIcon sx={{ fontSize: 60, color: '#eee' }} />
              </Avatar>
              {form.logo_url && (
                <IconButton 
                  size="small" 
                  sx={{ position: 'absolute', top: -10, right: -10, bgcolor: 'white', border: '1px solid #ddd' }}
                  onClick={() => setForm({...form, logo_url: ""})}
                >
                  <DeleteIcon fontSize="inherit" color="error" />
                </IconButton>
              )}
            </Box>
            
            <Stack spacing={1}>
              <Typography variant="subtitle2">Logo da Entidade</Typography>
              <Typography variant="caption" color="text.secondary">Use preferencialmente arquivos PNG com fundo transparente.</Typography>
              <Button 
                variant="outlined" 
                component="label" 
                startIcon={uploading ? <CircularProgress size={20} /> : <CloudUploadIcon />}
                disabled={uploading}
                size="small"
              >
                {uploading ? "Enviando..." : "Selecionar Logo"}
                <input type="file" hidden accept="image/*" onChange={handleUploadLogo} />
              </Button>
            </Stack>
          </Box>

          <TextField 
            label="Nome Oficial da Entidade" 
            fullWidth 
            value={form.nome} 
            onChange={(e) => setForm({...form, nome: e.target.value})} 
          />
          
          <Stack direction="row" spacing={2}>
            <TextField 
              label="Sigla / Abreviação" 
              fullWidth 
              value={form.sigla} 
              onChange={(e) => setForm({...form, sigla: e.target.value})} 
            />
            <TextField 
              label="Tipo (Ex: Federação, Clube)" 
              fullWidth 
              value={form.tipo} 
              onChange={(e) => setForm({...form, tipo: e.target.value})} 
            />
          </Stack>

          <Box sx={{ display: 'flex', gap: 2, pt: 2 }}>
            <Button 
              variant="contained" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar}
              disabled={loading || !form.nome}
              sx={{ px: 4 }}
            >
              {entidadeSelecionada ? "Atualizar" : "Cadastrar"}
            </Button>
            <Button 
              variant="outlined" 
              onClick={() => { setEntidadeSelecionada(null); setForm({nome:"", sigla:"", tipo:"", logo_url:""}); }}
            >
              Limpar / Novo
            </Button>
          </Box>
        </Stack>
      </Paper>
    </Container>
  );
}
"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formataDados } from "../../lib/formataDados";
import { useRouter } from "next/navigation";
import { useEmpresa } from "../../context/empresaContext";
import { 
  Box, Typography, Button, TextField, Paper, 
  CircularProgress, Container, Divider, Avatar, IconButton, Stack 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";
import PhotoCamera from "@mui/icons-material/PhotoCamera";

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isEditar = !!empresaId;

  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Estados dos Campos
  const [razaoSocial, setRazaoSocial] = useState("");
  const [documento, setDocumento] = useState("");
  const [nomeFantasia, setNomeFantasia] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [logoUrl, setLogoUrl] = useState("");

  const carregarDadosEmpresa = useCallback(async () => {
    if (!empresaId) return;
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("empresas")
        .select("*")
        .eq("id", empresaId)
        .single();

      if (error) throw error;

      if (data) {
        setRazaoSocial(data.razao_social || "");
        setNomeFantasia(data.nome_fantasia || "");
        setLogoUrl(data.logo_url || "");
        
        const docLimpo = (data.documento || "").replace(/\D/g, "");
        if (docLimpo) {
          const tipoDoc = docLimpo.length <= 11 ? "cpf" : "cnpj";
          setDocumento(formataDados(docLimpo, tipoDoc));
        }

        const cepLimpo = (data.cep || "").replace(/\D/g, "");
        setCep(formataDados(cepLimpo, "cep"));
        setEndereco(data.endereco || "");
        setNumero(data.numero || "");
        setBairro(data.bairro || "");
        setCidade(data.cidade || "");
        setEstado(data.estado || "");
      }
    } catch (err) {
      console.error("Erro ao carregar empresa:", err);
    } finally {
      setLoading(false);
    }
  }, [empresaId]);

  useEffect(() => {
    if (isEditar) carregarDadosEmpresa();
  }, [isEditar, carregarDadosEmpresa]);

  const handleUploadLogo = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      if (!event.target.files || event.target.files.length === 0) return;
      if (!empresaId) {
        alert("Salve a empresa primeiro para gerar um ID.");
        return;
      }

      setUploading(true);
      const file = event.target.files[0];
      const fileExt = file.name.split(".").pop();
      const fileName = `empresa_${empresaId}_logo.${fileExt}`;
      const filePath = `identificacao/${fileName}`;

      // Upload (INSERT/UPDATE)
      const { error: uploadError } = await supabase.storage
        .from("logos")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from("logos")
        .getPublicUrl(filePath);

      // Atualiza o registro da empresa com a URL da imagem
      const { error: updateError } = await supabase
        .from("empresas")
        .update({ logo_url: publicUrl })
        .eq("id", empresaId);

      if (updateError) throw updateError;

      setLogoUrl(publicUrl);
    } catch (err) {
      console.error("Erro upload:", err);
      alert("Verifique as permissões do bucket 'logos' no Supabase.");
    } finally {
      setUploading(false);
    }
  };

  const handleSalvar = async () => {
    setLoading(true);
    const payload = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      documento: documento.replace(/\D/g, ""),
      cep: cep.replace(/\D/g, ""),
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      // logo_url já é salvo no momento do upload
    };

    try {
      let error;
      if (isEditar) {
        const { error: err } = await supabase.from("empresas").update(payload).eq("id", empresaId);
        error = err;
      } else {
        const { error: err } = await supabase.from("empresas").insert([payload]);
        error = err;
      }

      if (error) throw error;
      alert("Dados salvos com sucesso!");
    } catch (err) {
      console.error("Erro ao salvar:", err);
      alert("Erro ao salvar dados.");
    } finally {
      setLoading(false);
    }
  };

  const handleDocumentoChange = (v: string) => {
    const apenasNumeros = v.replace(/\D/g, "");
    if (apenasNumeros.length > 14) return;
    const tipoDoc = apenasNumeros.length <= 11 ? "cpf" : "cnpj";
    setDocumento(formataDados(apenasNumeros, tipoDoc));
  };

  const handleCepChange = async (valor: string) => {
    const apenasNumeros = valor.replace(/\D/g, "");
    if (apenasNumeros.length > 8) return;
    setCep(formataDados(apenasNumeros, "cep"));

    if (apenasNumeros.length === 8) {
      try {
        const res = await fetch(`https://viacep.com.br/ws/${apenasNumeros}/json/`);
        const data = await res.json();
        if (!data.erro) {
          setEndereco(data.logradouro || "");
          setBairro(data.bairro || "");
          setCidade(data.localidade || "");
          setEstado(data.uf || "");
        }
      } catch (err) { console.error("Erro CEP:", err); }
    }
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <BusinessIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
            <Typography variant="h5" fontWeight="bold" color="primary">
              {isEditar ? "Configurações do Criadouro" : "Cadastro de Empresa"}
            </Typography>
          </Box>
        </Box>

        {/* 🔹 ÁREA DO LOGO */}
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Box sx={{ position: "relative" }}>
            <Avatar src={logoUrl} sx={{ width: 100, height: 100, border: "2px solid #ddd" }}>
              {!logoUrl && <BusinessIcon sx={{ fontSize: 50 }} />}
            </Avatar>
            <IconButton
              color="primary"
              component="label"
              sx={{ position: "absolute", bottom: -5, right: -5, bgcolor: "white", boxShadow: 2 }}
            >
              <input hidden accept="image/*" type="file" onChange={handleUploadLogo} disabled={!isEditar} />
              <PhotoCamera fontSize="small" />
            </IconButton>
            {uploading && <CircularProgress size={24} sx={{ position: 'absolute', top: 38, left: 38 }} />}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Logo Principal</Typography>
            <Typography variant="body2" color="textSecondary">Aparecerá no cabeçalho dos pedigrees.</Typography>
            {!isEditar && <Typography variant="caption" color="error">Salve os dados primeiro para liberar o upload.</Typography>}
          </Box>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* CAMPOS DE TEXTO */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Nome / Razão Social" sx={{ flex: 1 }} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
          <TextField label="CPF ou CNPJ" sx={{ width: { sm: '220px' } }} value={documento} onChange={(e) => handleDocumentoChange(e.target.value)} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField label="Nome Fantasia" fullWidth value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
        </Box>

        

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="CEP" sx={{ width: { sm: '150px' } }} value={cep} onChange={(e) => handleCepChange(e.target.value)} />
          <TextField label="Logradouro" sx={{ flex: 1 }} value={endereco} onChange={(e) => setEndereco(e.target.value)} />
          <TextField label="Nº" sx={{ width: { sm: '100px' } }} value={numero} onChange={(e) => setNumero(e.target.value)} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Bairro" sx={{ flex: 1 }} value={bairro} onChange={(e) => setBairro(e.target.value)} />
          <TextField label="Cidade" sx={{ flex: 1 }} value={cidade} onChange={(e) => setCidade(e.target.value)} />
          <TextField label="UF" sx={{ width: { sm: '80px' } }} value={estado} onChange={(e) => setEstado(e.target.value.toUpperCase())} />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push("/inicial_page")}>Cancelar</Button>
          <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={loading || uploading}>
            {isEditar ? "Atualizar" : "Salvar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
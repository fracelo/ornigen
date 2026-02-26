"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formataDados } from "../../lib/formataDados";
import { useRouter } from "next/navigation";
import { useEmpresa } from "../../context/empresaContext";
import { 
  Box, Typography, Button, TextField, Paper, 
  CircularProgress, Container, Divider, IconButton, Stack 
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
  const [responsavelNome, setResponsavelNome] = useState("");
  const [responsavelCpf, setResponsavelCpf] = useState("");
  const [cep, setCep] = useState("");
  const [endereco, setEndereco] = useState("");
  const [numero, setNumero] = useState("");
  const [bairro, setBairro] = useState("");
  const [cidade, setCidade] = useState("");
  const [estado, setEstado] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  
  // Novos campos de Telefone
  const [telefone1, setTelefone1] = useState("");
  const [resp1, setResp1] = useState("");
  const [telefone2, setTelefone2] = useState("");
  const [resp2, setResp2] = useState("");

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
        setResponsavelNome(data.responsavel_nome || "");
        setResponsavelCpf(formataDados(data.responsavel_cpf || "", "cpf"));
        setLogoUrl(data.logo_url || "");
        setTelefone1(data.telefone1 || "");
        setResp1(data.resp1 || "");
        setTelefone2(data.telefone2 || "");
        setResp2(data.resp2 || "");
        
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
        const file = event.target.files?.[0];
        if (!file) return;

        if (!empresaId) {
          alert("Por favor, salve os dados da empresa primeiro para gerar um ID.");
          return;
        }

        setUploading(true);

        // 1. Definir o caminho (ex: identificacao/id-da-empresa.png)
        const fileExt = file.name.split(".").pop();
        const filePath = `identificacao/${empresaId}.${fileExt}`;

        // 2. Fazer o Upload para o Bucket 'logos'
        // Usamos o upsert: true para sobrescrever se já existir
        const { data, error: uploadError } = await supabase.storage
          .from("logos")
          .upload(filePath, file, { 
            upsert: true,
            cacheControl: '0' // Importante para não ficar mostrando a imagem antiga
          });

        if (uploadError) throw uploadError;

        // 3. Obter a URL Pública Oficial
        const { data: { publicUrl } } = supabase.storage
          .from("logos")
          .getPublicUrl(filePath);

        // 4. Salvar essa URL na tabela 'empresas'
        const { error: updateError } = await supabase
          .from("empresas")
          .update({ logo_url: publicUrl })
          .eq("id", empresaId);

        if (updateError) throw updateError;

        // 5. Atualizar o estado local com a URL que vem do servidor
        // Adicionamos um timestamp no final para "enganar" o cache do navegador e mostrar a nova logo na hora
        const urlComCacheBuster = `${publicUrl}?t=${new Date().getTime()}`;
        setLogoUrl(urlComCacheBuster);

        alert("Logo carregada e salva com sucesso!");

      } catch (err: any) {
        console.error("Erro no processo de upload:", err);
        alert(`Erro: ${err.message || "Falha ao processar imagem"}`);
      } finally {
        setUploading(false);
      }
    };

  const handleSalvar = async () => {
    setLoading(true);
    const payload = {
      razao_social: razaoSocial,
      nome_fantasia: nomeFantasia,
      responsavel_nome: responsavelNome,
      responsavel_cpf: responsavelCpf.replace(/\D/g, ""),
      documento: documento.replace(/\D/g, ""),
      cep: cep.replace(/\D/g, ""),
      endereco,
      numero,
      bairro,
      cidade,
      estado,
      telefone1,
      resp1,
      telefone2,
      resp2
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
        
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 4 }}>
          <BusinessIcon color="primary" sx={{ mr: 1, fontSize: 30 }} />
          <Typography variant="h5" fontWeight="bold" color="primary">
            {isEditar ? "Configurações da Empresa" : "Cadastro de Empresa"}
          </Typography>
        </Box>

        {/* 🔹 ÁREA DO LOGO QUADRADO */}
        <Stack direction="row" spacing={3} alignItems="center" sx={{ mb: 4 }}>
          <Box sx={{ position: "relative" }}>
            <Box sx={{
                width: 100, height: 100, border: "2px solid #ddd", borderRadius: 2,
                overflow: "hidden", display: "flex", alignItems: "center", justifyContent: "center", bgcolor: "#f9f9f9",
            }}>
              {logoUrl ? (
                <Box component="img" src={logoUrl} sx={{ width: "100%", height: "100%", objectFit: "contain", p: 1 }} />
              ) : (
                <BusinessIcon sx={{ fontSize: 50, color: "#ccc" }} />
              )}
            </Box>
            <IconButton color="primary" component="label" disabled={!isEditar}
              sx={{ position: "absolute", bottom: -10, right: -10, bgcolor: "white", boxShadow: 2 }}
            >
              <input hidden accept="image/*" type="file" onChange={handleUploadLogo} disabled={!isEditar} />
              <PhotoCamera fontSize="small" />
            </IconButton>
            {uploading && <CircularProgress size={24} sx={{ position: 'absolute', top: '50%', left: '50%', m: '-12px' }} />}
          </Box>
          <Box>
            <Typography variant="subtitle1" fontWeight="bold">Logo do Criadouro</Typography>
            <Typography variant="body2" color="textSecondary">Recomendado: Formato quadrado (SVG ou PNG).</Typography>
          </Box>
        </Stack>

        <Divider sx={{ mb: 4 }} />

        {/* 🔹 DADOS PRINCIPAIS */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Nome / Razão Social" sx={{ flex: 1 }} value={razaoSocial} onChange={(e) => setRazaoSocial(e.target.value)} />
          <TextField label="CPF ou CNPJ Empresa" sx={{ width: { sm: '220px' } }} value={documento} onChange={(e) => handleDocumentoChange(e.target.value)} />
        </Box>

        <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
          <TextField label="Nome Fantasia" fullWidth value={nomeFantasia} onChange={(e) => setNomeFantasia(e.target.value)} />
        </Box>

        {/* 🔹 LINHA RESPONSÁVEL (SOLICITADO) */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Nome do Responsável" sx={{ flex: 1 }} value={responsavelNome} onChange={(e) => setResponsavelNome(e.target.value)} />
          <TextField label="CPF do Responsável" sx={{ width: { sm: '220px' } }} value={responsavelCpf} onChange={(e) => setResponsavelCpf(formataDados(e.target.value, "cpf"))} />
        </Box>

        <Divider sx={{ my: 3 }} />

        {/* 🔹 ENDEREÇO */}
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

        <Divider sx={{ my: 3 }} />

        {/* 🔹 CONTATOS (SOLICITADO: 3 CAMPOS POR LINHA) */}
        <Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 'bold' }}>Contatos</Typography>
        
        {/* Linha Telefone 1 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Telefone (1)" sx={{ flex: 1 }} value={telefone1} onChange={(e) => setTelefone1(e.target.value)} />
          <TextField label="Responsável Telefone (1)" sx={{ flex: 2 }} value={resp1} onChange={(e) => setResp1(e.target.value)} />
        </Box>

        {/* Linha Telefone 2 */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField label="Telefone (2)" sx={{ flex: 1 }} value={telefone2} onChange={(e) => setTelefone2(e.target.value)} />
          <TextField label="Responsável Telefone (2)" sx={{ flex: 2 }} value={resp2} onChange={(e) => setResp2(e.target.value)} />
        </Box>

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 4 }}>
          <Button variant="outlined" onClick={() => router.push("/inicial_page")}>Cancelar</Button>
          <Button variant="contained" size="large" startIcon={<SaveIcon />} onClick={handleSalvar} disabled={loading || uploading}>
            {isEditar ? "Atualizar" : "Salvar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
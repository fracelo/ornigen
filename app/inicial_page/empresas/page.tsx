"use client";

import { useState, useEffect, useCallback } from "react";
import { supabase } from "../../lib/supabaseClient";
import { formataDados } from "../../lib/formataDados";
import { useRouter } from "next/navigation";
import { useEmpresa } from "../../context/empresaContext";
import { useAuth } from "../../context/authContext";
import { 
  Box, Typography, Button, TextField, Paper, 
  CircularProgress, Container, Divider 
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import BusinessIcon from "@mui/icons-material/Business";

export default function CadastroEmpresaPage() {
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const isEditar = !!empresaId;

  const [loading, setLoading] = useState(false);

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

  // 🔹 Função para carregar dados do Banco (Supabase)
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
        
        // 🔹 Formatação na carga do Documento
        const docLimpo = (data.documento || "").replace(/\D/g, "");
        if (docLimpo) {
            const tipoDoc = docLimpo.length <= 11 ? "cpf" : "cnpj";
            setDocumento(formataDados(docLimpo, tipoDoc));
        }

        // 🔹 Formatação na carga do CEP
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
    if (isEditar) {
      carregarDadosEmpresa();
    }
  }, [isEditar, carregarDadosEmpresa]);

  const handleDocumentoChange = (v: string) => {
    const apenasNumeros = v.replace(/\D/g, "");
    if (apenasNumeros.length > 14) return; // Limite máximo de números para CNPJ
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
          setTimeout(() => document.getElementById("campo-numero")?.focus(), 100);
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
          {loading && <CircularProgress size={24} />}
        </Box>

        {/* 🔹 1ª LINHA: NOME/RAZÃO E DOCUMENTO (MENOR) */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField
            label="Nome / Razão Social"
            sx={{ flex: 1 }} 
            value={razaoSocial}
            onChange={(e) => setRazaoSocial(e.target.value)}
            InputProps={{ style: { fontSize: '1.2rem', fontWeight: '600' } }}
          />
          <TextField
            label="CPF ou CNPJ"
            sx={{ width: { sm: '220px' } }} // Tamanho menor e fixo
            value={documento}
            onChange={(e) => handleDocumentoChange(e.target.value)}
            error={documento.includes("inválido")}
          />
        </Box>

        {/* 🔹 2ª LINHA: NOME FANTASIA (Oculta se vazio) */}
        {nomeFantasia !== "" && (
          <Box sx={{ display: 'flex', gap: 2, mb: 3 }}>
            <TextField
              label="Nome Fantasia / Comercial"
              fullWidth
              value={nomeFantasia}
              onChange={(e) => setNomeFantasia(e.target.value)}
            />
          </Box>
        )}

        {/* 🔹 LINHA DE ENDEREÇO 1: CEP, LOGRADOURO E NÚMERO */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField 
            label="CEP" 
            sx={{ width: { sm: '150px' } }} 
            value={cep} 
            onChange={(e) => handleCepChange(e.target.value)} 
          />
          <TextField 
            label="Logradouro" 
            sx={{ flex: 1 }} 
            value={endereco} 
            onChange={(e) => setEndereco(e.target.value)} 
          />
          <TextField 
            id="campo-numero" 
            label="Nº" 
            sx={{ width: { sm: '100px' } }} 
            value={numero} 
            onChange={(e) => setNumero(e.target.value)} 
          />
        </Box>

        {/* 🔹 LINHA DE ENDEREÇO 2: BAIRRO, CIDADE E UF */}
        <Box sx={{ display: 'flex', gap: 2, mb: 3, flexDirection: { xs: 'column', sm: 'row' } }}>
          <TextField 
            label="Bairro" 
            sx={{ flex: 1 }} 
            value={bairro} 
            onChange={(e) => setBairro(e.target.value)} 
          />
          <TextField 
            label="Cidade" 
            sx={{ flex: 1 }} 
            value={cidade} 
            onChange={(e) => setCidade(e.target.value)} 
          />
          <TextField 
            label="UF" 
            sx={{ width: { sm: '80px' } }} 
            value={estado} 
            onChange={(e) => setEstado(e.target.value.toUpperCase())} 
            inputProps={{ maxLength: 2 }} 
          />
        </Box>

        <Divider sx={{ my: 4 }} />

        <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
          <Button variant="outlined" onClick={() => router.push("/inicial_page")}>
            Cancelar
          </Button>
          <Button 
            variant="contained" 
            size="large" 
            startIcon={<SaveIcon />}
            onClick={() => {/* Lógica de salvar */}}
            sx={{ fontWeight: 'bold', px: 5 }}
            disabled={loading}
          >
            {isEditar ? "Atualizar" : "Salvar"}
          </Button>
        </Box>
      </Paper>
    </Container>
  );
}
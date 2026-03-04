"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import {
  Box, Typography, Button, TextField, Paper, CircularProgress,
  Container, Divider, InputAdornment
} from "@mui/material";
import SaveIcon from "@mui/icons-material/Save";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import SetMealIcon from "@mui/icons-material/SetMeal"; // Ícone para Espécies

export default function CadastroEspecie() {
  const router = useRouter();
  const params = useParams();
  
  const idEspecie = params.id !== "novo" ? params.id : null;
  const [loading, setLoading] = useState(false);

  // Estados dos campos baseados na sua tabela especies_sispass
  const [codigoSispass, setCodigoSispass] = useState("");
  const [nomesComuns, setNomesComuns] = useState(""); // Tratado como string no input (separado por vírgula)
  const [nomeCientifico, setNomeCientifico] = useState("");
  const [diametroAnilha, setDiametroAnilha] = useState("");
  const [tempoPostura, setTempoPostura] = useState(10);
  const [tempoIncubacao, setTempoIncubacao] = useState(13);

  const carregarEspecie = useCallback(async () => {
    if (!idEspecie) return;
    setLoading(true);
    const { data, error } = await supabase
      .from("especies_sispass")
      .select("*")
      .eq("id", idEspecie)
      .single();

    if (data && !error) {
      setCodigoSispass(data.codigo_sispass?.toString() || "");
      setNomesComuns(data.nomes_comuns?.join(", ") || "");
      setNomeCientifico(data.nome_cientifico || "");
      setDiametroAnilha(data.diametro_anilha?.toString() || "");
      setTempoPostura(data.tempo_postura_ovos || 10);
      setTempoIncubacao(data.tempo_incubacao || 13);
    }
    setLoading(false);
  }, [idEspecie]);

  useEffect(() => { carregarEspecie(); }, [carregarEspecie]);

  const handleSalvar = async () => {
    setLoading(true);

    // Converte a string de nomes comuns de volta para array
    const nomesArray = nomesComuns.split(",").map(n => n.trim()).filter(n => n !== "");

    const payload = {
      codigo_sispass: parseInt(codigoSispass),
      nomes_comuns: nomesArray,
      nome_cientifico: nomeCientifico,
      diametro_anilha: parseFloat(diametroAnilha),
      tempo_postura_ovos: tempoPostura,
      tempo_incubacao: tempoIncubacao
    };

    const { error } = idEspecie 
      ? await supabase.from("especies_sispass").update(payload).eq("id", idEspecie)
      : await supabase.from("especies_sispass").insert([payload]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Espécie salva com sucesso!");
      router.push("/inicial_page/especies");
    }
    setLoading(false);
  };

  if (loading && idEspecie) {
    return <Box sx={{ display: 'flex', justifyContent: 'center', py: 10 }}><CircularProgress /></Box>;
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* 🚀 ESTILO PADRÃO DE BORDA IDENTICO A ENTIDADES */}
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
        {/* Cabeçalho */}
        <Box sx={{ display: 'flex', alignItems: 'center', mb: 5, justifyContent: 'space-between' }}>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Box
                component="img"
                src="/icons/especies.png"
                alt="Ícone Criadouro"
                sx={{ width: 96, height: 96, objectFit: 'contain' }}
            />
            <Typography variant="h5" fontWeight="900" color="#1e293b">
              {idEspecie ? "Editar Espécie" : "Nova Espécie"}
            </Typography>
          </Box>
          <Button 
            startIcon={<ArrowBackIcon />} 
            onClick={() => router.back()}
            sx={{ fontWeight: "bold", color: "#64748b", textTransform: 'none' }}
          >
            Voltar para a lista
          </Button>
        </Box>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          
          {/* Linha 1: Códigos e Nomes Principais */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField 
              label="Código SISPASS" 
              sx={{ flex: 1 }} 
              value={codigoSispass} 
              onChange={(e) => setCodigoSispass(e.target.value)} 
              type="number"
            />
            <TextField 
              label="Nome Científico" 
              sx={{ flex: 2 }} 
              value={nomeCientifico} 
              onChange={(e) => setNomeCientifico(e.target.value)} 
              InputProps={{ sx: { fontStyle: 'italic' } }}
            />
            <TextField 
              label="Diâmetro Anilha" 
              sx={{ flex: 1 }} 
              value={diametroAnilha} 
              onChange={(e) => setDiametroAnilha(e.target.value)} 
              InputProps={{
                endAdornment: <InputAdornment position="end">mm</InputAdornment>,
              }}
            />
          </Box>

          {/* Linha 2: Nomes Comuns */}
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField 
              label="Nomes Comuns (separe por vírgula)" 
              fullWidth 
              value={nomesComuns} 
              onChange={(e) => setNomesComuns(e.target.value)} 
              placeholder="Ex: Trinca-ferro, Pássaro Preto, etc."
            />
          </Box>

          <Divider sx={{ my: 1, fontWeight: 'bold' }}>⏱️ TEMPOS REPRODUTIVOS (DIAS)</Divider>

          {/* Linha 3: Tempos */}
          <Box sx={{ display: 'flex', gap: 2, flexDirection: { xs: 'column', sm: 'row' } }}>
            <TextField 
              label="Tempo Postura Ovos" 
              type="number" 
              sx={{ flex: 1 }} 
              value={tempoPostura} 
              onChange={(e) => setTempoPostura(parseInt(e.target.value))} 
            />
            <TextField 
              label="Tempo Incubação" 
              type="number" 
              sx={{ flex: 1 }} 
              value={tempoIncubacao} 
              onChange={(e) => setTempoIncubacao(parseInt(e.target.value))} 
            />
            <Box sx={{ flex: 2 }} /> {/* Espaçador para manter o alinhamento */}
          </Box>

          <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
            <Button 
              variant="contained" 
              size="large" 
              startIcon={<SaveIcon />} 
              onClick={handleSalvar} 
              disabled={loading}
              sx={{ 
                px: 8, 
                py: 1.5, 
                fontWeight: "900", 
                bgcolor: "#1e293b", 
                borderRadius: 2,
                "&:hover": { bgcolor: "#334155" } 
              }}
            >
              {loading ? "Salvando..." : "Salvar Espécie"}
            </Button>
          </Box>
        </Box>
      </Paper>
    </Container>
  );
}
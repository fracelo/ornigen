"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { Button, TextField, MenuItem, Paper } from "@mui/material";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function EspeciesPage() {
  const [busca, setBusca] = useState("");
  const [resultados, setResultados] = useState<any[]>([]);
  const [tipo, setTipo] = useState("");
  const [nomeCientifico, setNomeCientifico] = useState("");
  const [nomeIngles, setNomeIngles] = useState("");
  const [nomePortugues, setNomePortugues] = useState("");

  // 🔹 Busca dinâmica
  useEffect(() => {
    const fetchEspecies = async () => {
      if (busca.length < 2) {
        setResultados([]);
        return;
      }
      const { data, error } = await supabase
        .from("especies")
        .select("*")
        .or(`nome_cientifico.ilike.%${busca}%,nome_portugues.ilike.%${busca}%`)
        .limit(10);

      if (!error) setResultados(data || []);
    };
    fetchEspecies();
  }, [busca]);

  // 🔹 Salvar espécie
  const handleSalvar = async () => {
    const { error } = await supabase.from("especies").insert([
      {
        tipo,
        nome_cientifico: nomeCientifico,
        nome_ingles: nomeIngles,
        nome_portugues: nomePortugues,
      },
    ]);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Espécie salva com sucesso!");
      handleCancelar();
    }
  };

  // 🔹 Cancelar → limpa campos
  const handleCancelar = () => {
    setTipo("");
    setNomeCientifico("");
    setNomeIngles("");
    setNomePortugues("");
    setBusca("");
    setResultados([]);
  };

  return (
    <div className="container">
      <h2>Cadastro de Espécies</h2>

      {/* Campo de busca */}
      <TextField
        label="Buscar espécie (científico ou português)"
        value={busca}
        onChange={(e) => setBusca(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Lista estilo combo box */}
      {resultados.length > 0 && (
        <Paper elevation={3} style={{ backgroundColor: "#f0f8ff", padding: "10px" }}>
          {resultados.map((esp) => (
            <MenuItem
              key={esp.id}
              onClick={() => {
                setTipo(esp.tipo || "");
                setNomeCientifico(esp.nome_cientifico || "");
                setNomeIngles(esp.nome_ingles || "");
                setNomePortugues(esp.nome_portugues || "");
                setResultados([]); // 🔹 recolhe a lista após seleção
              }}
            >
              {esp.nome_cientifico} - {esp.nome_portugues}
            </MenuItem>
          ))}
        </Paper>
      )}

      {/* Campos de cadastro */}
      <TextField
        label="Tipo"
        value={tipo}
        onChange={(e) => setTipo(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nome Científico"
        value={nomeCientifico}
        onChange={(e) => setNomeCientifico(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nome Inglês"
        value={nomeIngles}
        onChange={(e) => setNomeIngles(e.target.value)}
        fullWidth
        margin="normal"
      />
      <TextField
        label="Nome Português"
        value={nomePortugues}
        onChange={(e) => setNomePortugues(e.target.value)}
        fullWidth
        margin="normal"
      />

      {/* Botões */}
      <div style={{ marginTop: "20px", display: "flex", gap: "1rem" }}>
        <Button variant="outlined" color="secondary" onClick={handleCancelar}>
          Cancelar
        </Button>
        <Button variant="contained" color="primary" onClick={handleSalvar}>
          Salvar
        </Button>
      </div>
    </div>
  );
}
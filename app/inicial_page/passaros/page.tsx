"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../lib/supabaseClient";
import Box from "@mui/material/Box";
import {
  TextField,
  Button,
  Checkbox,
  FormControlLabel,
  Radio,
  RadioGroup,
  Select,
  MenuItem,
  InputLabel,
  FormControl,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

export default function PassarosPage() {
  const [form, setForm] = useState({
    nome: "",
    anilha: "",
    data_nascimento: "",
    id_especie: "",
    especie_id: "",
    sexo: "M",
    pai_id: null,
    mae_id: null,
    pai_nao_informado: false,
    mae_nao_informado: false,
    criacao_propria: true,
    data_recebimento: null,
    origem_id: null,
    data_transferencia: null,
    destino_id: null,
    incompleto: false,
  });

  const [especies, setEspecies] = useState<{ id: number; nome: string }[]>([]);

  // 🔹 Carregar espécies do Supabase
  useEffect(() => {
    const fetchEspecies = async () => {
      const { data, error } = await supabase.from("especies").select("id, nome");
      if (!error && data) {
        setEspecies(data);
      }
    };
    fetchEspecies();
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();
    const { error } = await supabase.from("passaros").insert([form]);
    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Pássaro cadastrado com sucesso!");
    }
  };

  return (
    <div>
      <h2>Inclusão de Pássaro</h2>
      <form onSubmit={handleSubmit}>
        {/* 🔹 Primeira linha: Nome, Anilha, Data de Nascimento */}
        <Box display="flex" gap={2}>
          <TextField
            label="Nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            fullWidth
            margin="normal"
            inputProps={{ maxLength: 100 }}
          />
          <TextField
            label="Anilha"
            name="anilha"
            value={form.anilha}
            onChange={handleChange}
            required
            margin="normal"
            inputProps={{ maxLength: 20 }}
            sx={{ width: "200px" }}
          />
          <TextField
            type="date"
            label="Data de nascimento"
            name="data_nascimento"
            value={form.data_nascimento}
            onChange={handleChange}
            required
            margin="normal"
            InputLabelProps={{ shrink: true }}
            inputProps={{ maxLength: 10 }}
            sx={{ width: "180px" }}
          />
        </Box>

        {/* 🔹 Segunda linha: ID Espécie, Nome da Espécie (autocomplete), Sexo */}
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="ID Espécie"
            name="id_especie"
            value={form.id_especie}
            onChange={handleChange}
            margin="normal"
            sx={{ width: "120px" }}
          />

          <Autocomplete
            freeSolo
            options={especies.map((e) => e.nome)}
            value={form.especie_id}
            onChange={(event, newValue) => {
              setForm({ ...form, especie_id: newValue || "" });

              const especieSelecionada = especies.find((e) => e.nome === newValue);
              if (especieSelecionada) {
                setForm((prev) => ({
                  ...prev,
                  especie_id: especieSelecionada.nome,
                  id_especie: especieSelecionada.id.toString(),
                }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Espécie" margin="normal" fullWidth />
            )}
            sx={{ flex: 2 }}
          />

          <RadioGroup
            row
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            sx={{ flex: 1, alignItems: "center", display: "flex" }}
          >
            <FormControlLabel value="M" control={<Radio />} label="Macho" />
            <FormControlLabel value="F" control={<Radio />} label="Fêmea" />
          </RadioGroup>
        </Box>

        {/* 🔹 Pai */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Pai</InputLabel>
          <Select
            name="pai_id"
            value={form.pai_id || ""}
            onChange={handleChange}
          >
            <MenuItem value="">-- Selecione --</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              name="pai_nao_informado"
              checked={form.pai_nao_informado}
              onChange={handleChange}
            />
          }
          label="Não informado"
        />

        {/* 🔹 Mãe */}
        <FormControl fullWidth margin="normal">
          <InputLabel>Mãe</InputLabel>
          <Select
            name="mae_id"
            value={form.mae_id || ""}
            onChange={handleChange}
          >
            <MenuItem value="">-- Selecione --</MenuItem>
          </Select>
        </FormControl>
        <FormControlLabel
          control={
            <Checkbox
              name="mae_nao_informado"
              checked={form.mae_nao_informado}
              onChange={handleChange}
            />
          }
          label="Não informado"
        />

        {/* 🔹 Criação própria */}
        <FormControlLabel
          control={
            <Checkbox
              name="criacao_propria"
              checked={form.criacao_propria}
              onChange={handleChange}
            />
          }
          label="Criação própria"
        />

        {!form.criacao_propria && (
          <>
            <TextField
              type="date"
              label="Data de recebimento"
              name="data_recebimento"
              value={form.data_recebimento || ""}
              onChange={handleChange}
              required
              fullWidth
              margin="normal"
              InputLabelProps={{ shrink: true }}
            />
            <FormControl fullWidth margin="normal">
              <InputLabel>Origem</InputLabel>
              <Select
                name="origem_id"
                value={form.origem_id || ""}
                onChange={handleChange}
                required
              >
                <MenuItem value="">-- Selecione --</MenuItem>
              </Select>
            </FormControl>
          </>
        )}

        {/* 🔹 Transferência */}
        <TextField
          type="date"
          label="Data de transferência"
          name="data_transferencia"
          value={form.data_transferencia || ""}
          onChange={handleChange}
          fullWidth
          margin="normal"
          InputLabelProps={{ shrink: true }}
        />
        <FormControl fullWidth margin="normal">
          <InputLabel>Destino</InputLabel>
          <Select
            name="destino_id"
            value={form.destino_id || ""}
            onChange={handleChange}
          >
            <MenuItem value="">-- Selecione --</MenuItem>
          </Select>
        </FormControl>

        {/* 🔹 Status */}
        <FormControlLabel
          control={
            <Checkbox
              name="incompleto"
              checked={form.incompleto}
              onChange={handleChange}
            />
          }
          label="Incompleto"
        />

        {/* 🔹 Botões */}
        <Box mt={2}>
          <Button type="submit" variant="contained" color="primary" sx={{ mr: 2 }}>
            Salvar
          </Button>
          <Button type="button" variant="outlined" color="secondary">
            Cancelar
          </Button>
        </Box>
      </form>
    </div>
  );
}
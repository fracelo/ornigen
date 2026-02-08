"use client";

import { useState, useEffect } from "react";
import { supabase } from "../../../lib/supabaseClient";
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
import { useEmpresa } from "../../../context/empresaContext"; // 🔹 importa o contexto
import { useAuth } from "../../../context/authContext"; // 🔹 para pegar o usuário logado


export default function PassarosPage() {
  const { empresaId } = useEmpresa(); // 🔹 pega o UUID da empresa logada
    const { usuarioId } = useAuth(); // 🔹 agora temos o UUID do usuário logado


  const [form, setForm] = useState({
    nome: "",
    anilha: "",
    data_nascimento: "",
    especie_id: "",
    especie_nome: "",
    sexo: "M",
    pai_id: null,
    mae_id: null,
    pai_nao_informado: false,
    mae_nao_informado: false,
    criacao_propria: true,
    data_recebimento: null,
    origem_id: "" as string | null,
    origem_nome: "",
  });

  const [especies, setEspecies] = useState<{ id: number; nome_portugues: string }[]>([]);
  const [criadouros, setCriadouros] = useState<{ id: number; nome: string; proprio: boolean }[]>([]);

  // 🔹 Busca inicial de espécies
  useEffect(() => {
    const fetchEspecies = async () => {
      const { data, error } = await supabase.from("especies").select("id, nome_portugues");
      if (!error && data) setEspecies(data);
    };
    fetchEspecies();
  }, []);

  // 🔹 Busca inicial de criadouros filtrando pela empresa
  useEffect(() => {
    const fetchCriadouros = async () => {
      if (!empresaId) return;
      const { data, error } = await supabase
        .from("criadouros")
        .select("id, nome_fantasia, razao_social, e_proprio")
        .eq("empresa_uuid", empresaId);

      if (!error && data) {
        const lista = data.map((c) => ({
          id: c.id,
          nome: c.nome_fantasia || c.razao_social,
          proprio: c.e_proprio,
        }));
        setCriadouros(lista);
      }
    };
    fetchCriadouros();
  }, [empresaId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.from("passaros").insert([{
      nome: form.nome,
      anilha: form.anilha,
      especie_id: form.especie_id,
      sexo: form.sexo,
      pai_id: form.pai_nao_informado ? null : form.pai_id,
      mae_id: form.mae_nao_informado ? null : form.mae_id,
      pai_nao_informado: form.pai_nao_informado,
      mae_nao_informado: form.mae_nao_informado,
      criacao_propria: form.criacao_propria,
      data_nascimento: form.data_nascimento,
      data_recebimento: form.data_recebimento,
      origem_id: form.origem_id ? parseInt(form.origem_id, 10) : null,
      empresa_id: empresaId,   // 🔹 agora usa empresa_id
      usuario_id: usuarioId,   // 🔹 também precisa salvar o usuário logado

    }]);

    if (error) {
      alert("Erro ao salvar: " + error.message);
    } else {
      alert("Pássaro cadastrado com sucesso!");
    }
  };

  return (
    <Box sx={{ width: 900, height: 800, p: 4, boxShadow: 3, borderRadius: 2, backgroundColor: "white", overflowY: "auto", mx: "auto", mt: 4 }}>
      <h2>Inclusão de Pássaro</h2>
      <form onSubmit={handleSubmit}>
        {/* Nome, Anilha, Data de Nascimento */}
        <Box display="flex" gap={2}>
          <TextField label="Nome" name="nome" value={form.nome} onChange={handleChange} required fullWidth margin="normal" />
          <TextField label="Anilha" name="anilha" value={form.anilha} onChange={handleChange} required margin="normal" sx={{ width: "200px" }} />
          <TextField type="date" label="Data de nascimento" name="data_nascimento" value={form.data_nascimento} onChange={handleChange} required margin="normal" InputLabelProps={{ shrink: true }} sx={{ width: "250px" }} />
        </Box>

        {/* Espécie */}
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="ID Espécie"
            name="especie_id"
            value={form.especie_id}
            onChange={(e) => setForm({ ...form, especie_id: e.target.value })}
            onBlur={async () => {
              if (form.especie_id) {
                const { data } = await supabase.from("especies").select("id, nome_portugues").eq("id", form.especie_id).single();
                if (data) setForm((prev) => ({ ...prev, especie_nome: data.nome_portugues }));
              }
            }}
            margin="normal"
            sx={{ width: "120px" }}
          />

          <Autocomplete
            freeSolo
            options={especies.map((e) => e.nome_portugues)}
            value={form.especie_nome}
            onChange={(event, newValue) => {
              const especieSelecionada = especies.find((e) => e.nome_portugues === newValue);
              if (especieSelecionada) {
                setForm((prev) => ({
                  ...prev,
                  especie_id: especieSelecionada.id.toString(),
                  especie_nome: especieSelecionada.nome_portugues,
                }));
              } else {
                setForm((prev) => ({ ...prev, especie_nome: newValue || "" }));
              }
            }}
            onInputChange={async (event, newInputValue) => {
              setForm({ ...form, especie_nome: newInputValue });
              if (newInputValue.length >= 2) {
                const { data } = await supabase.from("especies").select("id, nome_portugues").ilike("nome_portugues", `%${newInputValue}%`);
                if (data) setEspecies(data);
              }
            }}
            renderInput={(params) => <TextField {...params} label="Espécie" placeholder="Digite ou selecione a espécie" margin="normal" fullWidth />}
            sx={{ flex: 2 }}
          />

          <RadioGroup row name="sexo" value={form.sexo} onChange={handleChange} sx={{ flex: 1 }}>
            <FormControlLabel value="M" control={<Radio />} label="Macho" />
            <FormControlLabel value="F" control={<Radio />} label="Fêmea" />
          </RadioGroup>
        </Box>

        {/* Pai */}
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Pai</InputLabel>
            <Select name="pai_id" value={form.pai_id || ""} onChange={handleChange}>
              <MenuItem value="">-- Selecione --</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Checkbox name="pai_nao_informado" checked={form.pai_nao_informado} onChange={handleChange} />} label="Não Informado" />
        </Box>

        {/* Mãe */}
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Mãe</InputLabel>
            <Select name="mae_id" value={form.mae_id || ""} onChange={handleChange}>
              <MenuItem value="">-- Selecione --</MenuItem>
            </Select>
          </FormControl>
          <FormControlLabel control={<Checkbox name="mae_nao_informado" checked={form.mae_nao_informado} onChange={handleChange} />} label="Não Informado" />
        </Box>

               {/* Origem */}
        <Box display="flex" gap={2} mt={2} alignItems="flex-start">
          <TextField
            label="Código Criadouro"
            name="origem_id"
            value={form.origem_id || ""}
            onChange={(e) => setForm({ ...form, origem_id: e.target.value })}
            onBlur={async () => {
              if (form.origem_id && empresaId) {
                const { data } = await supabase
                  .from("criadouros")
                  .select("id, nome_fantasia, razao_social, e_proprio")
                  .eq("id", form.origem_id)
                  .eq("empresa_uuid", empresaId) // 🔹 garante que seja da empresa logada
                  .single();
                if (data) {
                  setForm((prev) => ({
                    ...prev,
                    origem_id: data.id.toString(),
                    origem_nome: data.nome_fantasia || data.razao_social,
                    criacao_propria: data.e_proprio,
                  }));
                }
              }
            }}
            sx={{ width: "150px", mt: 2 }}
          />

          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Criadouro</InputLabel>
            <Select
              name="origem_id"
              value={form.origem_id || ""}
              onChange={(e) => {
                const origemSelecionada = e.target.value as string;
                const origemObj = criadouros.find((c) => c.id.toString() === origemSelecionada);
                setForm((prev) => ({
                  ...prev,
                  origem_id: origemSelecionada,
                  origem_nome: origemObj ? origemObj.nome : "",
                  criacao_propria: origemObj ? origemObj.proprio : false,
                }));
              }}
            >
              <MenuItem value="">-- Selecione --</MenuItem>
              {/* Primeiro os criadouros próprios */}
              {criadouros.filter((c) => c.proprio).map((c) => (
                <MenuItem key={c.id} value={c.id.toString()}>
                  {c.nome}
                </MenuItem>
              ))}
              {/* Separador */}
              {criadouros.some((c) => !c.proprio) && (
                <MenuItem disabled>──────────────</MenuItem>
              )}
              {/* Depois os demais criadouros */}
              {criadouros.filter((c) => !c.proprio).map((c) => (
                <MenuItem key={c.id} value={c.id.toString()}>
                  {c.nome}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>

        {/* Botões */}
        <Box mt={2}>
          <Button
            type="submit"
            variant="contained"
            color="primary"
            sx={{ mr: 2 }}
          >
            Salvar
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => {
              // 🔹 Aqui você pode redirecionar para a lista de pássaros
              // router.push("/inicial_page/passaros_lista");
            }}
          >
            Cancelar
          </Button>
        </Box>
      </form>
    </Box>
  );
}
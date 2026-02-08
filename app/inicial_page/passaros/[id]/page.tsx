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
import { useEmpresa } from "../../../context/empresaContext";
import { useAuth } from "../../../context/authContext";
import { useRouter } from "next/navigation";

export default function EditarPassaroPage({ params }: { params: { id: string } }) {
  const { empresaId } = useEmpresa();
  const { usuarioId } = useAuth();
  const router = useRouter();

  const [form, setForm] = useState<any>({
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

  // 🔹 Carrega dados do pássaro pelo ID
  useEffect(() => {
    const fetchPassaro = async () => {
      if (!empresaId) return;
      const { data, error } = await supabase
        .from("passaros")
        .select("*")
        .eq("id", params.id)
        .eq("empresa_id", empresaId)
        .single();

      if (!error && data) {
        setForm({
          ...form,
          ...data,
          especie_id: data.especie_id?.toString() || "",
          origem_id: data.origem_id?.toString() || "",
        });
      }
    };
    fetchPassaro();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [params.id, empresaId]);

  // 🔹 Busca espécies
  useEffect(() => {
    const fetchEspecies = async () => {
      const { data } = await supabase.from("especies").select("id, nome_portugues");
      if (data) setEspecies(data);
    };
    fetchEspecies();
  }, []);

  // 🔹 Busca criadouros
  useEffect(() => {
    const fetchCriadouros = async () => {
      if (!empresaId) return;
      const { data } = await supabase
        .from("criadouros")
        .select("id, nome_fantasia, razao_social, e_proprio")
        .eq("empresa_uuid", empresaId);

      if (data) {
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

  // 🔹 Atualiza registro
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase
      .from("passaros")
      .update({
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
        empresa_id: empresaId,
        usuario_id: usuarioId,
      })
      .eq("id", params.id)
      .eq("empresa_id", empresaId);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert("Pássaro atualizado com sucesso!");
      router.push("/inicial_page/passaros");
    }
  };

  return (
    <Box sx={{ width: 900, height: 800, p: 4, boxShadow: 3, borderRadius: 2, backgroundColor: "white", overflowY: "auto", mx: "auto", mt: 4 }}>
      <h2>Edição de Pássaro</h2>
      <form onSubmit={handleSubmit}>
        {/* Nome, Anilha, Data de Nascimento */}
        <Box display="flex" gap={2}>
          <TextField label="Nome" name="nome" value={form.nome} onChange={handleChange} required fullWidth margin="normal" />
          <TextField label="Anilha" name="anilha" value={form.anilha} onChange={handleChange} required margin="normal" sx={{ width: "200px" }} />
          <TextField type="date" label="Data de nascimento" name="data_nascimento" value={form.data_nascimento || ""} onChange={handleChange} required margin="normal" InputLabelProps={{ shrink: true }} sx={{ width: "250px" }} />
        </Box>

        {/* Espécie */}
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="ID Espécie"
            name="especie_id"
            value={form.especie_id}
            onChange={(e) => setForm({ ...form, especie_id: e.target.value })}
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
                setForm((prev: any) => ({
                  ...prev,
                  especie_id: especieSelecionada.id.toString(),
                  especie_nome: especieSelecionada.nome_portugues,
                }));
              } else {
                setForm((prev: any) => ({ ...prev, especie_nome: newValue || "" }));
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
                  .eq("empresa_uuid", empresaId)
                  .single();
                if (data) {
                  setForm((prev: any) => ({
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
                setForm((prev: any) => ({
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
            Atualizar
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={() => router.push("/inicial_page/passaros")}
          >
            Cancelar
          </Button>
        </Box>
      </form>
    </Box>
  );
}
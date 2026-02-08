"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
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

export default function EditarPassaroPage() {
  const params = useParams();
  const id = params?.id as string; // 🔹 obtém o id corretamente

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
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);

  // 🔹 Carrega dados do pássaro pelo ID
  useEffect(() => {
    if (!empresaId || !id) return;

    const fetchPassaro = async () => {
      const { data, error } = await supabase
        .from("passaros")
        .select("*")
        .eq("id", id)
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
  }, [id, empresaId]);

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

  // 🔹 Busca pais e mães
  useEffect(() => {
    const fetchPaisEMaes = async () => {
      if (!empresaId || !id) return;

      const { data: dataPais } = await supabase
        .from("passaros")
        .select("id, nome, anilha")
        .eq("empresa_id", empresaId)
        .eq("sexo", "M")
        .neq("id", id);

      if (dataPais) setPais(dataPais);

      const { data: dataMaes } = await supabase
        .from("passaros")
        .select("id, nome, anilha")
        .eq("empresa_id", empresaId)
        .eq("sexo", "F")
        .neq("id", id);

      if (dataMaes) setMaes(dataMaes);
    };

    fetchPaisEMaes();
  }, [empresaId, id]);

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
      .eq("id", id)
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

        {/* Espécie + Sexo */}
        <Box display="flex" gap={2} mt={2}>
          <Autocomplete
            options={especies.map((e) => ({ id: e.id, label: e.nome_portugues }))}
            getOptionLabel={(option) => option.label}
            value={
              especies.find((e) => e.id.toString() === form.especie_id)
                ? { id: parseInt(form.especie_id), label: especies.find((e) => e.id.toString() === form.especie_id)?.nome_portugues || "" }
                : null
            }
            onChange={(event, newValue) => {
              if (newValue) {
                setForm((prev: any) => ({
                  ...prev,
                  especie_id: newValue.id.toString(),
                  especie_nome: newValue.label,
                }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Espécie" placeholder="Selecione a espécie" margin="normal" fullWidth />
            )}
            sx={{ flex: 2 }}
          />

          <RadioGroup row name="sexo" value={form.sexo} onChange={handleChange} sx={{ width: "200px" }}>
            <FormControlLabel value="M" control={<Radio />} label="Macho" />
            <FormControlLabel value="F" control={<Radio />} label="Fêmea" />
          </RadioGroup>
        </Box>

                {/* Pai */}
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Pai</InputLabel>
            <Select
              name="pai_id"
              value={form.pai_id || ""}
              onChange={handleChange}
            >
              <MenuItem value="">-- Selecione --</MenuItem>
              {pais.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nome} ({p.anilha})
                </MenuItem>
              ))}
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
            label="Não Informado"
          />
        </Box>

        {/* Mãe */}
        <Box display="flex" alignItems="center" gap={2} mt={2}>
          <FormControl fullWidth>
            <InputLabel>Mãe</InputLabel>
            <Select
              name="mae_id"
              value={form.mae_id || ""}
              onChange={handleChange}
            >
              <MenuItem value="">-- Selecione --</MenuItem>
              {maes.map((m) => (
                <MenuItem key={m.id} value={m.id}>
                  {m.nome} ({m.anilha})
                </MenuItem>
              ))}
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
            label="Não Informado"
          />
        </Box>

        {/* Origem */}
        <Box display="flex" gap={2} mt={2} alignItems="flex-start">
          <FormControl fullWidth sx={{ mt: 2 }}>
            <InputLabel>Criadouro</InputLabel>
            <Select
              name="origem_id"
              value={form.origem_id || ""}
              onChange={(e) => {
                const origemSelecionada = e.target.value as string;
                const origemObj = criadouros.find(
                  (c) => c.id.toString() === origemSelecionada
                );
                setForm((prev: any) => ({
                  ...prev,
                  origem_id: origemSelecionada,
                  origem_nome: origemObj ? origemObj.nome : "",
                  criacao_propria: origemObj ? origemObj.proprio : false,
                }));
              }}
            >
              <MenuItem value="">-- Selecione --</MenuItem>
              {criadouros.map((c) => (
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
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
import { useEmpresa } from "../../../context/empresaContext";
import { useAuth } from "../../../context/authContext";
import {
  Box,
  TextField,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Checkbox,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

export default function NovoPassaroPage() {
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
      if (!empresaId) return;

      const { data: dataPais } = await supabase
        .from("passaros")
        .select("id, nome, anilha")
        .eq("empresa_id", empresaId)
        .eq("sexo", "M");

      if (dataPais) setPais(dataPais);

      const { data: dataMaes } = await supabase
        .from("passaros")
        .select("id, nome, anilha")
        .eq("empresa_id", empresaId)
        .eq("sexo", "F");

      if (dataMaes) setMaes(dataMaes);
    };

    fetchPaisEMaes();
  }, [empresaId]);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  // 🔹 Salvar registro
  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase.from("passaros").insert([
      {
        nome: form.nome,
        anilha: form.anilha,
        especie_id: form.especie_id ? parseInt(form.especie_id, 10) : null,
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
      },
    ]);

    if (error) {
      alert("Erro ao cadastrar: " + error.message);
    } else {
      alert("Pássaro cadastrado com sucesso!");
      // 🔹 Limpa o formulário para novo cadastro
      setForm({
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
    }
  };

  const handleCancel = () => {
    router.push("/inicial_page/passaros"); // 🔹 volta para lista
  };

  return (
    <Box sx={{ width: 900, p: 4, mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}>
      <h2>Novo Pássaro</h2>
      <form onSubmit={handleSubmit}>
        {/* Nome, Anilha, Data de Nascimento */}
        <Box display="flex" gap={2}>
          <TextField label="Nome" name="nome" value={form.nome} onChange={handleChange} required fullWidth margin="normal" />
          <TextField label="Anilha" name="anilha" value={form.anilha} onChange={handleChange} required margin="normal" sx={{ width: "200px" }} />
          <TextField type="date" label="Data de nascimento" name="data_nascimento" value={form.data_nascimento || ""} onChange={handleChange} required margin="normal" InputLabelProps={{ shrink: true }} sx={{ width: "250px" }} />
        </Box>

        {/* Espécie + Sexo */}
<Box display="flex" gap={2} mt={2}>
  {/* Código da Espécie */}
  <TextField
    label="Código da Espécie"
    name="especie_id"
    value={form.especie_id || ""}
    onChange={handleChange}
    onBlur={() => {
      // 🔹 Ao sair do campo, sincroniza combo
      const especieObj = especies.find(
        (e) => e.id.toString() === form.especie_id
      );
      if (especieObj) {
        setForm((prev: any) => ({
          ...prev,
          especie_nome: especieObj.nome_portugues,
        }));
      } else {
        setForm((prev: any) => ({
          ...prev,
          especie_nome: "",
        }));
      }
    }}
    sx={{ width: "200px" }}
  />

        {/* Combo de Espécies */}
        <Autocomplete
            options={especies.map((e) => ({
            id: e.id,
            label: `${e.id} - ${e.nome_portugues}`, // 🔹 mostra código + nome
            }))}
            getOptionLabel={(option) => option.label}
            value={
            especies.find((e) => e.id.toString() === form.especie_id)
                ? {
                    id: parseInt(form.especie_id),
                    label: `${form.especie_id} - ${form.especie_nome}`,
                }
                : null
            }
            onChange={(event, newValue) => {
            if (newValue) {
                setForm((prev: any) => ({
                ...prev,
                especie_id: newValue.id.toString(),
                especie_nome: newValue.label.split(" - ")[1], // pega só o nome
                }));
            }
            }}
            renderInput={(params) => (
            <TextField
                {...params}
                label="Espécie"
                placeholder="Digite para buscar"
                margin="normal"
                fullWidth
            />
            )}
            sx={{ flex: 2 }}
        />

        {/* Sexo */}
        <RadioGroup
            row
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            sx={{ width: "200px" }}
        >
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
              {pais.map((p) => (
                <MenuItem key={p.id} value={p.id}>
                  {p.nome} ({p.anilha})
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <FormControlLabel
            control={<Checkbox name="pai_nao_informado" checked={form.pai_nao_informado} onChange={handleChange} />}
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
        <Box mt={3} display="flex" gap={2}>
          <Button type="submit" variant="contained" color="primary">
            Salvar
          </Button>
          <Button
            type="button"
            variant="outlined"
            color="secondary"
            onClick={handleCancel}
          >
            Cancelar
          </Button>
        </Box>
      </form>
    </Box>
  );
}
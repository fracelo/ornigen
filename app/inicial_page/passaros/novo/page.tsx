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
  Typography,
} from "@mui/material";
import Autocomplete from "@mui/material/Autocomplete";

// 🔹 Importa o crachá
import CrachaPassaro from "../../../components/CrachaPassaro";

const normalizeText = (text: string) =>
  text
    ? text
        .normalize("NFD")
        .replace(/[\u0300-\u036f]/g, "")
        .replace(/[-\s]/g, "")
        .toLowerCase()
    : "";

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
      let todasEspecies: any[] = [];
      let from = 0;
      let to = 999;

      while (true) {
        const { data, error } = await supabase
          .from("especies")
          .select("id, nome_portugues")
          .range(from, to);

        if (error) {
          console.error("Erro ao buscar espécies:", error);
          break;
        }

        if (!data || data.length === 0) break;

        todasEspecies = [...todasEspecies, ...data];

        if (data.length < 1000) break;
        from += 1000;
        to += 1000;
      }

      const ordenadas = todasEspecies.sort((a, b) =>
        a.nome_portugues.localeCompare(b.nome_portugues, "pt", { sensitivity: "base" })
      );
      setEspecies(ordenadas);
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
      router.push("/inicial_page/passaros");
    }
  };

  const handleCancel = () => {
    router.push("/inicial_page/passaros");
  };

  return (
    <Box display="flex" gap={4} sx={{ minHeight: "100vh" }}>
      {/* Coluna esquerda: formulário */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Box sx={{ width: 900, p: 4, boxShadow: 3, borderRadius: 2 }}>
          <Typography
            variant="h4"
            sx={{ color: "darkblue", fontWeight: "bold", textAlign: "center", mb: 3 }}
          >
            Novo Pássaro
          </Typography>

          <form onSubmit={handleSubmit}>
        {/* Nome, Anilha, Data de Nascimento na mesma linha */}
        <Box display="flex" gap={2} mt={2}>
          <TextField
            label="Nome"
            name="nome"
            value={form.nome}
            onChange={handleChange}
            required
            fullWidth
          />
          <TextField
            label="Anilha"
            name="anilha"
            value={form.anilha}
            onChange={handleChange}
            required
            sx={{ width: "200px" }}
          />
          <TextField
            type="date"
            label="Data de nascimento"
            name="data_nascimento"
            value={form.data_nascimento || ""}
            onChange={handleChange}
            required
            InputLabelProps={{ shrink: true }}
            sx={{ width: "250px" }}
          />
        </Box>

                {/* Espécie + Sexo */}
        <Box display="flex" gap={2} mt={2} alignItems="center">
          <TextField
            label="Código da Espécie"
            name="especie_id"
            value={form.especie_id || ""}
            onChange={handleChange}
            onBlur={() => {
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
            sx={{ width: "150px" }}
          />

          <Autocomplete
            options={especies.map((e) => ({ id: e.id, label: e.nome_portugues }))}
            getOptionLabel={(option) => option.label}
            filterOptions={(options, state) => {
              const input = normalizeText(state.inputValue);
              const filtradas = options.filter((opt) =>
                normalizeText(opt.label).includes(input)
              );
              return filtradas;
            }}
            value={
              form.especie_id
                ? {
                    id: parseInt(form.especie_id),
                    label: form.especie_nome,
                  }
                : null
            }
            onChange={(event, newValue) => {
              if (newValue) {
                setForm((prev: any) => ({
                  ...prev,
                  especie_id: newValue.id.toString(),
                  especie_nome: newValue.label,
                }));
              } else {
                setForm((prev: any) => ({
                  ...prev,
                  especie_id: "",
                  especie_nome: "",
                }));
              }
            }}
            renderInput={(params) => (
              <TextField {...params} label="Espécie" placeholder="Digite para buscar" />
            )}
            sx={{ flex: 1 }}
          />

          {/* Sexo */}
          <RadioGroup
            row
            name="sexo"
            value={form.sexo}
            onChange={handleChange}
            sx={{ width: "200px", justifyContent: "center" }}
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
            <Select name="mae_id" value={form.mae_id || ""} onChange={handleChange}>
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
      </Box>

      {/* Coluna direita: crachá */}
      <Box
        sx={{
          flex: 1,
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "center",
        }}
      >
        <Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
          <Typography
            variant="h5"
            sx={{ color: "darkblue", fontWeight: "bold", textAlign: "center", mb: 3 }}
          >
            Pré-visualização do Crachá
          </Typography>

          <CrachaPassaro form={form} />
        </Box>
      </Box>
    </Box>
  );
}
"use client";

import { useState, useEffect } from "react";
import { Typography } from "@mui/material";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "../../../lib/supabaseClient";
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
import CrachaPassaro from "../../../components/CrachaPassaro";

export default function EditarPassaroPage() {
  const router = useRouter();
  const params = useParams();
  const passaroId = params?.id;

  const [form, setForm] = useState<any>({
    nome: "",
    anilha: "",
    data_nascimento: "",
    especie_id: "",
    especie_nome: "",
    sexo: "M",
    pai_id: null,
    mae_id: null,
    pai_nome: "",
    mae_nome: "",
    pai_nao_informado: false,
    mae_nao_informado: false,
    criacao_propria: true,
    data_recebimento: null,
    origem_id: "" as string | null,
    origem_nome: "",
  });

  const [especies, setEspecies] = useState<{ id: number; nome_portugues: string }[]>([]);
  const [pais, setPais] = useState<any[]>([]);
  const [maes, setMaes] = useState<any[]>([]);
  const [criadouros, setCriadouros] = useState<{ id: number; nome: string; proprio: boolean }[]>([]);
  const [crachaConcluido, setCrachaConcluido] = useState(false);

  // 🔹 Busca espécies com paginação automática
  useEffect(() => {
    const fetchEspecies = async () => {
      let todasEspecies: any[] = [];
      let from = 0;
      let to = 999;

      while (true) {
        const { data, error } = await supabase
          .from("especies")
          .select("id, nome_portugues")
          .range(from, to)
          .order("nome_portugues", { ascending: true });

        if (error) {
          console.error("Erro ao buscar espécies:", error);
          break;
        }

        if (!data || data.length === 0) break;

        todasEspecies = [...todasEspecies, ...data];

        if (data.length < 1000) break; // chegou no fim
        from += 1000;
        to += 1000;
      }

      setEspecies(todasEspecies);
    };

    fetchEspecies();
  }, [form.especie_id]);

  // 🔹 Carregar dados do pássaro
  useEffect(() => {
    const fetchPassaro = async () => {
      if (!passaroId) return;
      const { data } = await supabase
        .from("passaros")
        .select("*")
        .eq("id", passaroId)
        .single();

      if (data) {
        setForm((prev: any) => ({
          ...prev,
          ...data,
          especie_id: data.especie_id?.toString() || "",
          especie_nome:
            especies.find((e) => e.id === data.especie_id)?.nome_portugues || "",
        }));
        setCrachaConcluido(true); // 🔹 marca crachá como pronto
      }
    };
    fetchPassaro();
  }, [passaroId, especies]);

  // 🔹 Carregar pais e mães
  useEffect(() => {
    const fetchPaisEMaes = async () => {
      if (!passaroId) return;
      const idAtual = parseInt(passaroId as string, 10);

      const { data: dataPais } = await supabase
        .from("passaros")
        .select("id, nome, anilha, sexo")
        .eq("sexo", "M")
        .neq("id", idAtual);

      setPais(dataPais || []);

      const { data: dataMaes } = await supabase
        .from("passaros")
        .select("id, nome, anilha, sexo")
        .eq("sexo", "F")
        .neq("id", idAtual);

      setMaes(dataMaes || []);
    };
    fetchPaisEMaes();
  }, [passaroId]);

  // 🔹 Carregar criadouros
  useEffect(() => {
    const fetchCriadouros = async () => {
      const { data } = await supabase
        .from("criadouros")
        .select("id, nome_fantasia, razao_social, e_proprio");
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
  }, []);

  const handleChange = (e: any) => {
    const { name, value, type, checked } = e.target;
    setForm({ ...form, [name]: type === "checkbox" ? checked : value });
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const { error } = await supabase
      .from("passaros")
      .update({
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
      })
      .eq("id", passaroId);

    if (error) {
      alert("Erro ao atualizar: " + error.message);
    } else {
      alert("Pássaro atualizado com sucesso!");
      router.push("/inicial_page/passaros");
    }
  };

  return (
    <Box display="flex" gap={2} sx={{ minHeight: "100vh" }}>
      {/* Coluna esquerda: formulário */}
      <Box sx={{ width: 900, p: 4, mx: "auto", mt: 4, boxShadow: 3, borderRadius: 2 }}>
        <h2>Editar Pássaro</h2>
        <form onSubmit={handleSubmit}>
          {/* Nome, Anilha, Data de Nascimento */}
          <Box display="flex" gap={2} mt={2}>
            <TextField label="Nome" name="nome" value={form.nome} onChange={handleChange} required fullWidth />
            <TextField label="Anilha" name="anilha" value={form.anilha} onChange={handleChange} required sx={{ width: "200px" }} />
            <TextField type="date" label="Data de nascimento" name="data_nascimento" value={form.data_nascimento || ""} onChange={handleChange} required InputLabelProps={{ shrink: true }} sx={{ width: "250px" }} />
          </Box>

          {/* Espécie + Sexo */}
          <Box display="flex" gap={2} mt={2} alignItems="center">
            {/* Código da Espécie */}
            <TextField
              label="Código da Espécie"
              name="especie_id"
              value={form.especie_id || ""}
              onChange={(e) => {
                const id = e.target.value;
                const especieObj = especies.find((esp) => esp.id.toString() === id);
                setForm((prev: any) => ({
                  ...prev,
                  especie_id: id,
                  especie_nome: especieObj ? especieObj.nome_portugues : "",
                }));
              }}
              sx={{ width: "150px" }}
            />

            {/* Combo de Espécie */}
            <Autocomplete
              options={especies.map((e) => ({ id: e.id, label: e.nome_portugues }))}
              getOptionLabel={(option) => option.label}
              value={
                form.especie_id
                  ? {
                      id: parseInt(form.especie_id),
                      label:
                        especies.find((e) => e.id === parseInt(form.especie_id))?.nome_portugues || "",
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
              renderInput={(params) => <TextField {...params} label="Espécie" />}
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
              <Select
                name="pai_id"
                value={form.pai_id || ""}
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const paiObj = pais.find((p) => p.id === id);
                  setForm((prev: any) => ({
                    ...prev,
                    pai_id: id,
                    pai_nome: paiObj ? paiObj.nome : "",
                  }));
                }}
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
                onChange={(e) => {
                  const id = parseInt(e.target.value, 10);
                  const maeObj = maes.find((m) => m.id === id);
                  setForm((prev: any) => ({
                    ...prev,
                    mae_id: id,
                    mae_nome: maeObj ? maeObj.nome : "",
                  }));
                }}
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

      {/* Coluna direita: crachá */}
      <CrachaPassaro form={form} />
    </Box>
  );
}

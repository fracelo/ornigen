"use client";

import { useState, useEffect } from "react";
import { Box, Typography } from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function getAscendentes(passaroId: number, nivel: number = 4): Promise<any> {
  if (!passaroId || nivel === 0) return null;
  const { data } = await supabase
    .from("passaros")
    .select("id, nome, anilha, pai_id, mae_id, data_nascimento")
    .eq("id", passaroId)
    .single();
  if (!data) return null;
  return {
    id: data.id,
    nome: data.nome,
    anilha: data.anilha,
    data_nascimento: data.data_nascimento,
    pai: await getAscendentes(data.pai_id, nivel - 1),
    mae: await getAscendentes(data.mae_id, nivel - 1),
  };
}

function renderColumn(nodes: any[], expectedCount: number) {
  const filled = [...nodes];
  while (filled.length < expectedCount) filled.push(null);
  return (
    <Box
      sx={{
        flex: 1,
        display: "flex",
        flexDirection: "column",
        justifyContent: "space-around",
        alignItems: "flex-start",
        fontFamily: "Arial, Helvetica, sans-serif",
        fontSize: "0.55rem", // 🔹 fonte ainda menor
        pl: 0.5,
      }}
    >
      {filled.map((n, idx) => (
        <Box key={idx} sx={{ minHeight: "1.1em" }}>
          {n?.nome || ""}
        </Box>
      ))}
    </Box>
  );
}

export default function CrachaPassaro({ form }: { form: any }) {
  const [ascendentes, setAscendentes] = useState<any>(null);

  useEffect(() => {
    const atualizarArvore = async () => {
      const asc = {
        pai: form.pai_id ? await getAscendentes(form.pai_id) : null,
        mae: form.mae_id ? await getAscendentes(form.mae_id) : null,
      };
      setAscendentes(asc);
    };
    atualizarArvore();
  }, [form.pai_id, form.mae_id]);

  const col1: any[] = [ascendentes?.pai, ascendentes?.mae];
  const col2: any[] = [];
  col1.forEach((n) => n ? col2.push(n.pai || null, n.mae || null) : col2.push(null, null));
  const col3: any[] = [];
  col2.forEach((n) => n ? col3.push(n.pai || null, n.mae || null) : col3.push(null, null));
  const col4: any[] = [];
  col3.forEach((n) => n ? col4.push(n.pai || null, n.mae || null) : col4.push(null, null));

  return (
    <Box
      sx={{
        width: "10cm",
        height: "6cm",
        display: "flex",
        border: "1px solid #000",
        borderRadius: "12px", // cantos arredondados
        mx: "auto",
      }}
    >
      <Box sx={{ display: "flex", width: "100%", height: "100%" }}>
        {/* Lado esquerdo: fundo azul */}
        <Box
          sx={{
            width: "3cm", // 🔹 reduzido
            height: "100%",
            backgroundColor: "darkblue",
            color: "white",
            display: "flex",
            flexDirection: "column",
            alignItems: "flex-start",
            fontFamily: "Arial, Helvetica, sans-serif",
            p: 0.8, // 🔹 menos espaçamento
          }}
        >
          {/* Logo */}
          <Box
            sx={{
              width: "2cm",
              height: "2cm",
              backgroundColor: "white",
              mt: "1mm", // 1mm abaixo da linha superior
              mb: 0.8,
              alignSelf: "center",
              borderRadius: "4px",
            }}
          />

          {/* Dados principais */}
          <Typography sx={{ fontSize: "0.65rem" }}>Nome:</Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.67rem", mb: 0.4 }}>
            {form.nome}
          </Typography>

          <Typography sx={{ fontSize: "0.65rem" }}>Anilha:</Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.67rem", mb: 0.4 }}>
            {form.anilha}
          </Typography>

          <Typography sx={{ fontSize: "0.65rem" }}>Nascimento:</Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.67rem", mb: 0.4 }}>
            {formatDate(form.data_nascimento)}
          </Typography>

          <Typography sx={{ fontSize: "0.65rem" }}>Espécie:</Typography>
          <Typography sx={{ fontWeight: "bold", fontSize: "0.67rem", mb: 0.4 }}>
            {form.especie_nome || "-"}
          </Typography>
        </Box>

        {/* Lado direito: genealogia */}
        <Box sx={{ width: "7cm", display: "flex", flexDirection: "row" }}>
          {renderColumn(col1, 2)}   {/* Pai e Mãe */}
          {renderColumn(col2, 4)}   {/* Avós */}
          {renderColumn(col3, 8)}   {/* Bisavós */}
          {renderColumn(col4, 16)}  {/* Trisavós */}
        </Box>
      </Box>
    </Box>
  );
}
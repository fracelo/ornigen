"use client";

import { useState, useEffect } from "react";
import { Box, Typography, Avatar, Divider } from "@mui/material";
import { supabase } from "@/lib/supabaseClient";

function formatDate(dateStr: string | null) {
  if (!dateStr) return "---";
  const d = new Date(dateStr);
  return `${String(d.getDate()).padStart(2, "0")}/${String(d.getMonth() + 1).padStart(2, "0")}/${d.getFullYear()}`;
}

async function getAscendentes(passaroId: number, nivel: number = 4): Promise<any> {
  if (!passaroId || nivel === 0) return null;
  const { data } = await supabase
    .from("passaros")
    .select("id, nome, anilha, pai_id, mae_id")
    .eq("id", passaroId)
    .single();
  if (!data) return null;
  return {
    nome: data.nome,
    anilha: data.anilha,
    pai: await getAscendentes(data.pai_id, nivel - 1),
    mae: await getAscendentes(data.mae_id, nivel - 1),
  };
}

function renderColumn(nodes: any[], expectedCount: number) {
  const filled = [...nodes];
  while (filled.length < expectedCount) filled.push(null);
  
  return (
    <Box sx={{
      flex: 1,
      display: "flex",
      flexDirection: "column",
      justifyContent: "space-around",
    }}>
      {filled.map((n, idx) => (
        <Box key={idx} sx={{ 
          height: `${100 / expectedCount}%`,
          display: 'flex',
          alignItems: 'center',
          pl: 0.5,
          borderLeft: "1px solid #ddd",
          borderBottom: idx % 2 !== 0 ? "none" : "1px solid #eee",
          position: 'relative'
        }}>
          <Typography sx={{ 
            fontSize: expectedCount > 8 ? "0.33rem" : expectedCount > 4 ? "0.38rem" : "0.45rem", 
            fontWeight: "bold",
            color: "#333",
            lineHeight: 0.9,
            whiteSpace: "nowrap",
            overflow: 'hidden',
            fontFamily: "Arial Narrow, sans-serif"
          }}>
            {n?.nome || "---"}
          </Typography>
        </Box>
      ))}
    </Box>
  );
}

export default function CrachaPassaro({ form }: { form: any }) {
  const [ascendentes, setAscendentes] = useState<any>(null);
  const [logoUrl, setLogoUrl] = useState<string | null>(null);

  useEffect(() => {
    const carregarDadosCracha = async () => {
      const asc = {
        pai: form.pai_id ? await getAscendentes(form.pai_id) : null,
        mae: form.mae_id ? await getAscendentes(form.mae_id) : null,
      };
      setAscendentes(asc);

      if (form.empresa_id) {
        const { data: empresa } = await supabase
          .from("empresas")
          .select("logo_url")
          .eq("id", form.empresa_id)
          .single();
        if (empresa?.logo_url) setLogoUrl(empresa.logo_url);
      }
    };
    carregarDadosCracha();
  }, [form.pai_id, form.mae_id, form.empresa_id]);

  const col1 = [ascendentes?.pai, ascendentes?.mae];
  const col2: any[] = [];
  col1.forEach(n => n ? col2.push(n.pai || null, n.mae || null) : col2.push(null, null));
  const col3: any[] = [];
  col2.forEach(n => n ? col3.push(n.pai || null, n.mae || null) : col3.push(null, null));
  const col4: any[] = [];
  col3.forEach(n => n ? col4.push(n.pai || null, n.mae || null) : col4.push(null, null));

  return (
    <Box sx={{
      width: "10cm",
      height: "6.2cm",
      display: "flex",
      bgcolor: "white",
      border: "2px solid #000", // Borda preta nítida para corte
      borderRadius: "2px",
      mx: "auto",
      overflow: "hidden"
    }}>
      {/* LADO ESQUERDO: INFOS TÉCNICAS */}
      <Box sx={{
        width: "3.2cm",
        background: "#001f3f",
        color: "white",
        p: 1,
        display: "flex",
        flexDirection: "column",
      }}>
        
        {/* ESPAÇO 2x2 PARA LOGO DO LABORATÓRIO / CRIADOURO */}
        <Box sx={{ 
          width: "2cm", 
          height: "2cm", 
          bgcolor: "white", 
          borderRadius: "2px",
          alignSelf: 'center',
          mb: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'hidden'
        }}>
          {logoUrl ? (
            <img src={logoUrl} style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          ) : (
            <Typography sx={{ color: '#ccc', fontSize: '0.4rem', textAlign: 'center' }}>LOGO<br/>2x2</Typography>
          )}
        </Box>

        <Box sx={{ flexGrow: 1 }}>
          <Typography sx={{ fontSize: "0.4rem", opacity: 0.7, textTransform: 'uppercase' }}>Pássaro:</Typography>
          <Typography sx={{ fontWeight: "900", fontSize: "0.65rem", color: "#ffd700", lineHeight: 1, mb: 0.5 }}>
            {form.nome || "NOME"}
          </Typography>

          <Typography sx={{ fontSize: "0.38rem", fontStyle: 'italic', color: '#bbb', lineHeight: 1, mb: 1 }}>
            {form.descricao || "---"}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.4 }}>
            <Box>
              <Typography sx={{ fontSize: "0.38rem", opacity: 0.7 }}>Anilha / Sexo:</Typography>
              <Typography sx={{ fontWeight: "bold", fontSize: "0.55rem" }}>
                {form.anilha || "---"} • {form.sexo === 'M' ? 'M ♂' : 'F ♀'}
              </Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.38rem", opacity: 0.7 }}>Nascimento:</Typography>
              <Typography sx={{ fontWeight: "bold", fontSize: "0.5rem" }}>{formatDate(form.data_nascimento)}</Typography>
            </Box>

            <Box>
              <Typography sx={{ fontSize: "0.38rem", opacity: 0.7 }}>Espécie:</Typography>
              <Typography sx={{ fontWeight: "bold", fontSize: "0.5rem" }}>{form.especie_nome || "---"}</Typography>
            </Box>
          </Box>
        </Box>
        
        <Box sx={{ textAlign: 'center', pt: 0.5 }}>
          <Typography sx={{ fontSize: "0.35rem", fontWeight: 'bold', letterSpacing: 1 }}>ORNIGEN</Typography>
        </Box>
      </Box>

      {/* LADO DIREITO: GENEALOGIA COM GRID DE CORTE */}
      <Box sx={{ 
        width: "6.8cm", 
        display: "flex", 
        bgcolor: "#fff",
        borderLeft: "1px solid #000"
      }}>
        {renderColumn(col1, 2)}
        {renderColumn(col2, 4)}
        {renderColumn(col3, 8)}
        {renderColumn(col4, 16)}
      </Box>
    </Box>
  );
}
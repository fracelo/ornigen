"use client";

import { useState, useEffect } from "react";
import { useSearchParams } from "next/navigation";
import { createClient } from "@supabase/supabase-js";
import { Box, Typography, CircularProgress } from "@mui/material";
import ListaCrachas from "../../../app/components/ListaCrachas";
import { Passaro } from "../../../app/lib/Passaro"; // tipagem centralizada

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function PageCrachas() {
  const [passaros, setPassaros] = useState<Passaro[]>([]);
  const [loading, setLoading] = useState(true);
  const searchParams = useSearchParams();

  const idsParam = searchParams.get("ids");
  const empresaId = searchParams.get("empresa");

  useEffect(() => {
    console.log("Parâmetros recebidos na página de crachás:");
    console.log("idsParam:", idsParam);
    console.log("empresaId:", empresaId);

    const fetchPassaros = async () => {
      if (!idsParam || !empresaId) {
        console.warn("Nenhum parâmetro recebido, não há pássaros para buscar.");
        setLoading(false);
        return;
      }

      setLoading(true);
      const ids = idsParam.split(",").map((id) => parseInt(id));
      console.log("IDs convertidos para array:", ids);

      const { data, error } = await supabase
        .from("passaros")
        .select(`
          id,
          nome,
          anilha,
          data_nascimento,
          especie_nome,
          pai_id,
          mae_id
        `)
        .eq("empresa_id", empresaId)
        .in("id", ids);

      if (error) {
        console.error("Erro Supabase:", error);
      } else {
        console.log("Dados retornados do Supabase:", data);
        setPassaros(data as Passaro[]);
      }

      setLoading(false);
    };
    fetchPassaros();
  }, [idsParam, empresaId]);

  return (
    <Box sx={{ p: 2 }}>
      <Typography
        variant="h5"
        sx={{
          mb: 2,
          textAlign: "center",
          fontWeight: "bold",
          color: "#0D47A1",
        }}
      >
        Crachás dos Pássaros
      </Typography>

      {loading ? (
        <Box sx={{ display: "flex", justifyContent: "center", mt: 4 }}>
          <CircularProgress />
          <Typography sx={{ ml: 2 }}>Gerando crachás...</Typography>
        </Box>
      ) : passaros.length === 0 ? (
        <Typography sx={{ textAlign: "center", mt: 4 }}>
          Nenhum pássaro encontrado.
        </Typography>
      ) : (
        <ListaCrachas passaros={passaros} />
      )}
    </Box>
  );
}
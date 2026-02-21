"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { CircularProgress, Box, Button } from "@mui/material";
import LaudoPedigree from "@/components/LaudoPedigree";
import PrintIcon from "@mui/icons-material/Print";

export default function PedigreePage() {
  const { id } = useParams();
  const { empresaId } = useEmpresa();
  const [dados, setDados] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const buscarArvore = useCallback(async () => {
    if (!id || !empresaId) return;
    try {
      const { data: resEmp } = await supabase.from("empresas").select("*").eq("id", empresaId).single();
      setEmpresa(resEmp);

      const { data: p } = await supabase.from("passaros").select(`*, especies_sispass:especie_id(nomes_comuns)`).eq("id", id).single();
      
      if (p) {
        // Busca Nomes de Pais e Avós em paralelo
        const ids = [p.pai_id, p.mae_id].filter(Boolean);
        const { data: pais } = await supabase.from("passaros").select("id, nome, pai_id, mae_id").in("id", ids);
        
        const idsAvos = pais?.flatMap(parent => [parent.pai_id, parent.mae_id]).filter(Boolean) || [];
        const { data: avos } = await supabase.from("passaros").select("id, nome").in("id", idsAvos);

        const mapa: any = {};
        [...(pais || []), ...(avos || [])].forEach(x => mapa[x.id] = x);

        setDados({
          ...p,
          pai_nome: mapa[p.pai_id]?.nome,
          mae_nome: mapa[p.mae_id]?.nome,
          avo_paterno_nome: mapa[mapa[p.pai_id]?.pai_id]?.nome,
          ava_paterna_nome: mapa[mapa[p.pai_id]?.mae_id]?.nome,
          avo_materno_nome: mapa[mapa[p.mae_id]?.pai_id]?.nome,
          ava_materna_nome: mapa[mapa[p.mae_id]?.mae_id]?.nome,
        });
      }
    } catch (err) { console.error(err); } finally { setLoading(false); }
  }, [id, empresaId]);

  useEffect(() => { buscarArvore(); }, [buscarArvore]);

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: '#525659', minHeight: '100vh', py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }} className="no-print">
        <Button variant="contained" startIcon={<PrintIcon />} onClick={() => window.print()}>Imprimir Pedigree</Button>
      </Box>
      <LaudoPedigree passaro={dados} empresa={empresa} />
      <style jsx global>{`
        @media print { .no-print { display: none !important; } body { background: white !important; } @page { size: A4; margin: 0; } }
      `}</style>
    </Box>
  );
}
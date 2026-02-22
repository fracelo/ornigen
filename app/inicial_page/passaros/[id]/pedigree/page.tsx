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

  const buscarArvoreCompleta = useCallback(async () => {
    if (!id || !empresaId) return;

    try {
      // Busca dados da empresa
      const { data: resEmp } = await supabase.from("empresas").select("*").eq("id", empresaId).single();
      setEmpresa(resEmp);

      // Busca Recursiva de 4 Gerações
      const { data: p, error } = await supabase
        .from("passaros")
        .select(`
          *,
          especies_sispass:especie_id(nomes_comuns),
          pai:pai_id (
            id, nome, anilha,
            pai:pai_id (id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha)),
            mae:mae_id (id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha))
          ),
          mae:mae_id (
            id, nome, anilha,
            pai:pai_id (id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha)),
            mae:mae_id (id, nome, anilha, pai:pai_id(id, nome, anilha), mae:mae_id(id, nome, anilha))
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setDados(p);
    } catch (err) {
      console.error("Erro ao carregar pedigree:", err);
    } finally {
      setLoading(false);
    }
  }, [id, empresaId]);

  useEffect(() => { buscarArvoreCompleta(); }, [buscarArvoreCompleta]);

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: '#525659', minHeight: '100vh', py: 4 }}>
      <Box sx={{ display: 'flex', justifyContent: 'center', mb: 2 }} className="no-print">
        <Button variant="contained" color="primary" startIcon={<PrintIcon />} onClick={() => window.print()}>
          Imprimir Documento
        </Button>
      </Box>

      <LaudoPedigree passaro={dados} empresa={empresa} />

      <style jsx global>{`
        @media print { 
          .no-print { display: none !important; } 
          body { background: white !important; margin: 0; } 
          @page { size: A4; margin: 0; } 
        }
      `}</style>
    </Box>
  );
}
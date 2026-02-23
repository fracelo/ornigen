"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import { useEmpresa } from "@/context/empresaContext";
import { CircularProgress, Box, Button } from "@mui/material";
import LaudoPedigree from "@/components/LaudoPedigree";
import PrintIcon from "@mui/icons-material/Print";
import CloseIcon from "@mui/icons-material/Close";

export default function PedigreePage() {
  const { id } = useParams();
  const router = useRouter();
  const { empresaId } = useEmpresa();
  const [dados, setDados] = useState<any>(null);
  const [empresa, setEmpresa] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  const buscarArvoreCompleta = useCallback(async () => {
    if (!id || !empresaId) return;

    try {
      const { data: resEmp } = await supabase.from("empresas").select("*").eq("id", empresaId).single();
      setEmpresa(resEmp);

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

  // Função de fechar garantida
  const handleFechar = () => {
    if (window.history.length > 1) {
      router.back();
    } else {
      router.push("/passaros"); // Rota de fallback caso não tenha histórico
    }
  };

  if (loading) return <Box textAlign="center" mt={10}><CircularProgress /></Box>;

  return (
    <Box sx={{ bgcolor: '#525659', minHeight: '100vh', pt: 1, pb: 4 }}>
      
      <Box 
        sx={{ 
          display: 'flex', 
          justifyContent: 'center', 
          mb: 1,
          gap: 2 
        }} 
        className="no-print"
      >
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PrintIcon />} 
          onClick={() => window.print()}
        >
          Imprimir Documento
        </Button>

        <Button 
          variant="contained" 
          type="button"
          startIcon={<CloseIcon />} 
          onClick={handleFechar}
          sx={{ 
            bgcolor: '#fff', 
            color: '#000', 
            '&:hover': { bgcolor: '#f5f5f5' },
            fontWeight: 'bold'
          }}
        >
          Fechar
        </Button>
      </Box>

      {/* Wrapper para centralizar o laudo */}
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
        <LaudoPedigree passaro={dados} empresa={empresa} />
      </Box>

      <style jsx global>{`
        @media print { 
          .no-print { display: none !important; } 
          
          html, body { 
            background: white !important; 
            margin: 0 !important; 
            padding: 0 !important;
            overflow: hidden !important; /* Trava o scroll para não gerar página 2 */
          } 

          @page { 
            size: A4; 
            margin: 0; 
          } 

          /* Remove qualquer margem ou padding extra de div pai */
          div { margin-bottom: 0 !important; padding-bottom: 0 !important; }
        }
      `}</style>
    </Box>
  );
}
"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import TabelaPlanos from "@/components/TabelaPlanos"; 

import { Box, Container, Typography, AppBar, Toolbar, Button, Stack, Paper } from "@mui/material";
import FlutterDashIcon from "@mui/icons-material/FlutterDash";
import { useRouter } from "next/navigation";

// --- 1. COMPONENTE DO CARROSSEL DINÂMICO (QUADRADO) ---
function CarrosselTelas() {
  // Nomes dos arquivos conforme você salvou no bucket 'telas'
  const nomesImagens = ["1.png", "2.png", "3.png", "4.png"]; 
  
  // URL Base Direta do seu projeto Supabase
  const urlBase = "https://aqviniyxfnctuuaysava.supabase.co/storage/v1/object/public/telas/";

  return (
    <Box sx={{ py: 10, bgcolor: "#f8faff", borderTop: '1px solid #eee' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 6 }}>
          Conheça o OrniGen por dentro
        </Typography>

        <Box sx={{ 
          display: 'flex', 
          overflowX: 'auto', 
          gap: 3,
          pb: 4,
          px: 2,
          scrollSnapType: 'x mandatory',
          // Estilização da barra de rolagem horizontal
          '&::-webkit-scrollbar': { height: '8px' },
          '&::-webkit-scrollbar-thumb': { bgcolor: '#ccc', borderRadius: '10px' }
        }}>
          {nomesImagens.map((nome, index) => (
            <Box key={index} sx={{ 
              minWidth: { xs: '280px', sm: '350px', md: '450px' },
              scrollSnapAlign: 'center'
            }}>
              <Paper elevation={4} sx={{ borderRadius: 4, overflow: 'hidden', bgcolor: 'white' }}>
                <Box 
                  component="img" 
                  src={`${urlBase}${nome}`} 
                  alt={`Funcionalidade ${nome}`}
                  sx={{ 
                    width: '100%', 
                    aspectRatio: '1/1', 
                    display: 'block',
                    objectFit: 'cover',
                    backgroundColor: '#eee' // Fundo cinza enquanto carrega
                  }}
                  // Fallback: Se a imagem falhar, mostra um placeholder amigável
                  onError={(e) => { 
                    e.target.src = "https://via.placeholder.com/500x500?text=OrniGen+Preview"; 
                  }}
                />
              </Paper>
            </Box>
          ))}
        </Box>
      </Container>
    </Box>
  );
}

// --- 2. PÁGINA PRINCIPAL (LANDING PAGE) ---
export default function LandingPage() {
  const router = useRouter();
  const [planos, setPlanos] = useState([]);

  useEffect(() => {
    async function carregarPlanos() {
      try {
        const { data } = await supabase
          .from("planos")
          .select("*")
          .order("valor_mensal", { ascending: true });
        if (data) setPlanos(data);
      } catch (error) {
        console.error("Erro ao carregar planos:", error);
      }
    }
    carregarPlanos();
  }, []);

  return (
    <Box sx={{ bgcolor: "#fdfdfd", minHeight: "100vh" }}>
      
      {/* Navbar Fixa */}
      <AppBar position="fixed" sx={{ bgcolor: "white", color: "text.primary", boxShadow: "0px 2px 10px rgba(0,0,0,0.05)" }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", px: "0 !important" }}>
            <Box 
              sx={{ display: 'flex', alignItems: 'center', gap: 1, cursor: 'pointer' }}
              onClick={() => router.push("/")}
            >
              <FlutterDashIcon sx={{ color: "primary.main", fontSize: 32 }} />
              <Typography variant="h5" sx={{ fontWeight: "800", color: "primary.main", letterSpacing: -1 }}>
                OrniGen
              </Typography>
            </Box>
            
            <Stack direction="row" spacing={1}>
              <Button onClick={() => router.push("/login")} sx={{ fontWeight: 'bold' }}>Entrar</Button>
              <Button 
                variant="contained" 
                onClick={() => router.push("/register")}
                sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}
              >
                Registrar
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero Section */}
      <Box sx={{ 
        pt: { xs: 15, md: 22 }, 
        pb: { xs: 10, md: 18 }, 
        textAlign: 'center', 
        background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)",
        color: "white",
        clipPath: "ellipse(150% 100% at 50% 0%)"
      }}>
        <Container maxWidth="md">
          <Typography variant="h2" sx={{ fontWeight: "900", mb: 2, fontSize: { xs: '2.5rem', md: '4.5rem' }, lineHeight: 1.1 }}>
            Voe Alto na Gestão do seu Criadouro
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 5, fontWeight: 300, maxWidth: "700px", mx: "auto" }}>
            Controle genético e comercial com a simplicidade que você sempre quis. Tecnologia de ponta para criadores de elite.
          </Typography>
          <Button 
            variant="contained" 
            color="secondary" 
            size="large"
            sx={{ px: 6, py: 2, fontWeight: 'bold', borderRadius: 3, fontSize: '1.2rem', textTransform: 'none' }}
            onClick={() => router.push("/register")}
          >
            Começar Agora Grátis
          </Button>
        </Container>
      </Box>

      {/* Seção de Planos */}
      <Container sx={{ py: 12 }}>
        <Box sx={{ textAlign: 'center', mb: 8 }}>
          <Typography variant="h3" sx={{ fontWeight: 'bold', mb: 2 }}>Planos e Assinaturas</Typography>
          <Typography variant="body1" color="text.secondary">
            Transparência para o seu crescimento.
          </Typography>
        </Box>
        
        <TabelaPlanos 
          planos={planos} 
          isPublic={true} 
          onSelecionar={() => router.push("/register")} 
        />
      </Container>

      {/* Seção do Carrossel de Imagens Quadradas */}
      <CarrosselTelas />

      {/* Footer */}
      <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'white', borderTop: '1px solid #eee' }}>
        <Stack direction="row" justifyContent="center" alignItems="center" spacing={1} mb={2}>
          <FlutterDashIcon sx={{ color: "text.disabled" }} />
          <Typography variant="h6" sx={{ fontWeight: "bold", color: "text.disabled" }}>OrniGen</Typography>
        </Stack>
        <Typography variant="body2" color="text.secondary">
          © 2026 OrniGen - Tecnologia para Criadouros de Elite.
        </Typography>
      </Box>

    </Box>
  );
}
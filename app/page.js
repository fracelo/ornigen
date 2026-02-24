"use client";

import { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabaseClient"; 
import TabelaPlanos from "@/components/TabelaPlanos"; 

import { Box, Container, Typography, AppBar, Toolbar, Button, Stack, Paper, IconButton } from "@mui/material";
import ArrowBackIosNewIcon from "@mui/icons-material/ArrowBackIosNew";
import ArrowForwardIosIcon from "@mui/icons-material/ArrowForwardIos";
import { useRouter } from "next/navigation";

// --- 1. COMPONENTE DO CARROSSEL PROFISSIONAL ---
function CarrosselTelas() {
  const scrollRef = useRef(null);
  const nomesImagens = ["1.png", "2.png", "3.png", "4.png"]; 
  const urlBase = "https://aqviniyxfnctuuaysava.supabase.co/storage/v1/object/public/telas/";

  // Função para rolar para os lados
  const scroll = (direction) => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" ? scrollLeft - clientWidth : scrollLeft + clientWidth;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <Box sx={{ py: 10, bgcolor: "#f8faff", borderTop: '1px solid #eee' }}>
      <Container maxWidth="lg">
        <Typography variant="h4" sx={{ textAlign: 'center', fontWeight: 'bold', mb: 6 }}>
          Conheça o OrniGen por dentro
        </Typography>

        <Box sx={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
          
          {/* Botão Esquerda */}
          <IconButton 
            onClick={() => scroll("left")}
            sx={{ 
              position: 'absolute', left: -20, zIndex: 2, bgcolor: 'white', 
              boxShadow: 3, '&:hover': { bgcolor: '#f0f0f0' },
              display: { xs: 'none', md: 'flex' } 
            }}
          >
            <ArrowBackIosNewIcon />
          </IconButton>

          {/* Container do Scroll */}
          <Box 
            ref={scrollRef}
            sx={{ 
              display: 'flex', 
              overflowX: 'hidden', // Esconde a barra feia
              gap: 0, // Sem espaço entre elas para o snap funcionar 1 por 1
              scrollSnapType: 'x mandatory',
              width: '100%',
              pb: 2
            }}
          >
            {nomesImagens.map((nome, index) => (
              <Box key={index} sx={{ 
                minWidth: '100%', // Cada imagem ocupa a tela toda do container
                scrollSnapAlign: 'center',
                px: { xs: 1, md: 10 } // Espaçamento lateral para a imagem não colar nas bordas
              }}>
                <Paper elevation={6} sx={{ borderRadius: 4, overflow: 'hidden', bgcolor: 'white' }}>
                  <Box 
                    component="img" 
                    src={`${urlBase}${nome}`} 
                    alt={`Tela ${nome}`}
                    sx={{ 
                      width: '100%', 
                      aspectRatio: '1/1', 
                      display: 'block',
                      objectFit: 'contain', // "Contain" garante que a tela do sistema apareça inteira sem cortes
                      bgcolor: '#fafafa'
                    }}
                    onError={(e) => { 
                      e.target.onerror = null;
                      e.target.src = "https://images.unsplash.com/photo-1444464666168-49d633b867ad?w=500&h=500&fit=crop"; 
                    }}
                  />
                </Paper>
              </Box>
            ))}
          </Box>

          {/* Botão Direita */}
          <IconButton 
            onClick={() => scroll("right")}
            sx={{ 
              position: 'absolute', right: -20, zIndex: 2, bgcolor: 'white', 
              boxShadow: 3, '&:hover': { bgcolor: '#f0f0f0' },
              display: { xs: 'none', md: 'flex' } 
            }}
          >
            <ArrowForwardIosIcon />
          </IconButton>
        </Box>

        {/* Indicador visual de toque para Mobile */}
        <Typography variant="caption" sx={{ display: { xs: 'block', md: 'none' }, textAlign: 'center', mt: 2, color: 'text.secondary' }}>
          Arraste para o lado para ver mais →
        </Typography>
      </Container>
    </Box>
  );
}

// --- 2. PÁGINA PRINCIPAL ---
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
      
      {/* Navbar */}
      <AppBar position="fixed" sx={{ bgcolor: "white", color: "text.primary", boxShadow: "0px 2px 10px rgba(0,0,0,0.05)" }}>
        <Container maxWidth="lg">
          <Toolbar sx={{ justifyContent: "space-between", px: "0 !important", height: 80 }}>
            <Box sx={{ cursor: 'pointer' }} onClick={() => router.push("/")}>
              <Box component="img" src="/logo-ornigen.png" alt="OrniGen Logo" sx={{ height: 45, width: 'auto' }} />
            </Box>
            <Stack direction="row" spacing={1}>
              <Button onClick={() => router.push("/login")} sx={{ fontWeight: 'bold' }}>Entrar</Button>
              <Button variant="contained" onClick={() => router.push("/register")} sx={{ fontWeight: 'bold', borderRadius: 2, textTransform: 'none' }}>
                Registrar Criadouro
              </Button>
            </Stack>
          </Toolbar>
        </Container>
      </AppBar>

      {/* Hero */}
      <Box sx={{ 
        pt: { xs: 15, md: 22 }, pb: { xs: 10, md: 18 }, textAlign: 'center', 
        background: "linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)", color: "white",
        clipPath: "ellipse(150% 100% at 50% 0%)"
      }}>
        <Container maxWidth="md">
          <Box component="img" src="/logo-ornigen.png" alt="OrniGen Logo" sx={{ height: { xs: 80, md: 120 }, mb: 4, filter: 'brightness(0) invert(1)' }} />
          <Typography variant="h2" sx={{ fontWeight: "900", mb: 2, fontSize: { xs: '2.5rem', md: '4rem' } }}>
            Gestão de Elite para o seu Criadouro
          </Typography>
          <Typography variant="h5" sx={{ opacity: 0.9, mb: 5, fontWeight: 300 }}>
            A tecnologia a serviço da ornitologia profissional.
          </Typography>
          <Button variant="contained" color="secondary" size="large" sx={{ px: 6, py: 2, borderRadius: 3, fontWeight: 'bold' }} onClick={() => router.push("/register")}>
            Começar Agora
          </Button>
        </Container>
      </Box>

      {/* Planos */}
      <Container sx={{ py: 12 }}>
        <TabelaPlanos planos={planos} isPublic={true} onSelecionar={() => router.push("/register")} />
      </Container>

      {/* Carrossel */}
      <CarrosselTelas />

      {/* Footer */}
      <Box sx={{ py: 8, textAlign: 'center', bgcolor: 'white', borderTop: '1px solid #eee' }}>
        <Box component="img" src="/logo-ornigen.png" alt="OrniGen Logo" sx={{ height: 35, mb: 2, opacity: 0.5, filter: 'grayscale(1)' }} />
        <Typography variant="body2" color="text.secondary">© 2026 OrniGen - Tecnologia para Criadouros.</Typography>
      </Box>
    </Box>
  );
}
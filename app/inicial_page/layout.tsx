"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar, Toolbar, IconButton, Typography, Drawer, List,
  ListItemIcon, ListItemText, ListItemButton, Collapse, Divider, Box,
} from "@mui/material";

// Ícones de controle
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";

import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/authContext";
import { useEmpresa } from "../context/empresaContext";
import { supabase } from "../lib/supabaseClient";

export default function InicialLayout({ children }: { children: React.ReactNode }) {
  const [openPassaros, setOpenPassaros] = useState(false);
  const [openReproducao, setOpenReproducao] = useState(false);
  const [openFinanceiro, setOpenFinanceiro] = useState(false);
  
  const { usuarioLogado, setUsuarioLogado } = useAuth();
  const { nomeEmpresa, setEmpresaId, setNomeEmpresa } = useEmpresa();
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!usuarioLogado) router.push("/login");
  }, [usuarioLogado, router]);

  if (!usuarioLogado) return null;

  const goTo = (path: string) => router.push(path);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    setUsuarioLogado(false);
    setEmpresaId(null);
    setNomeEmpresa("");
    router.push("/");
  };

  const CustomIcon = (src: string, size = 96) => (
    <Box
      component="img"
      src={src}
      alt="menu-icon"
      sx={{
        width: size,
        height: size,
        objectFit: 'contain',
        mb: 1,
        transition: 'transform 0.2s',
        '&:hover': { transform: 'scale(1.1)' } 
      }}
    />
  );

  const menuWidth = 160; 
  const themeGrey = "#1e293b"; 

  return (
    <Box sx={{ display: 'flex', minHeight: "100vh" }}>
      <AppBar 
        position="fixed" 
        elevation={0}
        sx={{ 
          backgroundColor: themeGrey, 
          zIndex: (theme) => theme.zIndex.drawer + 1,
          width: `calc(100% - ${menuWidth}px)`,
          ml: `${menuWidth}px`,
          borderBottom: '1px solid rgba(255,255,255,0.08)'
        }}
      >
        <Toolbar sx={{ height: 70 }}>
          <Typography variant="h6" sx={{ flexGrow: 1, fontWeight: '900', letterSpacing: 1 }}>
            ORNIGEN <span style={{ fontWeight: 300, fontSize: '0.8rem', color: 'rgba(255,255,255,0.5)' }}>
              {nomeEmpresa ? `| ${nomeEmpresa}` : ""}
            </span>
          </Typography>
          
          <IconButton onClick={() => router.push("/inicial_page/empresas")}>
            {CustomIcon("/icons/configuracoes.png", 32)}
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        anchor="left"
        sx={{
          width: menuWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: menuWidth,
            backgroundColor: themeGrey,
            color: "#fff",
            boxSizing: 'border-box',
            borderRight: '1px solid rgba(255,255,255,0.08)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            overflowX: 'hidden',
            '&::-webkit-scrollbar': { width: '5px' },
            '&::-webkit-scrollbar-track': { backgroundColor: 'transparent' },
            '&::-webkit-scrollbar-thumb': { backgroundColor: 'rgba(255, 255, 255, 0.15)', borderRadius: '10px' },
            scrollbarWidth: 'thin',
            scrollbarColor: 'rgba(255, 255, 255, 0.15) transparent',
          },
        }}
      >
        <Toolbar sx={{ height: 70 }} /> 
        
        <List sx={{ width: '100%', px: 1, py: 2 }}>
          
          <ListItemButton 
            selected={pathname === "/inicial_page/"} 
            onClick={() => goTo("/inicial_page/")}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/home.png")}</ListItemIcon>
            <ListItemText primary="Home" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          <ListItemButton 
            selected={pathname === "/inicial_page/criadouros"} 
            onClick={() => goTo("/inicial_page/criadouros")}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/criadouros.png")}</ListItemIcon>
            <ListItemText primary="Criadouros" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          <ListItemButton 
            selected={pathname === "/inicial_page/entidades"} 
            onClick={() => goTo("/inicial_page/entidades")}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/entidades.png")}</ListItemIcon>
            <ListItemText primary="Entidades" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          <ListItemButton 
            selected={pathname === "/inicial_page/especies"} 
            onClick={() => goTo("/inicial_page/especies")}
            sx={{ flexDirection: 'column', alignItems: 'center', textAlign: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/especies.png")}</ListItemIcon>
            <ListItemText primary="Espécies" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          {/* Pássaros com Submenu Transferências */}
          <ListItemButton 
            onClick={() => setOpenPassaros(!openPassaros)} 
            sx={{ flexDirection: 'column', alignItems: 'center', mb: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/passaros.png")}</ListItemIcon>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Pássaros</Typography>
                {openPassaros ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            </Box>
          </ListItemButton>
          <Collapse in={openPassaros} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ flexDirection: 'column', py: 2 }} selected={pathname === "/inicial_page/passaros"} onClick={() => goTo("/inicial_page/passaros")}>
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/listapassaros.png", 48)}</ListItemIcon>
                <ListItemText primary="Relação" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
              
              {/* Novo Item: Transferências */}
              <ListItemButton 
                sx={{ flexDirection: 'column', py: 2 }} 
                selected={pathname === "/inicial_page/passaros/transferencias"} 
                onClick={() => goTo("/inicial_page/passaros/transferencias")}
              >
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/transferencia-passaros.png", 48)}</ListItemIcon>
                <ListItemText primary="Transferências" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItemButton 
            onClick={() => setOpenReproducao(!openReproducao)} 
            sx={{ flexDirection: 'column', alignItems: 'center', mb: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/reproducao.png")}</ListItemIcon>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Reprodução</Typography>
                {openReproducao ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            </Box>
          </ListItemButton>
          <Collapse in={openReproducao} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ flexDirection: 'column', py: 2 }} selected={pathname.startsWith("/inicial_page/reproducao")} onClick={() => goTo("/inicial_page/reproducao")}>
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/casais.png", 48)}</ListItemIcon>
                <ListItemText primary="Casais" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
              <ListItemButton sx={{ flexDirection: 'column', py: 2 }} onClick={() => goTo("/inicial_page/reproducao/reserva")}>
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/reserva-passaros.png", 48)}</ListItemIcon>
                <ListItemText primary="Reserva Filhotes" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          <ListItemButton 
            selected={pathname === "/inicial_page/anilhas"} 
            onClick={() => goTo("/inicial_page/anilhas")}
            sx={{ flexDirection: 'column', alignItems: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/anilhas.png")}</ListItemIcon>
            <ListItemText primary="Anilhas" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          <ListItemButton 
            selected={pathname.startsWith("/inicial_page/medicamentos")} 
            onClick={() => goTo("/inicial_page/medicamentos")}
            sx={{ flexDirection: 'column', alignItems: 'center', borderRadius: 2, mb: 2 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/medicamentos.png")}</ListItemIcon>
            <ListItemText primary="Medicamentos" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>

          <ListItemButton 
            onClick={() => setOpenFinanceiro(!openFinanceiro)} 
            sx={{ flexDirection: 'column', alignItems: 'center', mb: 1 }}
          >
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/financeiro.png")}</ListItemIcon>
            <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <Typography sx={{ fontSize: '0.75rem', fontWeight: 'bold' }}>Financeiro</Typography>
                {openFinanceiro ? <ExpandLess sx={{ fontSize: 16 }} /> : <ExpandMore sx={{ fontSize: 16 }} />}
            </Box>
          </ListItemButton>
          <Collapse in={openFinanceiro} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton sx={{ flexDirection: 'column', py: 2 }} selected={pathname.startsWith("/inicial_page/financeiro/categorias")} onClick={() => goTo("/inicial_page/financeiro/categorias")}>
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/categorias.png", 48)}</ListItemIcon>
                <ListItemText primary="Categorias" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
              <ListItemButton sx={{ flexDirection: 'column', py: 2 }} selected={pathname.startsWith("/inicial_page/financeiro/contascc")} onClick={() => goTo("/inicial_page/financeiro/contascc")}>
                <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/cadastrocc.png", 48)}</ListItemIcon>
                <ListItemText primary="Contas Correntes" primaryTypographyProps={{ fontSize: '0.7rem' }} />
              </ListItemButton>
            </List>
          </Collapse>

          <Divider sx={{ my: 2, backgroundColor: "rgba(255,255,255,0.1)" }} />

          <ListItemButton onClick={handleLogout} sx={{ flexDirection: 'column', color: "#f87171", mb: 2 }}>
            <ListItemIcon sx={{ minWidth: 0 }}>{CustomIcon("/icons/logout.png", 64)}</ListItemIcon>
            <ListItemText primary="Sair" primaryTypographyProps={{ fontSize: '0.75rem', fontWeight: 'bold' }} />
          </ListItemButton>
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 3, mt: "70px", bgcolor: "#f1f5f9" }}>
        {children}
      </Box>
    </Box>
  );
}
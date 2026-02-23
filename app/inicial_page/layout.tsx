"use client";

import React, { useState, useEffect } from "react";
import {
  AppBar,
  Toolbar,
  IconButton,
  Typography,
  Drawer,
  List,
  ListItemIcon,
  ListItemText,
  ListItemButton,
  Collapse,
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import NatureIcon from "@mui/icons-material/Nature";
import PetsIcon from "@mui/icons-material/Pets";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import ExpandLess from "@mui/icons-material/ExpandLess";
import ExpandMore from "@mui/icons-material/ExpandMore";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/authContext";
import { useEmpresa } from "../context/empresaContext";
import { supabase } from "../lib/supabaseClient";
import ShoppingCartIcon from "@mui/icons-material/ShoppingCart"; // Novo ícone
import InventoryIcon from "@mui/icons-material/Inventory"; // Novo ícone para estoque

export default function InicialLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const [openPassaros, setOpenPassaros] = useState(false);
  const { usuarioLogado, setUsuarioLogado } = useAuth();
  const { nomeEmpresa, setEmpresaId, setNomeEmpresa } = useEmpresa();
  const router = useRouter();
  const pathname = usePathname();
  const [openAnilhas, setOpenAnilhas] = useState(false); // Novo estado para o submenu de anilhas

  useEffect(() => {
    if (!usuarioLogado) {
      router.push("/login");
    }
  }, [usuarioLogado, router]);

  if (!usuarioLogado) {
    return null;
  }

  const goTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleLogout = async () => {
    // encerra sessão no Supabase
    await supabase.auth.signOut();

    // limpa contexto local
    setUsuarioLogado(false);
    setEmpresaId(null);
    setNomeEmpresa("");

    // fecha o menu lateral
    setOpen(false);

    // redireciona para tela inicial
    router.push("/");
  };

  return (
    <div style={{ backgroundColor: "#fff", minHeight: "100vh" }}>
      {/* 🔹 Barra superior azul */}
      <AppBar position="static" sx={{ backgroundColor: "#1976d2" }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon sx={{ fontSize: 32 }} />
          </IconButton>

          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OrniGen {nomeEmpresa ? ` - ${nomeEmpresa}` : ""}
          </Typography>

          <IconButton color="inherit" onClick={() => router.push("/inicial_page/empresas")}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 🔹 Drawer lateral azul */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 250,
            backgroundColor: "#1976d2",
            color: "#fff",
          },
        }}
      >
        <List>
          {/* 🔹 Primeiro item: Home */}
          <ListItemButton
            selected={pathname === "/"}
            onClick={() => goTo("/inicial_page/")}
          >
            <ListItemIcon>
              <HomeIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Home" />
          </ListItemButton>

          {/* 🔹 Criadouros */}
          <ListItemButton
            selected={pathname === "/inicial_page/criadouros"}
            onClick={() => goTo("/inicial_page/criadouros")}
          >
            <ListItemIcon>
              <NatureIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Criadouros" />
          </ListItemButton>

          {/* 🔹 Entidades */}
          <ListItemButton
            selected={pathname === "/inicial_page/entidades"}
            onClick={() => goTo("/inicial_page/entidades")}
          >
            <ListItemIcon>
              <NatureIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Entidades" />
          </ListItemButton>

          {/* 🔹 Espécies */}
          <ListItemButton
            selected={pathname === "/inicial_page/especies"}
            onClick={() => goTo("/inicial_page/especies")}
          >
            <ListItemIcon>
              <PetsIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Espécies" />
          </ListItemButton>

          {/* 🔹 Pássaros com submenu */}
          <ListItemButton onClick={() => setOpenPassaros(!openPassaros)}>
            <ListItemIcon>
              <PetsIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Pássaros" />
            {openPassaros ? <ExpandLess /> : <ExpandMore />}
          </ListItemButton>

          <Collapse in={openPassaros} timeout="auto" unmountOnExit>
            <List component="div" disablePadding>
              <ListItemButton
                sx={{ pl: 4 }}
                selected={pathname === "/inicial_page/passaros"}
                onClick={() => goTo("/inicial_page/passaros")}
              >
                <ListItemText primary="Relação de Pássaros" />
              </ListItemButton>

              <ListItemButton
                sx={{ pl: 4 }}
                selected={pathname === "/inicial_page/passaros_recebimento"}
                onClick={() => goTo("/inicial_page/passaros_recebimento")}
              >
                <ListItemText primary="Recebimento" />
              </ListItemButton>

              <ListItemButton
                sx={{ pl: 4 }}
                selected={pathname === "/inicial_page/passaros_transferencia"}
                onClick={() => goTo("/inicial_page/passaros_transferencia")}
              >
                <ListItemText primary="Transferência" />
              </ListItemButton>
            </List>
          </Collapse>

         {/* 🔹 Anilhas */}
          <ListItemButton
            selected={pathname === "/inicial_page/anilhas"}
            onClick={() => goTo("/inicial_page/anilhas")}
          >
            <ListItemIcon>
              <PetsIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Anilhas" />
          </ListItemButton>

          {/* 🔹 Logout */}
          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon sx={{ color: "#fff" }} />
            </ListItemIcon>
            <ListItemText primary="Sair/Logout" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* 🔹 Conteúdo da página filha */}
      <main style={{ padding: "20px" }}>{children}</main>
    </div>
  );
}
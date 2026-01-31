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
} from "@mui/material";
import MenuIcon from "@mui/icons-material/Menu";
import HomeIcon from "@mui/icons-material/Home";
import NatureIcon from "@mui/icons-material/Nature";
import PetsIcon from "@mui/icons-material/Pets";
import LogoutIcon from "@mui/icons-material/Logout";
import SettingsIcon from "@mui/icons-material/Settings";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "../context/authContext";

export default function InicialLayout({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const { usuarioLogado, setUsuarioLogado } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  // 🔹 Redirecionamento seguro
  useEffect(() => {
    if (!usuarioLogado) {
      router.push("/login");
    }
  }, [usuarioLogado, router]);

  if (!usuarioLogado) {
    return null; // evita renderizar conteúdo antes do redirect
  }

  const goTo = (path: string) => {
    setOpen(false);
    router.push(path);
  };

  const handleLogout = () => {
    setUsuarioLogado(false);
    setOpen(false);
    router.push("/login");
  };

  return (
    <div>
      {/* 🔹 Barra superior */}
      <AppBar position="static">
        <Toolbar>
          {/* Ícone do menu sanduíche à esquerda */}
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon sx={{ fontSize: 32 }} />
          </IconButton>

          {/* Título central */}
          <Typography variant="h6" sx={{ flexGrow: 1 }}>
            OrniGen
          </Typography>

          {/* Ícone de engrenagem à direita */}
          <IconButton color="inherit" onClick={() => alert("Configurações futuras")}>
            <SettingsIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      {/* 🔹 Drawer lateral */}
      <Drawer
        variant="temporary"
        anchor="left"
        open={open}
        onClose={() => setOpen(false)}
        sx={{
          "& .MuiDrawer-paper": {
            width: 220,
          },
        }}
      >
        <List>
          <ListItemButton
            selected={pathname === "/inicial_page/criadouros"}
            onClick={() => goTo("/inicial_page/criadouros")}
          >
            <ListItemIcon>
              <HomeIcon />
            </ListItemIcon>
            <ListItemText primary="Criadouros" />
          </ListItemButton>

          <ListItemButton
            selected={pathname === "/inicial_page/especies"}
            onClick={() => goTo("/inicial_page/especies")}
          >
            <ListItemIcon>
              <NatureIcon />
            </ListItemIcon>
            <ListItemText primary="Espécies" />
          </ListItemButton>

          <ListItemButton
            selected={pathname === "/passaros"}
            onClick={() => goTo("/passaros")}
          >
            <ListItemIcon>
              <PetsIcon />
            </ListItemIcon>
            <ListItemText primary="Pássaros" />
          </ListItemButton>

          <ListItemButton onClick={handleLogout}>
            <ListItemIcon>
              <LogoutIcon />
            </ListItemIcon>
            <ListItemText primary="Sair" />
          </ListItemButton>
        </List>
      </Drawer>

      {/* 🔹 Conteúdo da página filha */}
      <main style={{ padding: "20px" }}>{children}</main>
    </div>
  );
}
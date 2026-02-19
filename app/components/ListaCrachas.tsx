"use client";

import { Box } from "@mui/material";
import CrachaPassaro from "./CrachaPassaro";
import { Passaro } from "../lib/Passaro";

interface ListaCrachasProps {
  passaros: Passaro[];
}

export default function ListaCrachas({ passaros }: ListaCrachasProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: "repeat(2, 1fr)", // 2 crachás por linha
        gap: 2,
        p: 2,
      }}
    >
      {passaros.map((p) => (
        <CrachaPassaro key={p.id} form={p} />
      ))}
    </Box>
  );
}
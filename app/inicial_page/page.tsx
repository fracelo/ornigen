"use client";

export default function InicialPage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        backgroundColor: "#fff",
        textAlign: "center",
      }}
    >
      {/* Primeira frase */}
      <h1 style={{ color: "#0d47a1", fontWeight: "bold", marginBottom: "20px" }}>
        Bem-vindo à Plataforma OrniGen
      </h1>

      {/* Logo central */}
      <img
        src="/logo-ornigen.png"
        alt="Logo OrniGen"
        style={{ width: "400px", margin: "20px 0" }}
      />

      {/* Segunda frase */}
      <h2 style={{ color: "#0d47a1", fontWeight: "bold" }}>
        Escolha uma opção no menu lateral para começar
      </h2>
    </div>
  );
}
export default function InicialPage() {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        height: "80vh",
        textAlign: "center",
      }}
    >
      {/* Logo central */}
      <img
        src="/logo-ornigen.png"
        alt="Logo OrniGen"
        style={{ width: "400px", marginBottom: "20px" }}
      />

      {/* Frase abaixo */}
      <h2></h2>
    </div>
  );
}
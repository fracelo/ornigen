import Image from "next/image";
import Link from "next/link";

export default function Page() {
  return (
    <div
      style={{
        display: "flex",
        minHeight: "100vh",
        backgroundColor: "white",
        color: "black",
      }}
    >
      {/* Lado da imagem */}
      <div
        style={{
          flex: 1,
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
        }}
      >
        <Image
          src="/logo-ornigen.png" // ✅ imagem na pasta public
          alt="Imagem de pássaros"
          width={600}
          height={600}
        />
      </div>

      {/* Lado do texto */}
      <div
        style={{
          flex: 1,
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
        }}
      >
        <h1 style={{ fontSize: "3rem", marginBottom: "1rem" }}>OrniGen</h1>

        <p
          style={{
            fontSize: "1.2rem",
            lineHeight: "1.6",
            marginBottom: "2rem",
          }}
        >
          O sistema de OrniGen foi criado para organizar e visualizar as relações
          entre diferentes espécies e linhagens de aves. Ele permite acompanhar
          padrões de evolução, identificar características herdadas e compreender
          como diferentes grupos se conectam ao longo do tempo. É uma ferramenta
          que une ciência e tecnologia para facilitar estudos e descobertas sobre
          o fascinante mundo das aves.
        </p>

        {/* Link para login de empresas */}
        <Link
          href="/login"
          style={{ fontSize: "1.5rem", textDecoration: "underline" }}
        >
          Login
        </Link>
      </div>
    </div>
  );
}

// 🔚 Fim da página
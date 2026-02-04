"use client";
import { useRouter } from "next/navigation";

export default function TestePage() {
  const router = useRouter();

  return (
    <div style={{ display: "flex", justifyContent: "center", marginTop: "50px" }}>
      <button
        onClick={() => router.push("/inicial_page")}
        style={{ padding: "10px 20px", fontSize: "16px" }}
      >
        Ir para inicial_page
      </button>
    </div>
  );
}
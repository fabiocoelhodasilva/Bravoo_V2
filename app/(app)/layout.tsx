"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { AuthProvider, useAuth } from "@/context/AuthContext";

function ProtectedAppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { loading, isAuthenticated, perfilAtivoId, erroPerfil } = useAuth();
  const exigePerfil = !pathname.startsWith("/professor");

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.replace("/login");
    } else if (!loading && exigePerfil && !perfilAtivoId && !erroPerfil) {
      router.replace("/perfis");
    }
  }, [loading, isAuthenticated, perfilAtivoId, erroPerfil, exigePerfil, router]);

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          <p className="text-sm opacity-80">Carregando...</p>
        </div>
      </div>
    );
  }

  if (erroPerfil) {
    return <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-black text-white" role="alert">
      <p>{erroPerfil}</p><a href="/perfis" className="text-amber-300 underline">Escolher perfil novamente</a>
    </div>;
  }

  if (!isAuthenticated || (exigePerfil && !perfilAtivoId)) {
    return null;
  }

  return <React.Fragment key={exigePerfil ? perfilAtivoId : "conta"}>{children}</React.Fragment>;
}

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  return (
    <AuthProvider exigirPerfil={!pathname.startsWith("/professor")}>
      <ProtectedAppLayout>{children}</ProtectedAppLayout>
    </AuthProvider>
  );
}

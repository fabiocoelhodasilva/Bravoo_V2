"use client";

import React, { useEffect, useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    (async () => {
      const { data } = await supabase.auth.getSession();
      const userId = data?.session?.user?.id;

      // se não logado, manda pro login (preserva pra voltar depois)
      if (!userId) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setOk(true);
    })();
  }, [router, pathname]);

  if (!ok) {
    return (
      <div className="min-h-screen bg-background text-foreground flex items-center justify-center">
        <p>Carregando...</p>
      </div>
    );
  }

  return <>{children}</>;
}
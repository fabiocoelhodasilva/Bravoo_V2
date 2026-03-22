"use client";

import React, { useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [checkingAuth, setCheckingAuth] = useState(true);

  useEffect(() => {
    let isMounted = true;

    async function checkSession() {
      try {
        const { data, error } = await supabase.auth.getSession();
        const userId = data?.session?.user?.id;

        if (!isMounted) return;

        if (error || !userId) {
          router.replace(`/login?next=${encodeURIComponent(pathname)}`);
          return;
        }

        setCheckingAuth(false);
      } catch (error) {
        console.error("Erro ao verificar sessão no AppLayout:", error);

        if (!isMounted) return;
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
      }
    }

    checkSession();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      if (event === "SIGNED_OUT" || !session?.user?.id) {
        router.replace(`/login?next=${encodeURIComponent(pathname)}`);
        return;
      }

      setCheckingAuth(false);
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, [router, pathname]);

  if (checkingAuth) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-b-2 border-white" />
          <p className="text-sm opacity-80">Carregando...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
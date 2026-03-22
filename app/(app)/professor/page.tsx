"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";
import TeacherDashboard from "@/components/TeacherDashboard";

export default function ProfessorPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase.auth.getSession();

        if (error || !data.session) {
          router.replace("/login");
          return;
        }
      } finally {
        setChecking(false);
      }
    })();
  }, [router]);

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando…</div>
      </div>
    );
  }

  return <TeacherDashboard />;
}
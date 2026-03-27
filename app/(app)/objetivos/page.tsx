"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ObjetivosPageView } from "@/components/objetivos/ObjetivosPageView";
import { useAuth } from "@/context/AuthContext";
import {
  deleteObjetivo,
  fetchObjetivosByUser,
  signOutObjetivos,
  updateObjetivoProgress,
} from "@/lib/objetivos/objetivos-service";
import { clampProgress } from "@/lib/objetivos/objetivos-utils";
import type { Objetivo } from "@/types/objetivos";

export default function ObjetivosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Carregando objetivos...");
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    if (loading || !user?.id) return;

    async function initializePage() {
      try {
        const objetivosData = await fetchObjetivosByUser(user.id);
        setObjetivos(objetivosData);

        setLoadingMessage(
          objetivosData.length === 0 ? "Nenhum objetivo cadastrado." : ""
        );
      } catch (error) {
        console.error("Erro ao carregar objetivos:", error);
        setLoadingMessage("Erro ao carregar.");
      }
    }

    void initializePage();
  }, [loading, user?.id]);

  async function reloadObjetivos() {
    if (!user?.id) return;

    try {
      const objetivosData = await fetchObjetivosByUser(user.id);
      setObjetivos(objetivosData);

      setLoadingMessage(
        objetivosData.length === 0 ? "Nenhum objetivo cadastrado." : ""
      );
    } catch (error) {
      console.error("Erro ao recarregar objetivos:", error);
      setLoadingMessage("Erro ao carregar.");
    }
  }

  async function handleLogout() {
    try {
      await signOutObjetivos();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }

  async function handleSaveProgress(objetivoId: string, progresso: number) {
    if (!user?.id) return;

    const safeProgress = clampProgress(progresso);

    setSavingIds((prev) =>
      prev.includes(objetivoId) ? prev : [...prev, objetivoId]
    );

    try {
      await updateObjetivoProgress({
        objetivoId,
        userId: user.id,
        progresso: safeProgress,
      });

      setObjetivos((prev) =>
        prev.map((item) =>
          item.id === objetivoId
            ? { ...item, progresso_percentual: safeProgress }
            : item
        )
      );
    } catch (error) {
      console.error("Erro ao salvar progresso:", error);
      alert("Não foi possível salvar o progresso.");
    } finally {
      setSavingIds((prev) => prev.filter((id) => id !== objetivoId));
    }
  }

  async function handleDelete(objetivoId: string) {
    if (!user?.id) return;

    const confirmed = window.confirm("Excluir este objetivo?");
    if (!confirmed) return;

    setDeletingIds((prev) =>
      prev.includes(objetivoId) ? prev : [...prev, objetivoId]
    );

    try {
      await deleteObjetivo({
        objetivoId,
        userId: user.id,
      });

      await reloadObjetivos();
    } catch (error) {
      console.error("Erro ao excluir objetivo:", error);
      alert("Não foi possível excluir.");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== objetivoId));
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando objetivos...</div>
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <ObjetivosPageView
      objetivos={objetivos}
      loadingMessage={loadingMessage}
      savingIds={savingIds}
      deletingIds={deletingIds}
      onLogout={handleLogout}
      onSaveProgress={handleSaveProgress}
      onDelete={handleDelete}
    />
  );
}
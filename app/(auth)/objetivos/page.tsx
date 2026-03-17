"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ObjetivosPageView } from "@/components/objetivos/ObjetivosPageView";
import {
  deleteObjetivo,
  fetchObjetivosByUser,
  getCurrentSessionOrThrow,
  signOutObjetivos,
  updateObjetivoProgress,
} from "@/lib/objetivos/objetivos-service";
import { clampProgress } from "@/lib/objetivos/objetivos-utils";
import type { Objetivo } from "../../../types/objetivos";

export default function ObjetivosPage() {
  const router = useRouter();

  const [checking, setChecking] = useState(true);
  const [userId, setUserId] = useState<string | null>(null);
  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Carregando objetivos...");
  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  useEffect(() => {
    void initializePage();
  }, []);

  async function initializePage() {
    try {
      const session = await getCurrentSessionOrThrow();
      const currentUserId = session.user.id;

      setUserId(currentUserId);

      const objetivosData = await fetchObjetivosByUser(currentUserId);
      setObjetivos(objetivosData);

      setLoadingMessage(
        objetivosData.length === 0 ? "Nenhum objetivo cadastrado." : ""
      );
    } catch (error) {
      if (error instanceof Error && error.message === "NO_SESSION") {
        router.replace("/login");
        return;
      }

      console.error("Erro ao carregar objetivos:", error);
      setLoadingMessage("Erro ao carregar.");
    } finally {
      setChecking(false);
    }
  }

  async function reloadObjetivos() {
    if (!userId) return;

    try {
      const objetivosData = await fetchObjetivosByUser(userId);
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
    if (!userId) return;

    const safeProgress = clampProgress(progresso);
    setSavingIds((prev) => [...prev, objetivoId]);

    try {
      await updateObjetivoProgress({
        objetivoId,
        userId,
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
    if (!userId) return;

    const confirmed = window.confirm("Excluir este objetivo?");
    if (!confirmed) return;

    setDeletingIds((prev) => [...prev, objetivoId]);

    try {
      await deleteObjetivo({
        objetivoId,
        userId,
      });

      await reloadObjetivos();
    } catch (error) {
      console.error("Erro ao excluir objetivo:", error);
      alert("Não foi possível excluir.");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== objetivoId));
    }
  }

  if (checking) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-sm opacity-80">Carregando objetivos…</div>
      </div>
    );
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
"use client";

/* =========================================================
   Imports
========================================================= */

import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";

import { ObjetivosPageView } from "@/components/objetivos/ObjetivosPageView";
import { useAuth } from "@/context/AuthContext";

import {
  fetchObjetivosByUser,
  signOutObjetivos,
} from "@/lib/objetivos/objetivos-service";

import {
  deleteObjetivoAction,
  updateObjetivoProgressAction,
} from "@/app/actions/objetivos";

import { clampProgress } from "@/lib/objetivos/objetivos-utils";
import type { Objetivo } from "@/types/objetivos";

/* =========================================================
   Constantes
========================================================= */

const CACHE_PREFIX = "bravoo_objetivos_usuario_";

/* =========================================================
   Funções auxiliares de cache
========================================================= */

function getCacheKey(userId: string) {
  return `${CACHE_PREFIX}${userId}`;
}

function carregarObjetivosDoCache(userId: string): Objetivo[] | null {
  try {
    const cache = sessionStorage.getItem(getCacheKey(userId));
    if (!cache) return null;

    return JSON.parse(cache) as Objetivo[];
  } catch {
    return null;
  }
}

function salvarObjetivosNoCache(userId: string, objetivos: Objetivo[]) {
  try {
    sessionStorage.setItem(getCacheKey(userId), JSON.stringify(objetivos));
  } catch {
    // Evita quebrar a página caso o navegador bloqueie o sessionStorage.
  }
}

/* =========================================================
   Componente principal
========================================================= */

export default function ObjetivosPage() {
  const router = useRouter();
  const { user, loading } = useAuth();

  const [objetivos, setObjetivos] = useState<Objetivo[]>([]);
  const [loadingMessage, setLoadingMessage] = useState("Carregando objetivos...");

  const [savingIds, setSavingIds] = useState<string[]>([]);
  const [deletingIds, setDeletingIds] = useState<string[]>([]);

  const [feedbackMessage, setFeedbackMessage] = useState("");
  const [feedbackType, setFeedbackType] = useState<"error" | "success">("error");

  const [objetivoParaExcluir, setObjetivoParaExcluir] = useState<string | null>(
    null
  );
  const [showDeleteModal, setShowDeleteModal] = useState(false);

  /* =========================================================
     Carrega objetivos com cache rápido + atualização real
  ========================================================= */

  const reloadObjetivos = useCallback(async () => {
    const userId = user?.id;
    if (!userId) return;

    const objetivosCache = carregarObjetivosDoCache(userId);

    if (objetivosCache) {
      setObjetivos(objetivosCache);
      setLoadingMessage(
        objetivosCache.length === 0 ? "Nenhum objetivo cadastrado." : ""
      );
    }

    try {
      const objetivosData = await fetchObjetivosByUser(userId);

      setObjetivos(objetivosData);
      salvarObjetivosNoCache(userId, objetivosData);

      setLoadingMessage(
        objetivosData.length === 0 ? "Nenhum objetivo cadastrado." : ""
      );
    } catch (error) {
      console.error("Erro ao recarregar objetivos:", error);

      if (!objetivosCache) {
        setLoadingMessage("Erro ao carregar.");
      }
    }
  }, [user?.id]);

  useEffect(() => {
    if (loading || !user?.id) return;

    void reloadObjetivos();
  }, [loading, user?.id, reloadObjetivos]);

  /* =========================================================
     Limpa mensagens temporárias
  ========================================================= */

  useEffect(() => {
    if (!feedbackMessage) return;

    const timer = window.setTimeout(() => {
      setFeedbackMessage("");
    }, 3000);

    return () => window.clearTimeout(timer);
  }, [feedbackMessage]);

  /* =========================================================
     Logout
  ========================================================= */

  const handleLogout = useCallback(async () => {
    try {
      await signOutObjetivos();
    } catch (error) {
      console.error("Erro ao sair:", error);
    } finally {
      router.replace("/login");
      router.refresh();
    }
  }, [router]);

  /* =========================================================
     Salva progresso com atualização otimista
  ========================================================= */

  const handleSaveProgress = useCallback(
    async (objetivoId: string, progresso: number) => {
      const safeProgress = clampProgress(progresso);
      const userId = user?.id;

      let progressoAnterior = 0;
      let objetivosAtualizados: Objetivo[] = [];

      setObjetivos((prev) => {
        objetivosAtualizados = prev.map((item) => {
          if (item.id !== objetivoId) return item;

          progressoAnterior = clampProgress(item.progresso_percentual ?? 0);

          return {
            ...item,
            progresso_percentual: safeProgress,
          };
        });

        if (userId) {
          salvarObjetivosNoCache(userId, objetivosAtualizados);
        }

        return objetivosAtualizados;
      });

      setSavingIds((prev) =>
        prev.includes(objetivoId) ? prev : [...prev, objetivoId]
      );

      try {
        const result = await updateObjetivoProgressAction({
          objetivoId,
          progresso: safeProgress,
        });

        if (!result.ok) {
          throw new Error(result.message);
        }

        setFeedbackType("success");
        setFeedbackMessage("Progresso salvo com sucesso.");
      } catch (error) {
        console.error("Erro ao salvar progresso:", error);

        setObjetivos((prev) => {
          const objetivosRestaurados = prev.map((item) =>
            item.id === objetivoId
              ? {
                  ...item,
                  progresso_percentual: progressoAnterior,
                }
              : item
          );

          if (userId) {
            salvarObjetivosNoCache(userId, objetivosRestaurados);
          }

          return objetivosRestaurados;
        });

        setFeedbackType("error");
        setFeedbackMessage("Não foi possível salvar o progresso.");
      } finally {
        setSavingIds((prev) => prev.filter((id) => id !== objetivoId));
      }
    },
    [user?.id]
  );

  /* =========================================================
     Exclusão de objetivo
  ========================================================= */

  const handleDelete = useCallback(async (objetivoId: string): Promise<void> => {
    setObjetivoParaExcluir(objetivoId);
    setShowDeleteModal(true);
  }, []);

  const closeDeleteModal = useCallback(() => {
    setShowDeleteModal(false);
    setObjetivoParaExcluir(null);
  }, []);

  const confirmDelete = useCallback(async () => {
    const objetivoId = objetivoParaExcluir;
    const userId = user?.id;

    if (!objetivoId) return;

    setDeletingIds((prev) =>
      prev.includes(objetivoId) ? prev : [...prev, objetivoId]
    );

    try {
      const result = await deleteObjetivoAction({
        objetivoId,
      });

      if (!result.ok) {
        throw new Error(result.message);
      }

      setObjetivos((prev) => {
        const nextObjetivos = prev.filter((item) => item.id !== objetivoId);

        if (userId) {
          salvarObjetivosNoCache(userId, nextObjetivos);
        }

        setLoadingMessage(
          nextObjetivos.length === 0 ? "Nenhum objetivo cadastrado." : ""
        );

        return nextObjetivos;
      });

      setFeedbackType("success");
      setFeedbackMessage("Objetivo excluído com sucesso.");
    } catch (error) {
      console.error("Erro ao excluir objetivo:", error);
      setFeedbackType("error");
      setFeedbackMessage("Não foi possível excluir o objetivo.");
    } finally {
      setDeletingIds((prev) => prev.filter((id) => id !== objetivoId));
      closeDeleteModal();
    }
  }, [objetivoParaExcluir, user?.id, closeDeleteModal]);

  /* =========================================================
     Estado de carregamento inicial
  ========================================================= */

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

  /* =========================================================
     Renderização
  ========================================================= */

  return (
    <>
      <ObjetivosPageView
        objetivos={objetivos}
        loadingMessage={loadingMessage}
        savingIds={savingIds}
        deletingIds={deletingIds}
        onLogout={handleLogout}
        onSaveProgress={handleSaveProgress}
        onDelete={handleDelete}
      />

      {feedbackMessage && (
        <div className="fixed top-4 left-1/2 z-[100] w-[92%] max-w-md -translate-x-1/2">
          <div
            className={`rounded-2xl border px-4 py-3 text-sm font-medium shadow-lg ${
              feedbackType === "error"
                ? "border-red-400/30 bg-red-500/15 text-red-100"
                : "border-emerald-400/30 bg-emerald-500/15 text-emerald-100"
            }`}
          >
            {feedbackMessage}
          </div>
        </div>
      )}

      {showDeleteModal && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-[#111111] p-5 text-center shadow-2xl">
            <h2 className="mb-2 text-lg font-semibold text-white">
              Excluir objetivo
            </h2>

            <p className="mb-5 text-sm text-white/75">
              Tem certeza que deseja excluir este objetivo?
            </p>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={closeDeleteModal}
                className="flex-1 rounded-2xl bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                Cancelar
              </button>

              <button
                type="button"
                onClick={confirmDelete}
                className="flex-1 rounded-2xl bg-[var(--color-1,#c94a4a)] px-4 py-3 text-sm font-semibold text-white transition hover:opacity-90"
              >
                Excluir
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
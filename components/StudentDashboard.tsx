"use client";

import Header from "./Header";
import GradientTitle from "./GradientTitle";
import SubjectButton from "./SubjectButton";
import { useRouter } from "next/navigation";

interface StudentDashboardProps {
  onLogout?: () => void;
}

export default function StudentDashboard({ onLogout }: StudentDashboardProps) {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-black text-white flex flex-col items-center text-center font-sans">
      <Header />

      <GradientTitle>Escolha um Tema</GradientTitle>

      <div className="flex flex-col gap-5 w-full max-w-sm animate-fade-in">
        <SubjectButton subject="agenda" onClick={() => router.push("/agenda")}>
          Agenda escolar
        </SubjectButton>

        <SubjectButton subject="biblia" onClick={() => router.push("/biblia")}>
          Bíblia
        </SubjectButton>

        <SubjectButton subject="geografia" onClick={() => router.push("/geografia")}>
          Geografia
        </SubjectButton>

        <SubjectButton subject="matematica" onClick={() => router.push("/matematica")}>
          Matemática
        </SubjectButton>

        <SubjectButton subject="virtudes" onClick={() => router.push("/virtudes")}>
          Virtudes
        </SubjectButton>

        <SubjectButton subject="relatorios" onClick={() => router.push("/relatorios")}>
          Meus Resultados
        </SubjectButton>
      </div>
    </div>
  );
}
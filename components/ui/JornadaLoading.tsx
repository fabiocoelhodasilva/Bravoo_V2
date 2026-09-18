import BottomNav from "./BottomNav";

type Props = {
  active: "objetivos" | "livros" | "meu-dia";
  titulo: string;
};

export default function JornadaLoading({ active, titulo }: Props) {
  return (
    <main className="min-h-screen bg-black px-4 pb-[120px] pt-[60px] text-white" aria-busy="true">
      <h1 className="gradient-text text-center text-[1.55rem] font-bold sm:text-4xl">{titulo}</h1>
      <p role="status" className="mt-6 text-center text-sm text-white/60">Carregando...</p>
      <BottomNav active={active} />
    </main>
  );
}

import MandalaResumo from "./MandalaResumo";

type JornadaResumoProps = {
  joiasConquistadas: string[];
};

export default function JornadaResumo({
  joiasConquistadas,
}: JornadaResumoProps) {
  return (
    <section
      className="
        w-full
        max-w-sm
        mb-5
        animate-fade-in
      "
    >
      <div
        className="
          w-full
        "
      >
        <MandalaResumo joiasConquistadas={joiasConquistadas} />
      </div>
    </section>
  );
}
"use client";

/**
 * GeografiaHUD
 *
 * Esse componente representa a interface (HUD = Heads-Up Display) do jogo de geografia.
 *
 * Responsabilidades:
 * - Exibir o país atual que o usuário deve encontrar no globo (target)
 * - Mostrar mensagens de feedback ao usuário (acerto ou erro)
 *
 * Ele NÃO contém nenhuma lógica de jogo.
 * Apenas recebe os dados via props e exibe na tela.
 *
 * Separar esse componente ajuda a:
 * - manter a página mais limpa
 * - facilitar manutenção e evolução do layout
 * - permitir reutilização futura (ex: outros modos de jogo)
 */

type Props = {
  target: string;
  feedback: string;
};

export default function GeografiaHUD({ target, feedback }: Props) {
  return (
    <div className="geo-hud">
      <div className="geo-title">
        Clique em: {target}
      </div>
      <div className="geo-feedback">
        {feedback}
      </div>
    </div>
  );
}
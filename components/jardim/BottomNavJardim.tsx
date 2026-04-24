"use client";

import { Menu, Move, Pencil, Package } from "lucide-react";

type BottomNavJardimProps = {
  flyMode: boolean;
  editMode: boolean;
  onMenu: () => void;
  onFly: () => void;
  onItems: () => void;
  onEdit: () => void;
};

export default function BottomNavJardim({
  flyMode,
  editMode,
  onMenu,
  onFly,
  onItems,
  onEdit,
}: BottomNavJardimProps) {
  const itemBase =
    "flex flex-col items-center justify-center gap-1 text-[0.72rem] font-medium transition";

  const activeClass = "text-white";
  const inactiveClass = "text-white/60";
  const iconBase = "h-[22px] w-[22px]";

  return (
    <nav
      className="fixed bottom-0 left-0 z-50 w-full border-t border-white/10 bg-[#111]/95 backdrop-blur"
      onClick={(event) => event.stopPropagation()}
    >
      <div className="mx-auto grid h-[64px] max-w-[1100px] grid-cols-4 px-4">

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onMenu();
          }}
          className={`${itemBase} ${inactiveClass}`}
          aria-label="Menu"
        >
          <Menu className={iconBase} strokeWidth={2.1} />
          <span>Menu</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onFly();
          }}
          className={`${itemBase} ${flyMode ? activeClass : inactiveClass}`}
          aria-label="Movimento"
        >
          <Move className={iconBase} strokeWidth={flyMode ? 2.4 : 2.1} />
          <span>Movimento</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onItems();
          }}
          className={`${itemBase} ${inactiveClass}`}
          aria-label="Itens do Jardim"
        >
          <Package className={iconBase} strokeWidth={2.1} />
          <span>Itens do Jardim</span>
        </button>

        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onEdit();
          }}
          className={`${itemBase} ${editMode ? activeClass : inactiveClass}`}
          aria-label="Editar jardim"
        >
          <Pencil className={iconBase} strokeWidth={editMode ? 2.4 : 2.1} />
          <span>Editar jardim</span>
        </button>

      </div>
    </nav>
  );
}
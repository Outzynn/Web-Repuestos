"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "./DataProvider";

const tabs = [
  { href: "/", label: "A comprar", icon: "cart" as const },
  { href: "/stock", label: "Stock", icon: "box" as const },
  { href: "/agregar", label: "Agregar", icon: "plus" as const },
];

function Icon({ name, active }: { name: "cart" | "box" | "plus"; active: boolean }) {
  const stroke = active ? "#0071e3" : "#86868b";
  const common = {
    width: 26,
    height: 26,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke,
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };
  if (name === "cart") {
    return (
      <svg {...common}>
        <path d="M4 5h2l2.4 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.5L21 8H7" />
        <circle cx="10" cy="20" r="1.3" />
        <circle cx="18" cy="20" r="1.3" />
      </svg>
    );
  }
  if (name === "box") {
    return (
      <svg {...common}>
        <path d="M3 8.5 12 4l9 4.5v7L12 20l-9-4.5v-7Z" />
        <path d="M3 8.5 12 13l9-4.5M12 13v7" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M12 5v14M5 12h14" />
    </svg>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const { items } = useData();
  const pending = items.filter((i) => !i.done).length;

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-white/85 backdrop-blur-xl">
      <div className="safe-bottom mx-auto flex max-w-md items-stretch">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className="relative flex flex-1 flex-col items-center gap-1 pt-2 text-[11px] font-medium"
              style={{ color: active ? "#0071e3" : "#86868b" }}
            >
              <span className="relative">
                <Icon name={tab.icon} active={active} />
                {tab.href === "/" && pending > 0 && (
                  <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {pending}
                  </span>
                )}
              </span>
              {tab.label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}

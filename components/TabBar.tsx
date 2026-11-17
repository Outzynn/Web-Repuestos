"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useData } from "./DataProvider";

type IconName = "sell" | "box" | "wrench" | "chart" | "cart";

const tabs: { href: string; label: string; icon: IconName }[] = [
  { href: "/", label: "Vender", icon: "sell" },
  { href: "/stock", label: "Stock", icon: "box" },
  { href: "/service", label: "Service", icon: "wrench" },
  { href: "/caja", label: "Caja", icon: "chart" },
  { href: "/comprar", label: "Comprar", icon: "cart" },
];

function Icon({ name }: { name: IconName }) {
  const common = {
    width: 25,
    height: 25,
    viewBox: "0 0 24 24",
    fill: "none",
    stroke: "currentColor",
    strokeWidth: 1.9,
    strokeLinecap: "round" as const,
    strokeLinejoin: "round" as const,
  };

  if (name === "sell") {
    return (
      <svg {...common}>
        <path d="M20.6 12.3 12.3 20.6a2 2 0 0 1-2.8 0l-6-6a2 2 0 0 1-.6-1.6l.5-6.1a2 2 0 0 1 1.8-1.8l6.1-.5a2 2 0 0 1 1.6.6l6 6a2 2 0 0 1 0 2.8Z" />
        <circle cx="8.5" cy="8.5" r="1.4" />
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
  if (name === "wrench") {
    return (
      <svg {...common}>
        <path d="M15.5 3.5a5 5 0 0 0-4.6 6.9L3.8 17.5a1.8 1.8 0 0 0 2.5 2.5l7.1-7.1a5 5 0 0 0 6.1-6.6l-2.9 2.9-2.4-2.4 2.9-2.9a5 5 0 0 0-1.7-.4Z" />
      </svg>
    );
  }
  if (name === "chart") {
    return (
      <svg {...common}>
        <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" />
      </svg>
    );
  }
  return (
    <svg {...common}>
      <path d="M4 5h2l2.4 10.4a2 2 0 0 0 2 1.6h7.2a2 2 0 0 0 2-1.5L21 8H7" />
      <circle cx="10" cy="20" r="1.3" />
      <circle cx="18" cy="20" r="1.3" />
    </svg>
  );
}

export function TabBar() {
  const pathname = usePathname();
  const { items, jobs } = useData();

  const badges: Record<string, number> = {
    "/comprar": items.filter((i) => !i.done).length,
    "/service": jobs.filter((j) => j.status !== "entregado").length,
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-line bg-card/85 backdrop-blur-xl">
      <div className="safe-bottom mx-auto flex max-w-md items-stretch">
        {tabs.map((tab) => {
          const active = pathname === tab.href;
          const badge = badges[tab.href] ?? 0;
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={
                "relative flex flex-1 flex-col items-center gap-0.5 pt-2 text-[10px] font-medium " +
                (active ? "text-brand" : "text-muted")
              }
            >
              <span className="relative">
                <Icon name={tab.icon} />
                {badge > 0 && (
                  <span className="absolute -right-2 -top-1 min-w-[18px] rounded-full bg-danger px-1 text-center text-[10px] font-bold leading-[18px] text-white">
                    {badge}
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

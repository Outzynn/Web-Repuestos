"use client";

import { useMemo, useState } from "react";
import { useData } from "@/components/DataProvider";
import { Chips, Empty, GhostButton, Header, Sheet, useToast } from "@/components/ui";
import {
  dayKey,
  dayLabel,
  inPeriod,
  money,
  PERIODS,
  whenLabel,
  type Period,
} from "@/lib/format";
import { facuCut, saleProfit, shopProfit, type Job, type Sale } from "@/lib/types";

type Movement =
  | { kind: "venta"; at: string; sale: Sale }
  | { kind: "service"; at: string; job: Job };

export default function CajaPage() {
  const { ready, sales, jobs, deleteSale } = useData();
  const { toast, show } = useToast();

  const [period, setPeriod] = useState<Period>("hoy");
  const [openSaleId, setOpenSaleId] = useState<string | null>(null);

  const periodSales = useMemo(
    () => sales.filter((sale) => inPeriod(sale.createdAt, period)),
    [sales, period],
  );

  const periodJobs = useMemo(
    () =>
      jobs.filter(
        (job) => job.status === "entregado" && inPeriod(job.closedAt ?? job.createdAt, period),
      ),
    [jobs, period],
  );

  const ventas = periodSales.reduce((sum, s) => sum + s.total, 0);
  const service = periodJobs.reduce((sum, j) => sum + (j.charged ?? 0), 0);
  // La ganancia es lo que queda para el local: la parte de Facu va aparte.
  const ganancia =
    periodSales.reduce((sum, s) => sum + saleProfit(s), 0) +
    periodJobs.reduce((sum, j) => sum + shopProfit(j), 0);
  const paraFacu = periodJobs.reduce((sum, j) => sum + facuCut(j), 0);

  const porMedio = useMemo(() => {
    const map = new Map<string, number>();
    for (const sale of periodSales) {
      map.set(sale.pay, (map.get(sale.pay) ?? 0) + sale.total);
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1]);
  }, [periodSales]);

  const porCobrar = jobs
    .filter((j) => j.status === "entregado" && !j.paid)
    .reduce((sum, j) => sum + (j.charged ?? 0), 0);

  const facuPendiente = jobs
    .filter((j) => j.status === "entregado" && !j.facuPaid)
    .reduce((sum, j) => sum + facuCut(j), 0);

  const movements = useMemo<Movement[]>(() => {
    const list: Movement[] = [
      ...periodSales.map((sale) => ({ kind: "venta" as const, at: sale.createdAt, sale })),
      ...periodJobs.map((job) => ({
        kind: "service" as const,
        at: job.closedAt ?? job.createdAt,
        job,
      })),
    ];
    return list.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime());
  }, [periodSales, periodJobs]);

  const days = useMemo(() => {
    const map = new Map<string, Movement[]>();
    for (const movement of movements) {
      const key = dayKey(movement.at);
      map.set(key, [...(map.get(key) ?? []), movement]);
    }
    return [...map.entries()];
  }, [movements]);

  const openSale = sales.find((s) => s.id === openSaleId) ?? null;

  return (
    <main className="px-4">
      <Header title="Caja" subtitle="Lo que entro, sin cuentas a mano" />

      <div className="mt-3">
        <Chips
          options={PERIODS.map((p) => p.label)}
          value={PERIODS.find((p) => p.id === period)?.label ?? "Hoy"}
          onChange={(label) => {
            const found = PERIODS.find((p) => p.label === label);
            if (found) setPeriod(found.id);
          }}
        />
      </div>

      <section className="mt-4 rounded-2xl bg-card p-4 shadow-sm">
        <p className="text-[13px] font-semibold uppercase tracking-wide text-muted">
          Entro en total
        </p>
        <p className="mt-1 text-[38px] font-bold leading-none tabular-nums">
          {money(ventas + service)}
        </p>

        <div className="mt-4 grid grid-cols-3 gap-2 border-t border-line pt-3 text-center">
          <div>
            <p className="text-[12px] text-muted">Productos</p>
            <p className="text-[17px] font-semibold tabular-nums">{money(ventas)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted">Service</p>
            <p className="text-[17px] font-semibold tabular-nums">{money(service)}</p>
          </div>
          <div>
            <p className="text-[12px] text-muted">Ganancia</p>
            <p className="text-[17px] font-semibold tabular-nums text-ok">{money(ganancia)}</p>
          </div>
        </div>

        {paraFacu > 0 && (
          <p className="mt-3 border-t border-line pt-3 text-[13px] text-muted">
            Aparte de eso, a Facu le corresponden{" "}
            <span className="font-semibold text-ink">{money(paraFacu)}</span> de los equipos
            entregados.
          </p>
        )}

        {porMedio.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 border-t border-line pt-3">
            {porMedio.map(([metodo, monto]) => (
              <span
                key={metodo}
                className="rounded-full bg-app px-3 py-1.5 text-[13px] font-medium"
              >
                {metodo} <span className="tabular-nums text-muted">{money(monto)}</span>
              </span>
            ))}
          </div>
        )}
      </section>

      {porCobrar > 0 && (
        <p className="mt-3 rounded-2xl bg-warn/10 px-4 py-3 text-[14px] font-medium text-warn">
          Te deben {money(porCobrar)} de equipos ya entregados
        </p>
      )}

      {facuPendiente > 0 && (
        <p className="mt-3 rounded-2xl bg-card px-4 py-3 text-[14px] font-medium">
          Le debes {money(facuPendiente)} a Facu
        </p>
      )}

      <section className="mt-5">
        {!ready ? (
          <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
        ) : movements.length === 0 ? (
          <Empty title="Sin movimientos" hint="Las ventas y los equipos entregados aparecen aca" />
        ) : (
          days.map(([key, list]) => (
            <div key={key} className="mb-5">
              <div className="mb-2 flex items-end justify-between px-1">
                <h2 className="text-[13px] font-semibold uppercase tracking-wide text-muted">
                  {dayLabel(key)}
                </h2>
                <span className="text-[13px] font-semibold tabular-nums text-muted">
                  {money(
                    list.reduce(
                      (sum, m) => sum + (m.kind === "venta" ? m.sale.total : m.job.charged ?? 0),
                      0,
                    ),
                  )}
                </span>
              </div>
              <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
                {list.map((movement) =>
                  movement.kind === "venta" ? (
                    <li key={movement.sale.id}>
                      <button
                        type="button"
                        onClick={() => setOpenSaleId(movement.sale.id)}
                        className="flex w-full items-center gap-3 px-3 py-2.5 text-left active:bg-app"
                      >
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-[16px] font-medium">
                            {movement.sale.lines.map((l) => l.name).join(", ")}
                          </span>
                          <span className="block truncate text-[13px] text-muted">
                            {whenLabel(movement.sale.createdAt)} · {movement.sale.pay}
                            {movement.sale.note ? " · " + movement.sale.note : ""}
                          </span>
                        </span>
                        <span className="shrink-0 text-[17px] font-semibold tabular-nums">
                          {money(movement.sale.total)}
                        </span>
                      </button>
                    </li>
                  ) : (
                    <li key={movement.job.id} className="flex items-center gap-3 px-3 py-2.5">
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-[16px] font-medium">
                          {movement.job.device}
                          <span className="ml-2 rounded-full bg-app px-2 py-0.5 text-[11px] font-semibold text-muted">
                            service
                          </span>
                        </span>
                        <span className="block truncate text-[13px] text-muted">
                          {movement.job.customer ? movement.job.customer + " · " : ""}
                          {whenLabel(movement.at)}
                          {movement.job.paid ? "" : " · debe"}
                        </span>
                      </span>
                      <span className="shrink-0 text-[17px] font-semibold tabular-nums">
                        {money(movement.job.charged)}
                      </span>
                    </li>
                  ),
                )}
              </ul>
            </div>
          ))
        )}
      </section>

      {openSale && (
        <Sheet open onClose={() => setOpenSaleId(null)} title="Venta">
          <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card">
            {openSale.lines.map((line, index) => (
              <li key={index} className="flex items-center justify-between gap-3 px-3 py-2.5">
                <span className="min-w-0 flex-1 truncate text-[16px]">
                  {line.qty > 1 && <span className="font-semibold text-brand">{line.qty}x </span>}
                  {line.name}
                </span>
                <span className="shrink-0 text-[16px] font-semibold tabular-nums">
                  {money(line.price * line.qty)}
                </span>
              </li>
            ))}
          </ul>

          <div className="mt-3 space-y-1 px-1 text-[14px] text-muted">
            <p>{whenLabel(openSale.createdAt)} · {openSale.pay}</p>
            <p>
              Total <span className="font-semibold text-ink">{money(openSale.total)}</span> ·
              ganancia <span className="font-semibold text-ok">{money(saleProfit(openSale))}</span>
            </p>
            {openSale.note && <p>Nota: {openSale.note}</p>}
          </div>

          <div className="mt-4">
            <GhostButton
              tone="danger"
              onClick={async () => {
                if (!window.confirm("¿Borrar la venta y devolver el stock?")) return;
                await deleteSale(openSale.id);
                setOpenSaleId(null);
                show("Venta borrada, stock devuelto");
              }}
            >
              Borrar venta y devolver el stock
            </GhostButton>
          </div>
        </Sheet>
      )}

      {toast}
    </main>
  );
}

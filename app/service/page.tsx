"use client";

import { useEffect, useRef, useState } from "react";
import { useData } from "@/components/DataProvider";
import {
  AddButton,
  Chips,
  Empty,
  SearchButton,
  Field,
  GhostButton,
  Header,
  PrimaryButton,
  Sheet,
  Toggle,
  useToast,
} from "@/components/ui";
import { money, parseMoney, whenLabel } from "@/lib/format";
import {
  facuCut,
  keyOf,
  shopProfit,
  type FacuKind,
  type Job,
  type JobStatus,
} from "@/lib/types";

const STATUS_LABEL: Record<JobStatus, string> = {
  taller: "En el taller",
  listo: "Listo para retirar",
  entregado: "Entregados",
};

export default function ServicePage() {
  const { ready, jobs, addJob, updateJob, deleteJob } = useData();
  const { toast, show } = useToast();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [searching, setSearching] = useState(false);
  const [query, setQuery] = useState("");
  const searchRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searching) searchRef.current?.focus();
  }, [searching]);

  // Busca por equipo, por quien lo trajo y por lo que habia que hacerle.
  const q = keyOf(query);
  const matches = (job: Job) =>
    q.length === 0 ||
    [job.device, job.customer, job.issue, job.note].some(
      (field) => field && keyOf(field).includes(q),
    );

  const buscando = q.length > 0;
  const encontrados = jobs.filter(matches);
  const taller = encontrados.filter((j) => j.status === "taller");
  const listos = encontrados.filter((j) => j.status === "listo");
  const entregadosTodos = encontrados.filter((j) => j.status === "entregado");
  // Sin buscar alcanza con los ultimos; buscando se miran todos.
  const entregados = buscando ? entregadosTodos : entregadosTodos.slice(0, 15);
  const porCobrar = jobs
    .filter((j) => j.status === "entregado" && !j.paid)
    .reduce((sum, j) => sum + (j.charged ?? 0), 0);

  const editing = jobs.find((j) => j.id === editingId) ?? null;

  const subtitle = buscando
    ? encontrados.length === 1
      ? "1 equipo encontrado"
      : encontrados.length + " equipos encontrados"
    : jobs.length === 0
      ? "Equipos que entran a reparacion"
      : taller.length +
        " en el taller · " +
        listos.length +
        " listos" +
        (porCobrar > 0 ? " · " + money(porCobrar) + " por cobrar" : "");

  return (
    <main className="px-4">
      <Header
        title="Service"
        subtitle={subtitle}
        right={
          <>
            <SearchButton
              open={searching}
              onClick={() => {
                setSearching((v) => !v);
                if (searching) setQuery("");
              }}
            />
            <AddButton onClick={() => setAdding(true)} label="Nuevo equipo" />
          </>
        }
      />

      {/* La barra se despliega recien cuando tocan la lupa */}
      <div
        className={
          "grid transition-all duration-200 " +
          (searching ? "mt-3 grid-rows-[1fr] opacity-100" : "grid-rows-[0fr] opacity-0")
        }
      >
        <div className="overflow-hidden">
          <div className="relative">
            <span className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted">
              <svg
                width="18"
                height="18"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
                strokeLinecap="round"
              >
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              ref={searchRef}
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Equipo, cliente o falla"
              enterKeyHint="search"
              autoComplete="off"
              tabIndex={searching ? 0 : -1}
              className="w-full rounded-xl border border-line bg-card py-3 pl-10 pr-9 text-[17px] outline-none placeholder:text-muted focus:ring-2 focus:ring-brand/40"
            />
            {query && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  searchRef.current?.focus();
                }}
                aria-label="Limpiar busqueda"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted"
              >
                ✕
              </button>
            )}
          </div>
        </div>
      </div>

      {!ready ? (
        <p className="py-10 text-center text-[14px] text-muted">Cargando...</p>
      ) : buscando && encontrados.length === 0 ? (
        <div className="mt-5">
          <Empty title="Sin resultados" hint="Proba con el equipo, el nombre o la falla" />
        </div>
      ) : jobs.length === 0 ? (
        <div className="mt-5">
          <Empty
            title="Nada en el taller"
            hint="Toca + cuando entre un equipo: equipo y, si querés, de quien es"
          />
        </div>
      ) : (
        <>
          <Group title={STATUS_LABEL.taller} jobs={taller} onOpen={setEditingId} />
          <Group title={STATUS_LABEL.listo} jobs={listos} onOpen={setEditingId} />
          <Group title={STATUS_LABEL.entregado} jobs={entregados} onOpen={setEditingId} />
        </>
      )}

      {adding && (
        <JobSheet
          onClose={() => setAdding(false)}
          onSave={async (values) => {
            await addJob(values);
            setAdding(false);
            show("Equipo anotado");
          }}
        />
      )}

      {editing && (
        <JobSheet
          key={editing.id}
          job={editing}
          onClose={() => setEditingId(null)}
          onSave={async (values) => {
            await updateJob(editing.id, values);
            setEditingId(null);
            show("Guardado");
          }}
          onStatus={async (status, patch) => {
            await updateJob(editing.id, {
              ...patch,
              status,
              closedAt: status === "entregado" ? new Date().toISOString() : null,
            });
            setEditingId(null);
            show(status === "entregado" ? "Entregado" : STATUS_LABEL[status]);
          }}
          onDelete={async () => {
            if (!window.confirm("¿Borrar " + editing.device + "?")) return;
            await deleteJob(editing.id);
            setEditingId(null);
            show("Borrado");
          }}
        />
      )}

      {toast}
    </main>
  );
}

function Group({
  title,
  jobs,
  onOpen,
}: {
  title: string;
  jobs: Job[];
  onOpen: (id: string) => void;
}) {
  if (jobs.length === 0) return null;

  return (
    <section className="mt-5">
      <h2 className="mb-2 px-1 text-[13px] font-semibold uppercase tracking-wide text-muted">
        {title} ({jobs.length})
      </h2>
      <ul className="divide-y divide-line overflow-hidden rounded-2xl bg-card shadow-sm">
        {jobs.map((job) => (
          <li key={job.id}>
            <button
              type="button"
              onClick={() => onOpen(job.id)}
              className="flex w-full items-center gap-3 px-3 py-3 text-left active:bg-app"
            >
              <span className="min-w-0 flex-1">
                <span className="block truncate text-[17px] font-medium">{job.device}</span>
                <span className="block truncate text-[13px] text-muted">
                  {job.customer ? job.customer + " · " : ""}
                  {whenLabel(job.createdAt)}
                </span>
                {job.issue && <span className="block truncate text-[13px] text-muted">{job.issue}</span>}
              </span>
              <span className="shrink-0 text-right">
                <span className="block text-[16px] font-semibold tabular-nums">
                  {money(job.charged)}
                </span>
                {job.status === "entregado" && !job.paid && (
                  <span className="text-[12px] font-semibold text-warn">debe</span>
                )}
                {job.status === "entregado" && job.paid && (
                  <span className="text-[12px] font-medium text-ok">cobrado</span>
                )}
                {job.status !== "entregado" && job.charged !== null && (
                  <span className="text-[12px] text-muted">deja {money(shopProfit(job))}</span>
                )}
                {facuCut(job) > 0 && (
                  <span className="block text-[12px] text-muted">
                    Facu {money(facuCut(job))}
                    {job.status === "entregado" && !job.facuPaid ? " (sin pagar)" : ""}
                  </span>
                )}
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

type JobValues = {
  device: string;
  customer: string | null;
  issue: string | null;
  partsCost: number | null;
  charged: number | null;
  paid: boolean;
  facuKind: FacuKind | null;
  facuValue: number | null;
  facuPaid: boolean;
};

const FACU_OPTIONS = ["Sin Facu", "Porcentaje", "Monto fijo"] as const;

function JobSheet({
  job,
  onClose,
  onSave,
  onStatus,
  onDelete,
}: {
  job?: Job;
  onClose: () => void;
  onSave: (values: JobValues) => Promise<void>;
  onStatus?: (status: JobStatus, values: JobValues) => Promise<void>;
  onDelete?: () => Promise<void>;
}) {
  const [device, setDevice] = useState(job?.device ?? "");
  const [customer, setCustomer] = useState(job?.customer ?? "");
  const [issue, setIssue] = useState(job?.issue ?? "");
  const [charged, setCharged] = useState(job?.charged ? String(job.charged) : "");
  const [partsCost, setPartsCost] = useState(job?.partsCost ? String(job.partsCost) : "");
  const [paid, setPaid] = useState(job?.paid ?? false);
  const [facuPaid, setFacuPaid] = useState(job?.facuPaid ?? false);
  const [facuMode, setFacuMode] = useState<string>(
    job?.facuKind === "porcentaje"
      ? "Porcentaje"
      : job?.facuKind === "monto"
        ? "Monto fijo"
        : "Sin Facu",
  );
  const [facuValue, setFacuValue] = useState(job?.facuValue ? String(job.facuValue) : "");

  const facuKind: FacuKind | null =
    facuMode === "Porcentaje" ? "porcentaje" : facuMode === "Monto fijo" ? "monto" : null;

  const values = (): JobValues => ({
    device: device.trim(),
    customer: customer.trim() ? customer.trim() : null,
    issue: issue.trim() ? issue.trim() : null,
    charged: parseMoney(charged),
    partsCost: parseMoney(partsCost),
    paid,
    facuKind,
    facuValue: facuKind ? parseMoney(facuValue) : null,
    facuPaid,
  });

  const ganancia = (parseMoney(charged) ?? 0) - (parseMoney(partsCost) ?? 0);
  const paraFacu = !facuKind
    ? 0
    : facuKind === "monto"
      ? (parseMoney(facuValue) ?? 0)
      : Math.round((ganancia * (parseMoney(facuValue) ?? 0)) / 100);

  return (
    <Sheet open onClose={onClose} title={job ? job.device : "Entra un equipo"}>
      <div className="space-y-3">
        <Field
          label="Equipo"
          value={device}
          onChange={setDevice}
          placeholder="Ej: iPhone 13 Pro"
          autoFocus={!job}
        />
        <Field label="De quien es (opcional)" value={customer} onChange={setCustomer} placeholder="Nombre o telefono" />
        <Field label="Que hay que hacerle (opcional)" value={issue} onChange={setIssue} placeholder="Ej: cambio de modulo" />

        <div className="grid grid-cols-2 gap-3">
          <Field label="Se cobra" value={charged} onChange={setCharged} placeholder="0" money />
          <Field label="Repuesto" value={partsCost} onChange={setPartsCost} placeholder="0" money />
        </div>

        {/* La parte de Facu: a veces un porcentaje, a veces un monto fijo */}
        <div>
          <span className="mb-1 block px-1 text-[12px] font-semibold uppercase tracking-wide text-muted">
            Para Facu
          </span>
          <Chips options={[...FACU_OPTIONS]} value={facuMode} onChange={setFacuMode} />
        </div>

        {facuKind && (
          <Field
            label={facuKind === "porcentaje" ? "% de la ganancia" : "Cuanto se lleva"}
            value={facuValue}
            onChange={setFacuValue}
            placeholder={facuKind === "porcentaje" ? "50" : "0"}
            money={facuKind === "monto"}
          />
        )}

        {(charged || partsCost) && (
          <p className="px-1 text-[13px] text-muted">
            Ganancia: <span className="font-semibold text-ok">{money(ganancia)}</span>
            {paraFacu > 0 && (
              <>
                {" · Facu "}
                <span className="font-semibold text-ink">{money(paraFacu)}</span>
                {" · te queda "}
                <span className="font-semibold text-ok">{money(ganancia - paraFacu)}</span>
              </>
            )}
          </p>
        )}

        {/* El "debe" se marca solo cuando el equipo ya salio del taller */}
        {job?.status === "entregado" && (
          <Toggle label="Ya me pago" value={paid} onChange={setPaid} />
        )}
        {job?.status === "entregado" && paraFacu > 0 && (
          <Toggle label="Ya le pague a Facu" value={facuPaid} onChange={setFacuPaid} />
        )}

        <PrimaryButton onClick={() => onSave(values())} disabled={!device.trim()}>
          {job ? "Guardar cambios" : "Anotar equipo"}
        </PrimaryButton>

        {job && onStatus && job.status === "taller" && (
          <GhostButton onClick={() => onStatus("listo", values())}>Marcar listo</GhostButton>
        )}
        {job && onStatus && job.status !== "entregado" && (
          <>
            <PrimaryButton
              tone="ok"
              onClick={() => onStatus("entregado", { ...values(), paid: true })}
              disabled={!device.trim()}
            >
              Entregar y cobrar
            </PrimaryButton>
            <GhostButton onClick={() => onStatus("entregado", { ...values(), paid: false })} tone="muted">
              Entregar y queda debiendo
            </GhostButton>
          </>
        )}
        {job && onStatus && job.status === "entregado" && (
          <GhostButton onClick={() => onStatus("taller", values())} tone="muted">
            Volver al taller
          </GhostButton>
        )}
        {onDelete && (
          <GhostButton onClick={onDelete} tone="danger">
            Borrar
          </GhostButton>
        )}
      </div>
    </Sheet>
  );
}

"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getLocalDb,
  getActiveOperator,
  setActiveOperator,
  ensureInitialOperator,
} from "@/lib/db/local-db";
import type { AppOperator, AppRole } from "@/types/parking";

export function OperatorsManager() {
  const [operators, setOperators] = useState<AppOperator[]>([]);
  const [activeOp, setActiveOp] = useState<AppOperator | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  // Formulario nuevo operador
  const [name, setName] = useState("");
  const [role, setRole] = useState<AppRole>("OPERATOR");
  const [document, setDocument] = useState("");
  const [phone, setPhone] = useState("");
  const [formSuccess, setFormSuccess] = useState<string | null>(null);

  const loadOperators = useCallback(async () => {
    try {
      const db = getLocalDb();
      await ensureInitialOperator();
      const list = await db.operators.toArray();
      const active = await getActiveOperator();
      setOperators(list);
      setActiveOp(active);
    } catch (err) {
      console.error("Error al cargar operadores:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let active = true;
    Promise.resolve().then(() => {
      if (active) {
        loadOperators();
      }
    });
    return () => {
      active = false;
    };
  }, [loadOperators]);

  const handleSelectActive = async (op: AppOperator) => {
    await setActiveOperator(op.id);
    setActiveOp(op);
  };

  const handleCreateOperator = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;

    const newOp: AppOperator = {
      id: crypto.randomUUID(),
      name: name.trim(),
      role,
      document: document.trim() || undefined,
      phone: phone.trim() || undefined,
      isActive: true,
      createdAt: new Date().toISOString(),
    };

    const db = getLocalDb();
    await db.operators.add(newOp);

    setName("");
    setDocument("");
    setPhone("");
    setFormSuccess(`Operador "${newOp.name}" creado con éxito.`);
    setTimeout(() => setFormSuccess(null), 3000);

    await loadOperators();
  };

  const handleToggleActive = async (op: AppOperator) => {
    const db = getLocalDb();
    await db.operators.update(op.id, { isActive: !op.isActive });
    await loadOperators();
  };

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <p className="text-sm font-medium text-slate-400">Cargando operadores del sistema...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-white">Administración de Operadores</h1>
        <p className="mt-1 text-sm text-slate-400">
          Control de acceso por turnos, auditoría de cajeros y roles del parqueadero.
        </p>
      </div>

      {/* Operador en Turno Actual */}
      <div className="rounded-2xl border border-teal-500/30 bg-teal-500/5 p-4 sm:p-5">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-3">
            <span className="flex h-12 w-12 items-center justify-center rounded-2xl bg-teal-500/20 text-2xl text-teal-300">
              👤
            </span>
            <div>
              <p className="text-xs font-semibold uppercase tracking-wider text-teal-400">
                Operador en Turno Activo
              </p>
              <p className="text-lg font-bold text-white">
                {activeOp?.name || "Sin seleccionar"}
              </p>
              <p className="text-xs text-slate-400">
                Rol: <span className="font-semibold text-teal-300">{activeOp?.role}</span>
                {activeOp?.document ? ` · CC: ${activeOp.document}` : ""}
              </p>
            </div>
          </div>
          <span className="inline-flex self-start sm:self-auto items-center rounded-full bg-emerald-500/20 px-3 py-1 text-xs font-bold text-emerald-300">
            ● Turno en ejecución
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Lista de Operadores */}
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Personal Registrado ({operators.length})
          </h2>

          <div className="space-y-2">
            {operators.map((op) => {
              const isCurrent = activeOp?.id === op.id;
              return (
                <div
                  key={op.id}
                  className={`flex items-center justify-between gap-3 rounded-2xl border p-4 transition ${
                    isCurrent
                      ? "border-teal-500/50 bg-slate-900/90 shadow-md shadow-teal-500/10"
                      : "border-slate-800 bg-slate-900/50 hover:bg-slate-900"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{op.role === "ADMIN" ? "👑" : "💼"}</span>
                    <div>
                      <p className="text-sm font-bold text-white flex items-center gap-2">
                        {op.name}
                        {isCurrent && (
                          <span className="rounded bg-teal-500/20 px-1.5 py-0.5 text-[10px] font-bold text-teal-300">
                            En turno
                          </span>
                        )}
                      </p>
                      <p className="text-xs text-slate-400">
                        {op.role === "ADMIN" ? "Administrador" : "Operador de Caja"}
                        {op.phone ? ` · Tel: ${op.phone}` : ""}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    {!isCurrent && op.isActive && (
                      <button
                        type="button"
                        onClick={() => handleSelectActive(op)}
                        className="rounded-xl border border-teal-500/30 bg-teal-500/10 px-3 py-1.5 text-xs font-semibold text-teal-300 transition hover:bg-teal-500/20 active:scale-95"
                      >
                        Iniciar Turno
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => handleToggleActive(op)}
                      className={`rounded-xl px-2.5 py-1.5 text-xs font-semibold transition ${
                        op.isActive
                          ? "text-slate-400 hover:text-rose-400"
                          : "text-amber-400 hover:text-amber-300"
                      }`}
                      title={op.isActive ? "Desactivar operador" : "Activar operador"}
                    >
                      {op.isActive ? "Activo" : "Inactivo"}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Formulario Nuevo Operador */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <h2 className="text-sm font-bold uppercase tracking-wider text-slate-300">
            Registrar Nuevo Operador
          </h2>

          <form onSubmit={handleCreateOperator} className="mt-4 space-y-4">
            <div>
              <label className="block text-xs font-medium text-slate-300">Nombre completo *</label>
              <input
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Ej: Carlos Gómez"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Rol en el sistema</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as AppRole)}
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white focus:border-teal-400 focus:outline-none"
              >
                <option value="OPERATOR">Operador (Entradas, Salidas y Cobro)</option>
                <option value="ADMIN">Administrador (Acceso Total)</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Cédula / Documento</label>
              <input
                type="text"
                value={document}
                onChange={(e) => setDocument(e.target.value)}
                placeholder="Ej: 1085234567"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
              />
            </div>

            <div>
              <label className="block text-xs font-medium text-slate-300">Celular</label>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="Ej: 312 456 7890"
                className="mt-1 w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white placeholder-slate-500 focus:border-teal-400 focus:outline-none"
              />
            </div>

            {formSuccess && (
              <p className="text-xs font-semibold text-emerald-400">{formSuccess}</p>
            )}

            <button
              type="submit"
              className="w-full rounded-xl bg-teal-500 py-2.5 text-xs font-bold text-slate-950 shadow-md shadow-teal-500/20 transition hover:bg-teal-400 active:scale-95"
            >
              + Guardar Operador
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

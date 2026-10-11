import type { FormationName } from "./formations";

// A tiny registry shared by the DOM stages and the canvas director.

export interface StageRecord {
  id: string;
  el: HTMLElement;
  formation: FormationName;
}

export type ColonyStatus = "idle" | "running" | "off" | "unsupported";

type Listener = () => void;

class ColonyStore {
  stages = new Map<string, StageRecord>();
  status: ColonyStatus = "idle";
  enabled = true;
  // How many ants each stage holds, by stage id.
  counts = new Map<string, number>();
  private listeners = new Set<Listener>();

  register(id: string, el: HTMLElement, formation: FormationName) {
    this.stages.set(id, { id, el, formation });
  }

  update(id: string, formation: FormationName) {
    const s = this.stages.get(id);
    if (s) s.formation = formation;
  }

  unregister(id: string, el: HTMLElement) {
    if (this.stages.get(id)?.el === el) this.stages.delete(id);
  }

  setStatus(status: ColonyStatus) {
    this.status = status;
    document.documentElement.dataset.colony = status === "running" ? "on" : status === "idle" ? "" : "off";
    this.emit();
  }

  setCounts(counts: Map<string, number>) {
    this.counts = counts;
    this.emit();
  }

  setEnabled(enabled: boolean) {
    this.enabled = enabled;
    try {
      localStorage.setItem("gn-colony", enabled ? "1" : "0");
    } catch {}
    this.emit();
  }

  subscribe = (fn: Listener) => {
    this.listeners.add(fn);
    return () => this.listeners.delete(fn);
  };

  private emit() {
    for (const fn of this.listeners) fn();
  }
}

export const colonyStore = new ColonyStore();

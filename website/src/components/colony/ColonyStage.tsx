"use client";

import { useEffect, useRef, type ReactNode } from "react";
import type { FormationName } from "@/lib/colony/formations";
import { colonyStore } from "@/lib/colony/store";

// An empty box in the layout that the colony fills with a formation.
// `children` is the static fallback shown when the colony is not running.
export function ColonyStage({
  id,
  formation,
  className = "",
  children,
}: {
  id: string;
  formation: FormationName;
  className?: string;
  children?: ReactNode;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const formationRef = useRef(formation);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    colonyStore.register(id, el, formationRef.current);
    return () => colonyStore.unregister(id, el);
  }, [id]);

  useEffect(() => {
    formationRef.current = formation;
    colonyStore.update(id, formation);
  }, [id, formation]);

  return (
    <div
      ref={ref}
      data-colony-stage={id}
      aria-hidden
      className={`${/\b(absolute|fixed|sticky)\b/.test(className) ? "" : "relative"} ${className}`}
    >
      {children ? <div className="colony-fallback absolute inset-0">{children}</div> : null}
    </div>
  );
}

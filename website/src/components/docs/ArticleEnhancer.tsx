"use client";

import { useRouter } from "next/navigation";
import { useEffect, useRef, type ReactNode } from "react";
import { BASE_PATH } from "@/lib/docs/nav";

// Wraps the rendered Markdown: internal links navigate without a full reload,
// and every code block gets a copy button.
export function ArticleEnhancer({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useEffect(() => {
    const root = ref.current;
    if (!root) return;

    const onClick = (e: MouseEvent) => {
      if (e.defaultPrevented || e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
      const a = (e.target as HTMLElement).closest("a");
      if (!a || a.target || !a.getAttribute("href")) return;
      const href = a.getAttribute("href")!;
      if (!href.startsWith(`${BASE_PATH}/`)) return;
      const [path, hash] = href.slice(BASE_PATH.length).split("#");
      if (!hash || path !== window.location.pathname.slice(BASE_PATH.length)) {
        e.preventDefault();
        router.push(href.slice(BASE_PATH.length));
      }
    };
    root.addEventListener("click", onClick);

    const buttons: HTMLButtonElement[] = [];
    root.querySelectorAll("pre").forEach((pre) => {
      if (pre.querySelector(".copy-code")) return;
      const button = document.createElement("button");
      button.type = "button";
      button.className = "copy-code";
      button.textContent = "Copy";
      button.addEventListener("click", async () => {
        try {
          await navigator.clipboard.writeText(pre.querySelector("code")?.innerText ?? pre.innerText);
          button.textContent = "Copied";
          setTimeout(() => (button.textContent = "Copy"), 1500);
        } catch {}
      });
      pre.appendChild(button);
      buttons.push(button);
    });

    return () => {
      root.removeEventListener("click", onClick);
      buttons.forEach((b) => b.remove());
    };
  }, [router]);

  return <div ref={ref}>{children}</div>;
}

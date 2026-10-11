import type { ReactNode } from "react";
import { DocsSidebar } from "@/components/docs/Sidebar";
import { SearchDialog } from "@/components/docs/Search";
import { Footer } from "@/components/site/Footer";
import { Nav } from "@/components/site/Nav";
import { wrap } from "@/components/ui/primitives";
import { sidebar } from "@/lib/docs/content";
import "./docs.css";

export default function DocsLayout({ children }: { children: ReactNode }) {
  return (
    <>
      <Nav solid />
      <div className={`${wrap} pt-16 lg:pt-[72px]`}>
        <div className="grid grid-cols-1 lg:grid-cols-[15rem_minmax(0,1fr)] lg:gap-x-12 xl:grid-cols-[15rem_minmax(0,1fr)_13rem] xl:gap-x-14">
          <DocsSidebar sections={sidebar()} />
          {children}
        </div>
      </div>
      <Footer />
      <SearchDialog />
    </>
  );
}

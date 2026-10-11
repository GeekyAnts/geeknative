import { ArchitectureDiagram } from "@/components/diagrams/ArchitectureDiagram";
import { DeviceShowcase } from "@/components/showcase/DeviceShowcase";
import type { Chunk } from "@/lib/docs/markdown";
import { ArticleEnhancer } from "./ArticleEnhancer";

// Rendered Markdown, with the diagram and the screenshots dropped in where the page asks for them.
export function DocBody({ chunks }: { chunks: Chunk[] }) {
  return (
    <ArticleEnhancer>
      {chunks.map((chunk, i) =>
        chunk.type === "html" ? (
          <div key={i} className="docs-prose" dangerouslySetInnerHTML={{ __html: chunk.html }} />
        ) : (
          <figure key={i} className="docs-embed my-12" data-pagefind-ignore>
            {chunk.name === "architecture" ? <ArchitectureDiagram /> : <DeviceShowcase compact />}
          </figure>
        ),
      )}
    </ArticleEnhancer>
  );
}

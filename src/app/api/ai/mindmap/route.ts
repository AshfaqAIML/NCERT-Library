import { retrieve, compressContext } from "@/lib/ai-engine/retriever";
import { chat, extractJson } from "@/lib/ai";
import { handle } from "@/lib/http";

export const runtime = "nodejs";
export const maxDuration = 60;

interface MindMapNode {
  id: string;
  label: string;
  children?: MindMapNode[];
}

// Generate a visual mind map from book content
export async function POST(req: Request) {
  return handle(async () => {
    const { topic, bookId, subjectSlug, classNum } = await req.json();
    if (!topic) return new Response(JSON.stringify({ error: "Topic is required." }), { status: 400 });

    // Retrieve relevant chunks
    const result = await retrieve(topic, { topK: 8, filter: { bookId, subjectSlug, classNum } });
    if (result.chunks.length === 0) {
      return { mindmap: null, message: "I couldn't find content for this topic in the NCERT books." };
    }

    const context = compressContext(result.chunks, 4000);

    const raw = await chat([
      {
        role: "system",
        content: `You are an expert at creating structured mind maps for UPSC preparation. Return STRICT JSON only representing a mind map tree. Format: { "id": "root", "label": "Topic", "children": [ { "id": "1", "label": "Branch", "children": [...] } ] }. Keep labels short (2-5 words). 4-6 main branches, each with 2-4 sub-branches. No prose.`,
      },
      {
        role: "user",
        content: `Create a mind map for: ${topic}\n\nBased on this NCERT content:\n${context}\n\nStructure it as a hierarchical tree with the topic as root.`,
      },
    ]);

    const mindmap = extractJson<MindMapNode>(raw);
    const citations = result.chunks.map((c, i) => ({
      index: i + 1,
      bookTitle: c.bookTitle,
      chapter: c.chapter,
      page: c.page,
    }));

    return { mindmap, citations };
  });
}

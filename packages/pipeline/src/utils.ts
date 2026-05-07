import { prisma } from "@conscious-slovenia/database";

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")  // remove diacritics
    .replace(/[čć]/g, "c")
    .replace(/[šś]/g, "s")
    .replace(/[žź]/g, "z")
    .replace(/đ/g, "d")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 60);
}

function randomSuffix(): string {
  return Math.random().toString(36).slice(2, 7);
}

export async function generateSlug(title: string): Promise<string> {
  const base = slugify(title);
  let slug = base;

  // Ensure uniqueness
  const existing = await prisma.event.findUnique({ where: { slug } });
  if (existing) {
    slug = `${base}-${randomSuffix()}`;
  }

  return slug;
}

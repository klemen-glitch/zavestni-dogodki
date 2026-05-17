import type { Metadata } from "next";
import Link from "next/link";
import { BLOG_POSTS } from "@/content/blog-posts";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/utils";

export const metadata: Metadata = {
  title: "Blog — Zavestni Dogodki: Joga, Meditacija, Breathwork v Sloveniji",
  description: "Vodniki, nasveti in poglobljeni članki o jogi, meditaciji, breathworku, zvočnih kopelih in zavestnih praksah v Sloveniji.",
  keywords: ["zavestni blog", "joga vodnik", "meditacija nasveti", "breathwork slovenija", "zvočna kopel vodnik", "mindfulness slovenija"],
  alternates: { canonical: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/blog` },
  openGraph: {
    title: "Blog — Zavestni Dogodki",
    description: "Vodniki in nasveti o jogi, meditaciji, breathworku in zavestnih praksah v Sloveniji.",
    url: `${process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si"}/blog`,
    type: "website",
    locale: "sl_SI",
    siteName: "Zavestni Dogodki",
  },
};

export default function BlogPage() {
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const sorted = [...BLOG_POSTS].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${appUrl}/blog` },
    ],
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <span className="text-stone-700">Blog</span>
      </div>

      <div className="mb-10">
        <h1 className="text-3xl font-bold text-stone-800 mb-2">Blog</h1>
        <p className="text-stone-500">
          Vodniki, nasveti in poglobljeni članki o zavestnih praksah v Sloveniji.
        </p>
      </div>

      <div className="flex flex-col gap-8">
        {sorted.map((post) => (
          <article key={post.slug} className="group">
            <Link href={`/blog/${post.slug}`} className="block">
              <div className="bg-white rounded-2xl border border-stone-100 p-6 hover:border-emerald-200 hover:shadow-md transition-all">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-2xl">{CATEGORY_EMOJI[post.category] ?? "📖"}</span>
                  <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
                    {CATEGORY_LABEL[post.category] ?? post.category}
                  </span>
                  <span className="text-xs text-stone-400">{post.readingTime} min branja</span>
                </div>
                <h2 className="text-xl font-bold text-stone-800 mb-2 group-hover:text-emerald-700 transition-colors leading-snug">
                  {post.title}
                </h2>
                <p className="text-stone-500 text-sm leading-relaxed mb-4">
                  {post.description}
                </p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-stone-400">
                    {new Date(post.date).toLocaleDateString("sl-SI", {
                      day: "numeric", month: "long", year: "numeric",
                    })}
                  </span>
                  <span className="text-sm font-semibold text-emerald-700 group-hover:underline">
                    Preberi več →
                  </span>
                </div>
              </div>
            </Link>
          </article>
        ))}
      </div>

      {/* CTA */}
      <div className="mt-12 rounded-2xl bg-emerald-50 border border-emerald-200 p-8 text-center">
        <p className="text-stone-700 font-semibold text-lg mb-2">Iščete zavestne dogodke?</p>
        <p className="text-stone-500 text-sm mb-4">
          Preverite naš imenik joga delavnic, meditacij, breathworka in retreatov v Sloveniji.
        </p>
        <Link href="/events" className="inline-block bg-emerald-700 text-white px-6 py-2.5 rounded-full text-sm font-semibold hover:bg-emerald-800 transition-colors">
          Poišči dogodek →
        </Link>
      </div>
    </div>
  );
}

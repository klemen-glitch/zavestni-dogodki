import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { getBlogPost, BLOG_POSTS } from "@/content/blog-posts";
import { CATEGORY_EMOJI, CATEGORY_LABEL } from "@/lib/utils";

type Props = { params: Promise<{ slug: string }> };

export async function generateStaticParams() {
  return BLOG_POSTS.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) return { title: "Članek ni najden" };
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  return {
    title: `${post.title} | Zavestni Dogodki Blog`,
    description: post.description,
    keywords: [
      post.title.toLowerCase(),
      CATEGORY_LABEL[post.category]?.toLowerCase() ?? post.category.toLowerCase(),
      "zavestni dogodki",
      "slovenija",
      ...post.relatedCategories.map((c) => CATEGORY_LABEL[c]?.toLowerCase() ?? c.toLowerCase()),
    ],
    alternates: { canonical: `${appUrl}/blog/${slug}` },
    openGraph: {
      title: post.title,
      description: post.description,
      url: `${appUrl}/blog/${slug}`,
      type: "article",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
      publishedTime: post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${appUrl}/blog` },
      { "@type": "ListItem", position: 3, name: post.title, item: `${appUrl}/blog/${slug}` },
    ],
  };

  const blogPostingSchema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    datePublished: post.date,
    dateModified: post.date,
    author: { "@type": "Organization", name: post.author, url: appUrl },
    publisher: { "@type": "Organization", name: "Zavestni Dogodki", url: appUrl },
    url: `${appUrl}/blog/${slug}`,
    inLanguage: "sl",
    keywords: post.relatedCategories.map((c) => CATEGORY_LABEL[c] ?? c).join(", "),
    articleBody: post.content.map((s) => s.body).join(" "),
  };

  const faqSchema = post.faq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: post.faq.map((q) => ({
          "@type": "Question",
          name: q.question,
          acceptedAnswer: { "@type": "Answer", text: q.answer },
        })),
      }
    : null;

  return (
    <div className="max-w-3xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-stone-600">Blog</Link>
        <span>/</span>
        <span className="text-stone-700 truncate max-w-xs">{post.title}</span>
      </div>

      {/* Meta */}
      <div className="flex items-center gap-3 mb-4 flex-wrap">
        <span className="text-2xl">{CATEGORY_EMOJI[post.category] ?? "📖"}</span>
        <span className="text-xs font-medium text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full">
          {CATEGORY_LABEL[post.category] ?? post.category}
        </span>
        <span className="text-xs text-stone-400">{post.readingTime} min branja</span>
        <span className="text-xs text-stone-400">
          {new Date(post.date).toLocaleDateString("sl-SI", {
            day: "numeric", month: "long", year: "numeric",
          })}
        </span>
      </div>

      {/* Title */}
      <h1 className="text-3xl md:text-4xl font-bold text-stone-800 mb-4 leading-tight">
        {post.title}
      </h1>
      <p className="text-lg text-stone-500 mb-10 leading-relaxed">
        {post.description}
      </p>

      {/* Content */}
      <article className="prose prose-stone prose-lg max-w-none mb-12">
        {post.content.map((section, i) => (
          <div key={i} className="mb-8">
            {section.heading && (
              <h2 className="text-xl font-bold text-stone-800 mt-8 mb-3">{section.heading}</h2>
            )}
            <p className="text-stone-600 leading-relaxed">{section.body}</p>
          </div>
        ))}
      </article>

      {/* FAQ */}
      {post.faq.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-stone-800 mb-6">Pogosta vprašanja</h2>
          <div className="flex flex-col gap-4">
            {post.faq.map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-stone-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer select-none font-semibold text-stone-800 hover:bg-stone-50 transition-colors">
                  <span>{item.question}</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform flex-shrink-0">▼</span>
                </summary>
                <div className="px-6 pb-5 text-stone-600 leading-relaxed text-sm">
                  {item.answer}
                </div>
              </details>
            ))}
          </div>
        </section>
      )}

      {/* Related categories CTA */}
      {post.relatedCategories.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-stone-700 mb-3">Poiščite {CATEGORY_LABEL[post.category] ?? "zavestne"} dogodke</h2>
          <div className="flex flex-wrap gap-2">
            {post.relatedCategories.map((cat) => (
              <Link
                key={cat}
                href={`/categories/${cat.toLowerCase()}`}
                className="flex items-center gap-1.5 px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-800 text-sm rounded-full hover:bg-emerald-100 transition-colors font-medium"
              >
                {CATEGORY_EMOJI[cat]} {CATEGORY_LABEL[cat] ?? cat}
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* CTA banner */}
      <div className="rounded-2xl bg-gradient-to-r from-emerald-700 to-teal-700 p-8 text-center">
        <p className="text-white font-bold text-xl mb-2">Pripravljeni za izkušnjo?</p>
        <p className="text-emerald-100 text-sm mb-5">
          Poiščite razpisane {CATEGORY_LABEL[post.category]?.toLowerCase() ?? "zavestne"} dogodke v Sloveniji.
        </p>
        <Link
          href={`/categories/${post.category.toLowerCase()}`}
          className="inline-block bg-white text-emerald-800 px-6 py-2.5 rounded-full text-sm font-bold hover:bg-emerald-50 transition-colors"
        >
          Poišči {CATEGORY_LABEL[post.category] ?? "dogodke"} →
        </Link>
      </div>

      {/* Back to blog */}
      <div className="mt-8 text-center">
        <Link href="/blog" className="text-sm text-stone-400 hover:text-stone-600 hover:underline">
          ← Vse objave
        </Link>
      </div>
    </div>
  );
}

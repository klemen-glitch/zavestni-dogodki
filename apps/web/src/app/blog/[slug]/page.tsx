import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { getBlogPost, BLOG_POSTS } from "@/content/blog-posts";
import { CATEGORY_EMOJI, CATEGORY_LABEL, CATEGORY_HEX } from "@/lib/utils";

const AUTHOR_BIO = {
  name: "Uredništvo Zavestni Dogodki",
  role: "Kuratorji zavestnih praks v Sloveniji",
  description:
    "Zavestni Dogodki je kurirani imenik joga delavnic, meditacij, breathwork sej in retreatov v Sloveniji. Naša ekipa redno obiskuje prireditve in s prvimi rokami preverja kakovost — da vam prihranimo čas pri iskanju.",
};

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
    title: { absolute: `${post.title} | Zavestni Dogodki Blog` },
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
      modifiedTime: post.dateModified ?? post.date,
      authors: [post.author],
    },
  };
}

export default async function BlogPostPage({ params }: Props) {
  const { slug } = await params;
  const post = getBlogPost(slug);
  if (!post) notFound();

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";

  // Related posts: same category or overlapping relatedCategories, excluding current
  const relatedPosts = BLOG_POSTS.filter(
    (p) =>
      p.slug !== slug &&
      (p.category === post.category ||
        p.relatedCategories.some((c) => post.relatedCategories.includes(c)))
  ).slice(0, 2);

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
    dateModified: post.dateModified ?? post.date,
    author: { "@type": "Organization", name: AUTHOR_BIO.name, url: appUrl },
    publisher: { "@type": "Organization", name: "Zavestni Dogodki", url: appUrl, logo: { "@type": "ImageObject", url: `${appUrl}/icon-512.png` } },
    url: `${appUrl}/blog/${slug}`,
    mainEntityOfPage: { "@type": "WebPage", "@id": `${appUrl}/blog/${slug}` },
    inLanguage: "sl",
    keywords: post.relatedCategories.map((c) => CATEGORY_LABEL[c] ?? c).join(", "),
    articleBody: post.content.map((s) => s.body).join(" "),
    wordCount: post.content.map((s) => s.body.split(/\s+/).length).reduce((a, b) => a + b, 0),
    speakable: {
      "@type": "SpeakableSpecification",
      cssSelector: ["h1", "h2", ".prose > p:first-child"],
    },
  };

  const [catColor, catDark] = CATEGORY_HEX[post.category] ?? ["#059669", "#064e3b"];

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

  const howToSchema = post.howToSteps && post.howToSteps.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "HowTo",
        name: `Kako začeti z ${CATEGORY_LABEL[post.category]?.toLowerCase() ?? "zavestno prakso"} — korak za korakom`,
        description: post.description,
        inLanguage: "sl",
        step: post.howToSteps.map((s, i) => ({
          "@type": "HowToStep",
          position: i + 1,
          name: s.name,
          text: s.text,
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
      {howToSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(howToSchema) }} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8 flex-wrap">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <Link href="/blog" className="hover:text-stone-600">Blog</Link>
        <span>/</span>
        <span className="text-stone-700 truncate max-w-xs">{post.title}</span>
      </div>

      {/* Category hero strip — visual anchor (replaces featured image) */}
      <div
        className="rounded-2xl mb-8 p-6 flex items-center gap-5"
        style={{ background: `linear-gradient(135deg, ${catColor}14 0%, ${catColor}22 100%)`, borderLeft: `4px solid ${catColor}` }}
      >
        <span className="text-5xl leading-none">{CATEGORY_EMOJI[post.category] ?? "📖"}</span>
        <div>
          <span
            className="inline-block text-[11px] font-bold uppercase tracking-widest px-2.5 py-0.5 rounded-full text-white mb-2"
            style={{ backgroundColor: catColor }}
          >
            {CATEGORY_LABEL[post.category] ?? post.category}
          </span>
          <p className="text-stone-500 text-sm">
            {post.readingTime} min branja &middot;{" "}
            {new Date(post.date).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" })}
            {post.dateModified && post.dateModified !== post.date && (
              <span className="ml-2 text-emerald-600 font-medium">
                · Posodobljeno {new Date(post.dateModified).toLocaleDateString("sl-SI", { day: "numeric", month: "long", year: "numeric" })}
              </span>
            )}
          </p>
        </div>
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
            {section.imageUrl && (
              <figure className="my-8 not-prose">
                <Image
                  src={section.imageUrl}
                  alt={section.heading ?? post.title}
                  width={752}
                  height={423}
                  className="w-full rounded-2xl"
                  style={{ height: "auto" }}
                  sizes="(max-width: 768px) 100vw, 752px"
                  quality={85}
                />
              </figure>
            )}
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

      {/* Author bio — E-E-A-T signal */}
      <section className="mb-10 p-6 bg-stone-50 rounded-2xl border border-stone-100">
        <p className="text-xs font-bold uppercase tracking-widest text-stone-400 mb-4">O avtorju</p>
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-emerald-700 flex items-center justify-center text-white text-sm font-extrabold">
            ZD
          </div>
          <div>
            <p className="font-semibold text-stone-800 text-sm">{AUTHOR_BIO.name}</p>
            <p className="text-emerald-700 text-xs font-medium mt-0.5">{AUTHOR_BIO.role}</p>
            <p className="text-stone-500 text-sm mt-2 leading-relaxed">{AUTHOR_BIO.description}</p>
            <Link href="/events" className="inline-block mt-3 text-xs font-semibold text-emerald-700 hover:underline">
              Poišči zavestne dogodke v Sloveniji →
            </Link>
          </div>
        </div>
      </section>

      {/* Related posts — internal linking */}
      {relatedPosts.length > 0 && (
        <section className="mb-10">
          <h2 className="text-lg font-bold text-stone-800 mb-4">Podobne objave</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {relatedPosts.map((p) => (
              <Link
                key={p.slug}
                href={`/blog/${p.slug}`}
                className="block bg-white rounded-xl border border-stone-100 p-5 hover:border-emerald-200 hover:shadow-sm transition-all group"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-lg">{CATEGORY_EMOJI[p.category] ?? "📖"}</span>
                  <span className="text-xs font-medium text-emerald-700">{CATEGORY_LABEL[p.category] ?? p.category}</span>
                </div>
                <p className="font-bold text-stone-800 text-sm leading-snug group-hover:text-emerald-700 transition-colors">{p.title}</p>
                <p className="text-xs text-stone-400 mt-2">{p.readingTime} min branja</p>
              </Link>
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

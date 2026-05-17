export const dynamic = "force-dynamic";

import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import { db } from "@/lib/db";
import { EventCard } from "@/components/EventCard";
import { CATEGORY_EMOJI, CATEGORY_LABEL, ALL_CATEGORIES } from "@/lib/utils";
import type { EventCategory } from "@conscious-slovenia/database";

type Props = { params: Promise<{ category: string }> };

// Keyword-rich category descriptions for SEO
const CATEGORY_DESCRIPTIONS: Record<string, string> = {
  YOGA: "Najdite joga delavnice, tečaje in retreate v Sloveniji. Od začetnikov do naprednih — hatha, vinyasa, yin joga in več.",
  MEDITATION: "Meditacijski tečaji, vodene meditacije in mindfulness delavnice v Sloveniji. Notranji mir in zavestnost.",
  BREATHWORK: "Dihalne vaje in breathwork delavnice v Sloveniji. Holotropno dihanje, pranayama in transformativni dih.",
  SOUND_BATH: "Zvočne kopeli z Tibetanskimi posodami, gongom in kristalnimi posodami v Sloveniji. Zvočno zdravljenje.",
  CACAO_CEREMONY: "Kakao ceremonije v Sloveniji. Srčno odpirajoče skupnostne prireditve z ceremonialnim kakaom.",
  RETREAT: "Wellness retreati in zavestni retreati v Sloveniji. Weekend in večdnevni odmiki za telo, um in dušo.",
  WORKSHOP: "Zavestne delavnice in seminarji v Sloveniji. Osebna rast, duhovnost in holistično zdravje.",
  DANCE: "Zavestni ples, ecstatic dance in gibalne delavnice v Sloveniji. Svobodna izražanje skozi ples.",
  TANTRA: "Tantra delavnice in seminarji v Sloveniji. Zavestno partnerstvo, energija in celovitost.",
  HEALING: "Zdravilne prireditve in delavnice v Sloveniji. Energijsko zdravljenje, reiki, zvočno in holistično.",
  OTHER: "Zavestni dogodki v Sloveniji — duhovnost, osebna rast in celostno zdravje.",
};

// AEO (Answer Engine Optimization) FAQ per category — direct quotable Q&As for AI citation
const CATEGORY_AEO_FAQ: Record<string, { q: string; a: string }[]> = {
  YOGA: [
    { q: "Kakšna je razlika med hatha, vinyasa in yin jogo?", a: "Hatha joga je počasna in temeljna — idealna za začetnike. Vinyasa je dinamična, gibi se usklajujejo z dihanjem. Yin joga drži poze 3–5 minut za globoko raztezanje vezivnega tkiva in fascij." },
    { q: "Kako pogosto moram vaditi jogo, da bom opazil/a napredek?", a: "Za vidne rezultate priporočamo 2–3 ure joge tedensko v prvih 8 tednih. Konsistentnost je ključna — vsakodnevna 20-minutna vadba prinese boljše rezultate kot enkratna 2-urna seja na teden." },
    { q: "Koliko stanejo joga delavnice v Sloveniji?", a: "Skupinska ura joge v studiju stane 8–20 EUR. Mesečne članarine so 60–120 EUR. Weekend yoga retreati so 150–400 EUR all-inclusive (nastanitev, hrana, vse ure vključene)." },
    { q: "Ali je joga primerna za začetnike brez predznanja?", a: "Da — večina joga delavnic sprejema vse ravni, vključno s popolnimi začetniki. Iščite oznake 'za začetnike', 'all levels' ali 'nivo 1'. Povejte inštruktorju pred sejo, da ste začetnik." },
  ],
  MEDITATION: [
    { q: "Ali meditacija res pomaga pri stresu in anksioznosti?", a: "Da — klinične študije kažejo, da 8-tedenski program mindfulness meditacije merljivo zmanjša kortizol in simptome anksioznosti. Metaanalize potrjujejo učinkovitost pri depresiji, kronični bolečini in motnjah spanja." },
    { q: "Katera vrsta meditacije je najboljša za začetnike?", a: "Za začetnike priporočamo vodeno meditacijo z dihanjem ali body scan. Te tehnike ne zahtevajo predznanja in nudijo takojšen občutek umirjenosti. Skupinska meditacija pod vodstvom inštruktorja je odlična za razvoj prakse." },
    { q: "Kako dolgo moram meditirati na dan?", a: "Že 10–15 minut dnevno ima merljive učinke na fokus in čustveno stabilnost. Konsistentnost je pomembnejša od dolžine — dnevnih 10 minut preseže tedenskih 60 minut." },
    { q: "Kje v Sloveniji najdem meditacijske tečaje?", a: "Zavestni Dogodki zbira vse meditacijske tečaje, vodene meditacije in mindfulness delavnice po vsej Sloveniji — od Ljubljane do Maribora in Kopra. Filtrirajte po mestu in datumu za najnovejše termine." },
  ],
  BREATHWORK: [
    { q: "Kaj je breathwork in kako deluje?", a: "Breathwork je skupen izraz za tehnike namernega uravnavanja dihanja za terapevtske namene. Ker je dihanje edina telesna funkcija pod hkrati zavestnim in avtonomnim nadzorom, nam daje direkten dostop do živčnega sistema — v minutah premakne telo iz stresnega v sproščeno stanje." },
    { q: "Ali je breathwork varen?", a: "Osnovna breathwork vadba je varna za večino odraslih. Intenzivnejše tehnike (holotropno dihanje, Wim Hof metoda) niso priporočljive za nosečnice, osebe z epilepsijo ali srčno-žilnimi boleznimi. Vedno začnite pod strokovnim vodstvom." },
    { q: "Kakšna je razlika med breathworkom in pranayamo?", a: "Pranayama je dihalna vaja v tradiciji joge in ayurvede. Breathwork je sodoben, kliničen pristop, ki vključuje tako vzhodne prakse (pranayama, tummo) kot zahodne terapevtske metode (holotropno dihanje, rebirthing). Oba dosegata podobne fiziološke učinke." },
    { q: "Koliko stane breathwork delavnica v Sloveniji?", a: "Skupinska breathwork seansa stane 20–50 EUR. Individualna seansa z izkušenim facilitatorjem je 80–150 EUR. Vikend retreati z breathworkom so 200–500 EUR." },
  ],
  SOUND_BATH: [
    { q: "Kaj je zvočna kopel in kako deluje?", a: "Zvočna kopel je meditativna praksa, pri kateri Tibetanske posode, gongi in kristalne posode proizvajajo frekvence, ki preusmerijo možganske valove v alfa/theta stanje — globoko sprostitev. Telo je 60 % vode in zvočne vibracije ga dosežejo na celični ravni." },
    { q: "Ali moram imeti izkušnje z meditacijo za zvočno kopel?", a: "Ne — zvočna kopel je primerna za popolne začetnike. Vse kar morate storiti je, da se ulezete in pustite zvokom, da delajo. Ni aktivne meditacije, izkušnjo ustvari zvok sam." },
    { q: "Koliko stane zvočna kopel v Sloveniji?", a: "Skupinska zvočna kopel v Sloveniji stane 15–35 EUR za 60–90-minutno sejo. Individualne seje z osebnim terapevtom so 60–120 EUR." },
    { q: "Kako pogosto priporočate obisk zvočnih kopeli?", a: "Mnogi prakticirajo 1–2 zvočni kopeli mesečno za vzdrževanje dobrega počutja. Za akutni stres ali motnje spanja priporočamo tedenski obisk 4–6 tednov zapored." },
  ],
  CACAO_CEREMONY: [
    { q: "Kaj je kakao ceremonija?", a: "Kakao ceremonija je skupnostna prireditev, pri kateri udeleženci skupaj pijejo ceremonialny kakao — surovo, minimalno predelano čokolado, bogato s teobrominom. Ceremonija združuje namero, dihanje, meditacijo in glasbo za srčno odpirajočo izkušnjo." },
    { q: "Ali je ceremonialny kakao psihodelik?", a: "Ne — ceremonialny kakao ni psihodelik. Vsebuje teobromin (blažji stimulant kot kofein) in anandamid, ki povečata pretok krvi in občutek dobrega počutja brez spremembe zavesti." },
    { q: "Za koga kakao ceremonija ni primerna?", a: "Kakao ceremonije niso priporočljive za osebe na MAO inhibitorjih (antidepresivi), z resnimi srčnimi obolenji ali v nosečnosti. Vedno obvestite organizatorja o svojih zdravstvenih razmerah." },
  ],
  RETREAT: [
    { q: "Kaj je wellness retreat in čemu je namenjen?", a: "Retreat je večdnevni odmik (vikend ali teden), ki združuje intenzivnejšo joga ali meditacijsko prakso, zdravo prehrano in počitek v naravnem okolju. Namen je globlja praksa, odmik od stresa in spoznavanje skupnosti." },
    { q: "Koliko stanejo retreati v Sloveniji?", a: "Dnevni retreati so 60–120 EUR. Weekend retreati z dvema nočitvama all-inclusive so 200–450 EUR. Tedenski retreati so 700–1.500 EUR, odvisno od lokacije in programa." },
    { q: "Ali je retreat primeren za začetnike?", a: "Da — večina retreatov sprejema vse ravni. Preverite opis: nekateri so specifično za začetnike. Povejte organizatorju vašo raven pri prijavi." },
    { q: "Kdaj je najboljši čas za retreat v Sloveniji?", a: "Spomladi (april–junij) in jeseni (september–oktober) sta idealni — mila temperatura, narava v polnem razcvetu. Zimski retreati v Alpah imajo posebno čarobnost. Poletni retreati so priljubljeni na Primorskem in v hribovju." },
  ],
  WORKSHOP: [
    { q: "Kaj vključuje zavestna delavnica?", a: "Zavestne delavnice so intenzivne kratke izkušnje (2–8 ur) s specifično temo — osebna rast, holistično zdravje, kreativnost ali duhovnost. Vodja strukturira vsebino, vaje in skupinsko dinamiko za poglobljeno izkušnjo." },
    { q: "Koliko stanejo delavnice zavestnih praks v Sloveniji?", a: "Polodnevne delavnice so 25–60 EUR. Celodnevne delavnice so 60–120 EUR. Vikend intenzivi so 150–350 EUR." },
    { q: "Kako najdem pravo delavnico za mene?", a: "Na Zavestni Dogodki filtrirajte po kategoriji, mestu in datumu. Preberite opis in preverite profil vodje — izkušnje, izobrazba in recenzije so ključni pokazatelji kakovosti." },
  ],
  DANCE: [
    { q: "Kaj je zavestni ples in ecstatic dance?", a: "Zavestni ples je oblika svobodnega plesa brez koreografije — vsak se giblje na način, ki mu ustreza. Brez pravil, brez partnerja, brez alkohola. Glasba (od ambient do bobnov) vodi spontano gibanje telesa." },
    { q: "Ali moram znati plesati za zavestni ples?", a: "Absolutno ne — zavestni ples ne zahteva tehničnega znanja. Gre za svobodo izražanja skozi telo, ne za pravilne korake. Primeren je za vsakogar, ki je pripravljen pustiti telesu, da se giblje brez presoje." },
    { q: "Koliko stanejo zavestne plesne prireditve v Sloveniji?", a: "Ecstatic dance in zavestni ples dogodki stanejo 10–25 EUR. Delavnice z inštruktorjem so 25–60 EUR." },
  ],
  TANTRA: [
    { q: "Kaj je tantra — ali gre za seks?", a: "Tantra je stara vzhodna duhovna praksa, ki kultivira zavestnost, energijo in celovitost — ne gre primarno za seks. Večina tantra delavnic v Sloveniji se osredotoča na zavestno partnerstvo, komunikacijo in telesno zavedanje, brez eksplicitne seksualne vsebine." },
    { q: "Kdo je primeren za tantra delavnico?", a: "Tantra delavnice so primerne za odrasle, ki želijo poglobiti zavedanje svojega telesa, energije in odnosov. Ni zahtevano predznanje. Priporočamo pregled vsebine in pristopa vodje — kakovost se med ponudniki zelo razlikuje." },
  ],
  HEALING: [
    { q: "Kaj je energijsko zdravljenje?", a: "Energijsko zdravljenje (reiki, zvočno zdravljenje, kristaloterapija) temelji na aktiviranju naravnih samozdravilnih procesov telesa prek dela z energijo. Komplementarno je konvencionalnim zdravstvenim praksam, ne nadomešča jih." },
    { q: "Ali je energijsko zdravljenje alternativa zdravniku?", a: "Ne — energijsko zdravljenje priporočamo izključno kot komplementarno prakso poleg konvencionalnega zdravljenja, ne kot nadomestek. Za zdravstvene težave se vedno posvetujte z zdravnikom." },
    { q: "Katere vrste zdravilnih praks so na voljo v Sloveniji?", a: "V Sloveniji najdete reiki, zvočno terapijo z Tibetanskimi posodami, kranio-sakralno terapijo, kristaloterapijo, shamanske prakse in Theta Healing. Zavestni Dogodki zbira vse termine na enem mestu." },
  ],
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { category } = await params;
  const upper = category.toUpperCase();
  if (!ALL_CATEGORIES.includes(upper as EventCategory)) return { title: "Kategorija ni najdena" };
  const label = CATEGORY_LABEL[upper] ?? upper;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const description = CATEGORY_DESCRIPTIONS[upper] ?? `Vsi ${label.toLowerCase()} dogodki v Sloveniji.`;
  return {
    title: `${label} v Sloveniji 2026 — Delavnice & Retreati`,
    description,
    keywords: [label, `${label} slovenija`, `${label} ljubljana`, `${label} delavnica`, "zavestni dogodki", "holistic events slovenia"],
    alternates: { canonical: `${appUrl}/categories/${category.toLowerCase()}` },
    openGraph: {
      title: `${label} v Sloveniji 2026`,
      description,
      url: `${appUrl}/categories/${category.toLowerCase()}`,
      type: "website",
      locale: "sl_SI",
      siteName: "Zavestni Dogodki",
    },
  };
}

export default async function CategoryPage({ params }: Props) {
  const { category } = await params;
  const upper = category.toUpperCase() as EventCategory;

  if (!ALL_CATEGORIES.includes(upper as EventCategory)) notFound();

  const label = CATEGORY_LABEL[upper] ?? upper;
  const emoji = CATEGORY_EMOJI[upper] ?? "🌸";

  const [events, total] = await Promise.all([
    db.event.findMany({
      where: { category: upper, status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
      orderBy: [{ featured: "desc" }, { date: "asc" }],
      take: 24,
      include: { organizer: true, venue: true },
    }),
    db.event.count({
      where: { category: upper, status: { in: ["APPROVED", "FEATURED"] }, date: { gte: new Date() } },
    }),
  ]);

  // Other categories to suggest
  const otherCats = ALL_CATEGORIES.filter((c) => c !== upper && c !== "OTHER");

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://zavestnidogodki.si";
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Domov", item: appUrl },
      { "@type": "ListItem", position: 2, name: "Dogodki", item: `${appUrl}/events` },
      { "@type": "ListItem", position: 3, name: label, item: `${appUrl}/categories/${upper.toLowerCase()}` },
    ],
  };

  const aeoFaq = CATEGORY_AEO_FAQ[upper] ?? [];
  const faqSchema = aeoFaq.length > 0
    ? {
        "@context": "https://schema.org",
        "@type": "FAQPage",
        mainEntity: aeoFaq.map(({ q, a }) => ({
          "@type": "Question",
          name: q,
          acceptedAnswer: { "@type": "Answer", text: a },
        })),
      }
    : null;

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }} />
      {faqSchema && (
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />
      )}

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-stone-400 mb-8">
        <Link href="/" className="hover:text-stone-600">Domov</Link>
        <span>/</span>
        <Link href="/events" className="hover:text-stone-600">Dogodki</Link>
        <span>/</span>
        <span className="text-stone-700">{label}</span>
      </div>

      {/* Header — H1 with location keyword for SEO */}
      <div className="mb-6">
        <div className="text-5xl mb-4">{emoji}</div>
        <h1 className="text-3xl font-bold text-stone-800 mb-2">{label} v Sloveniji — Delavnice &amp; Retreati 2026</h1>
        <p className="text-stone-500 mb-4">{total} {total === 1 ? "dogodek" : "dogodkov"} · prihajajoče</p>
        {/* SEO intro — unique description per category */}
        <p className="text-stone-600 text-base leading-relaxed max-w-2xl">
          {CATEGORY_DESCRIPTIONS[upper]}
        </p>
      </div>

      {/* Events grid */}
      {events.length === 0 ? (
        <div className="text-center py-20 text-stone-400">
          <p className="text-5xl mb-4">{emoji}</p>
          <p className="text-lg mb-2">Ni prihajajoči {label.toLowerCase()} dogodkov.</p>
          <p className="text-sm">Preverite kmalu ali si oglejte druge kategorije.</p>
          <Link href="/events" className="inline-block mt-6 text-emerald-700 hover:underline text-sm">
            Vsi dogodki →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {events.map((e) => (
            <EventCard key={e.id} event={e as Parameters<typeof EventCard>[0]["event"]} />
          ))}
        </div>
      )}

      {/* AEO FAQ section — question-based H2/H3 for AI citation optimization */}
      {aeoFaq.length > 0 && (
        <section className="mb-12">
          <h2 className="text-2xl font-bold text-stone-800 mb-2">
            Pogosta vprašanja o {label.toLowerCase()} v Sloveniji
          </h2>
          <p className="text-stone-500 text-sm mb-6">Odgovori na najpogostejša vprašanja o {label.toLowerCase()} delavnicah in tečajih.</p>
          <div className="flex flex-col gap-3">
            {aeoFaq.map((item, i) => (
              <details
                key={i}
                className="group bg-white rounded-xl border border-stone-100 overflow-hidden"
              >
                <summary className="flex items-center justify-between gap-4 px-6 py-4 cursor-pointer select-none font-semibold text-stone-800 hover:bg-stone-50 transition-colors text-sm">
                  <span>{item.q}</span>
                  <span className="text-stone-400 group-open:rotate-180 transition-transform flex-shrink-0 text-xs">▼</span>
                </summary>
                <div className="px-6 pb-5 text-stone-600 leading-relaxed text-sm border-t border-stone-50">
                  {item.a}
                </div>
              </details>
            ))}
          </div>
          <div className="mt-6 text-center">
            <Link
              href="/blog"
              className="inline-block text-sm font-semibold text-emerald-700 hover:underline"
            >
              Preberite naš blog za poglobljene vodnike →
            </Link>
          </div>
        </section>
      )}

      {/* Other categories */}
      <section>
        <h2 className="text-xl font-bold text-stone-700 mb-4">Ostale kategorije</h2>
        <div className="flex flex-wrap gap-2">
          {otherCats.map((c) => (
            <Link key={c} href={`/categories/${c.toLowerCase()}`}
              className="flex items-center gap-1.5 px-4 py-2 bg-white border border-stone-200 text-stone-600 text-sm rounded-full hover:border-emerald-400 hover:text-emerald-700 transition-colors">
              {CATEGORY_EMOJI[c]} {CATEGORY_LABEL[c]}
            </Link>
          ))}
        </div>
      </section>
    </div>
  );
}

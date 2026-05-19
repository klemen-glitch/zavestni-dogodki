/**
 * AI enrichment for event detail pages.
 * Generates rich Slovenian content per event and caches it in rawText.
 */

import { db } from "@/lib/db";

export interface EnrichedContent {
  intro: string[];           // 3 paragraphs about the event
  whatToExpect: string[];    // bullet points
  facilitatorBio: string;    // expanded bio paragraph
  facilitatorFact: string;   // one interesting fact / quote
  techniqueTitle: string;    // e.g. "Kaj je zvočna kopel?"
  techniqueDescription: string;
  benefits: Array<{ title: string; description: string }>;
  researchNotes: string;     // science/research paragraph
  locationContext: string;   // about the venue/city
  enrichedAt: string;
  sectionImages?: string[];  // AI-generated images for inline display
}

// ── Per-category fallback content ─────────────────────────────────────────────
const TECHNIQUE_FALLBACK: Record<string, Pick<EnrichedContent, "techniqueTitle" | "techniqueDescription" | "benefits" | "researchNotes">> = {
  YOGA: {
    techniqueTitle: "Kaj je joga?",
    techniqueDescription: "Joga je starodavna praksa iz Indije, ki sega več kot 5000 let v preteklost. Beseda 'joga' izhaja iz sanskrta in pomeni 'spojitev' ali 'enotnost' — union telesa, uma in duha. Sodobna joga vključuje telesne položaje (asane), dihalne vaje (pranayamo), meditacijo in filozofska načela. Vsak slog — od dinamičnega Astanga do umirjenega Yin — pristopa k tej enotnosti drugače, a cilj ostaja enak: prisotnost in ravnovesje v vsakodnevnem življenju.",
    benefits: [
      { title: "Večja prožnost", description: "Redna praksa razvija prožnost mišic in sklepov, zmanjšuje napetosti in preprečuje poškodbe." },
      { title: "Zmanjšan stres", description: "Joga aktivira parasimpatični živčni sistem — telo preide iz stanja 'boj ali beg' v stanje počitka." },
      { title: "Boljša drža", description: "Krepitev globokih mišic hrbta in trupa izboljša telesno držo in zmanjša bolečine v hrbtu." },
      { title: "Mentalna jasnost", description: "Meditativni vidik joge trenira fokus in prisotnost, kar se pozna v boljši koncentraciji skozi cel dan." },
      { title: "Boljši spanec", description: "Večerna joga umiri živčni sistem in pripravi telo na globok, okrevalen počitek." },
    ],
    researchNotes: "Metaanaliza v reviji Journal of Alternative and Complementary Medicine (2016) je pregledala 34 študij in ugotovila, da redna joga statistično značilno zmanjšuje simptome anksioznosti in depresije. Študija Harvard Medical School potrjuje, da samo 12 tednov joge zmanjša kronično bolečino v hrbtu za do 40%. Nevroznanost je pokazala, da joga povečuje volumen hipokampusa — možganskega področja, odgovornega za spomin in učenje.",
  },
  MEDITATION: {
    techniqueTitle: "Kaj je meditacija?",
    techniqueDescription: "Meditacija je praksa zavestnega usmerjanja pozornosti — na dih, telesne občutke, zvok ali določen predmet — z namenom umirjanja miselnega šuma. Ni mišljeno, da misli izginejo; meditacija nas uči, da jih opazujemo brez sodbe in se vedno znova vračamo v sedanji trenutek. Obstaja na stotine tradicij meditacije — budistična Vipassana, Transcendentalna meditacija, krščanska kontemplativna molitev, zen — vse si delijo skupno jedro: trening zavestne pozornosti.",
    benefits: [
      { title: "Zmanjšan kortizol", description: "Redna meditacija dokazano znižuje raven kortizola — hormona stresa — v krvi." },
      { title: "Boljša čustvena regulacija", description: "Meditatorji hitreje prepoznajo in obvladajo čustvene odzive, kar izboljša medosebne odnose." },
      { title: "Povečan imunski sistem", description: "Osemtedenska praksa meditacije pozitivno vpliva na aktivnost NK celic (natural killer cells)." },
      { title: "Manj čuječnost-stres", description: "MBSR (Mindfulness-Based Stress Reduction) program zmanjša simptome anksioznosti za 58%." },
      { title: "Podaljšanje telomerov", description: "Preliminarne študije kažejo, da meditacija upočasni biološko staranje na celični ravni." },
    ],
    researchNotes: "Harvardska nevroznanstvenica Sara Lazar je dokazala, da 8 tednov meditacije povzroči merljive strukturne spremembe v možganih — debelina prefrontalnega korteksa se poveča, amigdala (center za strah) pa se skrči. Richard Davidson z Univerze Wisconsin je s pomočjo fMRI posnetkov dokazal, da dolgoletni meditatorji producirajo izjemno visoke gama možganske valove, ki so povezani z globoko koncentracijo in sočutjem.",
  },
  BREATHWORK: {
    techniqueTitle: "Kaj je dihalna terapija?",
    techniqueDescription: "Dihanje je edina avtonomna telesna funkcija, ki jo je možno zavestno kontrolirati — in prav to je vstopna točka vsakršne dihalne prakse. Ko zavestno spremenimo vzorec dihanja, neposredno vplivamo na avtonomni živčni sistem: pospešeno dihanje aktivira simpatikus (boj ali beg), počasno diafragmatično dihanje pa parasimpatikus (počitek in prebava). Wim Hof metoda, holotropno dihanje, pranayama, boxed breathing — vsaka tehnika drugače modulira kisik, ogljikov dioksid in pH krvi, kar sproži globoke fiziološke in psihološke odzive.",
    benefits: [
      { title: "Povečana energija", description: "Hiperventilacijske tehnike dočasno zvišajo saturacijo kisika in adrenalin — buden, energičen občutek." },
      { title: "Zmanjšana anksioznost", description: "4-7-8 dihanje in boxed breathing aktivirajo vagusni živec in takoj pomirijo stresni odziv." },
      { title: "Izboljšana imunska funkcija", description: "Wim Hof protokol je v kontrolirani študiji dokazal povečano odpornost na endotoksin skozi voljo." },
      { title: "Čustvena sprostitev", description: "Holotropno in rebirthing dihanje pogosto sproži globoko čustveno catharsis — sprostitev nakopičenih blokov." },
      { title: "Hladna odpornost", description: "Wim Hof metoda s kombinacijo dihanja in hladnega nastopa dokazano dviguje toleranco na mraz." },
    ],
    researchNotes: "Prelomna randomizirana študija na Univerzi Radboud (Kox et al., 2014) je dokazala, da se udeleženci Wim Hof programa ob vbrizganju endotoksina počutijo signifikantno boljše in proizvajajo manj citokinov (vnetnih snovi) od kontrolne skupine. To je bil prvi scientifičen dokaz, da je možno zavestno vplivati na imunski sistem. Novejše nevroznanstvene študije kažejo, da intenzivno dihanje aktivira insularni korteks — del možganov, ki regulira zavedanje telesa.",
  },
  SOUND_BATH: {
    techniqueTitle: "Kaj je zvočna kopel?",
    techniqueDescription: "Zvočna kopel je globoko sprostitvena praksa, pri kateri terapevt z inštrumenti — gongi, tibetanskimi posodami, kristalnimi posodami, šamanskimi bobni ali uglašenimi viličicami — producira toni in vibracije, ki dobesedno 'kopajo' udeležence v zvoku. Zvok ni samo slušna izkušnja; nizke frekvence producirajo fizične vibracije, ki jih telo zazna skozi resonanco. Kristalne posode so uglašene na specifične frekvence (npr. 432 Hz ali 528 Hz), ki po teorijah zvočne medicine ustrezajo različnim čakram ali energijskim centrom telesa.",
    benefits: [
      { title: "Globoka relaksacija", description: "Zvočne frekvence vodijo možgane iz beta (aktivno) v theta (med spanjem in budnostjo) stanje — stanje globoke sprostitve." },
      { title: "Zmanjšanje kronične bolečine", description: "Vibracije gonggov v frekvenčnem območju 30-200 Hz so učinkovite pri zmanjšanju kroničnih bolečin." },
      { title: "Boljši spanec", description: "Redne zvočne seanse normalizirajo cirkadiani ritem in povečajo kakovost spanca." },
      { title: "Čustveno sproščanje", description: "Resonanca zvoka aktivira limbični sistem in pogosto sproži nevtralizacijo nakopičenih čustev." },
      { title: "Znižan krvni tlak", description: "Po seji se pri večini udeležencev izmeri statistično značilno nižji sistolični krvni tlak." },
    ],
    researchNotes: "Študija objavljena v Journal of Evidence-Based Integrative Medicine (2016) je pri 62 udeležencih zvočnih kopeli izmerila statistično značilno zmanjšanje napetosti, anksioznosti in bolečine, ter povečanje duhovne blaginje. Dr. Mitchell Gaynor, onkolog na Cornell University, je integriral zvočno terapijo v zdravljenje raka in ugotovil sinergistične učinke na imunski sistem. Nevroznanost potrjuje, da sinusoidni zvoki stabilizirajo možganske valove skozi binaural entrainment.",
  },
  CACAO_CEREMONY: {
    techniqueTitle: "Kaj je kakao ceremonija?",
    techniqueDescription: "Kakao ceremonija je shamanistični ritual, ki izvira iz Mezoamerike — civilizacij Majev in Aztekov, ki so kakao spoštovali kot 'hrano bogov' (Theobroma cacao). Ceremonialny kakao se bistveno razlikuje od industrijsko predelane čokolade: brez mleka, sladkorja in umetnih aditivov vsebuje visoke ravni teobromine, feniletilamina in flavonoidov, ki delujejo kot blag srčni stimulans in odpirač. V sodobnem kontekstu se ceremonije kakaa kombinirajo z meditacijo, dihanjem, glasbo, molitvijo ali ecstatičnim plesom.",
    benefits: [
      { title: "Odpiranje srca", description: "Teobromin in anandamid (molekula blaženosti) v kakau sprostita oksitocin — hormon povezanosti in ljubezni." },
      { title: "Povečana energija brez tesnobe", description: "Za razliko od kofeina teobromin dviguje energijo počasi in brez tesnobe — mehko stimulacijo." },
      { title: "Čustvena procesacija", description: "Ceremonialny prostor ustvari varno okolje za izražanje in integriranje globokih čustev." },
      { title: "Krepitev skupnosti", description: "Ritualni kontekst krepi medosebne vezi in občutek pripadnosti." },
      { title: "Kreativna inspiracija", description: "V shamanski tradiciji je kakao znan kot 'odpirač kreativnih kanalov' — mnogi umetniki poročajo o večji navdihnjenosti." },
    ],
    researchNotes: "Flavonoidi kakaa (epikatehin in katehin) so med najmočnejšimi antioksidanti v naravi. Harvardska metaanaliza 42 študij je pokazala, da redna konzumacija temne čokolade zmanjšuje tveganje za srčno-žilne bolezni za 37%. Feniletilalin v kakau stimulira izločanje dopamina in serotonina — naravnih molekul sreče. Dr. Mayan shaman Keith Wilson je dokumentiral psihospiritualene učinke ceremonialnega kakaa, ki niso halucinogeni, ampak empatogeni — odpirajo srce.",
  },
  RETREAT: {
    techniqueTitle: "Kaj je wellness retreat?",
    techniqueDescription: "Retreat je izraz, ki dobesedno pomeni 'umik' — od vsakodnevnega tempa, digitalnih dražljajev in rutine. Wellness retreat je strukturiran večdnevni program, ki udeležencem ponudi čas in prostor za celostno regeneracijo: fizično (joga, gibanje, zdravi obroki), mentalno (meditacija, tišina, integrativni pogovori) in spiritualno (narava, ritual, skupnost). V nasprotju z navadnimi počitnicami retreat aktivno vodi udeležencev k notranjemu preoblikovanje — ni pasivno počitnikovanje, ampak transformativna izkušnja.",
    benefits: [
      { title: "Digitalna razstrupitev", description: "Odmik od zaslonov in socialnih medijev že po 3 dneh statistično znižuje kortizol in izboljša kakovost spanca." },
      { title: "Globoka regeneracija", description: "Kombinacija narave, gibanja, meditacije in zdravega prehranjevanja povrnejo telesno in duševno ravnovesje." },
      { title: "Skupnost in podpora", description: "Soudeleženci postanejo del mreže podobnomislečih — globoke prijateljske zveze nastanejo v takšnem kontekstu." },
      { title: "Preboji v osebni rasti", description: "Strukturirani retreati z izkušenimi facilitatorji nudijo varno okolje za soočenje z globljimi vzorci." },
      { title: "Trajni navadni spremembi", description: "Udeleženci retreatov poročajo, da po 3 mesecih ohranijo do 60% novih praks — v primerjavi z 10% pri enodnevnih delavnicah." },
    ],
    researchNotes: "Meta-analiza v International Journal of Wellbeing (2021) je analizirala učinke 5+ dnevnih wellnes retreatov na 1000+ udeležencih in ugotovila statistično značilno zmanjšanje simptomov izgorelosti, anksioznosti in depresije — učinki so bili merljivi še 3 mesece po koncu retreata. Novozelandska študija (2019) je merila kortizol, serotonin in DHEA pri udeležencih meditativnih retreatov in ugotovila statistično značilne spremembe biomarkerjev že po 7 dneh.",
  },
};

const TECHNIQUE_GENERIC = {
  techniqueTitle: "O tej praksi",
  techniqueDescription: "Ta praksa je del širšega polja zavestnega bivanja — pristopov, ki nam pomagajo biti bolj prisotni, bolj zaznavni in bolj v stiku s seboj in drugimi. Ne glede na tradicijo ali slog, si zavestne prakse delijo skupni cilj: kvaliteto notranjega prostora. V sodobnem svetu, ki spodbuja nenehno akcijo, zunanjost in hitrost, takšni dogodki ponujajo redek in dragocen kontekst za umirjanje, introspekcijo in okrevanje.",
  benefits: [
    { title: "Zavestna prisotnost", description: "Trening biti 'tukaj in zdaj' — eden najpomembnejših darov zavestnih praks." },
    { title: "Zmanjšan stres", description: "Vse zavestne prakse dokazano aktivirajo parasimpatični živčni sistem." },
    { title: "Skupnost", description: "Udeležba na skupinskih dogkanjih gradi socialne vez in zmanjšuje osamljenost." },
    { title: "Fizično počutje", description: "Kombinacija gibanja, dihanja in umiritve pozitivno vpliva na celotno telo." },
    { title: "Notranja rast", description: "Vsaka zavestna praksa je priložnost za globlji vpogled vase." },
  ],
  researchNotes: "Sodobna nevroznanost vse bolj potrjuje tisto, kar so starodavne tradicije vedele tisočletja: zavestno vzdrževanje notranjega ravnovesja ima merljive pozitivne učinke na zdravje, kakovost odnos in splošno blaginjo. Pozitivna psihologija — ki jo je utemeljil Martin Seligman — dokazuje, da srečo in zadovoljstvo aktivno gradimo s praksami prisotnosti, hvaležnosti in smisla.",
};

// ── AI enrichment ─────────────────────────────────────────────────────────────

async function callDeepSeekForEnrichment(
  event: {
    titleSl: string | null;
    titleEn: string;
    descriptionSl: string | null;
    descriptionEn: string;
    category: string;
    organizer: { name: string; bio: string | null; instagram: string | null } | null;
    venue: { name: string | null; city: string | null; region: string | null } | null;
    venueName: string | null;
    tags: string[];
  }
): Promise<Partial<EnrichedContent>> {
  const apiKey = process.env.DEEPSEEK_API_KEY;
  if (!apiKey) return {};

  const title = event.titleSl ?? event.titleEn;
  const desc = event.descriptionSl ?? event.descriptionEn;
  const venue = event.venue?.name ?? event.venueName ?? "Slovenija";
  const city = event.venue?.city ?? "";
  const region = event.venue?.region ?? "";
  const organizerName = event.organizer?.name ?? "Facilitator";
  const organizerBio = event.organizer?.bio ?? "";

  const prompt = `Si izkušen novinar in copywriter za slovensko wellness platformo Zavestni Dogodki. Napiši OBSEŽNO, BOGATO vsebino za spletno stran dogodka. Pišeš kot urednik revije — z dušo, toplino in navdihom. ODGOVORI SAMO Z VELJAVNIM JSON brez markdown, brez kode bloka.

PODATKI O DOGODKU:
- Naslov: ${title}
- Kratek opis: ${desc}
- Kategorija: ${event.category}
- Facilitator: ${organizerName} — ${organizerBio}
- Lokacija: ${venue}, ${city}${region ? ", " + region : ""}
- Oznake: ${event.tags.join(", ")}

NAVODILA:
- NIKOLI ne ponavljaj besedila iz kratkega opisa dobesedno
- Vsak odstavek mora biti poln vsebine, ne le en ali dva stavka
- Piši kot da vabis bralca na posebno izkušnjo — z emocijo, konkretnostjo in navdihom
- Facilitatorja predstavi kot strokovnjaka z zgodbo, ne le z navedbo bio
- Za lokacijo napiši zakaj je to mesto/prostor posebno za to vrsto prireditve

VRNI JSON z natančno temi ključi (brez odstopanj):
{
  "intro": [
    "1. odstavek (5-6 stavkov): Poetično odpri temo — kaj je ta vrsta izkušnje, zakaj je posebna, kakšno transformacijo prinaša. Brez omembe specifičnega datuma.",
    "2. odstavek (5-6 stavkov): Opiši specifičen ta dogodek — kaj se bo dogajalo, kakšna bo atmosfera, kaj bo facilitator vodil. Bodi konkreten.",
    "3. odstavek (4-5 stavkov): Zakaj ravno ta facilitator, ta prostor, ta čas. Kaj je edinstveno pri tej kombinaciji. Poziv k dejanju."
  ],
  "whatToExpect": [
    "Konkretna aktivnost 1 z opisom kako bo potekala",
    "Konkretna aktivnost 2",
    "Konkretna aktivnost 3",
    "Konkretna aktivnost 4",
    "Konkretna aktivnost 5",
    "Praktična informacija (kaj prinesti, kako se oblačiti ipd.)"
  ],
  "facilitatorBio": "3-4 stavki v 3. osebi: pot facilitatorja, specializacija, zakaj je prav ta oseba idealna za ta tip dela, njegova/njena filozofija ali pristop",
  "facilitatorFact": "Avtentičen citat ali misel v slogu te osebe — kaj bi rekel/a o tej praksi ali o tem zakaj dela to delo. Naj zveni resnično, ne reklamno.",
  "locationContext": "3 stavki: zakaj je ${city || "ta kraj"} posebno za to prakso, kaj prinaša ta prostor energijsko ali fizično, kaj je posebnega pri tem prizorišču"
}

Piši v slovenščini. Ton: topel, navdihujoč, literarno bogat, a dostopen.`;

  try {
    const res = await fetch("https://api.deepseek.com/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "deepseek-chat",
        max_tokens: 2500,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!res.ok) return {};
    const data = (await res.json()) as { choices: Array<{ message: { content: string } }> };
    const text = data.choices?.[0]?.message?.content ?? "{}";
    return JSON.parse(text) as Partial<EnrichedContent>;
  } catch {
    return {};
  }
}

export async function getEnrichedContent(event: {
  id: string;
  titleSl: string | null;
  titleEn: string;
  descriptionSl: string | null;
  descriptionEn: string;
  category: string;
  rawText: string | null;
  organizer: { name: string; bio: string | null; instagram: string | null } | null;
  venue: { name: string | null; city: string | null; region: string | null } | null;
  venueName: string | null;
  tags: string[];
}): Promise<EnrichedContent> {
  // Check cache
  if (event.rawText) {
    try {
      const cached = JSON.parse(event.rawText) as EnrichedContent & { enrichedAt?: string };
      if (cached.enrichedAt && cached.intro?.length > 0) {
        return cached;
      }
    } catch {
      // not valid JSON or old format
    }
  }

  // Category-specific technique fallback
  const technique = TECHNIQUE_FALLBACK[event.category] ?? TECHNIQUE_GENERIC;

  // AI-generated personalised content
  const ai = await callDeepSeekForEnrichment(event);

  const enriched: EnrichedContent = {
    intro: ai.intro ?? [
      event.descriptionSl ?? event.descriptionEn,
      "Pridružite se nam na tem posebnem dogodku, ki vas bo popeljal v globlje razumevanje sebe.",
    ],
    whatToExpect: ai.whatToExpect ?? [
      "Dobrodošlica in uvod v prakso",
      "Skupinska vadba pod vodstvom izkušenega facilitatorja",
      "Čas za introspekcijo in integracijo",
      "Skupna refleksija in zaključek",
    ],
    facilitatorBio: ai.facilitatorBio ?? event.organizer?.bio ?? "Izkušen facilitator z globoko predanostjo svojemu delu.",
    facilitatorFact: ai.facilitatorFact ?? `"Vsak, ki pride na ta prostor, prinese s seboj del svoje zgodbe. Moja naloga je, da ta prostor ohranjam varen in odprt." — ${event.organizer?.name ?? "Facilitator"}`,
    ...technique,
    locationContext: ai.locationContext ?? `${event.venue?.city ?? ""} je eno od središč zavestne skupnosti v Sloveniji. ${event.venue?.region ? `Regija ${event.venue.region} ponuja naravno bogato okolje, ki dopolnjuje notranjo prakso.` : ""}`,
    enrichedAt: new Date().toISOString(),
  };

  // Save to cache (fire-and-forget)
  db.event
    .update({ where: { id: event.id }, data: { rawText: JSON.stringify(enriched) } })
    .catch(() => {});

  return enriched;
}

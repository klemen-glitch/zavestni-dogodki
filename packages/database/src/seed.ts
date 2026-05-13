import { PrismaClient, EventCategory, EventStatus, EventSource, OrganizerTier } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...\n");

  // ─── ORGANIZERS ──────────────────────────────────────────────────────────
  const organizers = await Promise.all([
    prisma.organizer.create({
      data: {
        name: "Maja Novak",
        email: "maja@zavestno.si",
        bio: "Certificirana učiteljica joge in meditacije z 10-letnimi izkušnjami. Specializirana za hatha in yin jogo.",
        instagram: "@maja.zavestno",
        website: "https://zavestno.si",
        verified: true,
        tier: OrganizerTier.PREMIUM,
        rating: 4.8,
        reviewCount: 42,
        avatarUrl: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=200&h=200&fit=crop",
      },
    }),
    prisma.organizer.create({
      data: {
        name: "Luka Krajnc",
        email: "luka@dihaj.si",
        bio: "Wim Hof Method certificiran inštruktor in coach za dihalne tehnike. Organizator ledenih kopeli po vsej Sloveniji.",
        instagram: "@luka.dihaj",
        website: "https://dihaj.si",
        verified: true,
        tier: OrganizerTier.PREMIUM,
        rating: 4.9,
        reviewCount: 67,
        avatarUrl: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=200&h=200&fit=crop",
      },
    }),
    prisma.organizer.create({
      data: {
        name: "Ana Zupančič",
        email: "ana@zvocna-kopel.si",
        bio: "Terapevtka z gongi, tibetanskimi posodami in kristalnimi posodami. Vodi individualne in skupinske zvočne kopeli.",
        instagram: "@ana.zvocnakopel",
        verified: true,
        tier: OrganizerTier.FREE,
        rating: 4.7,
        reviewCount: 28,
        avatarUrl: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=200&h=200&fit=crop",
      },
    }),
    prisma.organizer.create({
      data: {
        name: "Tina Potočnik",
        email: "tina@kakao-ritual.si",
        bio: "Facilitatorka ceremonialnega kakava in ecstatičnega plesa. Ustvarja varen prostor za globoko povezovanje.",
        instagram: "@tina.kakao",
        website: "https://kakao-ritual.si",
        verified: true,
        tier: OrganizerTier.PARTNER,
        rating: 4.6,
        reviewCount: 35,
        avatarUrl: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&h=200&fit=crop",
      },
    }),
    prisma.organizer.create({
      data: {
        name: "Matej Horvat",
        email: "matej@retreat-slovenija.si",
        bio: "Organizator celostnih retreat-ov v srcu slovenskih Alp. Združuje jogo, meditacijo, pohodništvo in zdravo prehrano.",
        instagram: "@matej.retreat",
        website: "https://retreat-slovenija.si",
        verified: true,
        tier: OrganizerTier.PREMIUM,
        rating: 4.9,
        reviewCount: 53,
        avatarUrl: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=200&h=200&fit=crop",
      },
    }),
    prisma.organizer.create({
      data: {
        name: "Špela Kramberger",
        email: "spela@celostno.si",
        bio: "Celostna terapevtka — Reiki Master, Access Bars facilitatorka in intuitivna zdravilka.",
        instagram: "@spela.celostno",
        verified: false,
        tier: OrganizerTier.FREE,
        rating: 4.5,
        reviewCount: 19,
        avatarUrl: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&h=200&fit=crop",
      },
    }),
  ]);

  console.log(`✅ Created ${organizers.length} organizers`);

  // ─── VENUES ──────────────────────────────────────────────────────────────
  const venues = await Promise.all([
    prisma.venue.create({
      data: {
        name: "Zavestni Prostor Ljubljana",
        slug: "zavestni-prostor-ljubljana",
        address: "Trubarjeva cesta 50",
        city: "Ljubljana",
        region: "Osrednjeslovenska",
        lat: 46.0528,
        lng: 14.5107,
        website: "https://zavestniprostor.si",
        imageUrl: "https://images.unsplash.com/photo-1545205597-3d9d02c29597?w=800&h=400&fit=crop",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Yoga Studio Bled",
        slug: "yoga-studio-bled",
        address: "Cesta svobode 12",
        city: "Bled",
        region: "Gorenjska",
        lat: 46.3683,
        lng: 14.1146,
        website: "https://yogabled.si",
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Center Sonce Maribor",
        slug: "center-sonce-maribor",
        address: "Gosposka ulica 8",
        city: "Maribor",
        region: "Podravska",
        lat: 46.5547,
        lng: 15.6459,
        imageUrl: "https://images.unsplash.com/photo-1588286840104-8957b019727f?w=800&h=400&fit=crop",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Hiša Miru Bohinj",
        slug: "hisa-miru-bohinj",
        address: "Ribčev Laz 42",
        city: "Bohinj",
        region: "Gorenjska",
        lat: 46.2867,
        lng: 13.8575,
        imageUrl: "https://images.unsplash.com/photo-1600585154340-be6161a56a0c?w=800&h=400&fit=crop",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Prostor Srca Piran",
        slug: "prostor-srca-piran",
        address: "Tartinijev trg 3",
        city: "Piran",
        region: "Obalno-kraška",
        lat: 45.5283,
        lng: 13.5684,
        imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&h=400&fit=crop",
      },
    }),
    prisma.venue.create({
      data: {
        name: "Gozd Experience Park",
        slug: "gozd-experience-park",
        address: "Na Razdrtem 1",
        city: "Postojna",
        region: "Primorsko-notranjska",
        lat: 45.7743,
        lng: 14.2129,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
      },
    }),
  ]);

  console.log(`✅ Created ${venues.length} venues`);

  // ─── EVENTS ──────────────────────────────────────────────────────────────
  // Create events spanning the next 6 weeks
  const now = new Date();
  const dayMs = 24 * 60 * 60 * 1000;

  function futureDate(daysFromNow: number, hour: number = 10): Date {
    const d = new Date(now.getTime() + daysFromNow * dayMs);
    d.setHours(hour, 0, 0, 0);
    return d;
  }

  const events = await Promise.all([
    // ── YOGA ──
    prisma.event.create({
      data: {
        slug: "jutranja-hatha-joga-ljubljana",
        titleSl: "Jutranja Hatha Joga",
        titleEn: "Morning Hatha Yoga",
        descriptionSl: "Začnite dan z nežno hatha jogo. Primerno za vse ravni. Vadba vključuje asane, pranajamo in kratko meditacijo. Prinesi svojo blazino.",
        descriptionEn: "Start your day with gentle hatha yoga. Suitable for all levels. Practice includes asanas, pranayama, and a short meditation. Bring your own mat.",
        date: futureDate(2, 7),
        endDate: futureDate(2, 8),
        price: 12,
        currency: "EUR",
        category: EventCategory.YOGA,
        tags: ["hatha", "jutranja", "začetniki"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=800&h=400&fit=crop",
        organizerId: organizers[0].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 156,
        aiProcessed: true,
        aiConfidence: 0.95,
      },
    }),
    prisma.event.create({
      data: {
        slug: "yin-joga-in-zvocna-kopel",
        titleSl: "Yin Joga & Zvočna Kopel",
        titleEn: "Yin Yoga & Sound Bath",
        descriptionSl: "Globoko sproščujoča kombinacija yin joge in zvočne kopeli s tibetanskimi posodami. Popoln način za zaključek tedna.",
        descriptionEn: "Deeply relaxing combination of yin yoga and sound bath with Tibetan singing bowls. The perfect way to end your week.",
        date: futureDate(5, 18),
        endDate: futureDate(5, 20),
        price: 25,
        currency: "EUR",
        category: EventCategory.YOGA,
        tags: ["yin", "zvočna kopel", "sprostitev"],
        status: EventStatus.FEATURED,
        featured: true,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1506126613408-eca07ce68773?w=800&h=400&fit=crop",
        organizerId: organizers[0].id,
        venueId: venues[1].id,
        venueName: "Yoga Studio Bled",
        viewCount: 234,
        aiProcessed: true,
        aiConfidence: 0.92,
      },
    }),

    // ── BREATHWORK ──
    prisma.event.create({
      data: {
        slug: "wim-hof-dihalna-delavnica",
        titleSl: "Wim Hof Dihalna Delavnica + Ledena Kopel",
        titleEn: "Wim Hof Breathing Workshop + Ice Bath",
        descriptionSl: "3-urna delavnica Wim Hof metode: dihalna tehnika, meditacija in ledena kopel. Preizkusi meje svojega telesa in uma!",
        descriptionEn: "3-hour Wim Hof Method workshop: breathing technique, meditation, and ice bath. Test the limits of your body and mind!",
        date: futureDate(3, 10),
        endDate: futureDate(3, 13),
        price: 45,
        currency: "EUR",
        category: EventCategory.BREATHWORK,
        tags: ["wim hof", "ledena kopel", "dihanje"],
        status: EventStatus.FEATURED,
        featured: true,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1599901860904-17e6ed7083a0?w=800&h=400&fit=crop",
        organizerId: organizers[1].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 312,
        aiProcessed: true,
        aiConfidence: 0.97,
      },
    }),
    prisma.event.create({
      data: {
        slug: "holotropno-dihanje-maribor",
        titleSl: "Holotropno Dihanje",
        titleEn: "Holotropic Breathwork Session",
        descriptionSl: "Celodnevna izkušnja holotropnega dihanja po metodi Stanislava Grofa. Vključuje pripravo, dihalno seanso in integracijo.",
        descriptionEn: "Full-day holotropic breathing experience following Stanislav Grof's method. Includes preparation, breathing session, and integration.",
        date: futureDate(10, 9),
        endDate: futureDate(10, 17),
        price: 80,
        currency: "EUR",
        category: EventCategory.BREATHWORK,
        tags: ["holotropno", "grof", "transformacija"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1506126279646-a697353d3166?w=800&h=400&fit=crop",
        organizerId: organizers[1].id,
        venueId: venues[2].id,
        venueName: "Center Sonce Maribor",
        viewCount: 89,
        aiProcessed: true,
        aiConfidence: 0.88,
      },
    }),

    // ── SOUND BATH ──
    prisma.event.create({
      data: {
        slug: "gong-meditacija-polna-luna",
        titleSl: "Gong Meditacija ob Polni Luni",
        titleEn: "Full Moon Gong Meditation",
        descriptionSl: "Posebna gong meditacija ob polni luni. Zvoki gongov vas bodo popeljali v globoko stanje sprostitve in notranjega miru.",
        descriptionEn: "Special gong meditation during the full moon. The sounds of gongs will guide you into a deep state of relaxation and inner peace.",
        date: futureDate(7, 20),
        endDate: futureDate(7, 22),
        price: 20,
        currency: "EUR",
        category: EventCategory.SOUND_BATH,
        tags: ["gong", "polna luna", "meditacija"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1591291621164-2c6367723315?w=800&h=400&fit=crop",
        organizerId: organizers[2].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 198,
        aiProcessed: true,
        aiConfidence: 0.93,
      },
    }),
    prisma.event.create({
      data: {
        slug: "kristalne-posode-bled",
        titleSl: "Zvočna Kopel s Kristalnimi Posodami",
        titleEn: "Crystal Bowl Sound Bath",
        descriptionSl: "Potopite se v čiste frekvence kristalnih posod. Vsaka posoda je uglašena na drug energijski center (čakro).",
        descriptionEn: "Immerse yourself in the pure frequencies of crystal bowls. Each bowl is tuned to a different energy center (chakra).",
        date: futureDate(14, 19),
        endDate: futureDate(14, 21),
        price: 18,
        currency: "EUR",
        category: EventCategory.SOUND_BATH,
        tags: ["kristalne posode", "čakre", "zvok"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1528715471579-d1bcf0ba5e83?w=800&h=400&fit=crop",
        organizerId: organizers[2].id,
        venueId: venues[1].id,
        venueName: "Yoga Studio Bled",
        viewCount: 76,
        aiProcessed: true,
        aiConfidence: 0.91,
      },
    }),

    // ── CACAO CEREMONY ──
    prisma.event.create({
      data: {
        slug: "kakao-ceremonija-in-ecstaticni-ples",
        titleSl: "Kakao Ceremonija & Ecstatični Ples",
        titleEn: "Cacao Ceremony & Ecstatic Dance",
        descriptionSl: "Sveti ritual s ceremonialnim kakavom iz Guatemale, ki ga sledi 2 uri ecstatičnega plesa. Brez alkohola, brez obsojanja.",
        descriptionEn: "Sacred ritual with ceremonial cacao from Guatemala, followed by 2 hours of ecstatic dance. No alcohol, no judgment.",
        date: futureDate(4, 18),
        endDate: futureDate(4, 21),
        price: 30,
        currency: "EUR",
        category: EventCategory.CACAO_CEREMONY,
        tags: ["kakao", "ecstatični ples", "ceremonija"],
        status: EventStatus.FEATURED,
        featured: true,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?w=800&h=400&fit=crop",
        organizerId: organizers[3].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 445,
        aiProcessed: true,
        aiConfidence: 0.96,
      },
    }),

    // ── RETREAT ──
    prisma.event.create({
      data: {
        slug: "vikend-retreat-bohinj",
        titleSl: "Vikend Retreat: Joga, Meditacija & Narava",
        titleEn: "Weekend Retreat: Yoga, Meditation & Nature",
        descriptionSl: "3-dnevni retreat ob Bohinjskem jezeru. Jutranja in večerna joga, vodene meditacije, pohodništvo in zdrava veganska prehrana. Nastanitev vključena.",
        descriptionEn: "3-day retreat at Lake Bohinj. Morning and evening yoga, guided meditations, hiking, and healthy vegan cuisine. Accommodation included.",
        date: futureDate(12, 15),
        endDate: futureDate(14, 11),
        price: 320,
        priceNote: "Vključuje nastanitev in vse obroke",
        currency: "EUR",
        category: EventCategory.RETREAT,
        tags: ["retreat", "bohinj", "vikend", "joga"],
        status: EventStatus.FEATURED,
        featured: true,
        source: EventSource.DIRECT_SUBMISSION,
        imageUrl: "https://images.unsplash.com/photo-1545389336-cf090694435e?w=800&h=400&fit=crop",
        organizerId: organizers[4].id,
        venueId: venues[3].id,
        venueName: "Hiša Miru Bohinj",
        viewCount: 567,
        aiProcessed: true,
        aiConfidence: 0.98,
      },
    }),
    prisma.event.create({
      data: {
        slug: "tihni-retreat-piran",
        titleSl: "Tihni Retreat ob Morju",
        titleEn: "Silent Retreat by the Sea",
        descriptionSl: "5-dnevni tihni retreat v Piranu. Vipassana meditacija, nežna joga, hoja v tišini ob morju. Omejeno na 12 udeležencev.",
        descriptionEn: "5-day silent retreat in Piran. Vipassana meditation, gentle yoga, walking in silence by the sea. Limited to 12 participants.",
        date: futureDate(20, 16),
        endDate: futureDate(25, 10),
        price: 550,
        priceNote: "Zgodnja prijava: 480 EUR",
        currency: "EUR",
        category: EventCategory.RETREAT,
        tags: ["tihni retreat", "vipassana", "piran", "morje"],
        status: EventStatus.APPROVED,
        source: EventSource.DIRECT_SUBMISSION,
        imageUrl: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800&h=400&fit=crop",
        organizerId: organizers[4].id,
        venueId: venues[4].id,
        venueName: "Prostor Srca Piran",
        viewCount: 234,
        aiProcessed: true,
        aiConfidence: 0.94,
      },
    }),

    // ── MEDITATION ──
    prisma.event.create({
      data: {
        slug: "jutranja-meditacija-zazen",
        titleSl: "Jutranja Zazen Meditacija",
        titleEn: "Morning Zazen Meditation",
        descriptionSl: "Tradicionalna zen meditacija vsak torek in četrtek zjutraj. 30 min sedeča meditacija, 10 min kineča meditacija (kinhin).",
        descriptionEn: "Traditional zen meditation every Tuesday and Thursday morning. 30 min sitting meditation, 10 min walking meditation (kinhin).",
        date: futureDate(1, 6),
        endDate: futureDate(1, 7),
        price: 0,
        priceNote: "Prostovoljni prispevki dobrodošli",
        currency: "EUR",
        category: EventCategory.MEDITATION,
        tags: ["zen", "zazen", "jutranja", "brezplačno"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1508672019048-805c876b67e2?w=800&h=400&fit=crop",
        organizerId: organizers[0].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 122,
        aiProcessed: true,
        aiConfidence: 0.89,
      },
    }),
    prisma.event.create({
      data: {
        slug: "meditacija-s-pojocom-skledo",
        titleSl: "Meditacija s Pojočo Skledo",
        titleEn: "Singing Bowl Meditation",
        descriptionSl: "Vodena meditacija z zvoki tibetanskih pojočih skled. Primerno za začetnike in izkušene meditatorje.",
        descriptionEn: "Guided meditation with the sounds of Tibetan singing bowls. Suitable for beginners and experienced meditators.",
        date: futureDate(6, 19),
        endDate: futureDate(6, 20),
        price: 15,
        currency: "EUR",
        category: EventCategory.MEDITATION,
        tags: ["tibetanske sklede", "vodena meditacija"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1593811167562-9cef47bfc4d7?w=800&h=400&fit=crop",
        organizerId: organizers[2].id,
        venueId: venues[2].id,
        venueName: "Center Sonce Maribor",
        viewCount: 67,
        aiProcessed: true,
        aiConfidence: 0.87,
      },
    }),

    // ── WORKSHOP ──
    prisma.event.create({
      data: {
        slug: "delavnica-astrologija-za-zacetnike",
        titleSl: "Delavnica: Astrologija za Začetnike",
        titleEn: "Workshop: Astrology for Beginners",
        descriptionSl: "Celodnevna delavnica astrologije. Naučili se boste brati svoj natalni horoskop, razumeti planete in znamenja.",
        descriptionEn: "Full-day astrology workshop. Learn to read your natal chart, understand planets and signs.",
        date: futureDate(8, 10),
        endDate: futureDate(8, 17),
        price: 65,
        currency: "EUR",
        category: EventCategory.WORKSHOP,
        tags: ["astrologija", "delavnica", "začetniki"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1532968961962-8a0cb3a2d4f5?w=800&h=400&fit=crop",
        organizerId: organizers[5].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 145,
        aiProcessed: true,
        aiConfidence: 0.82,
      },
    }),

    // ── DANCE ──
    prisma.event.create({
      data: {
        slug: "5-ritmov-ples-ljubljana",
        titleSl: "5 Ritmov — Zavestni Ples",
        titleEn: "5 Rhythms — Conscious Dance",
        descriptionSl: "Potovanje skozi 5 ritmov: tekočnost, staccato, kaos, lirizem in tišina. Ples kot meditacija v gibanju.",
        descriptionEn: "Journey through 5 rhythms: flowing, staccato, chaos, lyrical, and stillness. Dance as meditation in motion.",
        date: futureDate(9, 19),
        endDate: futureDate(9, 21),
        price: 15,
        currency: "EUR",
        category: EventCategory.DANCE,
        tags: ["5 ritmov", "zavestni ples", "gibanje"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1508700929628-666bc8bd84ea?w=800&h=400&fit=crop",
        organizerId: organizers[3].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 178,
        aiProcessed: true,
        aiConfidence: 0.90,
      },
    }),

    // ── HEALING ──
    prisma.event.create({
      data: {
        slug: "reiki-delavnica-1-stopnja",
        titleSl: "Reiki Delavnica — 1. Stopnja (Shoden)",
        titleEn: "Reiki Workshop — Level 1 (Shoden)",
        descriptionSl: "Dvodnevna delavnica Reiki 1. stopnje z iniciacijo. Po zaključku boste sposobni zdraviti sebe in druge.",
        descriptionEn: "Two-day Reiki Level 1 workshop with initiation. After completion, you'll be able to heal yourself and others.",
        date: futureDate(15, 9),
        endDate: futureDate(16, 17),
        price: 180,
        priceNote: "Vključuje certifikat in gradivo",
        currency: "EUR",
        category: EventCategory.HEALING,
        tags: ["reiki", "shoden", "zdravljenje", "certifikat"],
        status: EventStatus.APPROVED,
        source: EventSource.DIRECT_SUBMISSION,
        imageUrl: "https://images.unsplash.com/photo-1600618528240-fb9fc964b853?w=800&h=400&fit=crop",
        organizerId: organizers[5].id,
        venueId: venues[2].id,
        venueName: "Center Sonce Maribor",
        viewCount: 201,
        aiProcessed: true,
        aiConfidence: 0.94,
      },
    }),

    // ── TANTRA ──
    prisma.event.create({
      data: {
        slug: "tantra-delavnica-za-pare",
        titleSl: "Tantra Delavnica za Pare",
        titleEn: "Tantra Workshop for Couples",
        descriptionSl: "Intimna delavnica za pare, ki želijo poglobiti svojo povezanost. Vaje za zaupanje, zavestno dotikanje in komunikacijo.",
        descriptionEn: "Intimate workshop for couples seeking to deepen their connection. Trust exercises, conscious touch, and communication.",
        date: futureDate(18, 10),
        endDate: futureDate(18, 17),
        price: 120,
        priceNote: "Cena za par",
        currency: "EUR",
        category: EventCategory.TANTRA,
        tags: ["tantra", "pare", "intimnost", "povezanost"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800&h=400&fit=crop",
        organizerId: organizers[3].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 289,
        aiProcessed: true,
        aiConfidence: 0.85,
      },
    }),

    // ── Additional future events ──
    prisma.event.create({
      data: {
        slug: "gozdna-kopel-postojna",
        titleSl: "Gozdna Kopel — Shinrin-yoku",
        titleEn: "Forest Bathing — Shinrin-yoku",
        descriptionSl: "Vodena gozdna kopel po japonski metodi shinrin-yoku. Zavestno potapljanje v gozdno atmosfero za globoko sprostitev.",
        descriptionEn: "Guided forest bathing following the Japanese shinrin-yoku method. Conscious immersion in the forest atmosphere for deep relaxation.",
        date: futureDate(11, 9),
        endDate: futureDate(11, 13),
        price: 35,
        currency: "EUR",
        category: EventCategory.HEALING,
        tags: ["gozdna kopel", "shinrin-yoku", "narava"],
        status: EventStatus.APPROVED,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800&h=400&fit=crop",
        organizerId: organizers[4].id,
        venueId: venues[5].id,
        venueName: "Gozd Experience Park",
        viewCount: 134,
        aiProcessed: true,
        aiConfidence: 0.91,
      },
    }),
    prisma.event.create({
      data: {
        slug: "access-bars-tecaj",
        titleSl: "Access Bars® Tečaj",
        titleEn: "Access Bars® Class",
        descriptionSl: "Enodnevni tečaj Access Bars® z mednarodno licenco. Naučili se boste 32 točk na glavi, ki sproščajo omejevalna prepričanja.",
        descriptionEn: "One-day Access Bars® class with international certification. Learn 32 points on the head that release limiting beliefs.",
        date: futureDate(22, 9),
        endDate: futureDate(22, 18),
        price: 250,
        priceNote: "Vključuje priročnik in certifikat",
        currency: "EUR",
        category: EventCategory.HEALING,
        tags: ["access bars", "certifikat", "tečaj"],
        status: EventStatus.APPROVED,
        source: EventSource.DIRECT_SUBMISSION,
        imageUrl: "https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&h=400&fit=crop",
        organizerId: organizers[5].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 93,
        aiProcessed: true,
        aiConfidence: 0.86,
      },
    }),

    // ── PENDING REVIEW events (to populate admin dashboard) ──
    prisma.event.create({
      data: {
        slug: "kirtan-vecer-ljubljana",
        titleSl: "Kirtan Večer — Skupinsko Petje Manter",
        titleEn: "Kirtan Evening — Group Mantra Chanting",
        descriptionSl: "Pridružite se nam za večer kirtana — skupinsko petje svetih manter v spremljavi harmonija in bobna.",
        descriptionEn: "Join us for an evening of kirtan — group chanting of sacred mantras accompanied by harmonium and drum.",
        date: futureDate(17, 19),
        endDate: futureDate(17, 21),
        price: 10,
        currency: "EUR",
        category: EventCategory.MEDITATION,
        tags: ["kirtan", "mantre", "petje"],
        status: EventStatus.PENDING_REVIEW,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=800&h=400&fit=crop",
        organizerId: organizers[0].id,
        venueId: venues[0].id,
        venueName: "Zavestni Prostor Ljubljana",
        viewCount: 0,
        aiProcessed: true,
        aiConfidence: 0.72,
      },
    }),
    prisma.event.create({
      data: {
        slug: "kontaktna-improvizacija-mb",
        titleSl: "Kontaktna Improvizacija — Odprta Ura",
        titleEn: "Contact Improvisation — Open Jam",
        descriptionSl: "Odprt prostor za prakso kontaktne improvizacije. Vsi nivoji dobrodošli. Topla oblačila in udobna obleka.",
        descriptionEn: "Open space for contact improvisation practice. All levels welcome. Warm clothing and comfortable attire.",
        date: futureDate(13, 18),
        endDate: futureDate(13, 20),
        price: 5,
        currency: "EUR",
        category: EventCategory.DANCE,
        tags: ["kontaktna improvizacija", "ples", "gibanje"],
        status: EventStatus.PENDING_REVIEW,
        source: EventSource.FACEBOOK_GROUP,
        imageUrl: "https://images.unsplash.com/photo-1547153760-18fc86ef506e?w=800&h=400&fit=crop",
        organizerId: organizers[3].id,
        venueId: venues[2].id,
        venueName: "Center Sonce Maribor",
        viewCount: 0,
        aiProcessed: true,
        aiConfidence: 0.68,
      },
    }),
  ]);

  console.log(`✅ Created ${events.length} events`);

  // ─── SUBSCRIBERS ─────────────────────────────────────────────────────────
  const subscribers = await Promise.all([
    prisma.subscriber.create({
      data: {
        email: "test@zavestnidogodki.si",
        firstName: "Test",
        lastName: "User",
        active: true,
        source: "seed",
        preferences: [EventCategory.YOGA, EventCategory.MEDITATION],
      },
    }),
    prisma.subscriber.create({
      data: {
        email: "demo@zavestnidogodki.si",
        firstName: "Demo",
        active: true,
        source: "seed",
        preferences: [EventCategory.RETREAT, EventCategory.BREATHWORK, EventCategory.SOUND_BATH],
      },
    }),
  ]);

  console.log(`✅ Created ${subscribers.length} subscribers`);

  // ─── SUMMARY ─────────────────────────────────────────────────────────────
  const counts = {
    organizers: await prisma.organizer.count(),
    venues: await prisma.venue.count(),
    events: await prisma.event.count(),
    featured: await prisma.event.count({ where: { featured: true } }),
    pending: await prisma.event.count({ where: { status: EventStatus.PENDING_REVIEW } }),
    subscribers: await prisma.subscriber.count(),
  };

  console.log("\n📊 Database Summary:");
  console.log(`   Organizers:  ${counts.organizers}`);
  console.log(`   Venues:      ${counts.venues}`);
  console.log(`   Events:      ${counts.events} (${counts.featured} featured, ${counts.pending} pending)`);
  console.log(`   Subscribers: ${counts.subscribers}`);
  console.log("\n🎉 Seed complete!");
}

main()
  .catch((e) => {
    console.error("❌ Seed failed:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());

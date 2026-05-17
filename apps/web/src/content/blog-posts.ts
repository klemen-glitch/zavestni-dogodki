export interface BlogPost {
  slug: string;
  title: string;
  description: string;
  /** ISO date string of first publish (YYYY-MM-DD) */
  date: string;
  /** ISO date string of last significant update — defaults to `date` if not set */
  dateModified?: string;
  category: string;
  readingTime: number;
  author: string;
  content: { heading?: string; body: string }[];
  faq: { question: string; answer: string }[];
  relatedCategories: string[];
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "kaj-je-zvocna-kopel",
    title: "Kaj je zvočna kopel? Popoln vodič za začetnike",
    description: "Zvočna kopel je terapevtska praksa, ki uporablja zvok Tibetanskih posod, gonga in kristalnih posod za globoko sprostitev in zdravljenje. Vse kar morate vedeti.",
    date: "2026-05-01",
    category: "SOUND_BATH",
    readingTime: 14,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Zvočna kopel (ang. sound bath) je meditativna in terapevtska praksa, pri kateri se udeleženci položijo na tla ali sedijo v udobnem položaju, medtem ko vodja igra različne inštrumente — najpogosteje Tibetanske zvočne posode, gong, kristalne posode in ksilofon. Zvoki in vibracije 'kopajo' telo in um v zvočne valove, ki spodbujajo globoko sprostitev. Praksa, ki izvira iz starodavnih azijskih tradicij, danes doživlja pravi preporod — in ni čudno, saj jo sodobna medicina vse bolj prepoznava kot učinkovito orodje za upravljanje stresa.",
      },
      {
        heading: "Kako deluje zvočna kopel?",
        body: "Zvočne vibracije vplivajo na možganske valove in jih preusmerijo iz beta stanja (budno, aktivno, 13–30 Hz) v alfa (8–13 Hz) ali theta stanje (4–8 Hz), ki ustreza globoki sprostitvi in poglobljenemu meditativnemu stanju. Gre za pojav, ki ga nevroznanstveniki imenujejo 'brainwave entrainment' ali usklajevanje možganskih valov. Hkrati zvočne vibracije spodbujajo sproščanje dopamina in serotonina — nevrotransmiterjev, ki uravnavata razpoloženje. Telo je sestavljeno večinoma iz vode, ki je odličen prevodnik zvoka — zato vibracije dosežejo vsako celico v telesu in ustvarijo notranjo masažo na celični ravni.",
      },
      {
        heading: "Kaj pričakovati na zvočni kopeli?",
        body: "Seansa navadno traja 60–90 minut. Udeleženci ležijo na joging preprogah ali blazinah, pogosto pokrijejo oči in se prepustijo izkušnji. Vodja začne z mehkimi toni in postopoma gradi zvočno izkušnjo — od nežnih posod do globokih vibracij gonga. Mnogi udeleženci opisujejo globoko sprostitev, vizualizacije, občutek lahkotnosti ali celo začasno 'izginotje' telesnih meja. Nekateri celo zaspijo — to je povsem normalno in kaže, da se telo globoko sprošča! Po seji je priporočljivo počivati vsaj 10–15 minut, piti vodo in si dati čas za integracijo izkušnje. Izogibajte se intenzivnim aktivnostim takoj po seji.",
      },
      {
        heading: "Kateri inštrumenti se uporabljajo?",
        body: "Tibetanske zvočne posode (singing bowls) so narejene iz zlitine sedmih kovin in proizvajajo bogat, večplastni rezonančen zvok. Kristalne posode so narejene iz 99,9-odstotnega kremena in imajo čist, prodoren zvok, ki je podoben tistemu, ki ga slišite pri dotiku omočenega prsta na robnik kristalne vaze. Gong je eden najmočnejših inštrumentov zvočnega zdravljenja — njegove nizke frekvence segajo globoko v telo in dosegajo organe. Nekateri vodilci dodajo še didgeridoo (aboriginalni inštrument iz Avstralije), zvončke koshi ali tingsha, shamanske bobne in celo vokalne harmonike za bogatejšo, večplastno zvočno izkušnjo.",
      },
      {
        heading: "Za koga je zvočna kopel primerna?",
        body: "Zvočna kopel je primerna za skoraj vsakogar — od popolnih začetnikov do izkušenih meditatorjev. Še posebej koristna je za posameznike pod kroničnim stresom, tiste z motnjami spanja ali anksioznostjo, osebe, ki iščejo alternativne metode sproščanja po zahtevnih delovnih obdobjih, in vsakogar, ki želi poglobiti svojo meditativno prakso brez let vadbe. Zvočna kopel zahteva le eno sposobnost: predanost zvoku. Odsvetuje se nosečnicam v prvem trimesečju, osebam z epilepsijo, kakršnimi koli vsajnimi kovinskimi implantati (srčni spodbujevalniki), in tistim, ki se ne počutijo dobro.",
      },
      {
        heading: "Kaj pravijo raziskave o zvočnih kopelih?",
        body: "Klinična literatura je še relativno mlada, a naraščajoča. Prelomna študija dr. Mitchella Gainesa iz leta 2016 (objavljena v Journal of Evidence-Based Complementary & Alternative Medicine) je pri udeležencih zvočnih kopeli izmerila statistično značilno zmanjšanje napetosti, anksioznosti in telesne bolečine. Kasnejše študije so potrdile, da zvočna terapija v kombinaciji z meditacijo zmanjšuje raven kortizola (hormona stresa) za 11–20 % in izboljšuje kakovost spanja po samo 4 tednih redne prakse. Zvočna kopel se v rehabilitacijski medicini vse bolj uporablja tudi kot dopolnilna terapija pri obvladovanju kronične bolečine, posttravmatski stresni motnji (PTSD) in onkološki negi.",
      },
      {
        heading: "Kako se pripraviti na svojo prvo zvočno kopel?",
        body: "Prihajate brez priprav — to je ena redkih praks, ki ne zahteva predznanja. Kljub temu upoštevajte nekaj nasvetov za boljšo izkušnjo: Nosite udobna, raztegljiva oblačila (ne tesnih kavbojk). Pojejte lahek obrok 2 uri pred sejo — ne na prazen in ne na poln želodec. Prinesite svojo tanko odejo ali rjuho, blazino za glavo in po možnosti masko za oči. Izključite telefon. Pridite 10 minut prej, da se aklimatizirati na prostor. Sporočite vodji, če imate kakršne koli zdravstvene posebnosti. Po seji načrtujte tiho popoldne — zvočna kopel spodbudi procese integracije, ki so intenzivnejši, kot se zdijo.",
      },
      {
        heading: "Zaključek: zakaj preizkusiti zvočno kopel?",
        body: "V svetu, ki zahteva stalno dosegljivost in hitrost, je zvočna kopel eno redkih izkušenj, ki vam da dovoljenje, da preprosto obstajate. Ni treba ničesar narediti, nič doseči, nič pravilno početi. Zvok naredi delo namesto vas. Če ste radovedni, je najboljši naslednji korak preprost: poiščite zvočno kopel v vašem mestu, se prijavite na skupinsko sejo in prinesete odprto srce. Večina udeležencev se vrne.",
      },
    ],
    faq: [
      { question: "Ali moram imeti izkušnje z meditacijo?", answer: "Ne, zvočna kopel je primerna za popolne začetnike. Vse kar morate storiti je, da se ulezete in pustite zvokom, da delajo svoje delo. Ni aktivne meditacije — izkušnjo ustvari zvok sam." },
      { question: "Kaj naj prinesem na zvočno kopel?", answer: "Prinesite udobna oblačila (po možnosti v plasteh — telo se med sejo ohlaja), tanko odejo ali rjuho, blazino za glavo, masko za oči in odprto mišljenje. Nekateri centri zagotovijo opremo — vnaprej preverite pri organizatorju." },
      { question: "Kako pogosto naj obiskujem zvočne kopeli?", answer: "Mnogi praktikanti poročajo o koristih že po eni seji. Za trajnejše učinke — boljši spanec, nižji stres, večja emocionalna stabilnost — priporočamo 1–2 seji mesečno. V akutnih stresnih obdobjih tedenski obisk 4–6 tednov." },
      { question: "Koliko stane zvočna kopel v Sloveniji?", answer: "Cene skupinskih sej se gibljejo med 15 in 35 EUR za 60–90-minutno sejo. Individualne seje so dražje, med 60 in 120 EUR. Priložnostne pop-up zvočne kopeli na festivalih ali v centrih so pogosto brezplačne ali po prispevku." },
      { question: "Je zvočna kopel primerna za otroke?", answer: "Da, a odvisno od starosti in temperamenta otroka. Otroci, starejši od 7–8 let, ki so sposobni mirno ležati 30–60 minut, zvočno kopel pogosto doživijo kot izjemno izkušnjo. Obstajajo specialne zvočne kopeli za otroke — preverite pri organizatorju." },
      { question: "Kaj se zgodi, če zaspim na zvočni kopeli?", answer: "To je povsem normalno in pogosto! Pomeni, da je vaše telo v globoki sprostitvi in varno zaupa prostoru. Vaše nezavedno telo kljub spancu sprejema zvočne vibracije. Po seji se boste počutili osveženi, ne zaspani." },
      { question: "Kako najdem zvočno kopel v svojem mestu?", answer: "Na Zavestni Dogodki zbiramo vse zvočne kopeli v Sloveniji — od Ljubljane do Maribora, Kopra in Gorenjske. Filtrirajte po mestu in datumu ter poiščite naslednjo sejo blizu vas." },
    ],
    relatedCategories: ["SOUND_BATH", "MEDITATION", "HEALING"],
  },
  {
    slug: "breathwork-za-zacetnike",
    title: "Breathwork za začetnike: kako začeti z dihalnimi vajami",
    description: "Breathwork ali zavestno dihanje je ena najučinkovitejših tehnik za zmanjšanje stresa, čustveno ozdravljenje in povečanje energije. Vodič za začetnike 2026.",
    date: "2026-05-08",
    category: "BREATHWORK",
    readingTime: 15,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Breathwork (zavestno dihanje) je skupen izraz za različne tehnike namernega uravnavanja dihanja za terapevtske namene. Od enostavnih vaj za sproščanje do globokih transformativnih tehnik — breathwork je eno najučinkovitejših in najdostopnejših orodij za dobro počutje. Najboljše pri vsem tem? Vaš dih je vedno z vami. Brezkupcijsko, brezplačno in dostopno 24 ur na dan.",
      },
      {
        heading: "Zakaj je breathwork tako učinkovit?",
        body: "Dihanje je edina telesna funkcija, ki jo lahko hkrati zavestno nadziramo IN ki poteka samodejno — brez naše pozornosti. Ta dvojnost nam daje neposreden dostop do avtonomnega živčnega sistema, tistega dela, ki uravnava stres, prebavo, srčni utrip in imunski odziv. Z zavestnim dihanjem lahko v minutah prestavimo telo iz simpatičnega ('boj ali beg') v parasimpatično ('počitek in obnova') stanje. Nobena druga tehnika ne doseže tega premika tako hitro. Ne meditacija, ne vadba, ne zdravila. Le dih.",
      },
      {
        heading: "Popularne tehnike breathworka — za vsakega kaj",
        body: "Box breathing (kvadratno dihanje): 4 sekunde vdih skozi nos, 4 zadrži, 4 izdih skozi usta, 4 zadrži — cikel ponavljajte 4–6 krat. Odlično za hitro zmanjšanje stresa pred zahtevnimi situacijami (sestanek, nastop, izpit). Uporablja ga US Navy SEALs. Tehnika 4-7-8 (dr. Andrew Weil): 4 sekunde vdih, 7 sekund zadrži, 8 sekund izdih — zelo učinkovita za spanje in akutno anksioznost. Holotropno dihanje (Stanislav Grof): globoko in hitro, neprekinjeno dihanje pod strokovnim vodstvom za poglobljene transformativne izkušnje — ne izvajajte doma brez usposobljenega facilitatorja. Wim Hof metoda: 30 globokih vdihov + zadrževanje diha + izpostavljenost mrazu — znanstveno dokazano poveča energijo, zmanjša vnetje in krepi imunski sistem.",
      },
      {
        heading: "Korak za korakom: začnite z dihalnimi vajami doma",
        body: "Izberite tiho mesto in si vzemite 10 minut brez motenj. 1) Ulezite se na hrbet ali sedite z ravno hrbtenico. 2) Položite eno roko na prsni koš, drugo na trebuh — to je vaše biofeedback orodje. 3) Vdihnite skozi nos 4 sekunde in usmerite zrak v trebuh (trebuh se dvigne, prsni koš ostane miren — to je trebušno dihanje). 4) Zadržite dih 2 sekunde. 5) Počasi izdihnite skozi usta 6 sekund — podaljšan izdih aktivira parasimpatični živčni sistem. 6) Ponovite 8–10 krat. Ko se navadite na trebušno dihanje (1–2 tedna), preidite na box breathing ali 4-7-8. Sledite ritmu — ne hitenite.",
      },
      {
        heading: "Kdaj je priporočljivo iti na delavnico?",
        body: "Za enostavnejše tehnike (trebušno dihanje, box breathing, 4-7-8) je vadba doma popolnoma primerna. Za globlje in intenzivnejše prakse — holotropno dihanje, rebirthing, intenzivne Wim Hof protokole ali ceremonial breathwork — je strokovno vodstvo nujno, ne le priporočljivo. Profesionalni breathwork facilitator skrbi za vašo fizično varnost (hiperventilacija in tetanija sta možni stranski učinki intenzivnejšega dihanja), nudi čustveno podporo med izkušnjo in pomaga pri integraciji — procesu osmišljanja tistega, kar ste doživeli.",
      },
      {
        heading: "Napake, ki jih delajo začetniki pri breathworku",
        body: "Prehiter začetek: Mnogi začetniki takoj skočijo na intenzivne tehnike in se počutijo slabo. Začnite s trebušnim dihanjem in napredujte postopoma. Napačna telesna drža: Sključena drža zoži prsni koš in omejuje kapaciteto pljuč za 30 %. Sedite vzravnano ali lezite na hrbet. Dihanje samo skozi usta: Večina tehnik vključuje vdih skozi nos (filtrira, ogreva in navlaži zrak) in izdih skozi usta ali nos. Preverjajte navodila za vsako tehniko posebej. Pretirana pričakovanja: Breathwork je orodje, ne čarobna palica. Rezultati se pokažejo z redno vadbo — ne po eni seji.",
      },
      {
        heading: "Kdaj pričakovati rezultate?",
        body: "Akutni učinki (zmanjšan stres, jasnejši um, boljše razpoloženje) so zaznavni že po prvi seji — to je ena redkih praks z takojšnjim feedbackom. Trajnejše spremembe v stopnji stresnega odziva, kakovosti spanja in čustveni stabilnosti se pokažejo po 4–8 tednih redne dnevne prakse (10–20 minut). Transformativne izkušnje (globoka čustvena sprostitev, sprememba vzorcev) zahtevajo globlje intenzivnejše seje z usposobljenim facilitatorjem.",
      },
      {
        heading: "Zaključek: zakaj bi morali začeti danes?",
        body: "V vsakem trenutku se odvija 15–20 vdihov in izdihov — večinoma nezavedno, plitko in hitro. To je izgubljena priložnost. Breathwork nas uči, da se vrnemo k tistemu, kar je vedno tu: k dihu. Začnite z dvema minutama trebušnega dihanja jutri zjutraj, preden vstanete s postelje. Ni potrebne opreme, ni aplikacije, ni naročnine. Le vaš dih in vaša odločitev, da mu prisluhnete.",
      },
    ],
    faq: [
      { question: "Je breathwork varen za začetnike?", answer: "Osnovna breathwork vadba (trebušno dihanje, box breathing, 4-7-8) je varna za večino odraslih. Intenzivnejše tehnike (holotropno dihanje, Wim Hof) niso priporočljive za nosečnice, osebe z epilepsijo, srčno-žilnimi boleznimi ali akutnimi psihiatričnimi stanji. V dvomih se posvetujte z zdravnikom." },
      { question: "Kdaj bom opazil/a rezultate breathworka?", answer: "Akutne učinke (manj stresa, jasnejši um, boljše razpoloženje) opazi večina že po prvi seji. Trajnejše spremembe v kakovosti spanja, stopnji anksioznosti in splošnem počutju se pokažejo po 4–8 tednih redne dnevne prakse." },
      { question: "Koliko časa na dan je dovolj?", answer: "Že 5–10 minut zavestnega dihanja na dan ima merljive učinke na stresni odziv in HRV (srčno variabilnost). Za globlje prakse priporočamo 20–30 minut. Konsistentnost je importantes od trajanja — kratka dnevna vadba preseže dolgo tedensko." },
      { question: "Ali se breathwork razlikuje od meditacije?", answer: "V meditaciji opazujemo dih brez manipulacije — breathwork ga aktivno usmerja in uravnava. Breathwork je pogosto bolj dostopen za začetnike, ker da nečemu, na kar se osredotočijo (ritem dihanja), namesto da sedijo v tišini z umerjevalnim umom." },
      { question: "Kaj je razlika med pranayamo in breathworkom?", answer: "Pranayama je dihalna praksa v tradiciji joge in ayurvede, kodificirana v starodavnih besedilih. Breathwork je sodobni, kliničen pristop, ki vključuje zahodno psihoterapevtsko tradicijo (Grof, Reich) in selektivno povzema vzhodne prakse. Oba dosegata podobne fiziološke učinke." },
      { question: "Kaj je tetanija in se mi bo zgodila?", answer: "Tetanija (mravljinčenje ali krči v rokah) je pogost in nenevarni stranski učinek hiperventilacije pri intenzivnejšem breathworku. Nastane zaradi spremembe CO2 v krvi. Facilitator je na to pripravljen in vas bo usmerjal. Pomaga upočasnitev dihanja ali kratek premor." },
      { question: "Kje najdem breathwork delavnice v Sloveniji?", answer: "Na Zavestni Dogodki objavljamo vse breathwork delavnice, tečaje in retreate v Sloveniji. Filtrirajte kategorijo Dihanje in izberite datum ter mesto, ki vam ustreza." },
    ],
    relatedCategories: ["BREATHWORK", "YOGA", "MEDITATION"],
  },
  {
    slug: "10-razlogov-za-yoga-retreat",
    title: "10 razlogov zakaj bi moral/a iti na yoga retreat v Sloveniji",
    description: "Yoga retreati nudijo globlje doživetje kot redne ure joge. Od osebnostne rasti do trajnih navad — odkrijte zakaj so retreati najboljša naložba v vaše zdravje.",
    date: "2026-05-15",
    category: "RETREAT",
    readingTime: 12,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Yoga retreat je večdnevni odmik, ki združuje intenzivnejšo joga prakso, meditacijo, dihalne vaje in počitek v naravnem ali mirnem okolju. Slovenija z Julijskimi Alpami, Jadranskim morjem in prekrasnimi dolenci nudi ene najboljših lokacij za tovrstne izkušnje v Evropi — in pri dostopnih cenah. Toda zakaj bi morali iti na retreat namesto nadaljevanja tedenskih ur joge?",
      },
      {
        heading: "1. Globlja praksa v kratkem času",
        body: "Na tedenski yoga uri se komaj segrejete, preden je že konec. Na retreatu boste v enem vikendu naredili toliko napredka kot v mesecu rednih ur. Dnevna vadba (tipično 2–3 ure zjutraj + popoldanska seansa) sistematično gradi moč, fleksibilnost in zavedanje. Brez motenj telefona, brez prehitevanja v pisarno. Samo vi, preproga in dih.",
      },
      {
        heading: "2. Odmik od vsakdanjega stresa",
        body: "Sprememba okolja je sama po sebi terapevtska — to ni metafora, ampak nevroznanstveno dejstvo. Ko zapustite znano okolje (dom, pisarno, rutino), možgani prekinejo automatizem in vstopijo v stanje večje receptivnosti. Naravno okolje hkrati neposredno znižuje kortizol: gozd, gore in morje aktivirajo parasimpatični živčni sistem hitreje kot katerakoli meditacijska tehnika v urbanem okolju.",
      },
      {
        heading: "3. Skupnost istovetnih ljudi",
        body: "Retreat je edinstvena priložnost za spoznavanje posameznikov, ki delijo vaše vrednote. Skupna intenzivna izkušnja — zgodnje vstajanje, skupna vadba, iskreni pogovori med odmori — ustvari globlje in hitrejše zaupanje, kot ga ustvari mesece socialnega mreženja. Mnogi udeleženci retreatov poročajo, da so na retreatu srečali nekatere svojih najbližjih prijateljev.",
      },
      {
        heading: "4. Naučite se novih navad v okolju, ki jim je naklonjeno",
        body: "Okolje oblikuje vedenje bolj, kot si mislimo. Doma je zofa bližje kot preproga, prigrizki bližje kot meditacijska blazina. Na retreatu je okolje sestavljeno prav za prakso: jutranja meditacija, zdrava hrana in redna vadba so privzete možnosti, ne izjeme. Ta 'mišični spomin' novih rutin se prenese domov z bistveno višjo verjetnostjo od navad, ki jih gradite v mesecih.",
      },
      {
        heading: "5. Digitalni detoks in kakovost spanja",
        body: "Mnogi retreati spodbujajo omejeno ali popolnoma odsotno uporabo telefonov. Dve do tri dni brez socialnih medijev in neskončnega brskanja drastično zmanjša anksioznost in izboljša kakovost spanja. Stranskega učinka ni — le jasnejši um, ki ga boste vzeli s seboj.",
      },
      {
        heading: "6. Neposreden dostop do izkušenih učiteljev",
        body: "Na skupinski uri joge z 20 udeleženci dobite le delček pozornosti inštruktorja. Na retreatu so učitelji dosegljivi ves dan — za korektivne prilagoditve, pogovor o praksi, vprašanja o prehrani ali dihanju. Takšna osebna mentorstvo je v mesecih rednih ur redkost.",
      },
      {
        heading: "7–10. Zdravo prehrana, narava, introspekcija in zaslužen odmor",
        body: "Zdravo, za telo pripravljeno vegetarijansko ali vegansko kosilo je standardni del retreatov — in boste presenečeni, kako dobro se počutite po treh dneh brez predelane hrane. Slovenija nudi gore (Julijske Alpe, Kamniške Alpe), morje (Piran, Portorož) in vasice (Bled, Bohinj) — vse znotraj dveh ur vožnje od Ljubljane. Čas za pisanje dnevnika, premislek in introspekcijo je redkost v vsakdanjem življenju, ne luksuz. In nenazadnje: zaslužili ste si odmor, ki je produktiven.",
      },
      {
        heading: "Kako izbrati pravi yoga retreat za vas?",
        body: "Najprej določite namen: Ali iščete sprostitev, intenzivno vadbo, duhovno poglobitev ali skupnost? Preverite raven zahtevnosti — retreati so označeni kot 'za začetnike', 'za vse ravni' ali 'za napredne'. Preverite profil inštruktorja: izkušnje, izobrazba in slog poučevanja so ključni. Preverite lokacijo in nastanitev: ali je skupina majhna (do 12) ali večja? Je nastanitev v eni sobi ali privatno? Je hrana vključena? Preberite recenzije prejšnjih udeležencev — iskreni komentarji o vzdušju in organizaciji povedo več kot lepše fotografije.",
      },
      {
        heading: "Zaključek: kdaj je pravi čas za retreat?",
        body: "Idealen čas za retreat ni 'ko bom imel čas' — ker ga ne boste nikoli imeli dovolj. Pravi čas je takrat, ko čutite, da potrebujete premor; ko vaša joga praksa stagnira; ko iščete stik s skupnostjo; ali preprosto ko hočete doživeti Slovenijo z drugačne perspektive. Retreati niso ekskluzivni za izkušene jogiče ali duhovne iskalce — so za vsakogar, ki želi investirati vikend v svoje dolgoročno počutje.",
      },
    ],
    faq: [
      { question: "Ali moram biti izkušen jogi za retreat?", answer: "Večina retreatov sprejema začetnike. Preverite opis — nekateri so specifično namenjeni začetnikom, drugi so primerni za vse ravni." },
      { question: "Koliko stane yoga retreat v Sloveniji?", answer: "Weekend retreati se gibljejo med 150 in 400 EUR all-inclusive (nastanitev, hrana, vadba). Dnevni retreati so med 60 in 120 EUR." },
      { question: "Kdaj je najboljši čas za yoga retreat v Sloveniji?", answer: "Spomladi (april–junij) in jeseni (september–oktober) so idealni — ni vročine, narava je najlepša. Zimski retreati v Alpah imajo posebno čarobnost." },
      { question: "Kaj prinesti na retreat?", answer: "Joga preproga (ali preverite, ali jo zagotovijo), udobna oblačila, sončna krema, notes za pisanje in odprto srce." },
      { question: "Kako najdem retreat blizu mene?", answer: "Zavestni Dogodki zbira vse yoga retreate v Sloveniji na enem mestu. Filtrirajte po regiji, datumu in ceni." },
    ],
    relatedCategories: ["RETREAT", "YOGA", "MEDITATION"],
  },
];

export function getBlogPost(slug: string): BlogPost | undefined {
  return BLOG_POSTS.find((p) => p.slug === slug);
}

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
    readingTime: 8,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Zvočna kopel (ang. sound bath) je meditativna in terapevtska praksa, pri kateri se udeleženci položijo na tla ali sedijo v udobnem položaju, medtem ko vodja igra različne inštrumente — najpogosteje Tibetanske zvočne posode, gong, kristalne posode in ksilofon. Zvoki in vibracije 'kopajo' telo in um v zvočne valove, ki spodbujajo globoko sprostitev.",
      },
      {
        heading: "Kako deluje zvočna kopel?",
        body: "Zvočne vibracije vplivajo na možganske valove in jih preusmerijo iz beta stanja (budno, aktivno) v alfa ali theta stanje (globoka sprostitev, meditacija). Raziskave kažejo, da redne zvočne kopeli zmanjšujejo kortizol (hormon stresa), izboljšujejo kakovost spanja in spodbujajo občutek dobrega počutja. Telo je sestavljeno večinoma iz vode, ki je odličen prevodnik zvoka — zato vibracije dosežejo vsako celico v telesu.",
      },
      {
        heading: "Kaj pričakovati na zvočni kopeli?",
        body: "Seansa navadno traja 60–90 minut. Udeleženci ležijo na joging preprogah ali blazinah. Vodja začne z mehkimi toni in postopoma gradi zvočno izkušnjo. Mnogi udeleženci opisujejo globoko sprostitev, vizualizacije in občutek lahkotnosti. Nekateri celo zaspijo — to je povsem normalno! Po seji je priporočljivo počakati, piti vodo in si dati čas za integracijo izkušnje.",
      },
      {
        heading: "Kateri inštrumenti se uporabljajo?",
        body: "Tibetanske zvočne posode so narejene iz posebnih zlitin kovin in proizvajajo bogat, rezonančen zvok. Kristalne posode so narejene iz kremena in imajo čist, prodoren zvok. Gong je eden najmočnejših inštrumentov — njegove vibracije segajo globoko v telo. Nekateri vodilci dodajo še didgeridoo, zvončke ali shamanske bobne za bogatejšo zvočno izkušnjo.",
      },
      {
        heading: "Za koga je zvočna kopel primerna?",
        body: "Zvočna kopel je primerna za skoraj vsakogar — od popolnih začetnikov do izkušenih meditatorjev. Še posebej koristna je za posameznike pod stresom, tiste z motnjami spanja, osebe, ki iščejo alternativne metode sproščanja, in vsakogar, ki želi poglobiti svojo meditativno prakso. Odsvetuje se nosečnicam v prvem trimesečju in osebam z epilepsijo.",
      },
    ],
    faq: [
      { question: "Ali moram imeti izkušnje z meditacijo?", answer: "Ne, zvočna kopel je primerna za popolne začetnike. Vse kar morate storiti je, da se ulezete in pustite zvokom, da delajo svoje delo." },
      { question: "Kaj naj prinesem na zvočno kopel?", answer: "Prinesite udobna oblačila, tanko odejo ali rjuho, blazino za glavo in odprto mišljenje. Nekateri centri zagotovijo opremo — preverite pri organizatorju." },
      { question: "Kako pogosto naj obiskujem zvočne kopeli?", answer: "Mnogi praktikanti poročajo o koristih že po eni seji. Za trajnejše učinke priporočamo 1–2 seji mesečno." },
      { question: "Koliko stane zvočna kopel v Sloveniji?", answer: "Cene se gibljejo med 15 in 40 EUR za skupinsko sejo. Individualne seje so dražje, med 60 in 120 EUR." },
      { question: "Kako najdem zvočno kopel v svojem mestu?", answer: "Na Zavestni Dogodki zbiramo vse zvočne kopeli v Sloveniji. Preverite našo kategorijo in filtrirajte po mestu." },
    ],
    relatedCategories: ["SOUND_BATH", "MEDITATION", "HEALING"],
  },
  {
    slug: "breathwork-za-zacetnike",
    title: "Breathwork za začetnike: kako začeti z dihalnimi vajami",
    description: "Breathwork ali zavestno dihanje je ena najučinkovitejših tehnik za zmanjšanje stresa, čustveno ozdravljenje in povečanje energije. Vodič za začetnike 2026.",
    date: "2026-05-08",
    category: "BREATHWORK",
    readingTime: 10,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Breathwork (zavestno dihanje) je skupen izraz za različne tehnike namernega uravnavanja dihanja za terapevtske namene. Od enostavnih vaj za sproščanje do globokih transformativnih tehnik — breathwork je eno najučinkovitejših in najdostopnejših orodij za dobro počutje.",
      },
      {
        heading: "Zakaj je breathwork tako učinkovit?",
        body: "Dihanje je edina telesna funkcija, ki jo lahko zavestno nadziramo, a se odvija tudi samodejno. Ta dvojnost nam daje neposreden dostop do avtonomnega živčnega sistema — tistega dela, ki uravnava stres, prebavo, srčni utrip in imunski odziv. Z zavestnim dihanjem lahko v minutah prestavimo telo iz simpatičnega (boj ali beg) v parasimpatično (počitek in obnova) stanje.",
      },
      {
        heading: "Popularne tehnike breathworka",
        body: "Box breathing (kvadratno dihanje): 4 sekunde vdih, 4 zadrži, 4 izdih, 4 zadrži — odlično za hitro zmanjšanje stresa. Tehnika 4-7-8: 4 sekunde vdih, 7 zadrži, 8 izdih — pomaga pri spanju in anksioznosti. Holotropno dihanje (Stanislav Grof): globoko in hitro dihanje pod strokovnim vodstvom za poglobljene izkušnje. Wim Hof metoda: kombinacija intenzivnega dihanja in izpostavljenosti mrazu za povečanje energije in odpornosti.",
      },
      {
        heading: "Kako začeti z breathworkom doma",
        body: "Začnite s preprostim abdominalnim dihanjem. Ulezite se na hrbet, položite eno roko na prsni koš, drugo na trebuh. Vdihnite skozi nos in usmerite zrak v trebuh (trebuh se dvigne, prsni koš miruje). Počasi izdihnite skozi usta. Ponavljajte 5–10 minut. Ko se navadite na trebušno dihanje, preizkusite box breathing ali tehniko 4-7-8.",
      },
      {
        heading: "Kdaj je priporočljivo iti na delavnico?",
        body: "Za enostavnejše tehnike si lahko vzamete čas doma. Za globlje prakse — holotropno dihanje, rebirthing ali intenzivne Wim Hof protokole — je priporočljivo začeti pod strokovnim vodstvom. Profesionalni breathwork vodja skrbi za vašo varnost, nudi podporo med intenzivnejšimi izkušnjami in pomaga pri integraciji.",
      },
    ],
    faq: [
      { question: "Je breathwork varen?", answer: "Osnovna breathwork vadba je varna za večino ljudi. Intenzivnejše tehnike niso priporočljive za nosečnice, osebe z epilepsijo ali srčno-žilnimi boleznimi brez zdravniškega posvetovanja." },
      { question: "Kdaj bom opazil/a rezultate?", answer: "Mnogi opisujejo opazne učinke že po prvi seji — zmanjšan stres, večjo jasnost uma in boljše razpoloženje. Trajnejše spremembe se pokažejo po 4–8 tednih redne vadbe." },
      { question: "Koliko časa na dan je dovolj?", answer: "Že 5–10 minut zavestnega dihanja na dan ima merljive učinke na stresni odziv. Za globlje prakse priporočamo 20–30 minut." },
      { question: "Kaj je razlika med jogo in breathworkom?", answer: "V jogi je pranayama (dihanje) del širše prakse. Breathwork je specializirana disciplina, ki se osredotoča izključno na terapevtski učinek dihanja." },
      { question: "Kje najdem breathwork delavnice v Sloveniji?", answer: "Na Zavestni Dogodki objavljamo vse breathwork delavnice in tečaje v Sloveniji. Preverite kategorijo Dihanje." },
    ],
    relatedCategories: ["BREATHWORK", "YOGA", "MEDITATION"],
  },
  {
    slug: "10-razlogov-za-yoga-retreat",
    title: "10 razlogov zakaj bi moral/a iti na yoga retreat v Sloveniji",
    description: "Yoga retreati nudijo globlje doživetje kot redne ure joge. Od osebnostne rasti do trajnih navad — odkrijte zakaj so retreati najboljša naložba v vaše zdravje.",
    date: "2026-05-15",
    category: "RETREAT",
    readingTime: 7,
    author: "Zavestni Dogodki",
    content: [
      {
        body: "Yoga retreat je večdnevni odmik, ki združuje intenzivnejšo joga prakso, meditacijo, dihalne vaje in počitek v naravnem ali mirnem okolju. Slovenija z Alpami, Jadranskim morjem in šotorji narave nudi izvrstne lokacije za takšne izkušnje.",
      },
      {
        heading: "1. Globlja praksa v kratkem času",
        body: "Na tedenski yoga uri se komaj segrejete. Na retreatu boste v enem vikendu naredili toliko napredka kot v mesecu rednih ur. Dnevna vadba, ki jo nudijo retreati, sistematično gradi moč, fleksibilnost in zavedanje.",
      },
      {
        heading: "2. Odmik od vsakdanjega stresa",
        body: "Sprememba okolja je sama po sebi terapevtska. Ko zapustite rutino doma in pisarne, možgani in telo dobijo priložnost za pravi počitek. Naravno okolje znižuje kortizol hitreje kot katerakoli druga metoda.",
      },
      {
        heading: "3. Skupnost istovetnih ljudi",
        body: "Retreat je edinstvena priložnost za spoznavanje istovetnih posameznikov. Delitev izkušenj med intenzivno vadbo ustvari hitro in globlje prijateljstvo kot katerakoli socialna mreža.",
      },
      {
        heading: "4–6. Naučite se zdravih navad, digitalni detoks in izkušeni učitelji",
        body: "Kontinuirana izkušnja retreata ustvari 'mišični spomin' novih rutinah. Jutranja meditacija, zdrava prehrana in redna vadba se na retreatu pokažejo kot dosegljive. Mnogi retreati spodbujajo omejeno uporabo telefonov — to samo po sebi zmanjša anksioznost in izboljša kakovost spanja. Izkušeni učitelji vam posvetijo ves čas in pozornost, ki je ne dobite v skupinskih urah.",
      },
      {
        heading: "7–10. Zdrava hrana, narava, introspekcija in zaslužen odmor",
        body: "Zdravo, za telo pripravljeno vegetarijansko ali vegansko kosilo je del večine retreatov. Narava je partner v ozdravitvi — zelene površine, gore in morje znižujejo stres merljivo bolj kot urbano okolje. Čas za pisanje dnevnika in introspekcijo je redkost v vsakdanjem življenju. In nenazadnje — zaslužili ste si odmor.",
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

import { NextResponse } from "next/server";

const SYSTEM_PROMPT = `Si prijazen pomočnik platforme Zavestni Dogodki — prvega kuricanega imenika zavestnih, duhovnih in wellness dogodkov v Sloveniji.

TVOJA VLOGA:
- Pomagaš obiskovalcem najti prave dogodke (joga, meditacija, dihanje, zvočne kopeli, kakao ceremonije, retreati, ples itd.)
- Odgovarjaš na vprašanja o platformi, oddaji dogodkov in zavestnih praksah
- Svetuješ katere prakse so primerne za različne potrebe
- Pišeš V SLOVENŠČINI (razen če te vprašajo drugače)

PODATKI O PLATFORMI:
- Zavestni Dogodki je brezplačen imenik za iskanje
- Organizatorji/facilitatorji lahko BREZPLAČNO (otvoritev promo) oddajo svoj dogodek na /submit
- Kategorije: Yoga, Meditacija, Dihanje, Zvočna kopel, Kakao ceremonija, Retreat, Delavnica, Ples, Tantra, Zdravljenje
- Filtriranje po mestu, regiji, datumu, ceni
- Spletna stran: zavestnidogodki.si

SLOG:
- Topel, prijazni, navdihujoč
- Kratek in jedrnat (2-4 stavki na odgovor)
- Emoji za živahnost 🌿
- Nikoli ne izmišljuj specifičnih datumov ali imen dogodkov — za konkretne dogodke napoti na /events`;

interface Message {
  role: "user" | "assistant";
  content: string;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json({ reply: "Oprostite, pomočnik trenutno ni na voljo." });
  }

  let body: { messages?: Message[] };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const messages = (body.messages ?? []).slice(-10); // keep last 10 turns

  try {
    const res = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "x-api-key": apiKey,
        "anthropic-version": "2023-06-01",
        "content-type": "application/json",
      },
      body: JSON.stringify({
        model: "claude-3-haiku-20240307",
        max_tokens: 400,
        system: SYSTEM_PROMPT,
        messages,
      }),
    });

    if (!res.ok) {
      return NextResponse.json({ reply: "Oprostite, prišlo je do napake. Poskusite znova." });
    }

    const data = (await res.json()) as { content: Array<{ text: string }> };
    const reply = data.content?.[0]?.text ?? "Oprostite, ne razumem. Poskusite znova.";
    return NextResponse.json({ reply });
  } catch {
    return NextResponse.json({ reply: "Oprostite, prišlo je do napake. Poskusite znova." });
  }
}

interface ICalEvent {
  title: string;
  description: string;
  location?: string | null;
  start: Date;
  end?: Date | null;
  url?: string;
  organizer?: string | null;
}

function formatICalDate(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function escapeICalText(text: string): string {
  return text
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\n/g, "\\n");
}

function foldLine(line: string): string {
  const max = 75;
  if (line.length <= max) return line;
  let result = "";
  let pos = 0;
  while (pos < line.length) {
    if (pos === 0) {
      result += line.slice(0, max);
      pos = max;
    } else {
      result += "\r\n " + line.slice(pos, pos + max - 1);
      pos += max - 1;
    }
  }
  return result;
}

export function generateICalFile(event: ICalEvent): string {
  const uid = `${Date.now()}-${Math.random().toString(36).slice(2)}@zavestnidogodki.si`;
  const now = formatICalDate(new Date());
  const dtstart = formatICalDate(event.start);
  const dtend = formatICalDate(event.end ?? new Date(event.start.getTime() + 2 * 60 * 60 * 1000));

  const lines = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//Zavestni Dogodki//SI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    "BEGIN:VEVENT",
    foldLine(`UID:${uid}`),
    foldLine(`DTSTAMP:${now}`),
    foldLine(`DTSTART:${dtstart}`),
    foldLine(`DTEND:${dtend}`),
    foldLine(`SUMMARY:${escapeICalText(event.title)}`),
    foldLine(`DESCRIPTION:${escapeICalText(event.description)}`),
    ...(event.location ? [foldLine(`LOCATION:${escapeICalText(event.location)}`)] : []),
    ...(event.url ? [foldLine(`URL:${event.url}`)] : []),
    ...(event.organizer ? [foldLine(`ORGANIZER;CN=${escapeICalText(event.organizer)}:mailto:info@zavestnidogodki.si`)] : []),
    "END:VEVENT",
    "END:VCALENDAR",
  ];

  return lines.join("\r\n");
}

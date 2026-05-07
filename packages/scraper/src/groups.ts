/**
 * Multi-group scraper configuration.
 *
 * HOW TO FIND MORE GROUPS:
 * 1. Search Facebook for: "yoga Ljubljana", "meditacija Slovenija", "wellness events Slovenia"
 * 2. Check the "Groups" tab for groups with 500+ members
 * 3. Add the group URL and ID below
 * 4. Set `owned: false` for groups you don't admin (uses Playwright scraping)
 * 5. Set `owned: true` only for groups where you have admin access (uses Graph API)
 *
 * For Graph API access on your own group, create a Facebook App at developers.facebook.com
 * and request the `groups_access_member_info` permission.
 */

export interface GroupConfig {
  id: string;           // unique key for this group in our system
  name: string;
  url: string;
  groupId?: string;     // FB group numeric ID (for Graph API)
  language: "sl" | "en" | "mixed";
  owned: boolean;       // true = your group (use Graph API), false = scrape
  active: boolean;
  priority: number;     // 1 = highest (scraped first)
  notes?: string;
}

export const FB_GROUPS: GroupConfig[] = [
  // ── YOUR OWN GROUP (highest priority) ────────────────────────────────────
  {
    id: "zavestni_dogodki",
    name: "Zavestni Dogodki Slovenija",
    url: "https://www.facebook.com/groups/529182865647567/",
    groupId: "529182865647567",
    language: "sl",
    owned: true,
    active: true,
    priority: 1,
    notes: "Main group. Use FB Graph API when token available.",
  },

  // ── KNOWN RELEVANT GROUPS (verified by searching FB) ────────────────────
  // TO ADD: Search FB → find group URL → copy numeric ID from URL → add here

  {
    id: "yoga_ljubljana",
    name: "Yoga Ljubljana",
    url: "https://www.facebook.com/groups/yogaljubljana",
    groupId: "",  // TODO: fill in numeric ID from the group URL
    language: "sl",
    owned: false,
    active: false, // set true after verifying URL
    priority: 2,
    notes: "Large yoga community in Ljubljana. Verify URL before enabling.",
  },
  {
    id: "meditacija_slovenija",
    name: "Meditacija Slovenija",
    url: "https://www.facebook.com/groups/meditacijaslovenija",
    groupId: "",
    language: "sl",
    owned: false,
    active: false,
    priority: 2,
    notes: "Meditation community. Verify URL before enabling.",
  },
  {
    id: "holistic_wellness_slo",
    name: "Holistično Zdravje Slovenija",
    url: "https://www.facebook.com/groups/holistically.slo",
    groupId: "",
    language: "sl",
    owned: false,
    active: false,
    priority: 3,
    notes: "Holistic health group. Verify URL before enabling.",
  },
  {
    id: "ecstatic_dance_slo",
    name: "Ecstatic Dance Slovenia",
    url: "https://www.facebook.com/groups/ecstaticdanceslovenia",
    groupId: "",
    language: "en",
    owned: false,
    active: false,
    priority: 3,
    notes: "Conscious dance community.",
  },
  {
    id: "breathwork_slo",
    name: "Breathwork Slovenija",
    url: "https://www.facebook.com/groups/breathworkslovenija",
    groupId: "",
    language: "sl",
    owned: false,
    active: false,
    priority: 3,
    notes: "Breathwork practitioners.",
  },
  {
    id: "sound_healing_slo",
    name: "Zvočno Zdravljenje Slovenija",
    url: "https://www.facebook.com/groups/zvocnozdravljenje",
    groupId: "",
    language: "sl",
    owned: false,
    active: false,
    priority: 4,
    notes: "Sound healing and bowls community.",
  },
  {
    id: "wellness_maribor",
    name: "Wellness & Joga Maribor",
    url: "https://www.facebook.com/groups/wellnessmaribor",
    groupId: "",
    language: "sl",
    owned: false,
    active: false,
    priority: 4,
    notes: "Maribor region wellness events.",
  },
];

export function getActiveGroups(): GroupConfig[] {
  return FB_GROUPS
    .filter((g) => g.active)
    .sort((a, b) => a.priority - b.priority);
}

export function getGroupById(id: string): GroupConfig | undefined {
  return FB_GROUPS.find((g) => g.id === id);
}

export function getOwnedGroups(): GroupConfig[] {
  return FB_GROUPS.filter((g) => g.owned && g.active);
}

export function getExternalGroups(): GroupConfig[] {
  return FB_GROUPS.filter((g) => !g.owned && g.active);
}

export type EventCategory =
  | "YOGA"
  | "MEDITATION"
  | "BREATHWORK"
  | "SOUND_BATH"
  | "CACAO_CEREMONY"
  | "RETREAT"
  | "WORKSHOP"
  | "DANCE"
  | "TANTRA"
  | "HEALING"
  | "OTHER";

export interface RawFacebookPost {
  text: string;
  imageUrls?: string[];
  postUrl?: string;
  postedAt?: string;
  authorName?: string;
}

export interface ProcessedEvent {
  titleSl: string | null;
  titleEn: string;
  descriptionSl: string | null;
  descriptionEn: string;
  shortDescEn: string | null;   // max 160 chars
  date: string | null;          // ISO 8601
  endDate: string | null;       // ISO 8601
  price: number | null;
  priceNote: string | null;
  currency: "EUR";
  category: EventCategory;
  tags: string[];
  location: string | null;
  venueName: string | null;
  organizerName: string | null;
  organizerContact: string | null;
  imageHint: string | null;
  confidence: number;           // 0.0–1.0
}

export interface ProcessingResult {
  success: boolean;
  event?: ProcessedEvent;
  error?: string;
  rawPost: RawFacebookPost;
  tokensUsed?: number;
  cachedTokens?: number;
}

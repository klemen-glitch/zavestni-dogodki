import type { ProcessedEvent } from "@conscious-slovenia/ai-processor";

export type { ProcessedEvent };

export interface NewsletterEdition {
  title: string;
  subjectLine: string;
  previewText: string;
  weekStart: Date;
  weekEnd: Date;
  featuredEvents: ProcessedEvent[];
  regularEvents: ProcessedEvent[];
  sponsorBlock?: SponsorBlock;
}

export interface SponsorBlock {
  name: string;
  tagline: string;
  ctaText: string;
  ctaUrl: string;
  imageUrl?: string;
}

export interface PublishResult {
  success: boolean;
  platform: "beehiiv" | "ghost";
  externalId?: string;
  externalUrl?: string;
  error?: string;
}

export interface BeehiivPostPayload {
  publication_id: string;
  subject: string;
  preview_text: string;
  body: string;
  status: "draft" | "confirmed";
  schedule_for?: number; // Unix timestamp
}

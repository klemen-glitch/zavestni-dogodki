export interface ScrapedPost {
  postId: string;
  text: string;
  imageUrls: string[];
  postUrl: string;
  authorName: string;
  postedAt: string;
  scrapedAt: string;
}

export interface ScraperConfig {
  groupUrl: string;
  maxPosts?: number;
  headless?: boolean;
  authStatePath?: string;
}

export interface ScraperResult {
  posts: ScrapedPost[];
  scrapedAt: string;
  durationMs: number;
  errors: string[];
}

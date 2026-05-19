export interface ScrapedPost {
  postId: string;
  text: string;
  imageUrls: string[];
  postUrl: string;
  authorName: string;
  /** Facebook profile URL of the post author, e.g. https://www.facebook.com/username */
  authorFbUrl?: string;
  /** Stable Facebook profile picture URL via Graph API */
  authorAvatarUrl?: string;
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

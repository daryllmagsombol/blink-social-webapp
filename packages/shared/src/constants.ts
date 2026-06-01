declare const process: {
  env: {
    NEXT_PUBLIC_API_URL?: string;
  };
};

export const API_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_CAPTION_LENGTH = 2200;
export const MAX_COMMENT_LENGTH = 500;
export const STORY_DURATION_HOURS = 24;

import type { Timestamp } from "firebase/firestore";

export type BlogPostDoc = {
  title: string;
  slug: string;
  excerpt: string;
  body: string;
  /** Optional hero image (HTTPS URL, e.g. Unsplash). */
  heroImage?: string;
  published: boolean;
  authorUid: string;
  authorName: string;
  createdAt: Timestamp | null;
  updatedAt: Timestamp | null;
};

export type BlogCommentDoc = {
  authorUid: string;
  authorDisplayName: string;
  body: string;
  /** Top-level: null. Reply: id of a top-level comment only. */
  parentCommentId: string | null;
  createdAt: Timestamp | null;
};

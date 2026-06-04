import {
  addDoc,
  collection,
  deleteDoc,
  deleteField,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  setDoc,
  updateDoc,
  where,
} from "firebase/firestore";
import type { Unsubscribe } from "firebase/firestore";
import type { User } from "firebase/auth";
import type { BlogCommentDoc, BlogPostDoc } from "@/lib/blog-types";
import { getFirebaseDb } from "@/lib/firebase-db";

const POSTS = "blog_posts";

export function slugifyTitle(title: string): string {
  const s = title
    .trim()
    .toLowerCase()
    .replace(/[''`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return s.length > 0 ? s.slice(0, 96) : "article";
}

export async function ensureUniqueSlug(base: string): Promise<string> {
  const db = getFirebaseDb();
  if (!db) return base;
  let candidate = base;
  let n = 0;
  while (n < 50) {
    const snap = await getDoc(doc(db, POSTS, candidate));
    if (!snap.exists()) return candidate;
    n += 1;
    candidate = `${base}-${n}`;
  }
  return `${base}-${Date.now()}`;
}

export function subscribePublishedPosts(
  onRows: (rows: { id: string; data: BlogPostDoc }[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  const q = query(collection(db, POSTS), where("published", "==", true), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onRows(snap.docs.map((d) => ({ id: d.id, data: d.data() as BlogPostDoc })));
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export function subscribeAllPostsForAdmin(
  onRows: (rows: { id: string; data: BlogPostDoc }[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  const q = query(collection(db, POSTS), orderBy("createdAt", "desc"));
  return onSnapshot(
    q,
    (snap) => {
      onRows(snap.docs.map((d) => ({ id: d.id, data: d.data() as BlogPostDoc })));
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export async function fetchPostBySlug(slug: string): Promise<{ id: string; data: BlogPostDoc } | null> {
  const db = getFirebaseDb();
  if (!db) return null;
  const ref = doc(db, POSTS, slug);
  const snap = await getDoc(ref);
  if (!snap.exists()) return null;
  return { id: snap.id, data: snap.data() as BlogPostDoc };
}

export async function saveBlogPostAdmin(
  slug: string,
  patch: Pick<BlogPostDoc, "title" | "slug" | "excerpt" | "body" | "published" | "heroImage">,
  user: User,
  isNew: boolean,
): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getFirebaseDb();
  if (!db) return { ok: false, message: "Firestore is not configured." };
  const ref = doc(db, POSTS, slug);
  const display = user.displayName ?? user.email?.split("@")[0] ?? "Author";
  try {
    if (isNew) {
      await setDoc(ref, {
        title: patch.title,
        slug,
        excerpt: patch.excerpt,
        body: patch.body,
        published: patch.published,
        ...(patch.heroImage?.trim() ? { heroImage: patch.heroImage.trim() } : {}),
        authorUid: user.uid,
        authorName: display,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
    } else {
      await updateDoc(ref, {
        title: patch.title,
        excerpt: patch.excerpt,
        body: patch.body,
        published: patch.published,
        ...(patch.heroImage?.trim() ? { heroImage: patch.heroImage.trim() } : { heroImage: deleteField() }),
        updatedAt: serverTimestamp(),
      });
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Save failed." };
  }
}

export async function deleteBlogPostAdmin(slug: string): Promise<{ ok: true } | { ok: false; message: string }> {
  const db = getFirebaseDb();
  if (!db) return { ok: false, message: "Firestore is not configured." };
  try {
    const likesSnap = await getDocs(collection(db, POSTS, slug, "likes"));
    const commentsSnap = await getDocs(collection(db, POSTS, slug, "comments"));
    for (const c of commentsSnap.docs) {
      await deleteDoc(c.ref);
    }
    for (const l of likesSnap.docs) {
      await deleteDoc(l.ref);
    }
    await deleteDoc(doc(db, POSTS, slug));
    return { ok: true };
  } catch (e) {
    return { ok: false, message: e instanceof Error ? e.message : "Delete failed." };
  }
}

export function subscribeLikes(
  postId: string,
  onData: (likeUids: string[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  return onSnapshot(
    collection(db, POSTS, postId, "likes"),
    (snap) => {
      onData(snap.docs.map((d) => d.id));
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export async function setLike(postId: string, uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("No database");
  await setDoc(doc(db, POSTS, postId, "likes", uid), { createdAt: serverTimestamp() });
}

export async function removeLike(postId: string, uid: string): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("No database");
  await deleteDoc(doc(db, POSTS, postId, "likes", uid));
}

export function subscribeComments(
  postId: string,
  onRows: (rows: { id: string; data: BlogCommentDoc }[]) => void,
  onError?: (e: Error) => void,
): Unsubscribe | null {
  const db = getFirebaseDb();
  if (!db) {
    onError?.(new Error("Firestore is not configured."));
    return null;
  }
  const q = query(collection(db, POSTS, postId, "comments"), orderBy("createdAt", "asc"));
  return onSnapshot(
    q,
    (snap) => {
      onRows(snap.docs.map((d) => ({ id: d.id, data: d.data() as BlogCommentDoc })));
    },
    (e) => onError?.(e instanceof Error ? e : new Error(String(e))),
  );
}

export async function addComment(
  postId: string,
  user: User,
  body: string,
  parentCommentId: string | null,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("No database");
  const authorDisplayName = user.displayName ?? user.email?.split("@")[0] ?? "Member";
  await addDoc(collection(db, POSTS, postId, "comments"), {
    authorUid: user.uid,
    authorDisplayName,
    body: body.trim(),
    parentCommentId: parentCommentId ?? null,
    createdAt: serverTimestamp(),
  });
}

export async function updateCommentBody(
  postId: string,
  commentId: string,
  body: string,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("No database");
  await updateDoc(doc(db, POSTS, postId, "comments", commentId), { body: body.trim() });
}

/** Deletes a top-level comment and its replies, or a single reply. */
export async function deleteCommentCascade(
  postId: string,
  commentId: string,
  uid: string,
  isAdminUser: boolean,
): Promise<void> {
  const db = getFirebaseDb();
  if (!db) throw new Error("No database");
  const cref = doc(db, POSTS, postId, "comments", commentId);
  const snap = await getDoc(cref);
  if (!snap.exists()) return;
  const data = snap.data() as BlogCommentDoc;
  if (!isAdminUser && data.authorUid !== uid) {
    throw new Error("You can only delete your own comments.");
  }
  if (data.parentCommentId == null) {
    const all = await getDocs(collection(db, POSTS, postId, "comments"));
    for (const d of all.docs) {
      const cd = d.data() as BlogCommentDoc;
      if (cd.parentCommentId === commentId) {
        await deleteDoc(d.ref);
      }
    }
  }
  await deleteDoc(cref);
}

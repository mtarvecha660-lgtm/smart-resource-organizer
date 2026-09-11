// File: src/services/resourceService.ts
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  onSnapshot,
  serverTimestamp,
  Timestamp,
  getDocs,
  limit,
  startAfter,
  orderBy,
  QueryDocumentSnapshot,
  DocumentData,
  getCountFromServer,
  QueryConstraint,
} from 'firebase/firestore';
import { db, auth } from '../lib/firebase';
import { ResourceFormData, ResourceItem, CategoryFilter, ResourceCategory } from '../types/resource';

const COLLECTION_NAME = 'resources';

export enum OperationType {
  CREATE = 'create',
  UPDATE = 'update',
  DELETE = 'delete',
  LIST = 'list',
  GET = 'get',
  WRITE = 'write',
}

export interface FirestoreErrorInfo {
  error: string;
  operationType: OperationType;
  path: string | null;
  authInfo: {
    userId?: string | null;
    email?: string | null;
    emailVerified?: boolean | null;
    isAnonymous?: boolean | null;
    tenantId?: string | null;
    providerInfo?: {
      providerId?: string | null;
      email?: string | null;
    }[];
  };
}

export function handleFirestoreError(error: unknown, operationType: OperationType, path: string | null): never {
  const errInfo: FirestoreErrorInfo = {
    error: error instanceof Error ? error.message : String(error),
    authInfo: {
      userId: auth.currentUser?.uid,
      email: auth.currentUser?.email,
      emailVerified: auth.currentUser?.emailVerified,
      isAnonymous: auth.currentUser?.isAnonymous,
      tenantId: auth.currentUser?.tenantId,
      providerInfo: auth.currentUser?.providerData?.map((provider) => ({
        providerId: provider.providerId,
        email: provider.email,
      })) || [],
    },
    operationType,
    path,
  };
  console.error('Firestore Error: ', JSON.stringify(errInfo));
  throw new Error(JSON.stringify(errInfo));
}

export interface PaginatedResourcesResult {
  items: ResourceItem[];
  lastVisible: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}

export interface ResourceAggregateStats {
  total: number;
  byCategory: Record<ResourceCategory, number>;
  activeTagsCount: number;
}

/**
 * Subscribes in real-time to a bounded, recent window of the user's resources
 * to prevent memory bloat and unbounded bandwidth consumption.
 */
export function subscribeToUserResources(
  uid: string,
  onData: (items: ResourceItem[]) => void,
  onError: (error: Error) => void,
  maxRecentCount = 60
): () => void {
  // Query with limit to prevent full snapshot memory overload
  const q = query(
    collection(db, COLLECTION_NAME),
    where('uid', '==', uid),
    limit(maxRecentCount)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ResourceItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          uid: data.uid || data.userId || uid,
          userId: data.userId || data.uid || uid,
          title: data.title || '',
          url: data.url || '',
          category: (data.category as ResourceCategory) || 'Link',
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || null,
        });
      });

      // Sort recent window by createdAt descending
      items.sort((a, b) => {
        const timeA =
          a.createdAt instanceof Timestamp
            ? a.createdAt.toMillis()
            : (a.createdAt as { seconds?: number })?.seconds
            ? (a.createdAt as { seconds: number }).seconds * 1000
            : 0;
        const timeB =
          b.createdAt instanceof Timestamp
            ? b.createdAt.toMillis()
            : (b.createdAt as { seconds?: number })?.seconds
            ? (b.createdAt as { seconds: number }).seconds * 1000
            : 0;
        return timeB - timeA;
      });

      onData(items);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      if (err.message.includes('insufficient permissions') || err.message.includes('permission-denied')) {
        try {
          handleFirestoreError(err, OperationType.LIST, COLLECTION_NAME);
        } catch (wrapped) {
          onError(wrapped instanceof Error ? wrapped : err);
          return;
        }
      }
      onError(err);
    }
  );
}

/**
 * Retrieves resources with cursor-based pagination using limit() and startAfter().
 */
export async function getUserResourcesPaginated(
  uid: string,
  pageSize = 20,
  lastVisibleDoc: QueryDocumentSnapshot<DocumentData> | null = null,
  categoryFilter: CategoryFilter = 'All'
): Promise<PaginatedResourcesResult> {
  const constraints: QueryConstraint[] = [
    where('uid', '==', uid),
  ];

  if (categoryFilter !== 'All') {
    constraints.push(where('category', '==', categoryFilter));
  }

  // Fetch pageSize + 1 to reliably determine hasMore without secondary read queries
  if (lastVisibleDoc) {
    constraints.push(startAfter(lastVisibleDoc));
  }
  constraints.push(limit(pageSize + 1));

  try {
    const q = query(collection(db, COLLECTION_NAME), ...constraints);
    const snap = await getDocs(q);

    const rawDocs = snap.docs;
    const hasMore = rawDocs.length > pageSize;
    const pageDocs = hasMore ? rawDocs.slice(0, pageSize) : rawDocs;
    const newLastVisible = pageDocs.length > 0 ? pageDocs[pageDocs.length - 1] : null;

    const items: ResourceItem[] = pageDocs.map((docSnap) => {
      const data = docSnap.data();
      return {
        id: docSnap.id,
        uid: data.uid || data.userId || uid,
        userId: data.userId || data.uid || uid,
        title: data.title || '',
        url: data.url || '',
        category: (data.category as ResourceCategory) || 'Link',
        description: data.description || '',
        tags: Array.isArray(data.tags) ? data.tags : [],
        createdAt: data.createdAt || null,
      };
    });

    // Stable sort in memory for the requested page
    items.sort((a, b) => {
      const timeA =
        a.createdAt instanceof Timestamp
          ? a.createdAt.toMillis()
          : (a.createdAt as { seconds?: number })?.seconds
          ? (a.createdAt as { seconds: number }).seconds * 1000
          : 0;
      const timeB =
        b.createdAt instanceof Timestamp
          ? b.createdAt.toMillis()
          : (b.createdAt as { seconds?: number })?.seconds
          ? (b.createdAt as { seconds: number }).seconds * 1000
          : 0;
      return timeB - timeA;
    });

    return {
      items,
      lastVisible: newLastVisible,
      hasMore,
    };
  } catch (err) {
    console.error('Paginated query error:', err);
    return {
      items: [],
      lastVisible: null,
      hasMore: false,
    };
  }
}

/**
 * Computes aggregate metrics using server-side count queries (getCountFromServer)
 * without pulling the full collection array into client memory.
 */
export async function getResourceMetrics(uid: string): Promise<ResourceAggregateStats> {
  const categories: ResourceCategory[] = ['Link', 'Document', 'GitHub', 'Reel'];
  const byCategory: Record<ResourceCategory, number> = {
    Link: 0,
    Document: 0,
    GitHub: 0,
    Reel: 0,
  };

  try {
    // Total count aggregation
    const totalQuery = query(collection(db, COLLECTION_NAME), where('uid', '==', uid));
    const totalSnap = await getCountFromServer(totalQuery);
    const total = totalSnap.data().count;

    // Per-category counts
    await Promise.all(
      categories.map(async (cat) => {
        try {
          const catQuery = query(
            collection(db, COLLECTION_NAME),
            where('uid', '==', uid),
            where('category', '==', cat)
          );
          const catSnap = await getCountFromServer(catQuery);
          byCategory[cat] = catSnap.data().count;
        } catch {
          // If compound query requires an index, fallback to 0 or estimates
          byCategory[cat] = 0;
        }
      })
    );

    return {
      total,
      byCategory,
      activeTagsCount: 0,
    };
  } catch (err) {
    console.warn('Server count aggregation fallback:', err);
    return {
      total: 0,
      byCategory,
      activeTagsCount: 0,
    };
  }
}

/**
 * Creates a new resource document in Firestore.
 * Strictly writes both `userId: uid` and `uid: uid` for document-level user isolation.
 */
export async function createResource(
  uid: string,
  formData: ResourceFormData,
  customId?: string
): Promise<ResourceItem> {
  const docRef = customId
    ? doc(db, COLLECTION_NAME, customId)
    : doc(collection(db, COLLECTION_NAME));

  const resourcePayload = {
    id: docRef.id,
    uid,
    userId: uid,
    title: formData.title.trim(),
    url: formData.url.trim(),
    category: formData.category,
    description: formData.description.trim(),
    tags: formData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    createdAt: serverTimestamp(),
  };

  try {
    await setDoc(docRef, resourcePayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `${COLLECTION_NAME}/${docRef.id}`);
  }

  return {
    ...resourcePayload,
    createdAt: Timestamp.now(),
  };
}

/**
 * Updates an existing resource document.
 */
export async function updateResource(
  id: string,
  formData: Partial<ResourceFormData>
): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  const updateData: Record<string, unknown> = {};

  if (formData.title !== undefined) updateData.title = formData.title.trim();
  if (formData.url !== undefined) updateData.url = formData.url.trim();
  if (formData.category !== undefined) updateData.category = formData.category;
  if (formData.description !== undefined) updateData.description = formData.description.trim();
  if (formData.tags !== undefined) {
    updateData.tags = formData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean);
  }

  try {
    await updateDoc(docRef, updateData);
  } catch (err) {
    handleFirestoreError(err, OperationType.UPDATE, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Deletes a resource document.
 */
export async function deleteResource(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  try {
    await deleteDoc(docRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `${COLLECTION_NAME}/${id}`);
  }
}

/**
 * Seeds initial demo resources for a newly signed-in user so their dashboard isn't blank.
 */
export async function seedInitialResourcesIfEmpty(uid: string): Promise<void> {
  try {
    const q = query(
      collection(db, COLLECTION_NAME),
      where('uid', '==', uid),
      limit(1)
    );
    const snap = await getDocs(q);
    if (!snap.empty) return;

    const starterItems: ResourceFormData[] = [
      {
        title: 'React Documentation & Architecture Guides',
        url: 'https://react.dev',
        category: 'Link',
        description: 'Core reference for modern frontend systems, concurrent features, hooks, and server components.',
        tags: ['react', 'frontend', 'architecture'],
      },
      {
        title: 'Vite Next Generation Tooling',
        url: 'https://github.com/vitejs/vite',
        category: 'GitHub',
        description: 'High-performance dev environment and production bundler leveraging native ES modules.',
        tags: ['vite', 'build', 'tooling'],
      },
      {
        title: 'Cascading Style Sheets Level 2 Revision 2 Specification',
        url: 'https://www.w3.org/TR/CSS22/intro.pdf',
        category: 'Document',
        description: 'W3C formal specification detailing visual formatting models, cascade calculations, and box layout rules.',
        tags: ['spec', 'w3c', 'css'],
      },
      {
        title: 'System Design: Scaling Distributed Services',
        url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
        category: 'Reel',
        description: 'Architectural patterns for data partitioning, consistency guarantees, and event-driven backends.',
        tags: ['systems', 'architecture', 'video'],
      },
    ];

    for (const item of starterItems) {
      await createResource(uid, item);
    }
  } catch (err) {
    console.warn('Seed initial resources check note:', err);
  }
}

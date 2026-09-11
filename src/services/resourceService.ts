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
} from 'firebase/firestore';
import { db } from '../lib/firebase';
import { ResourceFormData, ResourceItem } from '../types/resource';

const COLLECTION_NAME = 'resources';

/**
 * Subscribes in real-time to the current user's resources in Firestore.
 */
export function subscribeToUserResources(
  uid: string,
  onData: (items: ResourceItem[]) => void,
  onError: (error: Error) => void
): () => void {
  const q = query(
    collection(db, COLLECTION_NAME),
    where('uid', '==', uid)
  );

  return onSnapshot(
    q,
    (snapshot) => {
      const items: ResourceItem[] = [];
      snapshot.forEach((docSnap) => {
        const data = docSnap.data();
        items.push({
          id: docSnap.id,
          uid: data.uid,
          title: data.title || '',
          url: data.url || '',
          category: data.category || 'Link',
          description: data.description || '',
          tags: Array.isArray(data.tags) ? data.tags : [],
          createdAt: data.createdAt || null,
        });
      });

      // Sort client-side by createdAt descending to avoid composite index requirements
      items.sort((a, b) => {
        const timeA = a.createdAt instanceof Timestamp 
          ? a.createdAt.toMillis() 
          : (a.createdAt as { seconds?: number })?.seconds ? (a.createdAt as { seconds: number }).seconds * 1000 : 0;
        const timeB = b.createdAt instanceof Timestamp 
          ? b.createdAt.toMillis() 
          : (b.createdAt as { seconds?: number })?.seconds ? (b.createdAt as { seconds: number }).seconds * 1000 : 0;
        return timeB - timeA;
      });

      onData(items);
    },
    (err) => {
      console.error('Firestore subscription error:', err);
      onError(err);
    }
  );
}

/**
 * Creates a new resource document in Firestore.
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
    title: formData.title.trim(),
    url: formData.url.trim(),
    category: formData.category,
    description: formData.description.trim(),
    tags: formData.tags.map((t) => t.trim().toLowerCase()).filter(Boolean),
    createdAt: serverTimestamp(),
  };

  await setDoc(docRef, resourcePayload);

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

  await updateDoc(docRef, updateData);
}

/**
 * Deletes a resource document.
 */
export async function deleteResource(id: string): Promise<void> {
  const docRef = doc(db, COLLECTION_NAME, id);
  await deleteDoc(docRef);
}

/**
 * Seeds initial demo resources for a newly signed-in user so their dashboard isn't blank,
 * if they don't have any items yet.
 */
export async function seedInitialResourcesIfEmpty(uid: string): Promise<void> {
  const q = query(collection(db, COLLECTION_NAME), where('uid', '==', uid));
  const snap = await getDocs(q);
  if (!snap.empty) return;

  const starterItems: ResourceFormData[] = [
    {
      title: 'React Documentation & Interactive Tutorials',
      url: 'https://react.dev',
      category: 'Link',
      description: 'Official interactive documentation for React 19, server components, hooks, and modern frontend architecture.',
      tags: ['react', 'frontend', 'ui'],
    },
    {
      title: 'Vite Next Generation Frontend Tooling',
      url: 'https://github.com/vitejs/vite',
      category: 'GitHub',
      description: 'Get an instant dev server, lightning-fast HMR, and optimized production builds with modern ESM support.',
      tags: ['vite', 'build-tools', 'typescript'],
    },
    {
      title: 'Modern CSS and Web Standards Specification',
      url: 'https://www.w3.org/TR/CSS22/intro.pdf',
      category: 'Document',
      description: 'Core architectural reference for modern browser styling specifications, cascade layers, and layout engines.',
      tags: ['css', 'spec', 'design-system'],
    },
    {
      title: 'Building Responsive Dashboards in 60 Seconds',
      url: 'https://www.youtube.com/watch?v=dQw4w9WgXcQ',
      category: 'Reel',
      description: 'High-energy walkthrough breaking down modern grid layouts, responsive navigation, and micro-interactions.',
      tags: ['tutorial', 'video', 'design'],
    },
  ];

  for (const item of starterItems) {
    await createResource(uid, item);
  }
}

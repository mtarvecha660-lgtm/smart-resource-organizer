import { Timestamp } from 'firebase/firestore';

export type ResourceCategory = 'Link' | 'Document' | 'GitHub' | 'Reel';

export interface ResourceItem {
  id: string;
  uid: string;
  userId?: string;
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  tags: string[];
  createdAt: Timestamp | { seconds: number; nanoseconds: number } | null;
}

export interface ResourceFormData {
  title: string;
  url: string;
  category: ResourceCategory;
  description: string;
  tags: string[];
}

export type CategoryFilter = 'All' | ResourceCategory;

import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  auth,
  db,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  updateProfile,
  type User,
} from './firebase';
import {
  collection,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  serverTimestamp,
  setDoc,
} from './firebase';
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';

import { firebaseConfigured } from './config';
import { signInWithGoogle } from './google';
import { demoMatch, neighborById, seedListings } from './swap';
import {
  type Category,
  type HistoryEntry,
  type Listing,
  type ListingKind,
  type ListingStatus,
  type Match,
} from './types';

const LISTINGS_KEY = 'skillswaplocal:listings:v1';
const HISTORY_KEY = 'skillswaplocal:history:v1';
const SEEDED_KEY = 'skillswaplocal:seeded:v1';
const HISTORY_LIMIT = 20;

export interface AuthUser {
  uid: string;
  name: string | null;
  email: string | null;
  photo: string | null;
  /** 'google.com' or 'password' — how this account signs in. */
  provider: string | null;
}

export interface AppState {
  listings: Listing[];
  history: HistoryEntry[];
  /** Listings newest first. */
  sortedListings: Listing[];
  offers: Listing[];
  requests: Listing[];
  myListings: Listing[];
  user: AuthUser | null;
  authReady: boolean;
  guest: boolean;
  signIn: () => Promise<void>;
  signInWithEmail: (email: string, password: string) => Promise<void>;
  signUpWithEmail: (name: string, email: string, password: string) => Promise<void>;
  updateDisplayName: (name: string) => Promise<void>;
  setAvatarData: (dataUrl: string) => Promise<void>;
  sendPasswordReset: () => Promise<void>;
  resetPasswordForEmail: (email: string) => Promise<void>;
  signOut: () => Promise<void>;
  continueAsGuest: () => void;
  addListing: (input: {
    kind: ListingKind;
    title: string;
    category: Category;
    description: string;
    when: string;
    where: string;
    urgent?: boolean;
  }) => Listing;
  updateListingStatus: (id: string, status: ListingStatus) => void;
  deleteListing: (id: string) => void;
  bestMatchesFor: (request: Listing) => Match[];
  recordHistory: (entry: Omit<HistoryEntry, 'id' | 'at'>) => void;
  applyHistory: (entry: HistoryEntry) => Listing | null;
  clearHistory: () => void;
  clearDemoData: () => void;
  listingById: (id: string) => Listing | undefined;
}

const AppContext = createContext<AppState | null>(null);

function loadJson<T>(raw: string | null): T | null {
  if (!raw) return null;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return null;
  }
}

function uid(prefix: string): string {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

async function upsertProfile(u: User): Promise<void> {
  if (!firebaseConfigured) return;
  try {
    const ref = doc(db, 'users', u.uid);
    const snap = await getDoc(ref);
    const base = {
      displayName: u.displayName ?? '',
      email: u.email ?? '',
      photoURL: u.photoURL ?? '',
      lastLoginAt: serverTimestamp(),
    };
    if (!snap.exists()) {
      await setDoc(ref, { ...base, createdAt: serverTimestamp() });
    } else {
      await setDoc(ref, base, { merge: true });
    }
  } catch {
    // Sync is best-effort; the app keeps working offline.
  }
}

export function AppProvider({ children }: { children: React.ReactNode }) {
  const [listings, setListings] = useState<Listing[]>([]);
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [user, setUser] = useState<AuthUser | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [guest, setGuest] = useState(false);
  const listingsRef = useRef<Listing[]>([]);
  const historyRef = useRef<HistoryEntry[]>([]);
  const historyLoadedRef = useRef(false);
  const unsubsRef = useRef<(() => void)[]>([]);

  // Local data loads once at startup; first launch seeds demo listings.
  useEffect(() => {
    void (async () => {
      const [lRaw, hRaw, seeded] = await Promise.all([
        AsyncStorage.getItem(LISTINGS_KEY),
        AsyncStorage.getItem(HISTORY_KEY),
        AsyncStorage.getItem(SEEDED_KEY),
      ]);
      const l = loadJson<Listing[]>(lRaw);
      const h = loadJson<HistoryEntry[]>(hRaw);
      if (l && l.length > 0) {
        setListings(l);
        setHistory(h ?? []);
      } else if (!seeded) {
        setListings(seedListings());
        setHistory([]);
        await AsyncStorage.setItem(SEEDED_KEY, '1');
      }
      historyLoadedRef.current = true;
    })();
  }, []);

  // Local mirrors.
  useEffect(() => {
    listingsRef.current = listings;
    AsyncStorage.setItem(LISTINGS_KEY, JSON.stringify(listings)).catch(() => undefined);
  }, [listings]);
  useEffect(() => {
    historyRef.current = history;
    if (!historyLoadedRef.current) return;
    AsyncStorage.setItem(HISTORY_KEY, JSON.stringify(history)).catch(() => undefined);
  }, [history]);

  // Auth state: profile write, cloud subscriptions.
  // Readiness waits for Firebase to finish restoring any persisted
  // session from storage — the gate must not decide "signed out" (and
  // show Welcome) before the saved session has had its chance to load.
  useEffect(() => {
    let alive = true;
    void auth.authStateReady().then(() => {
      if (alive) setAuthReady(true);
    });
    const unsub = onAuthStateChanged(auth, (u) => {
      for (const fn of unsubsRef.current) fn();
      unsubsRef.current = [];
      if (!u) {
        setUser(null);
        return;
      }
      setUser({
        uid: u.uid,
        name: u.displayName,
        email: u.email,
        photo: u.photoURL,
        provider: u.providerData[0]?.providerId ?? null,
      });
      void upsertProfile(u);
      if (!firebaseConfigured) return;

      const subscribe = <T,>(
        colName: string,
        apply: (items: T[]) => void,
        local: () => T[],
        idOf: (item: T) => string,
      ) => {
        const col = collection(db, 'users', u.uid, colName);
        unsubsRef.current.push(
          onSnapshot(
            col,
            (snap) => {
              apply(snap.docs.map((d) => d.data() as T));
            },
            () => undefined,
          ),
        );
        // One-time merge: anything saved locally before sign-in joins the account.
        void (async () => {
          try {
            const cloud = await getDocs(col);
            const cloudIds = new Set(cloud.docs.map((d) => d.id));
            for (const item of local()) {
              const id = idOf(item);
              if (!cloudIds.has(id)) {
                await setDoc(
                  doc(db, 'users', u.uid, colName, id),
                  item as unknown as Record<string, unknown>,
                );
              }
            }
          } catch {
            // Best-effort merge only.
          }
        })();
      };
      subscribe<Listing>('listings', setListings, () => listingsRef.current, (e) => e.id);
      subscribe<HistoryEntry>('history', setHistory, () => historyRef.current, (h) => h.id);

      // Profile doc: a custom avatar / edited name stored there overrides
      // the auth copy.
      void (async () => {
        try {
          const snap = await getDoc(doc(db, 'users', u.uid));
          if (snap.exists()) {
            const data = snap.data();
            setUser((prev) =>
              prev && prev.uid === u.uid
                ? {
                    ...prev,
                    name: (data.displayName as string) || prev.name,
                    photo: (data.photoData as string) || prev.photo,
                  }
                : prev,
            );
          }
        } catch {
          // Keep the auth profile.
        }
      })();
    });
    return () => {
      alive = false;
      unsub();
    };
  }, []);

  const sortedListings = useMemo(
    () => [...listings].sort((a, b) => b.createdAt - a.createdAt),
    [listings],
  );
  const offers = useMemo(
    () => sortedListings.filter((l) => l.kind === 'offer'),
    [sortedListings],
  );
  const requests = useMemo(
    () => sortedListings.filter((l) => l.kind === 'request'),
    [sortedListings],
  );
  const myListings = useMemo(
    () => sortedListings.filter((l) => l.mine),
    [sortedListings],
  );

  const signIn = useCallback(async () => {
    await signInWithGoogle();
  }, []);

  const signInWithEmail = useCallback(async (email: string, password: string) => {
    await signInWithEmailAndPassword(auth, email.trim(), password);
  }, []);

  const signUpWithEmail = useCallback(
    async (name: string, email: string, password: string) => {
      const cred = await createUserWithEmailAndPassword(auth, email.trim(), password);
      const cleanName = name.trim();
      if (cleanName) {
        await updateProfile(cred.user, { displayName: cleanName });
        setUser({
          uid: cred.user.uid,
          name: cleanName,
          email: cred.user.email,
          photo: null,
          provider: 'password',
        });
        void upsertProfile({ ...cred.user, displayName: cleanName } as User);
      }
    },
    [],
  );

  const updateDisplayName = useCallback(async (name: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    const clean = name.trim();
    await updateProfile(currentUser, { displayName: clean });
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { displayName: clean }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, name: clean } : prev));
  }, []);

  const setAvatarData = useCallback(async (dataUrl: string) => {
    const currentUser = auth.currentUser;
    if (!currentUser) return;
    if (firebaseConfigured) {
      await setDoc(doc(db, 'users', currentUser.uid), { photoData: dataUrl }, { merge: true });
    }
    setUser((prev) => (prev ? { ...prev, photo: dataUrl } : prev));
  }, []);

  const sendPasswordReset = useCallback(async () => {
    const currentUser = auth.currentUser;
    if (!currentUser?.email) return;
    await sendPasswordResetEmail(auth, currentUser.email);
  }, []);

  const resetPasswordForEmail = useCallback(async (email: string) => {
    await sendPasswordResetEmail(auth, email.trim());
  }, []);

  const signOut = useCallback(async () => {
    await firebaseSignOut(auth);
    // Back to the welcome screen — the gate routes there as soon as the
    // user is signed out and not a guest.
    setGuest(false);
  }, []);

  const continueAsGuest = useCallback(() => {
    // Deliberately NOT persisted: guest lasts for this visit only, so the
    // next open asks for sign-in again. A signed-in user, by contrast,
    // stays signed in (Firebase Auth persistence).
    setGuest(true);
  }, []);

  const syncDoc = useCallback(
    (colName: string, id: string, data: unknown) => {
      if (!user || !firebaseConfigured) return;
      void setDoc(doc(db, 'users', user.uid, colName, id), data).catch(() => undefined);
    },
    [user],
  );

  const deleteDocCloud = useCallback(
    (colName: string, id: string) => {
      if (!user || !firebaseConfigured) return;
      void deleteDoc(doc(db, 'users', user.uid, colName, id)).catch(() => undefined);
    },
    [user],
  );

  const recordHistory = useCallback(
    (entry: Omit<HistoryEntry, 'id' | 'at'>) => {
      const full: HistoryEntry = { ...entry, id: uid('h'), at: Date.now() };
      setHistory((prev) => [full, ...prev].slice(0, HISTORY_LIMIT));
      syncDoc('history', full.id, full);
    },
    [syncDoc],
  );

  const addListing = useCallback(
    (input: {
      kind: ListingKind;
      title: string;
      category: Category;
      description: string;
      when: string;
      where: string;
      urgent?: boolean;
    }): Listing => {
      const listing: Listing = {
        id: uid('listing'),
        kind: input.kind,
        title: input.title.trim(),
        category: input.category,
        description: input.description.trim(),
        // The user's own listings are attributed to "You" — the board
        // shows them under the user's display name via neighbor 'me'.
        neighborId: 'me',
        distanceMi: 0,
        when: input.when.trim() || 'Flexible',
        where: input.where.trim() || 'Nearby',
        urgent: input.urgent ?? false,
        status: 'open',
        createdAt: Date.now(),
        mine: true,
      };
      setListings((prev) => [listing, ...prev]);
      syncDoc('listings', listing.id, listing);
      return listing;
    },
    [syncDoc],
  );

  const updateListingStatus = useCallback(
    (id: string, status: ListingStatus) => {
      setListings((prev) => {
        const next = prev.map((l) => (l.id === id ? { ...l, status } : l));
        const updated = next.find((l) => l.id === id);
        if (updated) syncDoc('listings', id, updated);
        return next;
      });
    },
    [syncDoc],
  );

  const deleteListing = useCallback(
    (id: string) => {
      setListings((prev) => prev.filter((l) => l.id !== id));
      setHistory((prev) => prev.filter((h) => h.listingId !== id));
      deleteDocCloud('listings', id);
    },
    [deleteDocCloud],
  );

  const bestMatchesFor = useCallback(
    (request: Listing): Match[] => demoMatch(request, listingsRef.current),
    [],
  );

  const applyHistory = useCallback((entry: HistoryEntry): Listing | null => {
    return listingsRef.current.find((l) => l.id === entry.listingId) ?? null;
  }, []);

  const clearHistory = useCallback(() => {
    setHistory([]);
    if (user && firebaseConfigured) {
      void (async () => {
        try {
          const snap = await getDocs(collection(db, 'users', user.uid, 'history'));
          await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)));
        } catch {
          // The subscription will reconcile the visible list.
        }
      })();
    }
  }, [user]);

  const clearDemoData = useCallback(() => {
    setListings((prev) => prev.filter((l) => !l.isDemo));
    setHistory((prev) =>
      prev.filter((h) => {
        const listing = listingsRef.current.find((l) => l.id === h.listingId);
        return listing ? !listing.isDemo : true;
      }),
    );
    if (user && firebaseConfigured) {
      for (const listing of listingsRef.current.filter((l) => l.isDemo)) {
        void deleteDoc(doc(db, 'users', user.uid, 'listings', listing.id)).catch(() => undefined);
      }
    }
  }, [user]);

  const listingById = useCallback(
    (id: string) => listings.find((l) => l.id === id),
    [listings],
  );

  const value = useMemo<AppState>(
    () => ({
      listings,
      history,
      sortedListings,
      offers,
      requests,
      myListings,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addListing,
      updateListingStatus,
      deleteListing,
      bestMatchesFor,
      recordHistory,
      applyHistory,
      clearHistory,
      clearDemoData,
      listingById,
    }),
    [
      listings,
      history,
      sortedListings,
      offers,
      requests,
      myListings,
      user,
      authReady,
      guest,
      signIn,
      signInWithEmail,
      signUpWithEmail,
      updateDisplayName,
      setAvatarData,
      sendPasswordReset,
      resetPasswordForEmail,
      signOut,
      continueAsGuest,
      addListing,
      updateListingStatus,
      deleteListing,
      bestMatchesFor,
      recordHistory,
      applyHistory,
      clearHistory,
      clearDemoData,
      listingById,
    ],
  );

  return <AppContext.Provider value={value}>{children}</AppContext.Provider>;
}

export function useApp(): AppState {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used inside AppProvider');
  return ctx;
}

/** Display name for a listing's neighbor — "You" for the user's own posts. */
export function listingNeighborName(listing: Listing, userName: string | null): string {
  if (listing.mine) return userName ?? 'You';
  return neighborById(listing.neighborId)?.name ?? 'A neighbor';
}

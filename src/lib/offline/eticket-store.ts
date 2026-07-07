import type { CachedETicket } from './types';

const DB_NAME = 'terbangin-etickets';
const DB_VERSION = 1;
const STORE_NAME = 'tickets';
const STORAGE_KEY = 'terbangin-etickets-v1';

function openDB(): Promise<IDBDatabase> {
    return new Promise((resolve, reject) => {
        if (typeof indexedDB === 'undefined') {
            reject(new Error('IndexedDB tidak tersedia'));
            return;
        }

        const request = indexedDB.open(DB_NAME, DB_VERSION);

        request.onerror = () => reject(request.error);
        request.onsuccess = () => resolve(request.result);

        request.onupgradeneeded = () => {
            const db = request.result;
            if (!db.objectStoreNames.contains(STORE_NAME)) {
                const store = db.createObjectStore(STORE_NAME, { keyPath: 'id' });
                store.createIndex('bookingCode', 'bookingCode', { unique: false });
                store.createIndex('cachedAt', 'cachedAt', { unique: false });
            }
        };
    });
}

function readStorageTickets(): CachedETicket[] {
    if (typeof window === 'undefined' || !window.localStorage) return [];

    try {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (!raw) return [];
        const parsed = JSON.parse(raw) as CachedETicket[];
        return Array.isArray(parsed) ? parsed : [];
    } catch {
        return [];
    }
}

function writeStorageTickets(tickets: CachedETicket[]): void {
    if (typeof window === 'undefined' || !window.localStorage) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(tickets));
}

function persistToStorage(ticket: CachedETicket): void {
    const current = readStorageTickets();
    const filtered = current.filter((item) => item.id !== ticket.id && item.bookingCode !== ticket.bookingCode);
    const next = [ticket, ...filtered].slice(0, 50);
    writeStorageTickets(next);
}

async function getTicketFromIndexedDB(bookingId: string): Promise<CachedETicket | null> {
    try {
        const db = await openDB();
        return await new Promise<CachedETicket | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).get(bookingId);
            request.onsuccess = () => {
                db.close();
                resolve((request.result as CachedETicket) || null);
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch {
        return null;
    }
}

async function getTicketByBookingCodeFromIndexedDB(bookingCode: string): Promise<CachedETicket | null> {
    try {
        const db = await openDB();
        return await new Promise<CachedETicket | null>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const store = tx.objectStore(STORE_NAME);
            const index = store.index('bookingCode');
            const request = index.get(bookingCode);
            request.onsuccess = () => {
                db.close();
                resolve((request.result as CachedETicket) || null);
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch {
        return null;
    }
}

async function getAllTicketsFromIndexedDB(): Promise<CachedETicket[]> {
    try {
        const db = await openDB();
        return await new Promise<CachedETicket[]>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readonly');
            const request = tx.objectStore(STORE_NAME).getAll();
            request.onsuccess = () => {
                db.close();
                const tickets = (request.result as CachedETicket[]) || [];
                resolve(tickets.sort((a, b) => b.cachedAt.localeCompare(a.cachedAt)));
            };
            request.onerror = () => {
                db.close();
                reject(request.error);
            };
        });
    } catch {
        return [];
    }
}

export async function saveETicket(ticket: CachedETicket): Promise<void> {
    persistToStorage(ticket);

    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
            tx.objectStore(STORE_NAME).put(ticket);
        });
    } catch {
        // Fallback keeps ticket available from localStorage when IndexedDB is unavailable.
    }
}

export async function getETicket(bookingId: string): Promise<CachedETicket | null> {
    const fromIndexedDB = await getTicketFromIndexedDB(bookingId);
    if (fromIndexedDB) return fromIndexedDB;

    return readStorageTickets().find((ticket) => ticket.id === bookingId) || null;
}

export async function getETicketByBookingCode(bookingCode: string): Promise<CachedETicket | null> {
    const fromIndexedDB = await getTicketByBookingCodeFromIndexedDB(bookingCode);
    if (fromIndexedDB) return fromIndexedDB;

    return readStorageTickets().find((ticket) => ticket.bookingCode === bookingCode) || null;
}

export async function getAllETickets(): Promise<CachedETicket[]> {
    const fromIndexedDB = await getAllTicketsFromIndexedDB();
    const fromStorage = readStorageTickets();

    const combined = [...fromIndexedDB, ...fromStorage.filter((item) => !fromIndexedDB.some((entry) => entry.id === item.id))];
    return combined.sort((a, b) => b.cachedAt.localeCompare(a.cachedAt));
}

export async function deleteETicket(bookingId: string): Promise<void> {
    const current = readStorageTickets().filter((item) => item.id !== bookingId);
    writeStorageTickets(current);

    try {
        const db = await openDB();
        await new Promise<void>((resolve, reject) => {
            const tx = db.transaction(STORE_NAME, 'readwrite');
            tx.oncomplete = () => {
                db.close();
                resolve();
            };
            tx.onerror = () => {
                db.close();
                reject(tx.error);
            };
            tx.objectStore(STORE_NAME).delete(bookingId);
        });
    } catch {
        // Ignore delete failure as storage fallback already updated.
    }
}

export function isOnline(): boolean {
    return typeof navigator !== 'undefined' ? navigator.onLine : true;
}


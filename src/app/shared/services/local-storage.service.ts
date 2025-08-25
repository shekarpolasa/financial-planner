import { Injectable } from "@angular/core";

@Injectable({ providedIn: 'root' })
export class LocalStorageService {
    private prefix: string = 'fp_';

    private getKey(key: string): string {
        return `${this.prefix}${key}`;
    }

    private encode(value: string): string {
        return btoa(unescape(encodeURIComponent(value))); // handles UTF-8
    }

    private decode(value: string): string {
        return decodeURIComponent(escape(atob(value)));
    }

    read<T>(key: string, defaultValue: T): T {
        try {
            const raw = localStorage.getItem(this.getKey(key));
            if (!raw) return defaultValue;

            const json = this.decode(raw);
            return JSON.parse(json) as T;
        } catch (e) {
            console.warn(`Failed to load or decode key: ${key}`, e);
            return defaultValue;
        }
    }

    write<T>(key: string, value: T): void {
        try {
            const json = JSON.stringify(value);
            const encoded = this.encode(json);
            localStorage.setItem(this.getKey(key), encoded);
        } catch (e) {
            console.error(`Failed to encode or save key: ${key}`, e);
        }
    }

    clear(key: string): void {
        try {
            localStorage.removeItem(this.getKey(key));
        } catch (e) {
            console.warn(`Failed to remove key: ${key}`, e);
        }
    }

    clearAll(): void {
        for (const key in localStorage) {
            if (key.startsWith(this.prefix)) {
                localStorage.removeItem(key);
            }
        }
    }
}

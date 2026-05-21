import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root',
})
export class Network {
  isOnline(): boolean {
    return navigator.onLine;
  }

    onReconnect(callback: () => void) {
    window.addEventListener('online', callback);
    }
}

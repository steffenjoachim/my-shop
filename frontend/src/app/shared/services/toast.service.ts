import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: number;
  text: string;
  type: 'success' | 'error' | 'info';
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  private _messages = signal<ToastMessage[]>([]);
  public readonly messages = this._messages.asReadonly();
  private nextId = 1;

  show(text: string, type: ToastMessage['type'] = 'info', durationMs = 3000) {
    const id = this.nextId++;
    const msg: ToastMessage = { id, text, type };
    this._messages.update((list) => [...list, msg]);
    setTimeout(() => this.dismiss(id), durationMs);
  }

  success(text: string, durationMs = 3000) {
    this.show(text, 'success', durationMs);
  }
  error(text: string, durationMs = 4000) {
    this.show(text, 'error', durationMs);
  }
  info(text: string, durationMs = 3000) {
    this.show(text, 'info', durationMs);
  }

  dismiss(id: number) {
    this._messages.update((list) => list.filter((m) => m.id !== id));
  }
}

import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { timer } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { Product } from '../models/products.model';

@Injectable({ providedIn: 'root' })
export class ProductService {
  private apiUrl = 'http://127.0.0.1:8000/api/products/';
  private _products = signal<Product[]>([]);
  public products = computed(() => this._products());

  constructor(private http: HttpClient) {
    // beim Start einmal laden …
    this.loadProducts();
    // … und dann alle 10 Sekunden neu
    timer(10_000, 10_000)
      .pipe(switchMap(() => this.http.get<Product[]>(this.apiUrl)))
      .subscribe(data => this._products.set(data));
  }

  loadProducts(): void {
    this.http.get<Product[]>(this.apiUrl)
      .subscribe(data => this._products.set(data));
  }
}

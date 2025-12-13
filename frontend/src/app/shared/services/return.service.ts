import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { ReturnItem } from '../models/return-item.model';

@Injectable({
  providedIn: 'root',
})
export class ReturnService {
  private http = inject(HttpClient);

  /**
   * Holt alle Retouren des aktuell eingeloggten Users.
   */
  getMyReturns() {
    return this.http.get<ReturnItem[]>(
      `${environment.apiBaseUrl}orders/my-returns/`,
      { withCredentials: true }
    );
  }
}

 
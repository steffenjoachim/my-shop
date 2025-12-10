import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ReturnService {
  private http = inject(HttpClient);

  /**
   * Holt alle Retouren des aktuell eingeloggten Users.
   */
  getMyReturns() {
    return this.http.get<any[]>(
      `${environment.apiBaseUrl}orders/my-returns/`,
      { withCredentials: true }
    );
  }
}

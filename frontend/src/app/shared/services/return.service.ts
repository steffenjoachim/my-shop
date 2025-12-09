import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ReturnService {
  private http = inject(HttpClient);
  private baseUrl = '/api/returns/'; // ggf. anpassen

  /**
   * Holt alle Retouren des aktuell eingeloggten Users.
   */
  getMyReturns(): Observable<any[]> {
    return this.http.get<any[]>(`${this.baseUrl}my/`);
  }
}

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class GameService {
  private baseUrl = 'http://localhost:3000'; // Flask server URL

  constructor(private http: HttpClient) {}

  initializeGame(customMap: any, goal: any, gamma: number, theta: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/initialize`, { custom_map: customMap, goal, gamma, theta });
  }

  updateGame(state: number[], action: number[], policy: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/update`, { state, action, policy });
  }
}

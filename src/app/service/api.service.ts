import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'src/environments/environment';
import { SignalingService } from './signaling.service';

/*
 * Service for Rest APIs
 */
@Injectable({
  providedIn: 'root',
})
export class ApiService {
  constructor(private http: HttpClient, private signalingService: SignalingService) {}

  /**
   * [get description]
   * @param  uri :uri for requested resource
   * @return     observable
   */
  get(uri: string): Observable<Object> {
    return this.http.get(environment.serverBaseUrl + uri, {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'connection-id': this.signalingService.connectionId!,
      },
    });
  }

  /**
   * make post rest api request
   * @param uri
   * @param body
   * @returns
   */
  post(uri: string, body: any): Observable<Object> {
    return this.http.post(environment.serverBaseUrl + uri, JSON.stringify(body), {
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'connection-id': this.signalingService.connectionId!,
      },
    });
  }
}

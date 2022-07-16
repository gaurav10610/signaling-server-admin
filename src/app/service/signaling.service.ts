import { EventEmitter, Injectable } from '@angular/core';
import { environment } from 'src/environments/environment';
import { BaseSignalingMessage, ConnectAck, SignalingMessageType } from '../types/message';
import { LogService } from './log.service';

@Injectable({
  providedIn: 'root',
})
export class SignalingService {
  onConnect: EventEmitter<any>;
  onMessage: EventEmitter<BaseSignalingMessage>;
  onDisconnect: EventEmitter<CloseEvent>;
  onConnectionFailed: EventEmitter<any>;

  webSocket: WebSocket | undefined;

  connectAttemptCount: number;
  connectCount: number;
  isConnected: boolean;
  isReconnected: boolean;

  connectionId: string | undefined;
  authorizationToken: string | undefined;

  constructor(private logService: LogService) {
    this.onConnect = new EventEmitter(true);
    this.onMessage = new EventEmitter(true);
    this.onDisconnect = new EventEmitter(true);
    this.onConnectionFailed = new EventEmitter(true);

    this.connectAttemptCount = 0;
    this.connectCount = 0;
    this.isConnected = false;
    this.isReconnected = false;

    this.init();
  }

  private init() {
    this.logService.log(`trying to ${this.connectCount > 1 ? 'reconnect' : 'connect'} web socket connection`);
    this.webSocket = new WebSocket(environment.webSocketServerUrl);

    // error handler
    this.webSocket.onerror = (event) => {
      this.connectAttemptCount++;
      this.onConnectionFailed.emit({
        connectAttempt: this.connectAttemptCount,
      });

      setTimeout(() => {
        this.init();
      }, environment.wsReconnectDelay);
    };

    // connection open event
    this.webSocket.onopen = (event) => {
      this.connectCount++;
      this.isConnected = true;
      this.isReconnected = this.connectCount > 1;

      this.logService.log(`web socket client ${this.isReconnected ? 'reconnected' : 'connected'}`);

      // emit connect event
      this.onConnect.emit({
        isReconnected: this.isReconnected,
      });
      this.connectAttemptCount = 0;

      // websocket message event
      this.webSocket!.onmessage = (event) => {
        const siganlingMessage: BaseSignalingMessage = JSON.parse(event.data) as BaseSignalingMessage;
        if (siganlingMessage.type === SignalingMessageType.CONNECT) {
          const acknowledment: ConnectAck = siganlingMessage as ConnectAck;
          this.connectionId = acknowledment.connectionId;
          this.authorizationToken = acknowledment.authorization;
        }
        this.onMessage.emit(siganlingMessage);
      };

      // websocket close event
      this.webSocket!.onclose = (event: CloseEvent) => {
        this.logService.log('disconnected from signaling server!');

        this.isConnected = false;
        this.connectionId = undefined;
        this.authorizationToken = undefined;

        this.onDisconnect.emit(event);
        setTimeout(() => {
          this.init();
        }, environment.wsReconnectDelay);
      };
    };
  }

  /**
   * send message
   * @param message
   */
  sendMessage(message: BaseSignalingMessage) {
    this.webSocket!.send(JSON.stringify(message));
  }
}

import { AfterViewInit, Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from '@angular/core';
import { ApiService } from '../service/api.service';
import { SignalingService } from '../service/signaling.service';
import { BaseSignalingMessage, ConnectAck, SignalingMessageType } from '../types/message';
import { firstValueFrom, Subscription } from 'rxjs';
import { BaseSuccessResponse } from '../types/api/api-response';

@Component({
  selector: 'app-server-test-client',
  templateUrl: './server-test-client.component.html',
  styleUrls: ['./server-test-client.component.scss'],
})
export class ServerTestClientComponent implements OnInit, AfterViewInit, OnDestroy {
  subscriptions: Subscription[] | undefined;

  username: string | undefined;
  selectedUser: string | undefined;
  selectedGroup: string | undefined;
  connectionId: string | undefined;
  isUserRegistered: boolean = false;
  isUserRegisteredInGroup: boolean = false;

  logMessages: string[] = [];
  onlineUsers: Map<string, boolean> = new Map();

  @ViewChild('usernameInput', { static: false }) usernameInput: ElementRef | undefined;
  @ViewChild('groupNameInput', { static: false }) groupNameInput: ElementRef | undefined;
  @ViewChild('logMessageDiv', { static: false }) logMessageDiv: ElementRef | undefined;

  constructor(
    private signalingService: SignalingService,
    private apiService: ApiService,
    private renderer: Renderer2,
    private zoneRef: NgZone
  ) {}

  ngOnDestroy(): void {
    this.subscriptions!.forEach((subscription) => subscription.unsubscribe());
    this.subscriptions = undefined;
  }

  ngAfterViewInit(): void {}

  ngOnInit(): void {
    this.subscriptions = [];
    this.subscriptions.push(this.signalingService.onConnect.subscribe(this.handleServerConnect.bind(this)));
    this.subscriptions.push(this.signalingService.onDisconnect.subscribe(this.handleServerDisconnect.bind(this)));
    this.subscriptions.push(this.signalingService.onMessage.subscribe(this.handleWebSocketMessage.bind(this)));
    this.subscriptions.push(this.signalingService.onConnectionFailed.subscribe(this.handleConnectionFailed.bind(this)));
  }

  async handleServerConnect(data: any) {
    this.logMessage(`${data.isReconnected ? 'reconnection' : 'connection'} with signaling server successful`);
  }

  async handleServerDisconnect(event: CloseEvent) {
    this.logMessage(`signaling server disconnected`);
  }

  async handleConnectionFailed(eventData: any) {
    this.logMessage(`connection failed with server with attempt count ${eventData.connectAttempt}`);
  }

  async handleWebSocketMessage(message: BaseSignalingMessage) {
    try {
      switch (message.type) {
        case SignalingMessageType.CONNECT:
          const acknowledment: ConnectAck = message as ConnectAck;
          this.connectionId = acknowledment.connectionId;
          break;

        default:
        // do nothing
      }
    } catch (error) {
      this.logMessage(`error while handling signaling message: ${JSON.stringify(message)}`);
    }
  }

  async fetchActiveUsers() {}

  async registerUser(needRegister: boolean) {
    if (needRegister && this.usernameInput!.nativeElement.value.trim().length === 0) {
      this.logMessage('blank or invalid username');
    }
    const logText = needRegister ? 'register' : 'de-register';
    this.logMessage(`${logText} user with username: ${this.usernameInput?.nativeElement.value}`);
    let data: any = null;
    try {
      data = await firstValueFrom(
        this.apiService.post('users/register', {
          username: needRegister ? this.usernameInput?.nativeElement.value : this.username,
          needRegister,
        })
      );
    } catch (e: any) {
      if (e.error) {
        this.logMessage(e.error.message);
      }
      this.logMessage(`error occured whie ${logText}`);
      return;
    }

    const response: BaseSuccessResponse = data as BaseSuccessResponse;
    this.logMessage(JSON.stringify(response));
    if (response.success) {
      if (needRegister) {
        this.username = response.username;
      } else {
        this.username = undefined;
      }
      this.usernameInput!.nativeElement.value = '';
      this.logMessage(`user ${logText} not successful`);
    } else {
      this.logMessage(`user ${logText} not successful`);
    }
  }

  sendMessage(event: KeyboardEvent, username: string) {}

  async sendMessageOnWebSocket(message: any) {
    this.logMessage(`sending message: ${message}`);
    if (!this.connectionId) {
      this.logMessage('last message cannot be sent because there is no connection id');
      return;
    }
    this.signalingService.sendMessage(message);
  }

  async logMessage(message: string) {
    this.logMessages.push(message);
    if (this.logMessageDiv) {
      this.renderer.setProperty(
        this.logMessageDiv!.nativeElement,
        'scrollTop',
        this.logMessageDiv!.nativeElement.scrollHeight
      );
    }
  }
}

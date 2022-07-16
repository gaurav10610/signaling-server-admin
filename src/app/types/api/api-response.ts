export interface GetUserStatusResponse {
  status: boolean;
}

export interface GetActiveGroupUsers {
  users: string[]; // list of usernames for all the active users in a group
}

export interface GetActiveUsersResponse {
  groups: Map<string, GetActiveGroupUsers>; // list of usernames for all the active users
  nonGroupUsers: string[];
}

export interface BaseServerResponse {
  connectionId: string;
}

export interface BaseSuccessResponse {
  username: string;
  success: boolean;
}

export interface ServerContextResponse {
  clientConnections: object;
  users: object;
}

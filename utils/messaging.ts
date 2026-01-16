export type MessageType = "GET_PAGE_CONTENT" | "CLICK_ELEMENT";

export interface MessagePayload {
  type: MessageType;
  payload?: any;
}

export interface GetPageContentResponse {
  content: string;
  title: string;
  url: string;
}

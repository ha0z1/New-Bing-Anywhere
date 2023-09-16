type ReadyState = 'closed' | 'ended' | 'open'
type MessageType = 'success' | 'failure'

export interface IMessage {
  msg: {
    readyState: ReadyState // default 'open'
    type: MessageType // default 'success'
    text: string
  }
  originMsg?: any
}

export interface ISendPrompt {
  conversationId: string
  prompt: string
  onMessage: (msg: IMessage) => void
  extra: any
}

export default interface APis {
  createConversation(): Promise<{
    conversationId: string
  }>

  sendPrompt(options: ISendPrompt): Promise<IMessage>

  deleteConversation(conversationId: string): Promise<void>
}

export enum Types {
  Chatgpt = 'Chatgpt',
  Claude = 'Claude',
  Bing = 'Bing',
  ChatgptAiplus = 'ChatgptAiplus',
  ClaudeAiplus = 'ClaudeAiplus'
}

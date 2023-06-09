/* eslint-disable @typescript-eslint/indent */
export const enum InvocationId {
  'Creative' = '2', // maybe 0?
  'Precise' = '1',
  'Balanced' = '0'
}
export interface Session {
  conversationSignature: string
  clientId: string
  conversationId: string
}
export interface createPropmtOptions {
  session: Session
  invocationId?: InvocationId
  isStartOfSession?: boolean
  prompt: string
}

export interface ConversationOptions {
  conversationId: string
  source: string
  participantId: string
  conversationSignature: string
}

export interface CoreData {
  messages: Array<
    Partial<{
      text: string
      author: 'user' | 'bot'
      createdAt: string
      timestamp: string
      messageId: string
      messageType?: 'RenderCardRequest' | 'Text' | 'RichCard' | 'EndOfConversationActivity' | 'ActivityTypes/Event'
      requestId: string
      offense: string
      feedback: {
        tag: null
        updatedOn: null
        type: 'None'
      }
      from: {
        id: string
        name: string | null
      }
      contentOrigin: 'cib' | 'DeepLeo'
      sourceAttributions?: Array<{
        providerDisplayName: string
        seeMoreUrl: string
        searchQuery: string
      }>
      suggestedResponses: Array<{
        text: string
        author: 'user' | 'bot'
        createdAt: string
        timestamp: string
        messageId: string
        messageType: 'Suggestion'
        offense: 'Unknown'
        feedback: {
          type: 'None'
        }
        contentOrigin: 'SuggestionChipsFalconService'
      }>
      privacy: null
    }>
  >
  firstNewMessageIndex: number
  defaultChatName: string
  conversationId: string
  requestId: string
  conversationExpiryTime: string
  shouldInitiateConversation: boolean
  telemetry: {
    metrics: null
    startTime: string
  }
  throttling: {
    maxNumUserMessagesInConversation: number
    numUserMessagesInConversation: number
  }
  result: {
    error?: string
    value: 'Success'
    message: string
    serviceVersion: string
  }
}

export interface Type1Data {
  type: 1
  target: 'update'
  arguments: [CoreData]
}

export interface Type2Data {
  type: 2
  invocationId: string
  item: CoreData
}

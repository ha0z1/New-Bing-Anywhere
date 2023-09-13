/* eslint-disable @typescript-eslint/indent */

export interface Session {
  encryptedConversationSignature: string
  clientId: string
  conversationId: string
}

export type ConversationStyle = 'Creative' | 'Precise' | 'Balanced'
export interface createPropmtOptions {
  tone: ConversationStyle
  session: Session
  invocationId?: 0
  isStartOfSession?: boolean
  prompt: string
}

export interface ConversationOptions {
  session: Session
  source: string
  participantId: string
}

export interface CoreData {
  messages?: Array<
    Partial<{
      text: string
      author: 'user' | 'bot'
      createdAt: string
      timestamp: string
      messageId: string
      messageType?: 'RenderCardRequest' | 'Text' | 'RichCard' | 'EndOfConversationActivity' | 'ActivityTypes/Event' | 'InternalSearchResult'
      groundingInfo?: {
        web_search_results?: Array<{
          index: string
          snippets: string[]
          title: string
          url: string
        }>
      }

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
  firstNewMessageIndex: number | null
  defaultChatName: string | null
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
    error?: string // 'Request is throttled.'
    value: 'Success' | 'Throttled'
    message: string // 'Request is throttled.'
    serviceVersion: string
  }
}

export interface type0Data {
  type: 0
  text: string
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

export type onMessageData = type0Data | Type1Data | Type2Data
export interface CreateBingChatOptions {
  prompt: string
  onMessage: (data: onMessageData) => void
  needRefresh: boolean
  session?: Session
}

export interface CreateBingChatResponce {
  data?: CoreData
  conversationOptions?: Partial<ConversationOptions>
}

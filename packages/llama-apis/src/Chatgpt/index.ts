import Apis, { Types } from '../abstract'

// interface IChatgptSendPrompt extends ISendPrompt {}
class Chatgpt implements Apis {
  static type: Types = Types.Chatgpt
  async createConversation() {
    // TODO
    const ret: any = {}
    return ret
  }

  async sendPrompt(/* options: IChatgptSendPrompt */) {
    //  TODO
    const ret: any = {}
    return ret
  }

  async deleteConversation(/* conversationId: string */) {
    //  TODO
  }
}

export default Chatgpt

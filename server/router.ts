import type { ModelSelection, ModelTask } from './types'
import { config } from './config'

export function selectModel(task: ModelTask, message: string): ModelSelection {
  const lower = message.toLowerCase()
  const detected: ModelTask = task !== 'chat' ? task :
    /plan|architecture|compare|reason|analy[sz]e|strategy|debug/.test(lower) ? 'deep' :
    /current|today|latest|news|price|weather|search/.test(lower) ? 'chat' : 'fast'
  const model = detected === 'deep' ? config.deepModel : detected === 'fast' ? config.fastModel : config.chatModel
  if (!model) throw new Error('No model is configured. Set AI_CHAT_MODEL, AI_FAST_MODEL, or AI_DEEP_MODEL on the server.')
  return { provider: config.provider, model, task: detected, maxTokens: detected === 'deep' ? 1800 : 1000, temperature: detected === 'deep' ? .2 : .4, reason: `Selected ${detected} route from task signals and latency budget` }
}

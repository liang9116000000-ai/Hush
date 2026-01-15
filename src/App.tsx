import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism'
import {
  DeepSeekError,
  streamDeepSeekChatCompletion,
  DEFAULT_API_BASE,
  type ChatMessage,
  type DeepSeekModel,
} from './lib/deepseek'
import {
  QwenError,
  streamQwenChatCompletion,
  DEFAULT_QWEN_API_BASE,
  type QwenModel,
} from './lib/qwen'
import {
  QwenImageError,
  generateImage,
  DEFAULT_QWEN_IMAGE_API_BASE,
} from './lib/qwen-image'
import {
  GLMError,
  streamGLMChatCompletion,
  DEFAULT_GLM_API_BASE,
  type GLMModel,
} from './lib/glm'
import {
  OpenAIError,
  streamOpenAIChatCompletion,
  DEFAULT_OPENAI_API_BASE,
  type OpenAIModel,
} from './lib/openai'
import { getSetting, setSetting, DB_KEYS } from './lib/db'

type ModelType = DeepSeekModel | QwenModel | GLMModel | OpenAIModel | 'wanx-v1'

function AttachIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function MicIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
      <path d="M19 10v2a7 7 0 0 1-14 0v-2" strokeLinecap="round" />
      <line x1="12" y1="19" x2="12" y2="22" strokeLinecap="round" />
    </svg>
  )
}

function SendIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2">
      <path d="M5 12h14" strokeLinecap="round" />
      <path d="M13 6l6 6-6 6" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  )
}

function ChatNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 5h14a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H10l-4 3v-3H5a2 2 0 0 1-2-2V7a2 2 0 0 1 2-2Z" />
      <path d="M9 10h6" strokeLinecap="round" />
    </svg>
  )
}

function VoiceNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M6 5v14" strokeLinecap="round" />
      <path d="M12 3v18" strokeLinecap="round" />
      <path d="M18 7v10" strokeLinecap="round" />
    </svg>
  )
}

function ImagineNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="4" y="4" width="16" height="16" rx="3" />
      <path d="M9 9h.01" strokeLinecap="round" />
      <path d="M11 15l2-3 3 4" />
    </svg>
  )
}

function ProjectNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 7a2 2 0 0 1 2-2h4l2 2h8a2 2 0 0 1 2 2v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2Z" />
    </svg>
  )
}

function HistoryNavIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M3 12a9 9 0 1 1 3 6.7" />
      <path d="M3 12h4" strokeLinecap="round" />
      <path d="M12 7v5l3 2" strokeLinecap="round" />
    </svg>
  )
}

function CollapseIcon({ collapsed }: { collapsed: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      {collapsed ? (
        <path d="M9 7l4 5-4 5" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <path d="M15 7l-4 5 4 5" strokeLinecap="round" strokeLinejoin="round" />
      )}
    </svg>
  )
}

function MoreIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="6" cy="12" r="1" />
      <circle cx="12" cy="12" r="1" />
      <circle cx="18" cy="12" r="1" />
    </svg>
  )
}

function DeleteIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 7h14" strokeLinecap="round" />
      <path d="M10 11v6" strokeLinecap="round" />
      <path d="M14 11v6" strokeLinecap="round" />
      <path d="M6 7l1 11a2 2 0 0 0 2 2h6a2 2 0 0 0 2-2l1-11" />
      <path d="M9 7V5a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v2" />
    </svg>
  )
}

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <button className="codeBlockCopy" onClick={handleCopy} aria-label="复制代码">
      {copied ? (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <path d="M20 6L9 17l-5-5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      ) : (
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
          <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
        </svg>
      )}
    </button>
  )
}

function MessageContent({ content }: { content: string }) {
  const [previewImage, setPreviewImage] = useState<string | null>(null)

  return (
    <>
      <div className="msgContent">
        <ReactMarkdown
          components={{
            code({ node, inline, className, children, ...props }) {
              const match = /language-(\w+)/.exec(className || '')
              const codeString = String(children).replace(/\n$/, '')
              
              return !inline && match ? (
                <div className="codeBlock">
                  <div className="codeBlockHeader">
                    <span className="codeBlockLang">{match[1]}</span>
                    <CopyButton text={codeString} />
                  </div>
                  <SyntaxHighlighter
                    style={vscDarkPlus}
                    language={match[1]}
                    PreTag="div"
                    customStyle={{
                      margin: 0,
                      borderRadius: '0 0 8px 8px',
                      fontSize: '14px',
                    }}
                    {...props}
                  >
                    {codeString}
                  </SyntaxHighlighter>
                </div>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            },
            img({ src, alt }) {
              return (
                <div className="msgImage">
                  <img 
                    src={src} 
                    alt={alt || '图像'} 
                    onClick={() => setPreviewImage(src || null)}
                    loading="lazy"
                  />
                </div>
              )
            },
          }}
        >
          {content}
        </ReactMarkdown>
      </div>
      {previewImage && (
        <div className="imagePreview" onClick={() => setPreviewImage(null)}>
          <div className="imagePreviewContent" onClick={(e) => e.stopPropagation()}>
            <img src={previewImage} alt="预览" />
            <button 
              className="imagePreviewClose" 
              onClick={() => setPreviewImage(null)}
              aria-label="关闭"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </>
  )
}

function ThinkingDots() {
  return (
    <div className="thinkingDots">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  )
}

function ImageGeneratingStatus({ status }: { status: string }) {
  return (
    <div className="imageGeneratingWrapper">
      <div className="imageGeneratingStatus">
        <div className="imageGeneratingText">{status}</div>
        <div className="imageGeneratingDots">
          <span className="dot"></span>
          <span className="dot"></span>
          <span className="dot"></span>
        </div>
      </div>
      <div className="imageGeneratingPlaceholder">
        <div className="imageGeneratingGradient"></div>
      </div>
    </div>
  )
}

type StoredChatMessage = ChatMessage & {
  localId: string
}

type ChatSession = {
  id: string
  title: string
  createdAt: number
  messages: StoredChatMessage[]
}

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function ensureTitleFromFirstUserMessage(session: ChatSession) {
  if (session.title !== '新对话') return
  const firstUser = session.messages.find((m) => m.role === 'user')?.content?.trim()
  if (!firstUser) return
  session.title = firstUser.length > 18 ? `${firstUser.slice(0, 18)}…` : firstUser
}

function makeUserMessage(content: string): StoredChatMessage {
  return { role: 'user', content, localId: nowId() }
}

function makeAssistantMessage(content: string, localId: string): StoredChatMessage {
  return { role: 'assistant', content, localId }
}

export default function App() {
  const [apiKeyChatModel, setApiKeyChatModel] = useState<string>('')
  const [apiKeyReasonerModel, setApiKeyReasonerModel] = useState<string>('')
  const [apiBaseChatModel, setApiBaseChatModel] = useState<string>(DEFAULT_API_BASE)
  const [apiBaseReasonerModel, setApiBaseReasonerModel] = useState<string>(DEFAULT_API_BASE)
  const [apiKeyQwen, setApiKeyQwen] = useState<string>('')
  const [apiBaseQwen, setApiBaseQwen] = useState<string>(DEFAULT_QWEN_API_BASE)
  const [apiKeyQwenImage, setApiKeyQwenImage] = useState<string>('')
  const [apiBaseQwenImage, setApiBaseQwenImage] = useState<string>(DEFAULT_QWEN_IMAGE_API_BASE)
  const [apiKeyGLM, setApiKeyGLM] = useState<string>('')
  const [apiBaseGLM, setApiBaseGLM] = useState<string>(DEFAULT_GLM_API_BASE)
  const [apiKeyOpenAI, setApiKeyOpenAI] = useState<string>('')
  const [apiBaseOpenAI, setApiBaseOpenAI] = useState<string>(DEFAULT_OPENAI_API_BASE)
  const [model, setModel] = useState<ModelType>('deepseek-chat')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [draft, setDraft] = useState<string>('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isSidebarModelMenuOpen, setIsSidebarModelMenuOpen] = useState(false)
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false)
  const [sessionMenuOpenId, setSessionMenuOpenId] = useState<string | null>(null)
  const [pendingDeleteSession, setPendingDeleteSession] = useState<ChatSession | null>(null)
  const [isSending, setIsSending] = useState(false)
  const [errorText, setErrorText] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)

  const abortRef = useRef<AbortController | null>(null)
  const chatScrollRef = useRef<HTMLDivElement | null>(null)

  const activeSession = useMemo(
    () => sessions.find((s) => s.id === activeSessionId) ?? null,
    [sessions, activeSessionId],
  )
  const messages = activeSession?.messages ?? []
  const isEmpty = messages.length === 0

  const scrollToBottom = useCallback(() => {
    const el = chatScrollRef.current
    if (!el) return
    el.scrollTop = el.scrollHeight
  }, [])

  const persistSessions = useCallback((nextSessions: ChatSession[]) => {
    setSetting(DB_KEYS.CHATS, nextSessions)
  }, [])

  const newChat = useCallback(() => {
    const id = nowId()
    const session: ChatSession = { id, title: '新对话', createdAt: Date.now(), messages: [] }
    setSessions((prev) => {
      const next = [session, ...prev]
      persistSessions(next)
      return next
    })
    setActiveSessionId(id)
    setDraft('')
    setErrorText('')
    queueMicrotask(scrollToBottom)
  }, [persistSessions, scrollToBottom])

  const deleteChat = useCallback(
    (id: string) => {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id)
      if (activeSessionId === id) {
        setActiveSessionId(next[0]?.id ?? '')
      }
      persistSessions(next)
      return next
    })
    },
    [activeSessionId, persistSessions],
  )

  const send = useCallback(async () => {
    const content = draft.trim()
    if (!content) return
    if (!activeSession) return
    if (isSending) return

    setErrorText('')
    setIsSending(true)
    abortRef.current?.abort()
    abortRef.current = new AbortController()

    const assistantPlaceholderId = nowId()

    setSessions((prev) => {
      const next = prev.map((s) => {
        if (s.id !== activeSessionId) return s
        const nextMessages: StoredChatMessage[] = [
          ...s.messages,
          makeUserMessage(content),
          makeAssistantMessage('', assistantPlaceholderId),
        ]
        const updated: ChatSession = {
          ...s,
          messages: nextMessages,
        }
        ensureTitleFromFirstUserMessage(updated)
        return updated
      })
      persistSessions(next)
      return next
    })

    setDraft('')
    queueMicrotask(scrollToBottom)

    const isQwen = model.startsWith('qwen-')
    const isGLM = model.startsWith('glm-')
    const isOpenAI = model.startsWith('gpt-')
    const isImage = model === 'wanx-v1'
    const apiKey = isImage
      ? apiKeyQwenImage
      : isQwen 
      ? apiKeyQwen
      : isGLM
      ? apiKeyGLM
      : isOpenAI
      ? apiKeyOpenAI
      : model === 'deepseek-chat' ? apiKeyChatModel : apiKeyReasonerModel
    const apiBase = isImage
      ? apiBaseQwenImage
      : isQwen 
      ? apiBaseQwen
      : isGLM
      ? apiBaseGLM
      : isOpenAI
      ? apiBaseOpenAI
      : model === 'deepseek-chat' ? apiBaseChatModel : apiBaseReasonerModel

    if (!apiKey) {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const updated = {
            ...s,
            messages: s.messages.map((m): StoredChatMessage =>
              m.localId === assistantPlaceholderId
                ? makeAssistantMessage(`未配置 ${isImage ? '千问图像' : isQwen ? '千问' : isGLM ? 'GLM' : isOpenAI ? 'ChatGPT' : 'DeepSeek'} API Key（左下角设置）。`, assistantPlaceholderId)
                : m,
            ),
          }
          return updated
        })
        persistSessions(next)
        return next
      })
      setIsSending(false)
      return
    }

    const baseMessages: ChatMessage[] = activeSession.messages
      .filter((m) => m.role === 'user' || m.role === 'assistant')
      .map((m) => ({ role: m.role, content: m.content }))

    try {
      if (isImage) {
        // 图像生成
        const urls = await generateImage({
          apiKey,
          apiBase,
          prompt: content,
          signal: abortRef.current.signal,
          onProgress: (status) => {
            setSessions((prev) => {
              const next = prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const updated = {
                  ...s,
                  messages: s.messages.map((m): StoredChatMessage =>
                    m.localId === assistantPlaceholderId ? makeAssistantMessage(status, assistantPlaceholderId) : m,
                  ),
                }
                return updated
              })
              persistSessions(next)
              return next
            })
            scrollToBottom()
          },
        })
        
        const imageMarkdown = urls.map(url => `![生成的图像](${url})`).join('\n\n')
        setSessions((prev) => {
          const next = prev.map((s) => {
            if (s.id !== activeSessionId) return s
            const updated = {
              ...s,
              messages: s.messages.map((m): StoredChatMessage =>
                m.localId === assistantPlaceholderId ? makeAssistantMessage(imageMarkdown, assistantPlaceholderId) : m,
              ),
            }
            return updated
          })
          persistSessions(next)
          return next
        })
      } else {
        let acc = ''
        
        if (isQwen) {
          for await (const delta of streamQwenChatCompletion({
            apiKey,
            apiBase,
            model: model as QwenModel,
            messages: [...baseMessages, { role: 'user', content }],
            signal: abortRef.current.signal,
          })) {
            acc += delta
            const nextText = acc
            setSessions((prev) => {
              const next = prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const updated = {
                  ...s,
                  messages: s.messages.map((m): StoredChatMessage =>
                    m.localId === assistantPlaceholderId ? makeAssistantMessage(nextText, assistantPlaceholderId) : m,
                  ),
                }
                return updated
              })
              persistSessions(next)
              return next
            })
            scrollToBottom()
          }
        } else if (isGLM) {
          for await (const delta of streamGLMChatCompletion({
            apiKey,
            apiBase,
            model: model as GLMModel,
            messages: [...baseMessages, { role: 'user', content }],
            signal: abortRef.current.signal,
          })) {
            acc += delta
            const nextText = acc
            setSessions((prev) => {
              const next = prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const updated = {
                  ...s,
                  messages: s.messages.map((m): StoredChatMessage =>
                    m.localId === assistantPlaceholderId ? makeAssistantMessage(nextText, assistantPlaceholderId) : m,
                  ),
                }
                return updated
              })
              persistSessions(next)
              return next
            })
            scrollToBottom()
          }
        } else if (isOpenAI) {
          for await (const delta of streamOpenAIChatCompletion({
            apiKey,
            apiBase,
            model: model as OpenAIModel,
            messages: [...baseMessages, { role: 'user', content }],
            signal: abortRef.current.signal,
          })) {
            acc += delta
            const nextText = acc
            setSessions((prev) => {
              const next = prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const updated = {
                  ...s,
                  messages: s.messages.map((m): StoredChatMessage =>
                    m.localId === assistantPlaceholderId ? makeAssistantMessage(nextText, assistantPlaceholderId) : m,
                  ),
                }
                return updated
              })
              persistSessions(next)
              return next
            })
            scrollToBottom()
          }
        } else {
          for await (const delta of streamDeepSeekChatCompletion({
            apiKey,
            apiBase,
            model: model as DeepSeekModel,
            messages: [...baseMessages, { role: 'user', content }],
            signal: abortRef.current.signal,
          })) {
            acc += delta
            const nextText = acc
            setSessions((prev) => {
              const next = prev.map((s) => {
                if (s.id !== activeSessionId) return s
                const updated = {
                  ...s,
                  messages: s.messages.map((m): StoredChatMessage =>
                    m.localId === assistantPlaceholderId ? makeAssistantMessage(nextText, assistantPlaceholderId) : m,
                  ),
                }
                return updated
              })
              persistSessions(next)
              return next
            })
            scrollToBottom()
          }
        }
      }
    } catch (err) {
      const msg =
        err instanceof DeepSeekError || err instanceof QwenError || err instanceof QwenImageError || err instanceof GLMError || err instanceof OpenAIError
          ? err.message
          : err instanceof Error
            ? err.message
            : '请求失败'
      setErrorText(msg)
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const updated = {
            ...s,
            messages: s.messages.map((m): StoredChatMessage =>
              m.localId === assistantPlaceholderId ? makeAssistantMessage(`出错了：${msg}`, assistantPlaceholderId) : m,
            ),
          }
          return updated
        })
        persistSessions(next)
        return next
      })
    } finally {
      setIsSending(false)
    }
  }, [
    activeSession,
    activeSessionId,
    apiKeyChatModel,
    apiKeyReasonerModel,
    apiBaseChatModel,
    apiBaseReasonerModel,
    apiKeyQwen,
    apiBaseQwen,
    apiKeyQwenImage,
    apiBaseQwenImage,
    apiKeyGLM,
    apiBaseGLM,
    apiKeyOpenAI,
    apiBaseOpenAI,
    draft,
    isSending,
    model,
    persistSessions,
    scrollToBottom,
  ])

  const onComposerKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key !== 'Enter') return
    if (e.shiftKey) return
    e.preventDefault()
    void send()
    },
    [send],
  )

  // 从 IndexedDB 加载设置
  useEffect(() => {
    async function loadSettings() {
      try {
        const [
          savedApiKeyChatModel,
          savedApiKeyReasonerModel,
          savedApiBaseChatModel,
          savedApiBaseReasonerModel,
          savedApiKeyQwen,
          savedApiBaseQwen,
          savedApiKeyQwenImage,
          savedApiBaseQwenImage,
          savedApiKeyGLM,
          savedApiBaseGLM,
          savedApiKeyOpenAI,
          savedApiBaseOpenAI,
          savedModel,
          savedChats,
        ] = await Promise.all([
          getSetting<string>(DB_KEYS.API_KEY_CHAT),
          getSetting<string>(DB_KEYS.API_KEY_REASONER),
          getSetting<string>(DB_KEYS.API_BASE_CHAT),
          getSetting<string>(DB_KEYS.API_BASE_REASONER),
          getSetting<string>(DB_KEYS.API_KEY_QWEN),
          getSetting<string>(DB_KEYS.API_BASE_QWEN),
          getSetting<string>(DB_KEYS.API_KEY_QWEN_IMAGE),
          getSetting<string>(DB_KEYS.API_BASE_QWEN_IMAGE),
          getSetting<string>(DB_KEYS.API_KEY_GLM),
          getSetting<string>(DB_KEYS.API_BASE_GLM),
          getSetting<string>(DB_KEYS.API_KEY_OPENAI),
          getSetting<string>(DB_KEYS.API_BASE_OPENAI),
          getSetting<ModelType>(DB_KEYS.MODEL),
          getSetting<ChatSession[]>(DB_KEYS.CHATS),
        ])

        if (savedApiKeyChatModel) setApiKeyChatModel(savedApiKeyChatModel)
        if (savedApiKeyReasonerModel) setApiKeyReasonerModel(savedApiKeyReasonerModel)
        if (savedApiBaseChatModel) setApiBaseChatModel(savedApiBaseChatModel)
        if (savedApiBaseReasonerModel) setApiBaseReasonerModel(savedApiBaseReasonerModel)
        if (savedApiKeyQwen) setApiKeyQwen(savedApiKeyQwen)
        if (savedApiBaseQwen) setApiBaseQwen(savedApiBaseQwen)
        if (savedApiKeyQwenImage) setApiKeyQwenImage(savedApiKeyQwenImage)
        if (savedApiBaseQwenImage) setApiBaseQwenImage(savedApiBaseQwenImage)
        if (savedApiKeyGLM) setApiKeyGLM(savedApiKeyGLM)
        if (savedApiBaseGLM) setApiBaseGLM(savedApiBaseGLM)
        if (savedApiKeyOpenAI) setApiKeyOpenAI(savedApiKeyOpenAI)
        if (savedApiBaseOpenAI) setApiBaseOpenAI(savedApiBaseOpenAI)
        if (savedModel) setModel(savedModel)

        if (savedChats && savedChats.length > 0) {
          setSessions(savedChats)
          setActiveSessionId(savedChats[0].id)
        } else {
          const id = nowId()
          const session: ChatSession = { id, title: '新对话', createdAt: Date.now(), messages: [] }
          setSessions([session])
          setActiveSessionId(id)
          await setSetting(DB_KEYS.CHATS, [session])
        }
      } catch (err) {
        console.error('加载设置失败:', err)
        const id = nowId()
        const session: ChatSession = { id, title: '新对话', createdAt: Date.now(), messages: [] }
        setSessions([session])
        setActiveSessionId(id)
      } finally {
        setIsLoading(false)
      }
    }
    loadSettings()
  }, [])

  // 保存设置到 IndexedDB
  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_CHAT, apiKeyChatModel)
  }, [apiKeyChatModel, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_REASONER, apiKeyReasonerModel)
  }, [apiKeyReasonerModel, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_CHAT, apiBaseChatModel)
  }, [apiBaseChatModel, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_REASONER, apiBaseReasonerModel)
  }, [apiBaseReasonerModel, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_QWEN, apiKeyQwen)
  }, [apiKeyQwen, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_QWEN, apiBaseQwen)
  }, [apiBaseQwen, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_QWEN_IMAGE, apiKeyQwenImage)
  }, [apiKeyQwenImage, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_QWEN_IMAGE, apiBaseQwenImage)
  }, [apiBaseQwenImage, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_GLM, apiKeyGLM)
  }, [apiKeyGLM, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_GLM, apiBaseGLM)
  }, [apiBaseGLM, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_KEY_OPENAI, apiKeyOpenAI)
  }, [apiKeyOpenAI, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.API_BASE_OPENAI, apiBaseOpenAI)
  }, [apiBaseOpenAI, isLoading])

  useEffect(() => {
    if (isLoading) return
    setSetting(DB_KEYS.MODEL, model)
  }, [model, isLoading])

  useEffect(() => {
    queueMicrotask(scrollToBottom)
  }, [messages.length, scrollToBottom])

  if (isLoading) {
    return (
      <div className="loadingScreen">
        <div className="loadingSpinner" />
      </div>
    )
  }

  return (
    <div
      className={`appShell ${isSidebarCollapsed ? 'appShellCollapsed' : ''}`}
      onClick={() => {
        if (sessionMenuOpenId) {
          setSessionMenuOpenId(null)
        }
      }}
    >
      <aside className={`sidebar ${isSidebarCollapsed ? 'sidebarCollapsed' : ''}`}>
        <div className="sidebarTopRow">
          <button
            type="button"
            className="sidebarNewChatBtn"
            onClick={newChat}
            aria-label="新对话"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M12 5v14M5 12h14" strokeLinecap="round" />
            </svg>
          </button>
        </div>

        <div className="sidebarNav">
          <button
            className="sidebarNavItem active"
            type="button"
            onClick={newChat}
          >
            <span className="sidebarNavIcon">
              <ChatNavIcon />
            </span>
            <span className="sidebarNavLabel">聊天</span>
          </button>
          <button className="sidebarNavItem" type="button">
            <span className="sidebarNavIcon">
              <VoiceNavIcon />
            </span>
            <span className="sidebarNavLabel">语音</span>
          </button>
          <button className="sidebarNavItem" type="button">
            <span className="sidebarNavIcon">
              <ImagineNavIcon />
            </span>
            <span className="sidebarNavLabel">Imagine</span>
          </button>
          <button className="sidebarNavItem" type="button">
            <span className="sidebarNavIcon">
              <ProjectNavIcon />
            </span>
            <span className="sidebarNavLabel">项目</span>
          </button>
          <button className="sidebarNavItem" type="button">
            <span className="sidebarNavIcon">
              <HistoryNavIcon />
            </span>
            <span className="sidebarNavLabel">历史记录</span>
          </button>
        </div>

        <div className="sectionTitle">你的聊天</div>
        <div className={`sessionList ${sessionMenuOpenId ? 'sessionListMenuOpen' : ''}`}>
          {sessions.map((s) => {
            const isActive = s.id === activeSessionId
            const isMenuOpen = sessionMenuOpenId === s.id
            return (
              <div
                key={s.id}
                className={`sessionItemRow ${isActive ? 'active' : ''} ${isMenuOpen ? 'menuOpen' : ''}`}
              >
                <button
                  type="button"
                  className="sessionItemMain"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSessionId(s.id)
                    setSessionMenuOpenId(null)
                  }}
                >
                  <div className="sessionTitle">{s.title}</div>
                </button>
                <button
                  type="button"
                  className="sessionItemMore"
                  onClick={(e) => {
                    e.stopPropagation()
                    setActiveSessionId(s.id)
                    setSessionMenuOpenId((prev) => (prev === s.id ? null : s.id))
                  }}
                  aria-label="会话更多操作"
                >
                  <MoreIcon />
                </button>
                {isMenuOpen ? (
                  <div
                    className="sessionMenu"
                    onClick={(e) => {
                      e.stopPropagation()
                    }}
                  >
                    <button className="sessionMenuItem" type="button" onClick={() => setSessionMenuOpenId(null)}>
                      <span className="sessionMenuItemLabel">分享</span>
                    </button>
                    <button className="sessionMenuItem" type="button" onClick={() => setSessionMenuOpenId(null)}>
                      <span className="sessionMenuItemLabel">开始群聊</span>
                    </button>
                    <button className="sessionMenuItem" type="button" onClick={() => setSessionMenuOpenId(null)}>
                      <span className="sessionMenuItemLabel">重命名</span>
                    </button>
                    <button className="sessionMenuItem" type="button" onClick={() => setSessionMenuOpenId(null)}>
                      <span className="sessionMenuItemLabel">置顶聊天</span>
                    </button>
                    <button className="sessionMenuItem" type="button" onClick={() => setSessionMenuOpenId(null)}>
                      <span className="sessionMenuItemLabel">归档</span>
                    </button>
                    <button
                      className="sessionMenuItem sessionMenuItemDanger"
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation()
                        setPendingDeleteSession(s)
                        setSessionMenuOpenId(null)
                      }}
                    >
                      <span className="sessionMenuItemIcon">
                        <DeleteIcon />
                      </span>
                      <span className="sessionMenuItemLabel">删除</span>
                    </button>
                  </div>
                ) : null}
              </div>
            )
          })}
        </div>

        <div className="sidebarFooter">
          <button
            type="button"
            className="userButton"
            onClick={() => setIsUserMenuOpen((v) => !v)}
          >
            <div className="userDot">ZL</div>
          </button>
          <button
            type="button"
            className="collapseButton"
            onClick={() => setIsSidebarCollapsed((v) => !v)}
            aria-label={isSidebarCollapsed ? '展开侧边栏' : '折叠侧边栏'}
          >
            <CollapseIcon collapsed={isSidebarCollapsed} />
          </button>
        </div>
        {isUserMenuOpen ? (
          <div className="userMenu">
            <div className="userMenuHeader">
              <div className="userMenuAvatar">HS</div>
              <div className="userMenuInfo">
                <div className="userMenuName">Hush 用户</div>
                <div className="userMenuHandle">@user</div>
              </div>
            </div>
            <div className="userMenuDivider" />
            <button className="userMenuItem" type="button">
              升级套餐
            </button>
            <button className="userMenuItem" type="button">
              个性化
            </button>
            <button
              className="userMenuItem"
              type="button"
              onClick={() => {
                setIsSettingsOpen(true)
                setIsUserMenuOpen(false)
              }}
            >
              设置
            </button>
            <div className="userMenuDivider" />
            <button className="userMenuItem" type="button">
              帮助
            </button>
            <button className="userMenuItem" type="button">
              退出登录
            </button>
          </div>
        ) : null}
      </aside>

      <main className="main">
        <div className="mainTopBar">
          <div className="mainModelSelectorWrapper">
            <button
              type="button"
              className="mainModelSelector"
              onClick={() => setIsSidebarModelMenuOpen((v) => !v)}
            >
              <span className="mainModelName">
                {model === 'deepseek-chat' ? 'DeepSeek' : 
                 model === 'deepseek-reasoner' ? 'DeepSeek R1' : 
                 model === 'qwen-turbo' ? '千问 Turbo' :
                 model === 'qwen-plus' ? '千问 Plus' : 
                 model === 'qwen-max' ? '千问 Max' :
                 model === 'glm-4-plus' ? 'GLM-4-Plus' :
                 model === 'glm-4-air' ? 'GLM-4-Air' :
                 model === 'glm-4-flash' ? 'GLM-4-Flash' :
                 model === 'gpt-5.2' ? 'GPT-5.2' :
                 model === 'gpt-4o' ? 'GPT-4o' :
                 model === 'gpt-4o-mini' ? 'GPT-4o-mini' :
                 model === 'gpt-4-turbo' ? 'GPT-4-Turbo' :
                 model === 'gpt-3.5-turbo' ? 'GPT-3.5-Turbo' : '千问图像'}
              </span>
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M6 9l6 6 6-6" />
              </svg>
            </button>
            {isSidebarModelMenuOpen && (
              <div className="mainModelMenu">
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('deepseek-chat')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">DeepSeek</div>
                    <div className="mainModelSub">对话模型</div>
                  </div>
                  {model === 'deepseek-chat' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('deepseek-reasoner')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">DeepSeek R1</div>
                    <div className="mainModelSub">推理模型</div>
                  </div>
                  {model === 'deepseek-reasoner' && <span className="mainModelCheck">✓</span>}
                </button>
                <div className="mainModelDivider" />
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('qwen-turbo')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">千问 Turbo</div>
                    <div className="mainModelSub">快速响应</div>
                  </div>
                  {model === 'qwen-turbo' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('qwen-plus')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">千问 Plus</div>
                    <div className="mainModelSub">平衡性能</div>
                  </div>
                  {model === 'qwen-plus' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('qwen-max')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">千问 Max</div>
                    <div className="mainModelSub">最强性能</div>
                  </div>
                  {model === 'qwen-max' && <span className="mainModelCheck">✓</span>}
                </button>
                <div className="mainModelDivider" />
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('glm-4-plus')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GLM-4-Plus</div>
                    <div className="mainModelSub">智谱旗舰</div>
                  </div>
                  {model === 'glm-4-plus' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('glm-4-air')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GLM-4-Air</div>
                    <div className="mainModelSub">快速响应</div>
                  </div>
                  {model === 'glm-4-air' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('glm-4-flash')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GLM-4-Flash</div>
                    <div className="mainModelSub">极速模型</div>
                  </div>
                  {model === 'glm-4-flash' && <span className="mainModelCheck">✓</span>}
                </button>
                <div className="mainModelDivider" />
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('gpt-5.2')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GPT-5.2</div>
                    <div className="mainModelSub">最新旗舰</div>
                  </div>
                  {model === 'gpt-5.2' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('gpt-4o')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GPT-4o</div>
                    <div className="mainModelSub">OpenAI 旗舰</div>
                  </div>
                  {model === 'gpt-4o' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('gpt-4o-mini')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GPT-4o-mini</div>
                    <div className="mainModelSub">快速高效</div>
                  </div>
                  {model === 'gpt-4o-mini' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('gpt-4-turbo')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GPT-4-Turbo</div>
                    <div className="mainModelSub">强大推理</div>
                  </div>
                  {model === 'gpt-4-turbo' && <span className="mainModelCheck">✓</span>}
                </button>
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('gpt-3.5-turbo')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">GPT-3.5-Turbo</div>
                    <div className="mainModelSub">经济实惠</div>
                  </div>
                  {model === 'gpt-3.5-turbo' && <span className="mainModelCheck">✓</span>}
                </button>
                <div className="mainModelDivider" />
                <button
                  type="button"
                  className="mainModelMenuItem"
                  onClick={() => {
                    setModel('wanx-v1')
                    setIsSidebarModelMenuOpen(false)
                  }}
                >
                  <div className="mainModelText">
                    <div className="mainModelTitle">千问图像</div>
                    <div className="mainModelSub">图像生成</div>
                  </div>
                  {model === 'wanx-v1' && <span className="mainModelCheck">✓</span>}
                </button>
              </div>
            )}
          </div>
        </div>
        <div className="chatArea" ref={chatScrollRef}>
          {isEmpty ? (
            <div className="landing">
              <div className="landingCenter">
                <div className="landingTitle">你想聊点什么？</div>
                <div className="landingComposerWrapper">
                  <form
                    className="landingComposer"
                    onSubmit={(e) => {
                      e.preventDefault()
                      void send()
                    }}
                  >
                    <div className="landingInputLeft">
                      <button type="button" className="attachBtn">
                        <AttachIcon />
                      </button>
                    </div>
                    <textarea
                      value={draft}
                      className="landingInput"
                      rows={1}
                      placeholder="你想知道些什么？"
                      onKeyDown={onComposerKeyDown}
                      onChange={(e) => setDraft(e.target.value)}
                    />
                    <div className="landingTools">
                      <button className="landingMic" type="button" aria-label="语音输入">
                        <MicIcon />
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            </div>
          ) : (
            <div className="messageList">
              {messages.map((m, idx) => (
                <div key={idx} className={`msgRow ${m.role}`}>
                  <div className="msgAvatar">
                    {m.role === 'user' ? '你' : m.role === 'assistant' ? 'DS' : 'S'}
                  </div>
                  <div className="msgBubble">
                    {m.role === 'assistant' && m.content === '' ? (
                      <ThinkingDots />
                    ) : m.role === 'assistant' && (m.content.includes('正在生成') || m.content.includes('正在提交') || m.content.includes('等待')) ? (
                      <ImageGeneratingStatus status={m.content} />
                    ) : (
                      <MessageContent content={m.content} />
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {!isEmpty ? (
          <footer className="composer">
            <div className="landingComposerWrapper">
              <form
                className="landingComposer"
                onSubmit={(e) => {
                  e.preventDefault()
                  void send()
                }}
              >
                <div className="landingInputLeft">
                  <button type="button" className="attachBtn">
                    <AttachIcon />
                  </button>
                </div>
                <textarea
                  value={draft}
                  className="landingInput"
                  rows={1}
                  placeholder="询问任何问题"
                  onKeyDown={onComposerKeyDown}
                  onChange={(e) => setDraft(e.target.value)}
                />
                <div className="landingTools">
                  <button className="landingMic" type="button" aria-label="语音输入">
                    <MicIcon />
                  </button>
                  <button className="landingMic" type="submit" aria-label="发送" disabled={isSending}>
                    <SendIcon />
                  </button>
                </div>
              </form>
            </div>
            {errorText ? <div className="errorBar">{errorText}</div> : null}
          </footer>
        ) : null}
      </main>

      {pendingDeleteSession ? (
        <div
          className="modalBackdrop"
          onClick={() => {
            setPendingDeleteSession(null)
          }}
        >
          <div
            className="modal confirmDeleteModal"
            onClick={(e) => {
              e.stopPropagation()
            }}
          >
            <div className="modalHeader confirmDeleteHeader">
              <div className="modalTitle">删除聊天？</div>
            </div>

            <div className="modalBody confirmDeleteBody">
              <div className="confirmDeleteText">
                这会删除“{pendingDeleteSession.title}”。
              </div>
              <div className="confirmDeleteHint">删除后将无法恢复此聊天记录。</div>
              <div className="confirmDeleteButtons">
                <button
                  className="btn"
                  type="button"
                  onClick={() => {
                    setPendingDeleteSession(null)
                  }}
                >
                  取消
                </button>
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => {
                    if (pendingDeleteSession) {
                      deleteChat(pendingDeleteSession.id)
                    }
                    setPendingDeleteSession(null)
                  }}
                >
                  删除
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}

      {isSettingsOpen ? (
        <div className="modalBackdrop" onClick={() => setIsSettingsOpen(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modalHeader">
              <div className="modalTitle">设置</div>
              <button className="btn" type="button" onClick={() => setIsSettingsOpen(false)}>
                关闭
              </button>
            </div>

            <div className="modalBody">
              <div className="settingsSection">
                <div className="settingsSectionTitle">deepseek-chat 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseChatModel}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_API_BASE}
                    onChange={(e) => setApiBaseChatModel(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyChatModel}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyChatModel(e.target.value)}
                  />
                </label>
              </div>

              <div className="settingsSection">
                <div className="settingsSectionTitle">deepseek-reasoner 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseReasonerModel}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_API_BASE}
                    onChange={(e) => setApiBaseReasonerModel(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyReasonerModel}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyReasonerModel(e.target.value)}
                  />
                </label>
              </div>

              <div className="settingsSection">
                <div className="settingsSectionTitle">千问 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseQwen}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_QWEN_API_BASE}
                    onChange={(e) => setApiBaseQwen(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyQwen}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyQwen(e.target.value)}
                  />
                </label>
              </div>

              <div className="settingsSection">
                <div className="settingsSectionTitle">千问图像 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseQwenImage}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_QWEN_IMAGE_API_BASE}
                    onChange={(e) => setApiBaseQwenImage(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyQwenImage}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyQwenImage(e.target.value)}
                  />
                </label>
              </div>

              <div className="settingsSection">
                <div className="settingsSectionTitle">GLM 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseGLM}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_GLM_API_BASE}
                    onChange={(e) => setApiBaseGLM(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyGLM}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyGLM(e.target.value)}
                  />
                </label>
              </div>

              <div className="settingsSection">
                <div className="settingsSectionTitle">ChatGPT 配置</div>
                <label className="field">
                  <div className="fieldLabel">API Base URL</div>
                  <input
                    value={apiBaseOpenAI}
                    className="fieldInput"
                    type="text"
                    placeholder={DEFAULT_OPENAI_API_BASE}
                    onChange={(e) => setApiBaseOpenAI(e.target.value)}
                  />
                </label>
                <label className="field">
                  <div className="fieldLabel">API Key</div>
                  <input
                    value={apiKeyOpenAI}
                    className="fieldInput"
                    type="password"
                    placeholder="sk-..."
                    onChange={(e) => setApiKeyOpenAI(e.target.value)}
                  />
                </label>
              </div>

              <label className="field">
                <div className="fieldLabel">默认模型</div>
                <select value={model} className="fieldInput" onChange={(e) => setModel(e.target.value as ModelType)}>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                  <option value="qwen-plus">qwen-plus</option>
                  <option value="qwen-turbo">qwen-turbo</option>
                  <option value="qwen-max">qwen-max</option>
                  <option value="glm-4-plus">glm-4-plus</option>
                  <option value="glm-4-air">glm-4-air</option>
                  <option value="glm-4-flash">glm-4-flash</option>
                  <option value="gpt-5.2">gpt-5.2</option>
                  <option value="gpt-4o">gpt-4o</option>
                  <option value="gpt-4o-mini">gpt-4o-mini</option>
                  <option value="gpt-4-turbo">gpt-4-turbo</option>
                  <option value="gpt-3.5-turbo">gpt-3.5-turbo</option>
                  <option value="wanx-v1">千问图像 (wanx-v1)</option>
                </select>
              </label>

              <div className="dangerZone">
                <button
                  className="btn btn-danger"
                  type="button"
                  onClick={() => deleteChat(activeSessionId)}
                  disabled={!activeSessionId}
                >
                  删除当前对话
                </button>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  )
}

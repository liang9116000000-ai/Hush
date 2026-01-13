import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { getSetting, setSetting, DB_KEYS } from './lib/db'

type ModelType = DeepSeekModel | QwenModel

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

function ThinkingDots() {
  return (
    <div className="thinkingDots">
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
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
  const [model, setModel] = useState<ModelType>('deepseek-chat')
  const [sessions, setSessions] = useState<ChatSession[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string>('')
  const [draft, setDraft] = useState<string>('')
  const [isSettingsOpen, setIsSettingsOpen] = useState(false)
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false)
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
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
    const apiKey = isQwen 
      ? apiKeyQwen 
      : model === 'deepseek-chat' ? apiKeyChatModel : apiKeyReasonerModel
    const apiBase = isQwen 
      ? apiBaseQwen 
      : model === 'deepseek-chat' ? apiBaseChatModel : apiBaseReasonerModel

    if (!apiKey) {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const updated = {
            ...s,
            messages: s.messages.map((m): StoredChatMessage =>
              m.localId === assistantPlaceholderId
                ? makeAssistantMessage(`未配置 ${isQwen ? '千问' : 'DeepSeek'} API Key（左下角设置）。`, assistantPlaceholderId)
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
    } catch (err) {
      const msg =
        err instanceof DeepSeekError || err instanceof QwenError
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
          savedModel,
          savedChats,
        ] = await Promise.all([
          getSetting<string>(DB_KEYS.API_KEY_CHAT),
          getSetting<string>(DB_KEYS.API_KEY_REASONER),
          getSetting<string>(DB_KEYS.API_BASE_CHAT),
          getSetting<string>(DB_KEYS.API_BASE_REASONER),
          getSetting<string>(DB_KEYS.API_KEY_QWEN),
          getSetting<string>(DB_KEYS.API_BASE_QWEN),
          getSetting<ModelType>(DB_KEYS.MODEL),
          getSetting<ChatSession[]>(DB_KEYS.CHATS),
        ])

        if (savedApiKeyChatModel) setApiKeyChatModel(savedApiKeyChatModel)
        if (savedApiKeyReasonerModel) setApiKeyReasonerModel(savedApiKeyReasonerModel)
        if (savedApiBaseChatModel) setApiBaseChatModel(savedApiBaseChatModel)
        if (savedApiBaseReasonerModel) setApiBaseReasonerModel(savedApiBaseReasonerModel)
        if (savedApiKeyQwen) setApiKeyQwen(savedApiKeyQwen)
        if (savedApiBaseQwen) setApiBaseQwen(savedApiBaseQwen)
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
        <div className="brandRow">
          <div className="brandMark">
            <img src="/AI.png" alt="Hush" className="brandLogo" />
          </div>
          <div className="brandText">
            <div className="brandTitle">Hush</div>
          </div>
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
        <div className="chatArea" ref={chatScrollRef}>
          {isEmpty ? (
            <div className="landing">
              <div className="landingCenter">
                <div className="landingLogo">
                  <div className="titleSelectorWrapper">
                    <button
                      type="button"
                      className="titleSelector"
                      onClick={() => setIsModelMenuOpen((v) => !v)}
                    >
                      <span className="titleSelectorName">
                        {model === 'deepseek-chat' ? 'DeepSeek' : 
                         model === 'deepseek-reasoner' ? 'DeepSeek R1' : 
                         model === 'qwen-turbo' ? '千问 Turbo' :
                         model === 'qwen-plus' ? '千问 Plus' : '千问 Max'}
                      </span>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <path d="M6 9l6 6 6-6" />
                      </svg>
                    </button>
                    {isModelMenuOpen ? (
                      <div className="titleModelMenu">
                        <button
                          type="button"
                          className="titleModelMenuItem"
                          onClick={() => {
                            setModel('deepseek-reasoner')
                            setIsModelMenuOpen(false)
                          }}
                        >
                          <span className="titleModelIcon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <rect x="6" y="6" width="12" height="12" rx="2" transform="rotate(45 12 12)" />
                              <circle cx="12" cy="12" r="2" fill="currentColor" />
                            </svg>
                          </span>
                          <div className="titleModelText">
                            <div className="titleModelTitle">DeepSeek R1</div>
                            <div className="titleModelSub">强化推理能力</div>
                          </div>
                          {model === 'deepseek-reasoner' ? <span className="titleModelCheck">✓</span> : null}
                        </button>
                        <button
                          type="button"
                          className="titleModelMenuItem"
                          onClick={() => {
                            setModel('deepseek-chat')
                            setIsModelMenuOpen(false)
                          }}
                        >
                          <span className="titleModelIcon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <circle cx="12" cy="12" r="4" />
                              <path d="M12 2v4M12 18v4M2 12h4M18 12h4" />
                              <path d="M4.93 4.93l2.83 2.83M16.24 16.24l2.83 2.83M4.93 19.07l2.83-2.83M16.24 7.76l2.83-2.83" />
                            </svg>
                          </span>
                          <div className="titleModelText">
                            <div className="titleModelTitle">DeepSeek</div>
                            <div className="titleModelSub">适合处理日常任务</div>
                          </div>
                          {model === 'deepseek-chat' ? <span className="titleModelCheck">✓</span> : null}
                        </button>
                        <div className="titleModelDivider" />
                        <button
                          type="button"
                          className="titleModelMenuItem"
                          onClick={() => {
                            setModel('qwen-max')
                            setIsModelMenuOpen(false)
                          }}
                        >
                          <span className="titleModelIcon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path d="M2 17l10 5 10-5" />
                              <path d="M2 12l10 5 10-5" />
                            </svg>
                          </span>
                          <div className="titleModelText">
                            <div className="titleModelTitle">千问 Max</div>
                            <div className="titleModelSub">最强能力，复杂任务</div>
                          </div>
                          {model === 'qwen-max' ? <span className="titleModelCheck">✓</span> : null}
                        </button>
                        <button
                          type="button"
                          className="titleModelMenuItem"
                          onClick={() => {
                            setModel('qwen-plus')
                            setIsModelMenuOpen(false)
                          }}
                        >
                          <span className="titleModelIcon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M12 2L2 7l10 5 10-5-10-5z" />
                              <path d="M2 12l10 5 10-5" />
                            </svg>
                          </span>
                          <div className="titleModelText">
                            <div className="titleModelTitle">千问 Plus</div>
                            <div className="titleModelSub">均衡性能，性价比高</div>
                          </div>
                          {model === 'qwen-plus' ? <span className="titleModelCheck">✓</span> : null}
                        </button>
                        <button
                          type="button"
                          className="titleModelMenuItem"
                          onClick={() => {
                            setModel('qwen-turbo')
                            setIsModelMenuOpen(false)
                          }}
                        >
                          <span className="titleModelIcon">
                            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
                            </svg>
                          </span>
                          <div className="titleModelText">
                            <div className="titleModelTitle">千问 Turbo</div>
                            <div className="titleModelSub">速度最快，简单任务</div>
                          </div>
                          {model === 'qwen-turbo' ? <span className="titleModelCheck">✓</span> : null}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>

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
                    ) : (
                      <div className="msgContent">{m.content}</div>
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

              <label className="field">
                <div className="fieldLabel">默认模型</div>
                <select value={model} className="fieldInput" onChange={(e) => setModel(e.target.value as ModelType)}>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
                  <option value="qwen-plus">qwen-plus</option>
                  <option value="qwen-turbo">qwen-turbo</option>
                  <option value="qwen-max">qwen-max</option>
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

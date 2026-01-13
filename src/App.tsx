import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  createDeepSeekChatCompletion,
  DeepSeekError,
  streamDeepSeekChatCompletion,
  type ChatMessage,
  type DeepSeekModel,
} from './lib/deepseek'

function AttachIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48" />
    </svg>
  )
}

function GlobeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <circle cx="12" cy="12" r="10" />
      <path d="M2 12h20" />
      <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z" />
    </svg>
  )
}

function ImageIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <circle cx="8.5" cy="8.5" r="1.5" />
      <polyline points="21 15 16 10 5 21" />
    </svg>
  )
}

function NewsIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M4 22h16a2 2 0 0 0 2-2V4a2 2 0 0 0-2-2H8a2 2 0 0 0-2 2v16a2 2 0 0 1-2 2Zm0 0a2 2 0 0 1-2-2v-9c0-1.1.9-2 2-2h2" />
      <path d="M18 14h-8" />
      <path d="M15 18h-5" />
      <path d="M10 6h8v4h-8V6Z" />
    </svg>
  )
}

function SoundIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
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

function AiLogoIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 40 40" fill="none">
      <defs>
        <linearGradient id="aiLogoGradient" x1="0" y1="0" x2="40" y2="40">
          <stop offset="0%" stopColor="#38bdf8" />
          <stop offset="100%" stopColor="#a855f7" />
        </linearGradient>
      </defs>
      <circle cx="20" cy="20" r="18" fill="url(#aiLogoGradient)" />
      <circle cx="20" cy="20" r="16" fill="#020617" />
      <rect x="14" y="14" width="12" height="12" rx="3" fill="url(#aiLogoGradient)" />
      <text
        x="20"
        y="22.5"
        textAnchor="middle"
        fontSize="7.5"
        fontWeight="700"
        fill="#f9fafb"
      >
        AI
      </text>
    </svg>
  )
}

function AutoModeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M5 4v16M19 4v16" strokeLinecap="round" />
      <path d="M9 8h6l-1 8h-4z" />
    </svg>
  )
}

function ExpertModeIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M12 4a5 5 0 0 0-5 5v2a5 5 0 0 0 10 0V9a5 5 0 0 0-5-5Z" />
      <path d="M9 21h6" strokeLinecap="round" />
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

const STORAGE_KEY = 'soulcode.chats.v1'
const STORAGE_API_KEY = 'soulcode.deepseek.apiKey'
const STORAGE_MODEL = 'soulcode.deepseek.model'

function nowId() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`
}

function safeJsonParse<T>(value: string | null): T | null {
  if (!value) return null
  try {
    return JSON.parse(value) as T
  } catch {
    return null
  }
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
  const [apiKey, setApiKey] = useState<string>(() => localStorage.getItem(STORAGE_API_KEY) ?? '')
  const [model, setModel] = useState<DeepSeekModel>(
    () => (localStorage.getItem(STORAGE_MODEL) as DeepSeekModel | null) ?? 'deepseek-chat',
  )
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
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nextSessions))
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

    if (!apiKey) {
      setSessions((prev) => {
        const next = prev.map((s) => {
          if (s.id !== activeSessionId) return s
          const updated = {
            ...s,
            messages: s.messages.map((m): StoredChatMessage =>
              m.localId === assistantPlaceholderId
                ? makeAssistantMessage('未配置 DeepSeek API Key（左下角设置）。', assistantPlaceholderId)
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
      const useStream = true
      if (!useStream) {
        const text = await createDeepSeekChatCompletion({
          apiKey,
          model,
          messages: [...baseMessages, { role: 'user', content }],
          signal: abortRef.current.signal,
        })
        setSessions((prev) => {
          const next = prev.map((s) => {
            if (s.id !== activeSessionId) return s
            const updated = {
              ...s,
              messages: s.messages.map((m): StoredChatMessage =>
                m.localId === assistantPlaceholderId ? makeAssistantMessage(text, assistantPlaceholderId) : m,
              ),
            }
            return updated
          })
          persistSessions(next)
          return next
        })
      } else {
        let acc = ''
        for await (const delta of streamDeepSeekChatCompletion({
          apiKey,
          model,
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
        err instanceof DeepSeekError
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
    apiKey,
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

  useEffect(() => {
    const parsed = safeJsonParse<unknown>(localStorage.getItem(STORAGE_KEY))
    if (Array.isArray(parsed) && parsed.length) {
      const normalized = parsed
        .map((raw) => raw as Partial<ChatSession>)
        .filter((s) => typeof s.id === 'string' && typeof s.title === 'string' && typeof s.createdAt === 'number')
        .map((s) => {
          const rawMessages = Array.isArray(s.messages) ? (s.messages as Array<ChatMessage & { localId?: string }>) : []
          const normalizedMessages: StoredChatMessage[] = rawMessages.flatMap((m) => {
            if (!m) return []
            if (typeof m.content !== 'string') return []
            if (m.role !== 'system' && m.role !== 'user' && m.role !== 'assistant') return []
            return [
              {
                role: m.role,
                content: m.content,
                localId: typeof m.localId === 'string' ? m.localId : nowId(),
              },
            ]
          })
          return {
            id: s.id as string,
            title: s.title as string,
            createdAt: s.createdAt as number,
            messages: normalizedMessages,
          } satisfies ChatSession
        })

      if (normalized.length) {
        setSessions(normalized)
        setActiveSessionId(normalized[0].id)
        return
      }
    }

    const id = nowId()
    const session: ChatSession = { id, title: '新对话', createdAt: Date.now(), messages: [] }
    setSessions([session])
    setActiveSessionId(id)
    persistSessions([session])
  }, [persistSessions])

  useEffect(() => {
    localStorage.setItem(STORAGE_API_KEY, apiKey)
  }, [apiKey])

  useEffect(() => {
    localStorage.setItem(STORAGE_MODEL, model)
  }, [model])

  useEffect(() => {
    queueMicrotask(scrollToBottom)
  }, [messages.length, scrollToBottom])

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
            <AiLogoIcon size={32} />
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
                  <img src="/ChatGPT%20Image.png" alt="Hush AI" className="landingHeroImage" />
                  <div className="landingName">Hush</div>
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
                      <div className="modelSelectorWrapper">
                        <button
                          type="button"
                          className="modelSelector"
                          onClick={() => setIsModelMenuOpen((v) => !v)}
                        >
                          <span className="modelName">
                            {model === 'deepseek-chat' ? 'deepseek-chat' : 'deepseek-reasoner'}
                          </span>
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                            <path d="M6 9l6 6 6-6" />
                          </svg>
                        </button>
                        {isModelMenuOpen ? (
                          <div className="modelMenu">
                            <button
                              type="button"
                              className={`modelMenuItem ${model === 'deepseek-chat' ? 'modelMenuItemActive' : ''}`}
                              onClick={() => {
                                setModel('deepseek-chat')
                                setIsModelMenuOpen(false)
                              }}
                            >
                              <div className="modelMenuMain">
                                <span className="modelMenuIcon">
                                  <AutoModeIcon />
                                </span>
                                <div className="modelMenuText">
                                  <div className="modelMenuTitle">deepseek-chat</div>
                                  <div className="modelMenuSub">通用对话模型</div>
                                </div>
                              </div>
                              {model === 'deepseek-chat' ? <span className="modelMenuCheck">✓</span> : null}
                            </button>
                            <button
                              type="button"
                              className={`modelMenuItem ${model === 'deepseek-reasoner' ? 'modelMenuItemActive' : ''}`}
                              onClick={() => {
                                setModel('deepseek-reasoner')
                                setIsModelMenuOpen(false)
                              }}
                            >
                              <div className="modelMenuMain">
                                <span className="modelMenuIcon">
                                  <ExpertModeIcon />
                                </span>
                                <div className="modelMenuText">
                                  <div className="modelMenuTitle">deepseek-reasoner</div>
                                  <div className="modelMenuSub">强化推理能力</div>
                                </div>
                              </div>
                              {model === 'deepseek-reasoner' ? <span className="modelMenuCheck">✓</span> : null}
                            </button>
                          <div className="modelMenuDivider" />
                          <div className="modelMenuSuper">
                          <div className="modelMenuSuperText">
                            <div className="modelMenuSuperTitle">SuperHush</div>
                              <div className="modelMenuSuperSub">解锁扩展能力</div>
                            </div>
                            <button type="button" className="modelMenuSuperBtn">
                              升级
                            </button>
                          </div>
                          <div className="modelMenuDivider" />
                          <div className="modelMenuCustom">
                            <div className="modelMenuCustomText">
                              <div className="modelMenuTitle">自定义指令</div>
                              <div className="modelMenuSub">未设置</div>
                            </div>
                            <button type="button" className="modelMenuCustomBtn">
                              自定义
                            </button>
                          </div>
                        </div>
                      ) : null}
                      </div>
                      <button className="landingMic" type="button" aria-label="语音输入">
                        <MicIcon />
                      </button>
                    </div>
                  </form>
                </div>

                <div className="featureRow">
                  <button className="featurePill" onClick={() => setDraft('搜索 DeepSearch')}>
                    <GlobeIcon />
                    <span>DeepSearch</span>
                  </button>
                  <button className="featurePill" onClick={() => setDraft('生成图片')}>
                    <ImageIcon />
                    <span>Create Image</span>
                  </button>
                  <button className="featurePill" onClick={() => setDraft('今天的新闻')}>
                    <NewsIcon />
                    <span>新闻播报员</span>
                  </button>
                  <button className="featurePill" onClick={() => setDraft('语音模式')}>
                    <SoundIcon />
                    <span>声音</span>
                  </button>
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
              <label className="field">
                <div className="fieldLabel">DeepSeek API Key</div>
                <input
                  value={apiKey}
                  className="fieldInput"
                  type="password"
                  placeholder="sk-..."
                  onChange={(e) => setApiKey(e.target.value)}
                />
              </label>

              <label className="field">
                <div className="fieldLabel">默认模型</div>
                <select value={model} className="fieldInput" onChange={(e) => setModel(e.target.value as DeepSeekModel)}>
                  <option value="deepseek-chat">deepseek-chat</option>
                  <option value="deepseek-reasoner">deepseek-reasoner</option>
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

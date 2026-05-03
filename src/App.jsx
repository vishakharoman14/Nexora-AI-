import { useState, useRef, useEffect } from "react";
import { URL, GROQ_API_KEY } from './constants';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism';

const CodeBlock = ({ language, children }) => {
  const [copied, setCopied] = useState(false);
  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div style={{ marginBottom: '1rem', borderRadius: '10px', overflow: 'hidden', border: '1px solid #333' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#1e1e1e', padding: '6px 14px' }}>
        <span style={{ fontSize: '12px', color: '#888' }}>{language || 'code'}</span>
        <button onClick={handleCopy} style={{ fontSize: '12px', color: copied ? '#4ade80' : '#aaa', background: 'transparent', border: '1px solid #444', borderRadius: '4px', padding: '2px 10px', cursor: 'pointer' }}>
          {copied ? '✓ Copied!' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter style={oneDark} language={language} PreTag="div" customStyle={{ margin: 0, borderRadius: 0, fontSize: '13px' }}>
        {children}
      </SyntaxHighlighter>
    </div>
  );
};

const MarkdownContent = ({ content }) => (
  <ReactMarkdown components={{
    code({ node, inline, className, children, ...props }) {
      const match = /language-(\w+)/.exec(className || '');
      return !inline && match ? (
        <CodeBlock language={match[1]}>{String(children).replace(/\n$/, '')}</CodeBlock>
      ) : (
        <code style={{ background: '#2a2a2a', padding: '2px 6px', borderRadius: '4px', fontSize: '13px', color: '#e2e2e2' }} {...props}>{children}</code>
      );
    },
    ol({ children }) { return <ol style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem' }}>{children}</ol>; },
    ul({ children }) { return <ul style={{ paddingLeft: '1.5rem', marginBottom: '0.75rem', listStyleType: 'disc' }}>{children}</ul>; },
    li({ children }) { return <li style={{ marginBottom: '5px', lineHeight: '1.7' }}>{children}</li>; },
    strong({ children }) { return <strong style={{ color: '#fff', fontWeight: '600' }}>{children}</strong>; },
    h1({ children }) { return <h1 style={{ fontSize: '1.4rem', fontWeight: '600', margin: '1rem 0 0.5rem' }}>{children}</h1>; },
    h2({ children }) { return <h2 style={{ fontSize: '1.2rem', fontWeight: '600', margin: '1rem 0 0.5rem' }}>{children}</h2>; },
    h3({ children }) { return <h3 style={{ fontSize: '1.05rem', fontWeight: '600', margin: '0.75rem 0 0.4rem' }}>{children}</h3>; },
    p({ children }) { return <p style={{ marginBottom: '0.6rem', lineHeight: '1.75' }}>{children}</p>; },
  }}>
    {content}
  </ReactMarkdown>
);

let chatIdCounter = 1;

export default function App() {
  const [chats, setChats] = useState([{ id: 1, title: 'New Chat', messages: [] }]);
  const [activeChatId, setActiveChatId] = useState(1);
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);
  const bottomRef = useRef(null);
  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth <= 768;
      setIsMobile(mobile);
      if (!mobile) setSidebarOpen(true); 
      if (mobile) setSidebarOpen(false); 
    };
    window.addEventListener('resize', handleResize);
    if (window.innerWidth <= 768) setSidebarOpen(false);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, loading, activeChatId]);

  const selectChat = (id) => {
    setActiveChatId(id);
    if (isMobile) setSidebarOpen(false);
  };

  const newChat = () => {
    chatIdCounter += 1;
    const newC = { id: chatIdCounter, title: 'New Chat', messages: [] };
    setChats(prev => [newC, ...prev]);
    setActiveChatId(chatIdCounter);
    if (isMobile) setSidebarOpen(false);
  };

  const deleteChat = (e, chatId) => {
    e.stopPropagation();
    const remaining = chats.filter(c => c.id !== chatId);
    if (remaining.length === 0) {
      chatIdCounter += 1;
      const fresh = { id: chatIdCounter, title: 'New Chat', messages: [] };
      setChats([fresh]);
      setActiveChatId(fresh.id);
    } else {
      setChats(remaining);
      if (activeChatId === chatId) setActiveChatId(remaining[0].id);
    }
  };

  const askQuestion = async () => {
    if (!question.trim() || loading) return;
    const userMessage = { role: 'user', content: question };
    const currentQuestion = question;
    setQuestion('');
    setLoading(true);

    setChats(prev => prev.map(c => {
      if (c.id !== activeChatId) return c;
      return {
        ...c,
        title: c.messages.length === 0
          ? currentQuestion.slice(0, 28) + (currentQuestion.length > 28 ? '...' : '')
          : c.title,
        messages: [...c.messages, userMessage]
      };
    }));

    const updatedMessages = [...activeChat.messages, userMessage];
    const payload = {
      model: 'llama-3.3-70b-versatile',
      messages: [
        { role: 'system', content: 'Always format responses clearly. Use numbered lists when listing items. Use bullet points for sub-items. Use markdown for code blocks.' },
        ...updatedMessages
      ]
    };

    let response = await fetch(URL, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${GROQ_API_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });
    response = await response.json();
    const aiMessage = { role: 'assistant', content: response.choices[0].message.content };
    setChats(prev => prev.map(c =>
      c.id === activeChatId ? { ...c, messages: [...c.messages, aiMessage] } : c
    ));
    setLoading(false);
  };

  return (
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f', color: '#e5e5e5', fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', overflow: 'hidden' }}>

      {sidebarOpen && isMobile && (
        <div onClick={() => setSidebarOpen(false)} style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)',
          zIndex: 10, backdropFilter: 'blur(2px)'
        }} />
      )}
      <div style={{
        width: '260px',
        minWidth: '260px',
        background: '#171717',
        display: 'flex',
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0, left: 0,
        height: '100vh',
        transform: sidebarOpen ? 'translateX(0)' : 'translateX(-260px)',
        transition: 'transform 0.25s ease',
        zIndex: isMobile ? 20 : 1,
        flexShrink: 0
      }}>

        <div style={{ padding: '12px 12px 8px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <img src="/nexora-logo.png" alt="Nexora AI" style={{ width: '32px', height: '32px', borderRadius: '50%', objectFit: 'cover' }} />
            <span style={{ fontSize: '16px', fontWeight: '600', color: '#fff' }}>Nexora AI</span>
          </div>
          <button onClick={() => setSidebarOpen(false)} style={{
            background: 'transparent', border: 'none', color: '#666',
            cursor: 'pointer', padding: '6px', borderRadius: '6px',
            display: 'flex', alignItems: 'center', justifyContent: 'center'
          }} title="Close sidebar">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="3" width="18" height="18" rx="2"/>
              <line x1="9" y1="3" x2="9" y2="21"/>
            </svg>
          </button>
        </div>

        <div style={{ padding: '4px 12px 8px' }}>
          <button onClick={newChat} style={{
            width: '100%', padding: '9px 12px', background: 'transparent',
            border: 'none', borderRadius: '8px', color: '#ececec',
            fontSize: '14px', cursor: 'pointer', display: 'flex',
            alignItems: 'center', gap: '10px', fontWeight: '400',
            transition: 'background 0.15s'
          }}
          onMouseEnter={e => e.currentTarget.style.background = '#2a2a2a'}
          onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
            </svg>
            New chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          <p style={{ fontSize: '11px', color: '#555', padding: '8px 8px 4px', fontWeight: '500' }}>Today</p>
          {chats.map(chat => (
            <div key={chat.id}
              style={{ position: 'relative', marginBottom: '1px', borderRadius: '8px', background: chat.id === activeChatId ? '#2a2a2a' : 'transparent' }}
              onMouseEnter={e => {
                if (chat.id !== activeChatId) e.currentTarget.style.background = '#1f1f1f';
                e.currentTarget.querySelector('.del-btn').style.opacity = '1';
              }}
              onMouseLeave={e => {
                if (chat.id !== activeChatId) e.currentTarget.style.background = 'transparent';
                e.currentTarget.querySelector('.del-btn').style.opacity = '0';
              }}
            >
              <button onClick={() => selectChat(chat.id)} style={{
                width: '100%', padding: '9px 32px 9px 12px',
                background: 'transparent', border: 'none',
                color: chat.id === activeChatId ? '#fff' : '#b0b0b0',
                fontSize: '13.5px', cursor: 'pointer', textAlign: 'left',
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block',
                borderRadius: '8px'
              }}>
                {chat.title}
              </button>
              <button className="del-btn" onClick={(e) => deleteChat(e, chat.id)} style={{
                position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)',
                background: 'transparent', border: 'none', color: '#666',
                cursor: 'pointer', fontSize: '13px', opacity: '0',
                transition: 'opacity 0.15s, color 0.15s', padding: '4px 6px',
                borderRadius: '4px', lineHeight: 1
              }}
              onMouseEnter={e => e.currentTarget.style.color = '#ff5555'}
              onMouseLeave={e => e.currentTarget.style.color = '#666'}
              title="Delete chat">🗑</button>
            </div>
          ))}
        </div>

        <div style={{ padding: '12px', borderTop: '1px solid #2a2a2a' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', padding: '8px', borderRadius: '8px' }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'linear-gradient(135deg, #6366f1, #a855f7)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '13px', fontWeight: '600', color: '#fff', flexShrink: 0 }}>
              N
            </div>
            <div>
              <p style={{ margin: 0, fontSize: '13px', color: '#fff', fontWeight: '500' }}>Nexora AI</p>
              <p style={{ margin: 0, fontSize: '11px', color: '#555' }}>Free plan</p>
            </div>
          </div>
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

        <div style={{ padding: '10px 16px', display: 'flex', alignItems: 'center', gap: '10px', background: '#0f0f0f' }}>
          {!sidebarOpen && (
            <button onClick={() => setSidebarOpen(true)} style={{
              background: 'transparent', border: 'none', color: '#666',
              cursor: 'pointer', padding: '6px', borderRadius: '6px',
              display: 'flex', alignItems: 'center'
            }} title="Open sidebar">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <line x1="9" y1="3" x2="9" y2="21"/>
              </svg>
            </button>
          )}
          <span style={{ fontSize: '15px', color: '#888', fontWeight: '500' }}>
            {activeChat?.title === 'New Chat' ? 'Nexora AI' : activeChat?.title}
          </span>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '24px 0' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>

            {activeChat.messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '12vh', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/nexora-logo.png" alt="Nexora AI" style={{ width: '80px', height: '80px', borderRadius: '50%', marginBottom: '16px', objectFit: 'cover', border: '2px solid #6366f1' }} />
                <h2 style={{ fontSize: '26px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>How can I help you?</h2>
                <p style={{ color: '#555', fontSize: '14px' }}>Powered by Groq · Llama 3.3 70B</p>
              </div>
            )}

            {activeChat.messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '24px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <img src="/nexora-logo.png" alt="Nexora AI" style={{ width: '32px', height: '32px', borderRadius: '50%', marginRight: '10px', flexShrink: 0, marginTop: '2px', objectFit: 'cover', border: '1px solid #6366f1' }} />
                )}
                <div style={{
                  maxWidth: msg.role === 'user' ? '75%' : 'calc(100% - 42px)',
                  background: msg.role === 'user' ? '#1e1e1e' : 'transparent',
                  border: msg.role === 'user' ? '1px solid #2e2e2e' : 'none',
                  borderRadius: '14px',
                  padding: msg.role === 'user' ? '10px 16px' : '0',
                  fontSize: '14px', lineHeight: '1.75', color: '#e5e5e5'
                }}>
                  {msg.role === 'user' ? msg.content : <MarkdownContent content={msg.content} />}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <img src="/nexora-logo.png" alt="Nexora AI" style={{ width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0, objectFit: 'cover', border: '1px solid #6366f1' }} />
                <span style={{ color: '#a78bfa', fontSize: '14px' }}>Thinking...</span>
              </div>
            )}
            <div ref={bottomRef} />
          </div>
        </div>

        <div style={{ padding: '12px 24px 20px' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '14px', padding: '10px 10px 10px 18px' }}>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: '14px', lineHeight: '1.5' }}
              type="text"
              placeholder="Ask me anything..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askQuestion()}
            />
            <button onClick={askQuestion} disabled={loading || !question.trim()} style={{
              background: question.trim() ? 'linear-gradient(135deg, #6366f1, #a855f7)' : '#252525',
              border: 'none', borderRadius: '10px', color: '#fff', padding: '8px 18px',
              fontSize: '13px', fontWeight: '500',
              cursor: question.trim() ? 'pointer' : 'default',
              transition: 'all 0.2s', flexShrink: 0
            }}>
              {loading ? '...' : 'Ask'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', marginTop: '8px' }}>
            Developed for Learning purpose by Vishakha Roman.
          </p>
        </div>
      </div>
    </div>
  );
}
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
  const bottomRef = useRef(null);

  const activeChat = chats.find(c => c.id === activeChatId);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chats, loading, activeChatId]);

  const newChat = () => {
    chatIdCounter += 1;
    const newC = { id: chatIdCounter, title: 'New Chat', messages: [] };
    setChats(prev => [newC, ...prev]);
    setActiveChatId(chatIdCounter);
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
        title: c.messages.length === 0 ? currentQuestion.slice(0, 30) + (currentQuestion.length > 30 ? '...' : '') : c.title,
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
    <div style={{ display: 'flex', height: '100vh', background: '#0f0f0f', color: '#e5e5e5', fontFamily: 'system-ui, sans-serif' }}>

      <div style={{ width: '260px', minWidth: '260px', background: '#171717', display: 'flex', flexDirection: 'column', borderRight: '1px solid #2a2a2a' }}>

      <div style={{ padding: '20px 16px 12px', borderBottom: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', gap: '10px' }}>
        <img src="/nexora-logo.png" alt="Nexora AI" style={{ width: '38px', height: '38px', borderRadius: '50%', objectFit: 'cover', border: '1px solid #6366f1'}} />
        <h1 style={{ fontSize: '18px', fontWeight: '700', color: '#fff', margin: 0, letterSpacing: '-0.3px' }}>
          Nexora AI
        </h1>
      </div>

        <div style={{ padding: '12px' }}>
          <button onClick={newChat} style={{
            width: '100%', padding: '9px 14px', background: '#252525', border: '1px solid #333',
            borderRadius: '8px', color: '#e5e5e5', fontSize: '13px', cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: '8px', fontWeight: '500'
          }}>
            <span style={{ fontSize: '16px' }}>+</span> New Chat
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '0 8px' }}>
          <p style={{ fontSize: '11px', color: '#555', padding: '4px 8px 6px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Today</p>
         

    {chats.map(chat => (
      <div
        key={chat.id}
        style={{ position: 'relative', marginBottom: '2px' }}
        onMouseEnter={e => e.currentTarget.querySelector('.del-btn').style.opacity = '1'}
        onMouseLeave={e => e.currentTarget.querySelector('.del-btn').style.opacity = '0'}
      >
        <button onClick={() => setActiveChatId(chat.id)} style={{
          width: '100%', padding: '9px 36px 9px 12px', background: chat.id === activeChatId ? '#2a2a2a' : 'transparent',
          border: 'none', borderRadius: '7px', color: chat.id === activeChatId ? '#fff' : '#999',
          fontSize: '13px', cursor: 'pointer', textAlign: 'left',
          whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', display: 'block'
        }}>
          {chat.title}
        </button>
        <button
          className="del-btn"
          onClick={(e) => {
            e.stopPropagation();
            const remaining = chats.filter(c => c.id !== chat.id);
            if (remaining.length === 0) {

              chatIdCounter += 1;
              const fresh = { id: chatIdCounter, title: 'New Chat', messages: [] };
              setChats([fresh]);
              setActiveChatId(fresh.id);
            } else {
              setChats(remaining);
              if (activeChatId === chat.id) setActiveChatId(remaining[0].id);
            }
          }}
          style={{
            position: 'absolute', right: '6px', top: '50%', transform: 'translateY(-50%)',
            background: 'transparent', border: 'none', color: '#ff5555', cursor: 'pointer',
            fontSize: '14px', opacity: '0', transition: 'opacity 0.15s', padding: '4px 6px',
            borderRadius: '4px', lineHeight: 1
          }}
          title="Delete chat"
        >
          🗑
            </button>
          </div>
        ))}
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

        {/* Messages */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '32px 0' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', padding: '0 24px' }}>

            {activeChat.messages.length === 0 && (
              <div style={{ textAlign: 'center', marginTop: '15vh', width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <img src="/nexora-logo.png" alt="Nexora AI" style={{ 
                  width: '100px', height: '100px', borderRadius: '50%', 
                  marginBottom: '20px', border: '2px solid #6366f1',
                  objectFit: 'cover'
                }} />
                <h2 style={{ fontSize: '28px', fontWeight: '600', color: '#fff', marginBottom: '8px' }}>Nexora AI</h2>
                <p style={{ color: '#555', fontSize: '15px' }}>Ask me anything. I'm here to help.</p>
              </div>
            )}

            {activeChat.messages.map((msg, i) => (
              <div key={i} style={{ marginBottom: '24px', display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}>
                {msg.role === 'assistant' && (
                  <img
                    src="/nexora-logo.png"
                    alt="Nexora AI"
                    style={{ 
                      width: '36px', height: '36px', borderRadius: '50%', 
                      marginRight: '10px', flexShrink: 0, marginTop: '2px',
                      objectFit: 'cover', border: '1px solid #6366f1'
                    }}
                  />
                )}
                <div style={{
                  maxWidth: msg.role === 'user' ? '75%' : '100%',
                  background: msg.role === 'user' ? '#1e1e1e' : 'transparent',
                  border: msg.role === 'user' ? '1px solid #2e2e2e' : 'none',
                  borderRadius: '14px', padding: msg.role === 'user' ? '10px 16px' : '0',
                  fontSize: '14px', lineHeight: '1.75', color: '#e5e5e5'
                }}>
                  {msg.role === 'user' ? msg.content : <MarkdownContent content={msg.content} />}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '24px' }}>
                <img
                  src="/nexora-logo.png"
                  alt="Nexora AI"
                  style={{ 
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    objectFit: 'cover', border: '1px solid #6366f1'
                  }}
                />
                <span style={{ color: '#a78bfa', fontSize: '14px' }}>Thinking...</span>
              </div>
            )}

            <div ref={bottomRef} />
          </div>
        </div>

        <div style={{ padding: '16px 24px 24px', borderTop: '1px solid #1e1e1e' }}>
          <div style={{ maxWidth: '720px', margin: '0 auto', display: 'flex', gap: '10px', alignItems: 'center', background: '#1a1a1a', border: '1px solid #2e2e2e', borderRadius: '12px', padding: '8px 8px 8px 16px' }}>
            <input
              style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#e5e5e5', fontSize: '14px', lineHeight: '1.5' }}
              type="text"
              placeholder="Ask me anything..."
              value={question}
              onChange={e => setQuestion(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && askQuestion()}
            />
            <button onClick={askQuestion} disabled={loading || !question.trim()} style={{
              background: question.trim() ? '#6366f1' : '#252525',
              border: 'none', borderRadius: '8px', color: '#fff', padding: '8px 16px',
              fontSize: '13px', fontWeight: '500', cursor: question.trim() ? 'pointer' : 'default',
              transition: 'background 0.2s'
            }}>
              {loading ? '...' : 'Ask'}
            </button>
          </div>
          <p style={{ textAlign: 'center', fontSize: '11px', color: '#444', marginTop: '10px' }}>Powered by Groq · Llama 3.3 70B</p>
        </div>

      </div>
    </div>
  );
}
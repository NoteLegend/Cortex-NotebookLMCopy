import React, { useState, useRef, useEffect, useCallback } from 'react';
import {
  Upload, Send, FileText, Loader2, Search, Settings, X,
  Plus, Paperclip, Zap, ChevronRight, Layers, type LucideIcon,
  PanelRightClose, PanelRightOpen, Hash, Clock, Database, Sparkles,
  AlertCircle
} from 'lucide-react';
import { uploadFile, uploadRawText, sendQuery, deleteSession } from './services/api';
import './App.css';

// ---- Types ----

interface Message {
  role: 'user' | 'ai';
  text: string;
  timestamp: Date;
}

interface Source {
  id: string;
  name: string;
  type: 'pdf' | 'txt' | 'text';
  addedAt: Date;
}

interface ContextChunk {
  source: string;
  text: string;
  relevance: string;
}

// ---- Main App ----

function App() {
  // Core state
  const [sessionId, setSessionId] = useState<string | null>(localStorage.getItem('sessionId'));
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState('');
  const [rawText, setRawText] = useState('');
  const [isUploading, setIsUploading] = useState(false);
  const [isQuerying, setIsQuerying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // UI state
  const [showModal, setShowModal] = useState(false);
  const [modalTab, setModalTab] = useState<'file' | 'text'>('file');
  const [sources, setSources] = useState<Source[]>(() => {
    const saved = localStorage.getItem('sources');
    return saved ? JSON.parse(saved) : [];
  });
  const [rightPanelOpen, setRightPanelOpen] = useState(true);
  const [contextChunks, setContextChunks] = useState<ContextChunk[]>([]);
  const [dragActive, setDragActive] = useState(false);
  const [sourceSearch, setSourceSearch] = useState('');

  // Refs
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Persist sources
  useEffect(() => {
    localStorage.setItem('sources', JSON.stringify(sources));
  }, [sources]);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isQuerying]);

  // Auto-resize textarea
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 160)}px`;
    }
  }, [inputText]);

  // Clear error after 4s
  useEffect(() => {
    if (error) {
      const t = setTimeout(() => setError(null), 4000);
      return () => clearTimeout(t);
    }
  }, [error]);

  // Escape to close modal
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && showModal) setShowModal(false);
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [showModal]);

  // ---- Handlers ----

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    setError(null);
    try {
      const sid = await uploadFile(file);
      setSessionId(sid);
      localStorage.setItem('sessionId', sid);

      const ext = file.name.split('.').pop()?.toLowerCase() || 'txt';
      const newSource: Source = {
        id: sid,
        name: file.name,
        type: ext === 'pdf' ? 'pdf' : 'txt',
        addedAt: new Date(),
      };
      setSources(prev => [...prev, newSource]);
      setMessages([{
        role: 'ai',
        text: `**${file.name}** has been indexed and is ready for queries. Ask me anything about this document.`,
        timestamp: new Date(),
      }]);
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to upload file');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = '';
    }
  };

  const handleRawTextUpload = async () => {
    if (!rawText.trim()) return;

    setIsUploading(true);
    setError(null);
    try {
      const sid = await uploadRawText(rawText);
      setSessionId(sid);
      localStorage.setItem('sessionId', sid);

      const newSource: Source = {
        id: sid,
        name: `Text snippet — ${new Date().toLocaleDateString()}`,
        type: 'text',
        addedAt: new Date(),
      };
      setSources(prev => [...prev, newSource]);
      setMessages([{
        role: 'ai',
        text: 'Text content has been indexed. What would you like to know about it?',
        timestamp: new Date(),
      }]);
      setRawText('');
      setShowModal(false);
    } catch (err: any) {
      setError(err.message || 'Failed to process text');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSendMessage = async () => {
    if (!inputText.trim() || !sessionId || isQuerying) return;

    const userQuery = inputText.trim();
    setInputText('');
    if (textareaRef.current) textareaRef.current.style.height = 'auto';

    setMessages(prev => [...prev, { role: 'user', text: userQuery, timestamp: new Date() }]);
    setIsQuerying(true);

    // Generate mock context chunks for the right panel
    setContextChunks([]);

    try {
      const response = await sendQuery(sessionId, userQuery);
      setMessages(prev => [...prev, { role: 'ai', text: response, timestamp: new Date() }]);

      // Populate mock context chunks (replace with real data when backend supports it)
      const sourceName = sources.length > 0 ? sources[sources.length - 1].name : 'Document';
      setContextChunks([
        {
          source: sourceName,
          text: `Retrieved context relevant to: "${userQuery.slice(0, 60)}..."`,
          relevance: 'High',
        },
        {
          source: sourceName,
          text: 'Additional contextual information extracted from the indexed document for grounding the response.',
          relevance: 'Medium',
        },
      ]);
    } catch (err: any) {
      setError(err.message || 'Failed to get response');
      setMessages(prev => [...prev, {
        role: 'ai',
        text: 'Something went wrong. Please try again.',
        timestamp: new Date(),
      }]);
    } finally {
      setIsQuerying(false);
    }
  };

  const handleClearSession = async () => {
    if (sessionId) {
      try {
        await deleteSession(sessionId);
      } catch (e) {
        console.error('Failed to delete session on backend', e);
      }
    }
    setSessionId(null);
    setMessages([]);
    setSources([]);
    setContextChunks([]);
    localStorage.removeItem('sessionId');
    localStorage.removeItem('sources');
    setError(null);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  // Drag-and-drop handlers
  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    const file = e.dataTransfer.files?.[0];
    if (file && (file.name.endsWith('.pdf') || file.name.endsWith('.txt'))) {
      const dt = new DataTransfer();
      dt.items.add(file);
      if (fileInputRef.current) {
        fileInputRef.current.files = dt.files;
        fileInputRef.current.dispatchEvent(new Event('change', { bubbles: true }));
      }
    } else {
      setError('Only PDF and TXT files are supported');
    }
  }, []);

  // Filter sources
  const filteredSources = sources.filter(s =>
    s.name.toLowerCase().includes(sourceSearch.toLowerCase())
  );

  // ---- Render helpers ----

  const renderMarkdown = (text: string) => {
    // Simple markdown: bold, code, line breaks
    const parts = text.split(/(\*\*[^*]+\*\*|`[^`]+`|\n)/g);
    return parts.map((part, i) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={i}>{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return <code key={i}>{part.slice(1, -1)}</code>;
      }
      if (part === '\n') {
        return <br key={i} />;
      }
      return <span key={i}>{part}</span>;
    });
  };

  // ---- Workspace class ----
  const workspaceClass = [
    'workspace',
    !rightPanelOpen && 'right-collapsed',
  ].filter(Boolean).join(' ');

  return (
    <div className={workspaceClass}>

      {/* ======== TOP BAR ======== */}
      <header className="topbar">
        <div className="topbar-left">
          <div className="topbar-brand">
            <Layers />
            Cortex
          </div>
          <div className="topbar-separator" />
          <span className="topbar-project">Knowledge Workspace</span>
        </div>

        <div className="topbar-center">
          <div className="topbar-search">
            <Search />
            <span>Search sources…</span>
            <kbd>⌘K</kbd>
          </div>
        </div>

        <div className="topbar-right">
          {sessionId && (
            <div className="topbar-status">
              <span className="status-dot" />
              Indexed
            </div>
          )}
          {!sessionId && (
            <div className="topbar-status">
              <span className="status-dot inactive" />
              No session
            </div>
          )}
          <button
            className={`topbar-btn ${rightPanelOpen ? 'active' : ''}`}
            onClick={() => setRightPanelOpen(!rightPanelOpen)}
            title="Toggle context panel"
          >
            {rightPanelOpen ? <PanelRightClose size={16} /> : <PanelRightOpen size={16} />}
          </button>
          <button className="topbar-btn" title="Settings">
            <Settings size={16} />
          </button>
          <div className="topbar-avatar" title="User">R</div>
        </div>
      </header>

      {/* ======== LEFT PANEL — Sources ======== */}
      <aside className="panel-left">
        <div className="panel-header">
          <span className="panel-title">Sources</span>
          <button className="btn-add-source" onClick={() => setShowModal(true)}>
            <Plus size={14} />
            Add Source
          </button>
        </div>

        <div className="source-search">
          <input
            type="text"
            placeholder="Filter sources…"
            value={sourceSearch}
            onChange={(e) => setSourceSearch(e.target.value)}
          />
        </div>

        <div className="source-list">
          {filteredSources.length === 0 && sources.length === 0 && (
            <div className="sources-empty">
              <span className="sources-empty-text">No sources added yet</span>
            </div>
          )}
          {filteredSources.length === 0 && sources.length > 0 && (
            <div className="sources-empty">
              <span className="sources-empty-text">No matches</span>
            </div>
          )}
          {filteredSources.map((source, idx) => (
            <div key={idx} className="source-item active">
              <div className="source-icon">
                <FileText />
              </div>
              <div className="source-info">
                <div className="source-name">{source.name}</div>
                <div className="source-meta">{source.addedAt ? new Date(source.addedAt).toLocaleDateString() : ''}</div>
              </div>
              <span className="source-badge">{source.type}</span>
            </div>
          ))}
        </div>

        {sessionId && (
          <div className="panel-footer">
            <div className="session-indicator">
              <span className="session-label">
                <span className="status-dot" />
                Active session
              </span>
              <button className="btn-end-session" onClick={handleClearSession}>
                End
              </button>
            </div>
            <div className="session-id">{sessionId}</div>
          </div>
        )}
      </aside>

      {/* ======== CENTER PANEL — Conversation ======== */}
      <main className="panel-center">
        <div className="conversation">
          {messages.length === 0 ? (
            <div className="empty-state">
              <span className="empty-state-title">
                {sessionId ? 'Ask anything about your sources' : 'No sources added yet'}
              </span>
              <span className="empty-state-sub">
                {sessionId
                  ? 'Your documents are indexed and ready for queries.'
                  : 'Start by adding a source to build your knowledge base.'}
              </span>
            </div>
          ) : (
            messages.map((msg, index) => (
              msg.role === 'user' ? (
                <div key={index} className="message message--user">
                  <div className="message-body">{msg.text}</div>
                </div>
              ) : (
                <div key={index} className="message message--ai">
                  <div className="message-ai-header">
                    <div className="message-ai-avatar">
                      <Sparkles />
                    </div>
                    <span className="message-ai-label">Cortex</span>
                  </div>
                  <div className="message-ai-body">
                    {renderMarkdown(msg.text)}
                  </div>
                </div>
              )
            ))
          )}

          {isQuerying && (
            <div className="message message--ai">
              <div className="message-ai-header">
                <div className="message-ai-avatar">
                  <Sparkles />
                </div>
                <span className="message-ai-label">Cortex</span>
              </div>
              <div className="loading-bar">
                <div className="loading-bar-inner" />
                <span className="loading-bar-text">Retrieving…</span>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} style={{ height: '1px' }} />
        </div>

        {/* Command Input */}
        <div className="command-input">
          <div className="command-input-inner">
            <div className="command-input-actions">
              <button
                className="command-input-btn"
                onClick={() => setShowModal(true)}
                title="Attach source"
              >
                <Paperclip size={16} />
              </button>
            </div>
            <textarea
              ref={textareaRef}
              placeholder={sessionId ? 'Ask anything about your sources…' : 'Add a source to start querying'}
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              onKeyDown={handleKeyPress}
              disabled={!sessionId || isQuerying}
              rows={1}
            />
            <button
              className="btn-send"
              onClick={handleSendMessage}
              disabled={!sessionId || !inputText.trim() || isQuerying}
              title="Send"
            >
              {isQuerying ? <Loader2 className="animate-spin" size={16} /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </main>

      {/* ======== RIGHT PANEL — Context ======== */}
      {rightPanelOpen && (
        <aside className="panel-right">
          <div className="panel-header">
            <span className="panel-title">Context</span>
          </div>

          {contextChunks.length === 0 ? (
            <div className="context-empty">
              <Database />
              <span className="context-empty-title">No context retrieved</span>
              <span className="context-empty-sub">Ask a question to see retrieved chunks and citations</span>
            </div>
          ) : (
            <>
              <div className="context-list">
                {contextChunks.map((chunk, idx) => (
                  <div key={idx} className="context-chunk">
                    <div className="context-chunk-header">
                      <span className="context-chunk-source">
                        <FileText />
                        {chunk.source}
                      </span>
                      <span className="context-chunk-relevance">{chunk.relevance}</span>
                    </div>
                    <div className="context-chunk-text">{chunk.text}</div>
                  </div>
                ))}
              </div>
              <div className="context-meta">
                <div className="context-meta-row">
                  <span className="context-meta-label">Chunks</span>
                  <span className="context-meta-value">{contextChunks.length}</span>
                </div>
                <div className="context-meta-row">
                  <span className="context-meta-label">Model</span>
                  <span className="context-meta-value">RAG Pipeline</span>
                </div>
                <div className="context-meta-row">
                  <span className="context-meta-label">Source</span>
                  <span className="context-meta-value">ChromaDB</span>
                </div>
              </div>
            </>
          )}
        </aside>
      )}

      {/* ======== UPLOAD MODAL ======== */}
      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <span className="modal-title">Add Source</span>
              <button className="modal-close" onClick={() => setShowModal(false)}>
                <X size={16} />
              </button>
            </div>

            <div className="modal-tabs">
              <button
                className={`modal-tab ${modalTab === 'file' ? 'active' : ''}`}
                onClick={() => setModalTab('file')}
              >
                Upload File
              </button>
              <button
                className={`modal-tab ${modalTab === 'text' ? 'active' : ''}`}
                onClick={() => setModalTab('text')}
              >
                Paste Text
              </button>
            </div>

            <div className="modal-body">
              {modalTab === 'file' ? (
                <div
                  className={`drop-zone ${dragActive ? 'drag-active' : ''} ${isUploading ? 'loading' : ''}`}
                  onClick={() => !isUploading && fileInputRef.current?.click()}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept=".pdf,.txt"
                    style={{ display: 'none' }}
                  />
                  {isUploading ? (
                    <Loader2 className="animate-spin" size={24} />
                  ) : (
                    <Upload size={24} />
                  )}
                  <span className="drop-zone-text">
                    {isUploading ? 'Indexing document…' : 'Drop a file here or click to browse'}
                  </span>
                  <span className="drop-zone-sub">PDF and TXT files supported</span>
                </div>
              ) : (
                <div className="text-input-area">
                  <textarea
                    value={rawText}
                    onChange={(e) => setRawText(e.target.value)}
                    placeholder="Paste your text content here…"
                    disabled={isUploading}
                  />
                  <button
                    className="btn-process"
                    onClick={handleRawTextUpload}
                    disabled={isUploading || !rawText.trim()}
                  >
                    {isUploading && <Loader2 className="animate-spin" size={14} />}
                    {isUploading ? 'Processing…' : 'Index Text'}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ======== ERROR TOAST ======== */}
      {error && (
        <div className="error-toast">
          <AlertCircle size={16} />
          {error}
          <button onClick={() => setError(null)}>
            <X size={14} />
          </button>
        </div>
      )}
    </div>
  );
}

export default App;

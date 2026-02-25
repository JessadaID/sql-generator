import { useState, useRef, useEffect } from 'react';
import { chatWithGroq, type ChatMessage } from '../utils/groqClient';
import { applyAlterStatements } from '../utils/sqlParser';
import type { SqlSchema } from '../types/schema';
import type { Theme } from '../types/theme';

interface AiChatSidebarProps {
    isOpen: boolean;
    schema: SqlSchema;
    theme: Theme;
    onClose: () => void;
    onImportSql: (sql: string) => void;
    onApplyAlter: (newSchema: SqlSchema) => void;
}

// Detect if an SQL snippet contains ALTER TABLE statements
function hasAlterTable(sql: string): boolean {
    return /^\s*ALTER\s+TABLE/im.test(sql);
}

// Render message content with syntax-highlighted SQL blocks
function MessageContent({
    content,
    onImportSql,
    onApplyAlter,
    theme,
}: {
    content: string;
    onImportSql: (sql: string) => void;
    onApplyAlter: (sql: string) => void;
    theme: Theme;
}) {
    const codeBg = theme === 'dark' ? 'bg-slate-950 border-slate-700' : 'bg-slate-100 border-slate-300';
    const codeText = theme === 'dark' ? 'text-emerald-300' : 'text-emerald-700';
    const btnBg = 'bg-indigo-600 hover:bg-indigo-500 text-white';
    const alterBtnBg = 'bg-amber-600 hover:bg-amber-500 text-white';

    // Split content into text parts and SQL code blocks
    const parts = content.split(/(```sql[\s\S]*?```)/gi);

    return (
        <div className="flex flex-col gap-2">
            {parts.map((part, i) => {
                const sqlMatch = part.match(/```sql\s*([\s\S]*?)```/i);
                if (sqlMatch) {
                    const sql = sqlMatch[1].trim();
                    const isAlter = hasAlterTable(sql);
                    return (
                        <div key={i} className={`rounded-lg border overflow-hidden ${codeBg}`}>
                            {/* SQL header label */}
                            <div className="px-3 py-1.5 flex items-center justify-between border-b border-inherit">
                                <span className="text-[10px] font-bold uppercase tracking-wider opacity-60">
                                    {isAlter ? 'ALTER TABLE' : 'SQL'}
                                </span>
                            </div>
                            {/* SQL code display */}
                            <pre className={`p-3 text-xs font-mono overflow-x-auto whitespace-pre-wrap break-words ${codeText}`}>
                                {sql}
                            </pre>
                            {/* Action button */}
                            <div className="px-3 py-2 border-t border-inherit flex justify-end">
                                {isAlter ? (
                                    <button
                                        onClick={() => onApplyAlter(sql)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${alterBtnBg}`}
                                    >
                                        {/* Pencil icon */}
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                        </svg>
                                        Apply ALTER
                                    </button>
                                ) : (
                                    <button
                                        onClick={() => onImportSql(sql)}
                                        className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-xs font-semibold transition-colors ${btnBg}`}
                                    >
                                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                        </svg>
                                        ใช้ SQL นี้
                                    </button>
                                )}
                            </div>
                        </div>
                    );
                }
                // Render plain text parts, preserving newlines
                return part.trim() ? (
                    <p key={i} className="text-sm leading-relaxed whitespace-pre-wrap">
                        {part.trim()}
                    </p>
                ) : null;
            })}
        </div>
    );
}

export default function AiChatSidebar({ isOpen, schema, theme, onClose, onImportSql, onApplyAlter }: AiChatSidebarProps) {
    const [messages, setMessages] = useState<ChatMessage[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLTextAreaElement>(null);

    // Scroll to bottom whenever messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isLoading]);

    // Focus input when sidebar opens
    useEffect(() => {
        if (isOpen) {
            setTimeout(() => inputRef.current?.focus(), 300);
        }
    }, [isOpen]);

    const handleSend = async () => {
        const text = inputValue.trim();
        if (!text || isLoading) return;

        const userMessage: ChatMessage = { role: 'user', content: text };
        const newMessages = [...messages, userMessage];
        setMessages(newMessages);
        setInputValue('');
        setIsLoading(true);

        try {
            const reply = await chatWithGroq(newMessages, schema);
            setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
        } catch (err) {
            console.error('Groq API error:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '❌ เกิดข้อผิดพลาดในการเชื่อมต่อ AI กรุณาตรวจสอบ API Key' },
            ]);
        } finally {
            setIsLoading(false);
        }
    };

    // Handle ALTER TABLE SQL from AI — apply directly to current schema
    const handleAiAlterSql = (sql: string) => {
        try {
            const newSchema = applyAlterStatements(schema, sql);
            onApplyAlter(newSchema);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '✅ Apply ALTER TABLE สำเร็จ! Diagram อัปเดตแล้ว' },
            ]);
        } catch (err) {
            console.error('Apply ALTER error:', err);
            setMessages((prev) => [
                ...prev,
                { role: 'assistant', content: '❌ ไม่สามารถ apply ALTER TABLE ได้ ตรวจสอบ syntax' },
            ]);
        }
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        // Send on Enter, allow Shift+Enter for newline
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleClearChat = () => {
        setMessages([]);
    };

    // Theme-based styles
    const bg = theme === 'dark' ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';
    const headerBg = theme === 'dark' ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';
    const inputBg = theme === 'dark' ? 'bg-slate-800 border-slate-700 text-slate-200 placeholder-slate-500 focus:border-indigo-500' : 'bg-slate-50 border-slate-300 text-slate-800 placeholder-slate-400 focus:border-indigo-400';
    const userBubble = theme === 'dark' ? 'bg-indigo-600 text-white' : 'bg-indigo-500 text-white';
    const aiBubble = theme === 'dark' ? 'bg-slate-800 text-slate-200' : 'bg-slate-100 text-slate-800';
    const footerBg = theme === 'dark' ? 'bg-slate-900 border-slate-700/60' : 'bg-white border-slate-200';

    return (
        <div
            className={`border-l flex flex-col transition-all duration-300 overflow-hidden z-20 shrink-0 shadow-xl ${bg}`}
            style={{ width: isOpen ? 360 : 0, minWidth: isOpen ? 360 : 0 }}
        >
            <div className="flex flex-col h-full w-[360px]">
                {/* Header */}
                <div className={`flex items-center justify-between px-4 py-3 border-b shrink-0 ${headerBg}`}>
                    <div className="flex items-center gap-2.5">
                        {/* AI sparkle icon */}
                        <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-md">
                            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />
                            </svg>
                        </div>
                        <div>
                            <div className="text-sm font-semibold">AI Assistant</div>
                            <div className="text-[10px] opacity-50">Powered by Groq</div>
                        </div>
                    </div>
                    <div className="flex items-center gap-1">
                        {/* Clear chat button */}
                        {messages.length > 0 && (
                            <button
                                onClick={handleClearChat}
                                title="ล้างประวัติการสนทนา"
                                className="p-1.5 rounded-md opacity-50 hover:opacity-100 transition-opacity text-xs"
                            >
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        )}
                        {/* Close button */}
                        <button
                            onClick={onClose}
                            title="ปิด AI Assistant"
                            className="p-1.5 rounded-md opacity-50 hover:opacity-100 transition-opacity"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                        </button>
                    </div>
                </div>

                {/* Schema summary badge */}
                <div className={`px-4 py-2 border-b shrink-0 ${headerBg}`}>
                    <div className="flex items-center gap-1.5 text-[11px] opacity-60">
                        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 7v10c0 2 1 3 3 3h10c2 0 3-1 3-3V7c0-2-1-3-3-3H7C5 4 4 5 4 7z" />
                        </svg>
                        <span>
                            รู้จัก {schema.tables.length} ตาราง{schema.tables.length > 0 ? ': ' + schema.tables.map((t) => t.name).join(', ') : ''}
                        </span>
                    </div>
                </div>

                {/* Messages area */}
                <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-4">
                    {/* Welcome message when no chat yet */}
                    {messages.length === 0 && (
                        <div className="flex flex-col items-center justify-center h-full gap-3 text-center px-4 opacity-60">
                            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-600/20 flex items-center justify-center">
                                <svg className="w-7 h-7 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />
                                </svg>
                            </div>
                            <div>
                                <div className="text-sm font-semibold mb-1">AI Schema Advisor</div>
                                <div className="text-xs leading-relaxed">
                                    ถามได้เลย! เช่น<br />
                                    "ถ้าจะเพิ่มตาราง payments ควรมีโครงสร้างยังไง?"<br />
                                    "แนะนำ index สำหรับตาราง orders หน่อย"
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Chat message bubbles */}
                    {messages.map((msg, i) => (
                        <div
                            key={i}
                            className={`flex gap-2.5 ${msg.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}
                        >
                            {/* Avatar icon */}
                            <div className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${msg.role === 'user' ? 'bg-indigo-600/20' : 'bg-purple-600/20'}`}>
                                {msg.role === 'user' ? (
                                    <svg className="w-3.5 h-3.5 text-indigo-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 12c2.7 0 4.8-2.1 4.8-4.8S14.7 2.4 12 2.4 7.2 4.5 7.2 7.2 9.3 12 12 12zm0 2.4c-3.2 0-9.6 1.6-9.6 4.8v2.4h19.2v-2.4c0-3.2-6.4-4.8-9.6-4.8z" />
                                    </svg>
                                ) : (
                                    <svg className="w-3.5 h-3.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                        <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />
                                    </svg>
                                )}
                            </div>
                            {/* Message bubble */}
                            <div className={`max-w-[85%] rounded-2xl px-3.5 py-2.5 ${msg.role === 'user' ? `${userBubble} rounded-tr-sm` : `${aiBubble} rounded-tl-sm`}`}>
                                {msg.role === 'assistant' ? (
                                    <MessageContent content={msg.content} onImportSql={onImportSql} onApplyAlter={handleAiAlterSql} theme={theme} />
                                ) : (
                                    <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.content}</p>
                                )}
                            </div>
                        </div>
                    ))}

                    {/* Loading indicator */}
                    {isLoading && (
                        <div className="flex gap-2.5 flex-row">
                            <div className="w-7 h-7 rounded-full bg-purple-600/20 flex items-center justify-center shrink-0">
                                <svg className="w-3.5 h-3.5 text-purple-400" fill="currentColor" viewBox="0 0 24 24">
                                    <path d="M12 2l2.4 6.6L21 12l-6.6 2.4L12 21l-2.4-6.6L3 12l6.6-2.4z" />
                                </svg>
                            </div>
                            <div className={`rounded-2xl rounded-tl-sm px-4 py-3 ${aiBubble}`}>
                                <div className="flex items-center gap-1.5">
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '0ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '150ms' }} />
                                    <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60 animate-bounce" style={{ animationDelay: '300ms' }} />
                                </div>
                            </div>
                        </div>
                    )}

                    {/* Scroll anchor */}
                    <div ref={messagesEndRef} />
                </div>

                {/* Input footer */}
                <div className={`p-3 border-t shrink-0 ${footerBg}`}>
                    <div className="flex gap-2 items-end">
                        <textarea
                            ref={inputRef}
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            placeholder="ถามเกี่ยวกับ schema ได้เลย... (Enter ส่ง)"
                            disabled={isLoading}
                            rows={1}
                            className={`flex-1 resize-none rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors min-h-[42px] max-h-[120px] ${inputBg} disabled:opacity-50`}
                            style={{ overflowY: 'auto' }}
                            onInput={(e) => {
                                // Auto-resize textarea height based on content
                                const el = e.currentTarget;
                                el.style.height = 'auto';
                                el.style.height = Math.min(el.scrollHeight, 120) + 'px';
                            }}
                        />
                        {/* Send button */}
                        <button
                            onClick={handleSend}
                            disabled={isLoading || !inputValue.trim()}
                            className="w-10 h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors shrink-0"
                        >
                            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                            </svg>
                        </button>
                    </div>
                    <p className="text-[10px] opacity-40 mt-1.5 text-center">Shift+Enter สำหรับขึ้นบรรทัดใหม่</p>
                </div>
            </div>
        </div>
    );
}

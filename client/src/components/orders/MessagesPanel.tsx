import { MessageCircle, SendHorizontal } from 'lucide-react';
import { useEffect, useRef, useState, type FormEvent } from 'react';
import { api, ApiError } from '../../api/client';
import type { OrderMessage } from '../../types/order';
import Button from '../Button';

const POLL_MS = 5000;
const time = (iso: string) => new Date(iso).toLocaleString('es-CO', { dateStyle: 'short', timeStyle: 'short' });

/**
 * Messages panel of S17/S22 (US-40). Loads the thread, then asks only for newer messages every
 * 5 s while the tab is visible; the interval stops when the panel unmounts. Text is rendered by
 * React as text, so markup like <script> is shown literally and never runs.
 */
export default function MessagesPanel({ orderId, mySide }: { orderId: string; mySide: 'store' | 'distributor' }) {
  const [messages, setMessages] = useState<OrderMessage[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const last = useRef<string | null>(null); // createdAt of the newest message we have
  const listRef = useRef<HTMLOListElement>(null);

  // Append without duplicates (a poll can race with our own send).
  const merge = (incoming: OrderMessage[]) => {
    if (incoming.length === 0) return;
    setMessages((prev) => {
      const seen = new Set(prev.map((m) => m.id));
      return [...prev, ...incoming.filter((m) => !seen.has(m.id))];
    });
    last.current = incoming[incoming.length - 1].createdAt;
  };

  useEffect(() => {
    let cancelled = false;
    const fetchNew = async () => {
      try {
        const query = last.current ? `?after=${encodeURIComponent(last.current)}` : '';
        const res = await api<{ data: OrderMessage[] }>(`/orders/${orderId}/messages${query}`);
        if (!cancelled) {
          merge(res.data);
          setLoaded(true);
        }
      } catch {
        // A failed poll is retried on the next tick.
      }
    };
    fetchNew();
    const id = window.setInterval(() => !document.hidden && fetchNew(), POLL_MS);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [orderId]);

  // Keep the newest message in view.
  useEffect(() => {
    listRef.current?.lastElementChild?.scrollIntoView({ block: 'nearest' });
  }, [messages.length]);

  const send = async (e?: FormEvent) => {
    e?.preventDefault();
    if (!text.trim()) return;
    setSending(true);
    setError(null);
    try {
      const message = await api<OrderMessage>(`/orders/${orderId}/messages`, { method: 'POST', body: JSON.stringify({ text }) });
      merge([message]);
      setText('');
    } catch (err) {
      setError(err instanceof ApiError ? (err.details[0]?.message ?? err.message) : 'Could not send. Check your connection.');
    } finally {
      setSending(false);
    }
  };

  return (
    <section aria-labelledby="messages-title" className="flex flex-col card">
      <h2 id="messages-title" className="flex items-center gap-2 border-b border-slate-200 px-4 py-3 font-semibold">
        <MessageCircle className="h-4 w-4 text-primary" aria-hidden="true" />
        Messages
      </h2>
      <ol ref={listRef} aria-live="polite" className="max-h-96 min-h-32 space-y-3 overflow-y-auto bg-slate-50 p-4">
        {messages.map((m) => {
          const mine = m.sender.orgType === mySide;
          return (
            // Each bubble rises in once when it arrives; nothing else in the panel moves.
            <li
              key={m.id}
              className={`flex flex-col transition-[opacity,translate] duration-300 starting:translate-y-2 starting:opacity-0 ${mine ? 'items-end' : 'items-start'}`}
            >
              <p
                className={`max-w-[85%] rounded-2xl px-3.5 py-2 text-sm break-words whitespace-pre-wrap ${
                  mine ? 'rounded-br-md bg-primary text-white' : 'rounded-bl-md border border-slate-200 bg-white text-slate-900'
                }`}
              >
                {m.text}
              </p>
              <span className="mt-1 text-xs text-slate-600">
                {mine ? 'You' : m.sender.name} · {time(m.createdAt)}
              </span>
            </li>
          );
        })}
        {loaded && messages.length === 0 && (
          <li className="py-6 text-center text-sm text-slate-600">No messages yet. Ask about delivery times or substitutions here.</li>
        )}
      </ol>
      <form onSubmit={send} className="space-y-2 border-t border-slate-200 p-3">
        {error && <p className="text-xs font-medium text-red-700">{error}</p>}
        <label className="sr-only" htmlFor="message-text">
          Message
        </label>
        <textarea
          id="message-text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && !e.shiftKey) send(e);
          }}
          maxLength={1000}
          rows={2}
          placeholder="Write a message…"
          className="field block w-full resize-none"
        />
        <div className="flex items-center justify-between gap-3">
          <span className="text-xs text-slate-600">
            Enter to send · Shift+Enter for a new line · <span className="tabular-nums">{text.length}/1000</span>
          </span>
          <Button type="submit" loading={sending} disabled={!text.trim()}>
            Send
            <SendHorizontal className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>
      </form>
    </section>
  );
}

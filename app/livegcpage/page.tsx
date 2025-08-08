"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";
import { v4 as uuidv4 } from "uuid";
import { flushSync } from "react-dom";

type Message = {
  id: number;
  username: string;
  content: string;
  created_at: string;
  reply_to?: number | null;
  media_url?: string | null;
  client_id?: string | null;
  _pending?: boolean;
  _error?: string | null;
  _new?: boolean;
};

const randomNames = ["AnonymousLion", "ShadowWolf", "GhostFalcon", "SilentTiger", "NightPanther"];
const getRandomName = () =>
  randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 1000);

function getOrCreateUsername() {
  if (typeof window === "undefined") return getRandomName();
  const token = localStorage.getItem("admin_token");
  if (token === "resettingthispc67%token") return "Lapsus$ (Admin)";
  let username = localStorage.getItem("username");
  if (!username) {
    username = getRandomName();
    localStorage.setItem("username", username);
  }
  return username;
}

export default function LiveGCPage() {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [text, setText] = useState("");
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);

  const [theme, setTheme] = useState<"dark" | "light">("dark");
  const [listReady, setListReady] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [atBottomState, setAtBottomState] = useState(true); // for rendering the Jump button

  const listRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);
  const composerRef = useRef<HTMLDivElement | null>(null);
  const menuWrapRef = useRef<HTMLDivElement | null>(null);

  const isDark = theme === "dark";

  // spacing constants
  const GAP_INSIDE = 4;
  const GAP_BETWEEN = 12;
  const MAX_BUBBLE = "76%";

  // logic ref so effects can use constant deps
  const atBottomRef = useRef(true);
  const setAtBottom = (v: boolean) => {
    atBottomRef.current = v;
    setAtBottomState(v); // trigger render for the Jump button
  };

  const refreshAppVH = () => {
    const h = window.visualViewport ? (window as any).visualViewport.height : window.innerHeight;
    document.documentElement.style.setProperty("--app-vh", `${Math.round(h)}px`);
  };

  const getBottomGap = () => {
    const el = listRef.current;
    if (!el) return Infinity;
    return el.scrollHeight - el.scrollTop - el.clientHeight;
  };

  const scrollToBottom = (instant = false) => {
    const el = listRef.current;
    if (!el) return;
    const prev = el.style.scrollBehavior;
    if (instant) el.style.scrollBehavior = "auto";
    el.scrollTop = el.scrollHeight;
    if (instant) {
      requestAnimationFrame(() => {
        el.style.scrollBehavior = prev || "smooth";
      });
    }
  };

  const autoSize = () => {
    const ta = inputRef.current;
    if (!ta) return;
    ta.style.height = "0px";
    const next = Math.min(160, ta.scrollHeight);
    ta.style.height = next + "px";
  };

  // init user
  useEffect(() => { setUsername(getOrCreateUsername()); }, []);

  // admin
  useEffect(() => {
    const checkAdmin = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("admin_token");
      if (!token) return;
      const { data: admin } = await supabase.from("admin_tokens").select("*").eq("id", token).single();
      if (admin?.role === "admin") setUsername("Lapsus$ (Admin)");
    };
    checkAdmin();
  }, []);

  // initial load
  useEffect(() => {
    let alive = true;
    const load = async () => {
      const { data, error } = await supabase
        .from("messages")
        .select("*")
        .order("created_at", { ascending: true });
      if (!error && data && alive) {
        flushSync(() => setMessages((data as Message[]).map(m => ({ ...m, _new: false }))));
        queueMicrotask(() => {
          scrollToBottom(true);
          setListReady(true);
        });
      }
    };
    load();
    return () => { alive = false; };
  }, []);

  // realtime
  useEffect(() => {
    const channel = supabase
      // @ts-ignore
      .channel("realtime chat")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages" }, payload => {
        const incoming = { ...(payload.new as Message), _new: true };
        setMessages(prev => {
          const byClient = prev.findIndex(p => p.client_id && incoming.client_id && p.client_id === incoming.client_id);
          if (byClient !== -1) {
            const next = prev.slice();
            next[byClient] = { ...incoming, _pending: false, _error: null, _new: true };
            return next;
          }
          if (prev.some(p => p.id === incoming.id)) return prev;
          return [...prev, incoming];
        });

        // only auto scroll if you are already near bottom
        if (atBottomRef.current && getBottomGap() < 200) {
          requestAnimationFrame(() => scrollToBottom(false));
        }
      })
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  }, []);

  // padding equals composer height exactly
  useEffect(() => {
    const list = listRef.current;
    const comp = composerRef.current;
    if (!list || !comp) return;
    const ro = new ResizeObserver(() => {
      list.style.paddingBottom = comp.getBoundingClientRect().height - 50 + "px";
      if (atBottomRef.current) scrollToBottom(true);
    });
    ro.observe(comp);
    return () => ro.disconnect();
  }, []);

  // track bottom
  useEffect(() => {
    const el = listRef.current;
    if (!el) return;
    const onScroll = () => setAtBottom(getBottomGap() < 56);
    el.addEventListener("scroll", onScroll, { passive: true });
    onScroll();
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  // keyboard and vh
  useEffect(() => {
    if (typeof window === "undefined") return;
    refreshAppVH();
    const onWindowResize = () => {
      refreshAppVH();
      if (atBottomRef.current) scrollToBottom(true);
    };
    window.addEventListener("resize", onWindowResize);
    if ("visualViewport" in window) {
      const vv = (window as any).visualViewport as VisualViewport;
      vv.addEventListener("resize", onWindowResize);
      vv.addEventListener("scroll", onWindowResize);
    }
    return () => {
      window.removeEventListener("resize", onWindowResize);
      if ("visualViewport" in window) {
        const vv = (window as any).visualViewport as VisualViewport;
        vv.removeEventListener("resize", onWindowResize);
        vv.removeEventListener("scroll", onWindowResize);
      }
    };
  }, []);

  // close menu when clicking outside
  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e: MouseEvent | TouchEvent) => {
      const wrap = menuWrapRef.current;
      if (!wrap) return;
      if (!wrap.contains(e.target as Node)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("touchstart", onDoc, { passive: true });
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("touchstart", onDoc);
    };
  }, [menuOpen]);

  const onInputFocus = () => {
    requestAnimationFrame(() => {
      autoSize();
      composerRef.current?.classList.add("composer-open");
      // do NOT force scroll here
    });
  };
  const onInputBlur = () => {
    setTimeout(() => {
      refreshAppVH();
      if (atBottomRef.current) scrollToBottom(true);
      composerRef.current?.classList.remove("composer-open");
    }, 50);
  };

  // swipe to reply only on bubble, and do NOT auto scroll on reply
  const swipeStateRef = useRef<{ id: number | null; startX: number; startY: number; dragging: boolean }>({
    id: null, startX: 0, startY: 0, dragging: false,
  });
  const onBubbleTouchStart = (id: number) => (e: React.TouchEvent) => {
    const t = e.touches[0];
    swipeStateRef.current = { id, startX: t.clientX, startY: t.clientY, dragging: false };
  };
  const onBubbleTouchMove = (id: number) => (e: React.TouchEvent) => {
    const st = swipeStateRef.current;
    if (st.id !== id) return;
    const t = e.touches[0];
    const dx = Math.max(0, t.clientX - st.startX);
    const dy = Math.abs(t.clientY - st.startY);
    if (!st.dragging && dx > 10 && dx > dy + 6) st.dragging = true;
    if (!st.dragging) return;
    e.preventDefault();
    const bubble = e.currentTarget as HTMLElement;
    const hint = bubble.parentElement?.querySelector(".swipe-reply") as HTMLElement | null;
    const travel = Math.min(dx, 88);
    bubble.style.transform = `translateX(${travel}px)`;
    if (hint) hint.style.opacity = String(Math.min(1, travel / 48));
  };
  const onBubbleTouchEnd = (id: number) => (e: React.TouchEvent) => {
    const st = swipeStateRef.current;
    if (st.id !== id) return;
    const bubble = e.currentTarget as HTMLElement;
    const hint = bubble.parentElement?.querySelector(".swipe-reply") as HTMLElement | null;
    const dx = Math.max(0, (e.changedTouches?.[0]?.clientX || st.startX) - st.startX);
    const triggered = st.dragging && dx > 48;
    bubble.style.transform = "";
    if (hint) hint.style.opacity = "0";
    swipeStateRef.current = { id: null, startX: 0, startY: 0, dragging: false };
    if (triggered) {
      setReplyTo(id);
      requestAnimationFrame(() => {
        composerRef.current?.classList.add("composer-open");
        inputRef.current?.focus();
        autoSize();
        // stay in place. no scroll to bottom here
      });
      if ((navigator as any).vibrate) { try { (navigator as any).vibrate(10); } catch {} }
    }
  };

  async function handleSend(explicit?: string) {
    const content = (explicit ?? text).trim();
    if (!content && !mediaFile) return;
    const clientId = uuidv4();
    const optimistic: Message = {
      id: Date.now(),
      username,
      content,
      created_at: new Date().toISOString(),
      reply_to: replyTo,
      media_url: null,
      client_id: clientId,
      _pending: true,
      _error: null,
      _new: true,
    };
    flushSync(() => {
      setMessages(prev => [...prev, optimistic]);
      setText("");
      setReplyTo(null);
    });
    
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "0px";
    }
    
    requestAnimationFrame(() => { inputRef.current?.focus(); autoSize(); });
    // you just sent the message, so snap to bottom instantly
    scrollToBottom(true);

    let mediaUrl: string | null = null;
    try {
      if (mediaFile) {
        const fileName = `${Date.now()}-${mediaFile.name}`;
        const { data: up, error: upErr } = await supabase.storage.from("media").upload(fileName, mediaFile);
        if (upErr) throw upErr;
        const pub = supabase.storage.from("media").getPublicUrl(up.path);
        // @ts-ignore
        mediaUrl = pub?.data?.publicUrl || null;
      }
    } catch {
      setMessages(prev => prev.map(m => (m.client_id === clientId ? { ...m, _pending: false, _error: "Upload failed" } : m)));
      return;
    } finally {
      setMediaFile(null);
      setMediaPreview(null);
    }

    try {
      const { error } = await supabase.from("messages").insert([
        { username, content, reply_to: optimistic.reply_to, media_url: mediaUrl, client_id: clientId },
      ]);
      if (error) throw error;
    } catch {
      setMessages(prev => prev.map(m => (m.client_id === clientId ? { ...m, _pending: false, _error: "Send failed" } : m)));
    } finally {
      if (atBottomRef.current) scrollToBottom(false);
      inputRef.current?.focus();
    }
  }

  function formatTime(ts: string) {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  }

  const bgApp = isDark ? "bg-neutral-950" : "bg-white";
  const fgApp = isDark ? "text-white" : "text-black";

  const findMessageById = (id: number | null | undefined) => (id ? messages.find(m => m.id === id) : undefined);
  const replyTarget = findMessageById(replyTo || undefined);

  const isSameGroup = (a: Message | undefined, b: Message | undefined) => {
    if (!a || !b) return false;
    if (a.username !== b.username) return false;
    const ta = new Date(a.created_at).getTime();
    const tb = new Date(b.created_at).getTime();
    return Math.abs(tb - ta) < 5 * 60 * 1000;
  };

  return (
    <div className={`flex flex-col ${bgApp} ${fgApp}`} style={{ height: "var(--app-vh, 100dvh)", paddingBottom: "env(safe-area-inset-bottom)" }}>
      {/* compact navbar. in light mode no gray hover or active bg */}
      <nav className={`shrink-0 sticky top-0 z-30 border-b ${isDark ? "bg-neutral-900/90 backdrop-blur border-neutral-800" : "bg-white/80 backdrop-blur border-neutral-200"}`}>
        <div className="mx-auto max-w-3xl px-3 h-12 flex items-center gap-2">
          <Link
            href="/"
            className={`p-2 rounded-full ${isDark ? "dark:hover:bg-neutral-800" : ""} active:opacity-80`}
            aria-label="Back"
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none"><path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" /></svg>
          </Link>

          <div className="flex items-center min-w-0 gap-2">
            <div className="w-7 h-7 rounded-full bg-gradient-to-tr from-fuchsia-500 to-blue-500 p-[2px] flex-shrink-0">
              <div className="w-full h-full rounded-full bg-white dark:bg-neutral-900" />
            </div>
            <div className="min-w-0 leading-tight">
              <div className="text-sm font-semibold truncate">Live Group</div>
              <div className="text-[11px] opacity-60 truncate">{messages.length} messages</div>
            </div>
          </div>

          <div className="ml-auto flex items-center gap-1" ref={menuWrapRef}>
            <button
              onClick={() => setTheme(isDark ? "light" : "dark")}
              className="px-2 py-1 text-xs rounded-full border border-neutral-300 dark:border-neutral-700 active:opacity-80"
              aria-label="Toggle theme"
            >
              {isDark ? "Light" : "Dark"}
            </button>

            <div className="relative">
              <button
                onClick={() => setMenuOpen(v => !v)}
                className={`p-2 rounded-full ${isDark ? "dark:hover:bg-neutral-800" : ""} active:opacity-80`}
                aria-label="Menu"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor">
                  <circle cx="5" cy="12" r="2" />
                  <circle cx="12" cy="12" r="2" />
                  <circle cx="19" cy="12" r="2" />
                </svg>
              </button>
              {menuOpen && (
                <div className={`absolute right-0 mt-2 w-44 rounded-xl shadow-lg ring-1 ${isDark ? "bg-neutral-900 ring-white/10" : "bg-white ring-black/10"}`}>
                  <Link href="/scoreboard" className="block px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => setMenuOpen(false)}>Scoreboard</Link>
                  <Link href="/ratinggame" className="block px-3 py-2 text-sm hover:bg-neutral-100 dark:hover:bg-neutral-800" onClick={() => setMenuOpen(false)}>RatingGame</Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* chat list */}
      <div className="mx-auto w-full max-w-3xl flex-1 min-h-0">
        <div
          ref={listRef}
          className="h-full overflow-y-auto px-3 transition-opacity duration-150 overscroll-contain"
          style={{ opacity: listReady ? 1 : 0, scrollBehavior: "smooth" }}
          role="log" aria-live="polite" aria-relevant="additions"
        >
          <div className="pt-2">
            {messages.length === 0 ? (
              <p className="text-center text-neutral-400 pt-8">Loading…</p>
            ) : (
              messages.map((m, i) => {
                const prev = messages[i - 1];
                const next = messages[i + 1];
                const last = i === messages.length - 1;

                const mine = m.username === username;
                const isAdmin = m.username === "Lapsus$ (Admin)";
                const groupedWithPrev = isSameGroup(prev, m);
                const groupedWithNext = isSameGroup(m, next);

                const radius =
                  mine
                    ? groupedWithPrev && groupedWithNext
                      ? "rounded-2xl"
                      : groupedWithPrev
                      ? "rounded-2xl rounded-br-md"
                      : groupedWithNext
                      ? "rounded-2xl rounded-tr-md"
                      : "rounded-2xl"
                    : groupedWithPrev && groupedWithNext
                    ? "rounded-2xl"
                    : groupedWithPrev
                    ? "rounded-2xl rounded-bl-md"
                    : groupedWithNext
                    ? "rounded-2xl rounded-tl-md"
                    : "rounded-2xl";

                const topGap = groupedWithPrev ? GAP_INSIDE : GAP_BETWEEN;
                const bottomGap = groupedWithNext ? GAP_INSIDE : last ? 2 : GAP_BETWEEN;

                // color accents for the reply chip like Insta
                const replyChip =
                  mine
                    ? "bg-white/15 text-white border-white/20"
                    : isDark
                    ? "bg-white/5 text-neutral-200 border-white/10"
                    : "bg-black/5 text-neutral-800 border-black/10";

                return (
                  <div
                    key={m.id}
                    className={`flex ${mine ? "justify-end" : "justify-start"} msg`}
                    data-new={m._new ? "true" : "false"}
                    style={{ marginTop: topGap, marginBottom: bottomGap }}
                  >
                    <div className="relative" style={{ maxWidth: MAX_BUBBLE }}>
                      {!groupedWithPrev && (
                        <div className="flex items-baseline gap-2 mb-1 px-1">
                          <span className="text-[11px] opacity-70">
                            {mine ? "You" : m.username} {isAdmin && <span className="opacity-80">✔️</span>}
                          </span>
                          <span className="text-[10px] opacity-50">{formatTime(m.created_at)}</span>
                          {m._pending && (
                            <span className="text-[10px] opacity-70 inline-flex items-center gap-1">
                              <span className="dot" /><span className="dot" /><span className="dot" />
                            </span>
                          )}
                          {m._error && <span className="text-[10px] text-red-400">failed</span>}
                        </div>
                      )}

                      {/* swipe hint */}
                      <div className="swipe-reply absolute -left-7 top-1/2 -translate-y-1/2 opacity-0 transition-opacity pointer-events-none">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
                          <path d="M10 19l-7-7 7-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </div>

                      <div
                        className={[
                          "px-3 py-1.5 shadow-sm ring-1 bubble",
                          radius,
                          mine
                            ? "bg-gradient-to-tr from-blue-500 to-indigo-500 text-white ring-indigo-500/20"
                            : isDark
                            ? "bg-neutral-900 text-white ring-white/5"
                            : "bg-neutral-100 text-black ring-black/5",
                        ].join(" ")}
                        style={{ scrollMarginBottom: 64, touchAction: "pan-y" }}
                        onTouchStart={onBubbleTouchStart(m.id)}
                        onTouchMove={onBubbleTouchMove(m.id)}
                        onTouchEnd={onBubbleTouchEnd(m.id)}
                      >
                        {m.reply_to && (() => {
                          const replied = messages.find(mm => mm.id === m.reply_to);
                          if (!replied) return null;
                          const replyName = replied.username === username ? "You" : replied.username;
                          return (
                            <div
                              className={`mb-2 text-[12px] rounded-lg px-2 py-1 border ${replyChip}`}
                              style={{ borderLeftWidth: 3 }}
                            >
                              Replying to {replyName}: “{replied.content.slice(0, 120)}{replied.content.length > 120 ? "…" : ""}”
                            </div>
                          );
                        })()}

                        <div className="whitespace-pre-wrap break-words text-[15px] leading-relaxed">
                          {m.content}
                        </div>

                        {m.media_url && (
                          <div className="mt-2 media-wrap">
                            {m.media_url.endsWith(".mp4") ? (
                              <video controls className="rounded w-full">
                                <source src={m.media_url} type="video/mp4" />
                              </video>
                            ) : (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={m.media_url} alt="shared media" className="rounded w-full" />
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Jump to latest button */}
          {!atBottomState && (
            <button
              onClick={() => scrollToBottom(false)}
              className={`fixed right-4 bottom-[84px] rounded-full px-3 py-2 text-sm shadow-md ring-1 ${
                isDark ? "bg-neutral-800 text-white ring-white/10" : "bg-white text-black ring-black/10"
              }`}
              aria-label="Jump to latest"
            >
              New messages ↓
            </button>
          )}
        </div>
      </div>

      {/* reply banner near composer */}
      {replyTarget && (
        <div className="mx-auto max-w-3xl w-full px-3 sm:px-4 mb-1 text-sm">
          <div className={`rounded-xl px-3 py-2 border ${isDark ? "bg-neutral-900 text-neutral-200 border-white/10" : "bg-neutral-100 text-neutral-800 border-black/10"}`} style={{ borderLeftWidth: 3 }}>
            Replying to {replyTarget.username === username ? "You" : replyTarget.username}: “
            {replyTarget.content.slice(0, 140)}
            {replyTarget.content.length > 140 ? "…" : ""}”
            <button onClick={() => { setReplyTo(null); }} className="ml-3 text-blue-400 hover:underline">Cancel</button>
          </div>
        </div>
      )}

      {/* composer */}
      <div
        ref={composerRef}
        className="sticky bottom-0 w-full composer"
        style={{ paddingBottom: "max(env(safe-area-inset-bottom), var(--vvh-offset, 0px))" }}
      >
        <div className={`mx-auto w-full max-w-3xl px-3 sm:px-4 pb-2 pt-2 ${isDark ? "bg-neutral-950" : "bg-white"}`}>
          {mediaPreview && (
            <div className={`mb-2 rounded-lg overflow-hidden ${isDark ? "bg-neutral-900" : "bg-neutral-100"} p-2`}>
              <div className="text-xs mb-2 opacity-70">Attachment preview</div>
              {mediaPreview.endsWith(".mp4") ? (
                <video controls className="rounded w-full"><source src={mediaPreview} /></video>
              ) : (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={mediaPreview} alt="preview" className="rounded w-full" />
              )}
            </div>
          )}

          <div className="flex items-end gap-2">
            <label className={`cursor-pointer p-2 rounded-full ${isDark ? "dark:hover:bg-neutral-800" : ""} active:opacity-80`}>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={e => {
                  const f = e.target.files?.[0] || null;
                  if (f && !f.type.includes("video") && !f.type.includes("image")) {
                    setMediaFile(null);
                    return;
                  }
                  setMediaFile(f);
                  requestAnimationFrame(() => {
                    // do not force bottom. just keep view stable
                    inputRef.current?.focus();
                  });
                }}
                className="hidden"
                aria-label="Attach media"
              />
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none">
                <path d="M21 15V8a2 2 0 0 0-2-2h-7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                <rect x="3" y="8" width="14" height="13" rx="2" stroke="currentColor" strokeWidth="2" />
              </svg>
            </label>

            <form onSubmit={e => { e.preventDefault(); const val = inputRef.current?.value ?? ""; const trimmed = val.trim(); if (!trimmed && !mediaFile) return; flushSync(() => setText("")); if (inputRef.current) { inputRef.current.value = ""; inputRef.current.style.height = "0px";} handleSend(trimmed); }} className="flex-1 flex items-end gap-2">
              <div className={`flex-1 flex items-end rounded-2xl border px-3 py-2 ${isDark ? "bg-neutral-900 border-neutral-800" : "bg-neutral-100 border-neutral-200"}`}>
                <textarea
  ref={inputRef}
  value={text}
  onFocus={onInputFocus}
  onBlur={onInputBlur}
  onChange={e => { setText(e.target.value); autoSize(); }}
  onKeyDown={e => {
  const composing =
    (e as any).isComposing ||
    (e.nativeEvent as any).isComposing ||
    (e as any).keyCode === 229;

  if (e.key === "Enter" && !e.shiftKey && !composing) {
    e.preventDefault();

    const val = inputRef.current?.value ?? "";
    const trimmed = val.trim();
    if (!trimmed && !mediaFile) return;

    // 1) clear React state immediately
    flushSync(() => setText(""));

    // 2) clear DOM immediately
    if (inputRef.current) {
      inputRef.current.value = "";
      inputRef.current.style.height = "0px";
    }

    // 3) send
    handleSend(trimmed);
  }
}}

  rows={1}
  placeholder="Message…"
  className="flex-1 resize-none bg-transparent outline-none text-[15px] max-h-40"
  aria-label="Message input"
/>
</div>

              <button
                type="submit"
                onMouseDown={e => e.preventDefault()}
                className="px-4 py-2 rounded-2xl font-semibold text-white bg-gradient-to-tr from-blue-500 to-indigo-500 active:opacity-90"
                aria-label="Send message"
              >
                Send
              </button>
            </form>
          </div>
        </div>
      </div>

      <style jsx global>{`
        .overscroll-contain { overscroll-behavior: contain; }

        .msg[data-new="true"] .bubble { animation: msgIn 180ms cubic-bezier(.22,.61,.36,1) both; }
        @keyframes msgIn { from { opacity: 0; transform: translateY(6px) scale(.995); } to { opacity: 1; transform: translateY(0) scale(1); } }
        .msg[data-new="true"] .media-wrap { animation: mediaIn 220ms ease-out both; }
        @keyframes mediaIn { from { opacity: 0; filter: saturate(.9) blur(2px); } to { opacity: 1; filter: saturate(1) blur(0); } }

        .dot { width: 4px; height: 4px; border-radius: 9999px; background: currentColor; opacity: .7; display: inline-block; animation: blink 1s infinite ease-in-out; }
        .dot:nth-child(2) { animation-delay: .15s; }
        .dot:nth-child(3) { animation-delay: .3s; }
        @keyframes blink { 0%, 80%, 100% { transform: scale(.6); opacity: .5; } 40% { transform: scale(1); opacity: 1; } }

        .composer { transition: height 150ms ease, transform 150ms ease, background 150ms ease; }
        .composer-open { transform: translateZ(0); }
      `}</style>
    </div>
  );
}

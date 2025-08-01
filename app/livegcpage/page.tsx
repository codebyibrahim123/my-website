"use client";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { supabase } from "@/utils/supabaseClient";

// Type definition for messages
type Message = {
  id: number;
  username: string;
  content: string;
  created_at: string;
  reply_to?: number | null;
  media_url?: string | null;
};

const randomNames = ["AnonymousLion", "ShadowWolf", "GhostFalcon", "SilentTiger", "NightPanther"];
const getRandomName = () =>
  randomNames[Math.floor(Math.random() * randomNames.length)] + Math.floor(Math.random() * 1000);

const getOrCreateUsername = () => {
  if (typeof window !== "undefined") {
    const token = localStorage.getItem("admin_token");
    if (token === "resettingthispc67%token") {
      return "Lapsus$ (Admin)";
    }
    let username = localStorage.getItem("username");
    if (!username) {
      username = getRandomName();
      localStorage.setItem("username", username);
    }
    return username;
  }
  return getRandomName();
};

export default function LiveGCPage() {
  const [username, setUsername] = useState("");
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [theme, setTheme] = useState("dark");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUsername(getOrCreateUsername());
  }, []);

  useEffect(() => {
    const checkAdmin = async () => {
      if (typeof window === "undefined") return;
      const token = localStorage.getItem("admin_token");
      if (!token) return;

      const { data: admin, error } = await supabase
        .from("admin_tokens")
        .select("*")
        .eq("id", token)
        .single();

      if (admin && admin.role === "admin") {
        setUsername("Lapsus$ (Admin)");
      }
    };

    checkAdmin();
  }, []);
  // @ts-ignore
  useEffect(() => {
    fetchMessages();
    const channel = supabase
      .channel("realtime chat")
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: "messages" },
        (payload) => {
          const newMsg = payload.new as Message;
          setMessages((prev) => (prev.some((msg) => msg.id === newMsg.id) ? prev : [...prev, newMsg]));
        }
      )
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  useEffect(() => {
    if (!showScrollButton) bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleScroll = () => {
      const container = containerRef.current;
      if (!container) return;
      const atBottom = container.scrollHeight - container.scrollTop - container.clientHeight < 50;
      setShowScrollButton(!atBottom);
    };
    const container = containerRef.current;
    container?.addEventListener("scroll", handleScroll);
    return () => container?.removeEventListener("scroll", handleScroll);
  }, []);

  const fetchMessages = async () => {
    const { data, error } = await supabase.from("messages").select("*").order("created_at", { ascending: true });
    if (!error && data) setMessages(data as Message[]);
  };

  const handleSend = async () => {
    if (!newMessage.trim() && !mediaFile) return;
    let mediaUrl = null;
    if (mediaFile) {
      const fileName = `${Date.now()}-${mediaFile.name}`;
      const { data, error } = await supabase.storage.from("media").upload(fileName, mediaFile);
      if (!error && data) {
        const { data: publicUrl } = supabase.storage.from("media").getPublicUrl(fileName);
        mediaUrl = publicUrl.publicUrl;
      }
    }
    await supabase.from("messages").insert([{ username, content: newMessage, reply_to: replyTo, media_url: mediaUrl }]);
    setNewMessage("");
    setMediaFile(null);
    setReplyTo(null);
    inputRef.current.focus();
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col items-center min-h-screen transition-colors duration-300 ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <nav className="w-full sticky top-0 z-30 bg-black flex justify-start gap-5 items-center border-b border-gray-700 px-4 py-3">
        <Link href="/" className="text-lg font-semibold text-blue-500">Home</Link>
        <Link href="/scoreboard" className="text-lg font-semibold text-blue-500">Scoreboard</Link>
        <Link href="/ratinggame" className="text-lg font-semibold text-blue-500">RatingGame</Link>
      </nav>

      <div className="w-full max-w-md sm:max-w-2xl flex-1 overflow-hidden">
        <div
          ref={containerRef}
          className="overflow-y-auto px-4 py-2"
          style={{ height: "calc(100vh - 210px)" }}
        >
          {messages.length === 0 ? (
            <p className="text-center text-gray-400">Loading messages...</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.username === username;
              const replyToMsg = messages.find((m) => m.id === msg.reply_to);
              const replyName = replyToMsg?.username === username ? "You" : replyToMsg?.username;
              const isAdminMsg = msg.username === "Lapsus$ (Admin)";
              return (
                <div key={msg.id} className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] shadow ${isOwn ? "bg-blue-500 text-white" : "bg-gray-100 dark:bg-zinc-800 text-black dark:text-white"}`}>
                    <div className="font-medium text-sm">
                      {isOwn ? "You" : msg.username} {isAdminMsg && <span className="text-blue-300">✔️</span>}
                      <span className="ml-2 text-xs text-gray-400">{formatTime(msg.created_at)}</span>
                    </div>
                    {replyToMsg && (
                      <div className="text-xs text-gray-400 italic border-l-2 border-gray-500 pl-2 my-2">
                        Replying to {replyName}: "{replyToMsg.content}"
                      </div>
                    )}
                    <div className="whitespace-pre-wrap break-words">{msg.content}</div>
                    {msg.media_url && (
                      <div className="mt-2">
                        {msg.media_url.endsWith(".mp4") ? (
                          <video controls className="rounded w-full">
                            <source src={msg.media_url} type="video/mp4" />
                          </video>
                        ) : (
                          <img src={msg.media_url} alt="shared media" className="rounded w-full" />
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setReplyTo(msg.id)}
                      className="mt-2 text-xs text-gray-400 hover:text-blue-400"
                    >↩ Reply</button>
                  </div>
                </div>
              );
            })
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {showScrollButton && (
        <button
          onClick={() => bottomRef.current?.scrollIntoView({ behavior: "smooth" })}
          className="fixed bottom-20 right-4 px-3 py-2 rounded-full bg-blue-600 text-white shadow-md z-40"
        >↓</button>
      )}

      {replyTo && (
        <div className="text-sm text-gray-400 mb-2 max-w-2xl w-full px-4">
          Replying to message #{replyTo}
          <button
            onClick={() => setReplyTo(null)}
            className="ml-4 text-blue-400 hover:underline"
          >Cancel</button>
        </div>
      )}

      <div className="w-full max-w-2xl px-4 pb-4">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          className="block w-full mb-2 text-sm text-gray-400 file:mr-4 file:py-2 file:px-4 file:border-0 file:rounded file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
        />
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded-full bg-zinc-900 text-white border border-zinc-700 outline-none placeholder-gray-400"
          />
          <button
            type="button"
            onMouseDown={(e) => e.preventDefault()}
            onClick={handleSend}
            className="px-6 py-3 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-semibold"
          >Send</button>
        </div>
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="fixed top-3 right-3 px-4 py-1 bg-gray-600 text-white rounded-full text-xs z-50"
      >{theme === "dark" ? "☀ Light" : "🌙 Dark"}</button>
    </div>
  );
}


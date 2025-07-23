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

export default function LiveGCPage() {
  const [username, setUsername] = useState(getRandomName());
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [showScrollButton, setShowScrollButton] = useState(false);
  const [theme, setTheme] = useState("dark");
  const containerRef = useRef<HTMLDivElement | null>(null);
  const bottomRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && sessionStorage.getItem("isAdmin") === "true") {
      setUsername("Admin");
    }
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
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  const isDark = theme === "dark";

  return (
    <div className={`flex flex-col items-center min-h-screen font-sans ${isDark ? "bg-black text-white" : "bg-white text-black"}`}>
      <nav className="w-full sticky top-0 z-20 bg-gray-900 dark:bg-[#111] border-b border-gray-800 px-4 py-3 flex justify-between items-center">
        <Link href="/" className="text-gray-300">🏠 Home</Link>
        <h2 className="text-lg font-medium">Live Group Chat</h2>
        <Link href="/scoreboard" className="text-gray-300">📊 Scoreboard</Link>
      </nav>

      <div className="w-full max-w-3xl flex-1 overflow-hidden px-2 sm:px-4">
        <div
          ref={containerRef}
          className="overflow-y-auto py-4"
          style={{ height: "calc(100vh - 240px)" }}
        >
          {messages.length === 0 ? (
            <p className="text-gray-500">Loading messages...</p>
          ) : (
            messages.map((msg) => {
              const isOwn = msg.username === username;
              const replyToMsg = messages.find((m) => m.id === msg.reply_to);
              const replyName = replyToMsg?.username === username ? "You" : replyToMsg?.username;
              const isAdminMsg = msg.username === "Admin";
              return (
                <div key={msg.id} className={`mb-3 flex ${isOwn ? "justify-end" : "justify-start"}`}>
                  <div className={`rounded-2xl px-4 py-3 max-w-[85%] break-words ${isOwn ? "bg-blue-600 text-white text-right" : "bg-gray-200 dark:bg-zinc-800 text-black dark:text-white text-left"}`}>
                    <div className="font-semibold mb-1">
                      {isOwn ? "You" : msg.username}
                      {isAdminMsg && <span className="ml-1 inline-block text-blue-400">✔️</span>}
                      <span className="ml-2 text-sm font-normal text-gray-400">{formatTime(msg.created_at)}</span>
                    </div>
                    {replyToMsg && (
                      <div className="text-sm text-gray-400 border-l-2 border-gray-600 pl-2 mb-2">
                        Replying to {replyName}: "{replyToMsg.content}"
                      </div>
                    )}
                    <div>{msg.content}</div>
                    {msg.media_url && (
                      <div className="mt-2">
                        {msg.media_url.endsWith(".mp4") ? (
                          <video controls className="w-full rounded">
                            <source src={msg.media_url} type="video/mp4" />
                          </video>
                        ) : (
                          <img src={msg.media_url} alt="shared media" className="w-full rounded" />
                        )}
                      </div>
                    )}
                    <button
                      onClick={() => setReplyTo(msg.id)}
                      className="mt-2 text-sm text-gray-400 hover:text-gray-200"
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
          className="fixed bottom-24 right-4 bg-blue-600 text-white px-4 py-2 rounded-full z-10"
        >↓ New Messages</button>
      )}

      {replyTo && (
        <div className="text-sm text-gray-300 mb-2 max-w-3xl w-full px-4">
          Replying to message #{replyTo}
          <button
            onClick={() => setReplyTo(null)}
            className="ml-4 text-gray-400 hover:text-gray-200"
          >Cancel</button>
        </div>
      )}

      <div className="w-full max-w-3xl px-4 py-3">
        <input
          type="file"
          accept="image/*,video/*"
          onChange={(e) => setMediaFile(e.target.files?.[0] || null)}
          className="text-gray-300 mb-2"
        />
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSend()}
            placeholder="Type your message..."
            className="flex-1 px-4 py-3 rounded bg-zinc-900 text-white border border-zinc-700 outline-none"
          />
          <button
            onClick={handleSend}
            className="px-6 py-3 bg-blue-600 text-white font-semibold rounded"
          >Send</button>
        </div>
      </div>

      <button
        onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
        className="absolute top-2 right-2 text-xs px-3 py-1 bg-gray-600 text-white rounded"
      >{theme === "dark" ? "☀ Light" : "🌙 Dark"}</button>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient("https://qvijyrpjcdvqzamtcqyo.supabase.co", "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aWp5cnBqY2R2cXphbXRjcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzg3NTQsImV4cCI6MjA2OTAxNDc1NH0.q_lMSlzli2wKSaOp9wpPv2b1nSxIspIIfU5YxyNY0vc");
const profiles = [
  {
    id: 1,
    name: "Amina Abid",
    image: "/Amina.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    extraImage: null,
    extraVideo: null,  
    class: "11 Pink",
    age: 16,
    weight: "Unknown",
    height: "Unknown",
    rls: "Single",
  },
  {
    id: 2,
    name: "Minahil Fatima",
    image: "https://randomuser.me/api/portraits/women/20.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    extraImage: "https://randomuser.me/api/portraits/women/20.jpg",
    extraVideo: "https://www.w3schools.com/html/mov_bbb.mp4",
    class: "11 Pink",
    age: 16,
    weight: "Unknown",
    height: "Unknown",
    rls: "Single",
  },
  {
    id: 3,
    name: "Jweriyah Faizi",
    image: "https://randomuser.me/api/portraits/women/21.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    class: "11 Pink",
    age: 16,
    weight: "Unknown",
    height: "Unknown",
    rls: "Single",
  },
  {
    id: 4,
    name: "Test Profile 4",
    image: "https://randomuser.me/api/portraits/women/40.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    class: "F",
    age: 16,
    weight: "60kg",
    height: "5'6\"",
    rls: "Single",
  },
  {
    id: 5,
    name: "Test Profile 5",
    image: "https://randomuser.me/api/portraits/men/50.jpg",
    video: "https://www.w3schools.com/html/mov_bbb.mp4",
    class: "G",
    age: 17,
    weight: "68kg",
    height: "5'11\"",
    rls: "Single",
  },
];

function DotBackground() {
  type Dot = {
    top: string;
    left: string;
    size: string;
    opacity: number;
    duration: number;
    x: number;
    y: number;
  };

  const [dots, setDots] = useState<Dot[]>([]);
  useEffect(() => {
    const totalDots = 160;
    const newDots = Array.from({ length: totalDots }, () => ({
      top: `${Math.random() * 100}%`,
      left: `${Math.random() * 100}%`,
      size: `${Math.random() * 2 + 1}px`,
      opacity: Math.random() * 0.5 + 0.2,
      duration: Math.random() * 1.5 + 0.5,
      x: Math.random() * 100 - 50,
      y: Math.random() * 100 - 50,
    }));
    setDots(newDots);
  }, []);

  return (
    <div style={{ position: "absolute", inset: 0, zIndex: 0, overflow: "hidden", pointerEvents: "none" }}>
      {dots.map((dot, i) => (
        <motion.div
          key={i}
          initial={{ x: 0, y: 0 }}
          animate={{ x: [0, dot.x, 0], y: [0, dot.y, 0] }}
          transition={{
            duration: dot.duration,
            repeat: Infinity,
            repeatType: "mirror",
            ease: "easeInOut",
          }}
          style={{
            position: "absolute",
            top: dot.top,
            left: dot.left,
            width: dot.size,
            height: dot.size,
            backgroundColor: "#aaa",
            borderRadius: "50%",
            opacity: dot.opacity,
          }}
        />
      ))}
    </div>
  );
}

export default function HomePage() {
  const [darkMode, setDarkMode] = useState(true);
  const [search, setSearch] = useState("");
  const [ratings, setRatings] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const [loading, setLoading] = useState(true);
  const [progress, setProgress] = useState(0);
  const [showCurtain, setShowCurtain] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            setShowCurtain(true);
            setTimeout(() => setLoading(false), 600);
          }, 300);
          return 100;
        }
        return prev + 2.5;
      });
    }, 30);
    return () => clearInterval(interval);
  }, []);

  const handleRate = async (id, value) => {
    console.log("Rating triggered", { id, value });
    if (ratings[id]) return;

    const { error } = await supabase.from("ratings").insert([{ profile_id: id, score: value }]);
    if (error) {
      console.error("Rating failed:", error.message);
      return;
    }

    setRatings((prev) => ({ ...prev, [id]: value }));
    setToastMsg(`You rated ${value}/10`);
    setTimeout(() => setToastMsg(null), 2000);
  };

  const filteredProfiles = search.trim()
    ? profiles.filter((profile) => profile.name.toLowerCase().startsWith(search.toLowerCase()))
    : [];

  return (
    <div style={{ background: darkMode ? "black" : "white", color: darkMode ? "white" : "black", minHeight: "100vh", padding: "2rem", position: "relative", transition: "all 0.3s ease"}}>
      <DotBackground />
      <div style={{ position: "relative", zIndex: 1 }}>
        <nav style={{ display: "flex", justifyContent: "space-between", marginBottom: "2rem" }}>
          <div></div>
          <div style={{ display: "flex", gap: "2rem" }}>
            <Link href="/livegcpage" style={{ color: darkMode ? "#ccc" : "#333", textDecoration: "none" }}>Live Chat</Link>
            <Link href="/scoreboard" style={{ color: darkMode ? "#ccc" : "#333", textDecoration: "none" }}>Scoreboard</Link>
          </div>
          <button onClick={() => setDarkMode(!darkMode)} style={{ background: "none", border: "1px solid #444", fontSize: "0.9rem", padding: "0.2rem 0.4rem", borderRadius: "6px", cursor: "pointer", color: darkMode ? "white" : "black", display: "flex", alignItems: "center", gap: "0.5rem" }}>
            {darkMode ? <Moon size={17} /> : <Sun size={17} />} {darkMode ? "Dark Mode" : "Light Mode"}
          </button>
        </nav>

        <h1 style={{ textAlign: "center", fontSize: "2rem", marginBottom: "1rem", fontWeight: 800 }}>
          Every BDC 11th Grade Girl<br />Is Listed Right Here — Unfiltered
        </h1>
        <p style={{ color: darkMode ? "#aaa" : "#555", textAlign: "center", marginBottom: "2rem" }}>
          We — the Admins — are untraceable. Don’t be oversmart. Search your girl, uncover the truth, and rate her anonymously out of 10.
        </p>

        <div style={{ textAlign: "center", marginBottom: "2rem" }}>
          <input
            type="text"
            placeholder="Search your girl..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ padding: "1rem", borderRadius: "10px", border: "1px solid #444", background: darkMode ? "#111" : "#eee", color: darkMode ? "white" : "black", width: "100%", maxWidth: "420px" }}
          />
        </div>

        {filteredProfiles.length > 0 && (
          <div style={{ 
            display: "grid", 
            gap: "1.5rem", 
            gridTemplateColumns:
              filteredProfiles.length === 1
              ? "1fr"
              :filteredProfiles.length === 2
              ? "repeat(2, 1fr)"
              : "repeat (auto-fit, minmax(300px, 1fr))",
              maxWidth: "100%",
              overflowX: "hidden",
              padding: "0 1rem",
              boxSizing: "border-box",
             }}>
            {filteredProfiles.map((profile) => (
              <motion.div
                key={profile.id}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                whileHover={{ scale: 1.04 }}
                transition={{ duration: 0.35 }}
                style={{ background: darkMode ? "#0c0c0c" : "#f9f9f9", borderRadius: "1.5rem", padding: "1.6rem", textAlign: "center", border: "1px solid #222", boxShadow: "0 0 12px rgba(0,0,0,0.1)" }}
              >
                <div style={{ display: "grid", gap: "0.5rem", marginBottom: "1rem", flexWrap: "wrap", gridTemplateColumns: "repeat(auto-fit, minmax (300px, 1fr))", width: "100%", maxWidth: "100%", boxSizing: "border-box", padding: "0 1rem" }}>
  <img
    src={profile.image}
    alt={profile.name}
    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
  />
  <video
    src={profile.video}
    muted
    autoPlay
    loop
    style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
  />
  
  {profile.extraImage && (
    <img
      src={profile.extraImage}
      alt={profile.name + " extra"}
      style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
    />
  )}

  {profile.extraVideo && (
    <video
      src={profile.extraVideo}
      muted
      autoPlay
      loop
      style={{ width: "150px", height: "150px", objectFit: "cover", borderRadius: "10px" }}
    />
  )}
</div>

                <h3 style={{ color: darkMode ? "#eee" : "#222", marginBottom: "0.6rem" }}>{profile.name}</h3>
                <p>🎓 Class: {profile.class}</p>
                <p>🎂 Age: {profile.age}</p>
                <p>⚖️ Weight: {profile.weight}</p>
                <p>📏 Height: {profile.height}</p>
                <p>❤️ Status: {profile.rls}</p>
                <p style={{ marginTop: "1rem", marginBottom: "0.4rem", color: darkMode ? "#aaa" : "#555", fontSize: "0.9rem", fontWeight: 600 }}>Rate here:</p>
                <div style={{ display: "flex", justifyContent: "center", flexWrap: "wrap" }}>
                  {[...Array(10)].map((_, i) => (
                    <motion.button
                      whileTap={{ scale: ratings[profile.id] ? 1 : 0.9 }}
                      key={i + 1}
                      disabled={!!ratings[profile.id]}
                      onClick={() => handleRate(profile.id, i + 1)}
                      style={{
                        padding: "0.4rem 0.7rem",
                        margin: "0.2rem",
                        borderRadius: "999px",
                        border: "1px solid #444",
                        background: ratings[profile.id] === i + 1 ? "#555" : "#111",
                        color: "#ccc",
                        fontWeight: "bold",
                        fontSize: "0.9rem",
                        cursor: ratings[profile.id] ? "not-allowed" : "pointer",
                        opacity: ratings[profile.id] ? 0.6 : 1,
                      }}
                    >
                      {i + 1}
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        )}

        <AnimatePresence>
          {toastMsg && (
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              style={{
                position: "fixed",
                bottom: "2rem",
                left: "50%",
                transform: "translateX(-50%)",
                background: "#111",
                color: "#fff",
                padding: "0.75rem 1.5rem",
                borderRadius: "12px",
                fontSize: "0.95rem",
                border: "1px solid #333",
                zIndex: 1000,
              }}
            >
              {toastMsg}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

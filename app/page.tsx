"use client";

import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { Sun, Moon } from "lucide-react";
import { createClient } from "@supabase/supabase-js";
import { v4 as uuidv4 } from "uuid";

const supabase = createClient(
  "https://qvijyrpjcdvqzamtcqyo.supabase.co",
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InF2aWp5cnBqY2R2cXphbXRjcXlvIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTM0Mzg3NTQsImV4cCI6MjA2OTAxNDc1NH0.q_lMSlzli2wKSaOp9wpPv2b1nSxIspIIfU5YxyNY0vc"
);

/* DEMO PROFILES — SAFE (18+) with new fields */
const profiles = [
  {
    id: 1,
    name: "Amina Abid",
    image: "/profile 1.png",
    age: 16,
    dob: "2009-1-1",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "Single",
    media: [
      { type: "image", src: "/profile 1.png" },
      { type: "image", src: "/profile 1.png" },
    ],
  },
  {
    id: 2,
    name: "Minahil Fatima",
    image: "/profile 2.png",
    age: 16,
    dob: "------",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "In a relationship with ---",
    media: [
      { type: "image", src: "/profile 2.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 2.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
  {
    id: 3,
    name: "Jweriyah Faizi",
    image: "/profile 3.png",
    age: 16,
    dob: "---",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "Single",
    media: [
      { type: "image", src: "/profile 3.png" },
      { type: "image", src: "/profile 3.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 3.png" },
      { type: "image", src: "/profile 3.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
  {
    id: 4,
    name: "Test Profile 4",
    image: "/profile 4.png",
    age: 16,
    dob: "------",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "In a relationship with ---",
    media: [
      { type: "image", src: "/profile 4.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 4.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
  {
    id: 5,
    name: "Test Profile 5",
    image: "/profile 5.png",
    age: 16,
    dob: "------",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "In a relationship with ---",
    media: [
      { type: "image", src: "/profile 5.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 5.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
  {
    id: 6,
    name: "Test Profile 6",
    image: "/profile 1.png",
    age: 16,
    dob: "------",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "In a relationship with ---",
    media: [
      { type: "image", src: "/profile 1.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 1.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
  {
    id: 7,
    name: "Test Profile 7",
    image: "/profile 1.png",
    age: 16,
    dob: "------",
    location: "Scroll down to vote",
    class: "11 Pink",
    rls: "In a relationship with ---",
    media: [
      { type: "image", src: "/profile 1.png" },
      { type: "video", src: "https://www.w3schools.com/html/mov_bbb.mp4" },
      { type: "image", src: "/profile 1.png" },
      { type: "video", src: "https://interactive-examples.mdn.mozilla.net/media/cc0-videos/flower.mp4" },
    ],
  },
];

export default function HomePage() {
  const ACCENT = "#7ee7c6"; // neon accent
  const [isLightMode, setIsLightMode] = useState(false);
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [ratings, setRatings] = useState({});
  const [toastMsg, setToastMsg] = useState(null);
  const [userId, setUserId] = useState(null);

  // modal + gallery
  const [selectedProfile, setSelectedProfile] = useState(null);
  const [galleryOpen, setGalleryOpen] = useState(false);
  const [galleryIndex, setGalleryIndex] = useState(0);
  const galleryRef = useRef(null);

  // debounce search
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 160);
    return () => clearTimeout(t);
  }, [search]);

  // filtered profiles only when searched
  const filteredProfiles = debouncedSearch
    ? profiles.filter((p) => p.name.toLowerCase().startsWith(debouncedSearch.toLowerCase()))
    : [];

  // user id init
  useEffect(() => {
    let uid = localStorage.getItem("user_id");
    if (!uid) {
      uid = uuidv4();
      localStorage.setItem("user_id", uid);
    }
    setUserId(uid);
  }, []);

  // fetch ratings (optional)
// rate handler
const handleRate = async (id, value) => {
  if (ratings[id]) return;
  try {
    const { error } = await supabase.from("ratings").insert([{ profile_id: id, score: value }]);
    if (!error) {
      setRatings((s) => ({ ...s, [id]: value }));
      setToastMsg(`You rated ${value}/10`);
      setTimeout(() => setToastMsg(null), 2000);
    }
  } catch (e) {
    console.error(e);
  }
};

  // modal + gallery keyboard handlers
  useEffect(() => {
    const onKey = (e) => {
      if (e.key === "Escape") {
        if (galleryOpen) setGalleryOpen(false);
        else setSelectedProfile(null);
      } else if (e.key === "ArrowRight" && galleryOpen) {
        setGalleryIndex((i) => (i + 1) % (selectedProfile?.media?.length || 1));
      } else if (e.key === "ArrowLeft" && galleryOpen) {
        setGalleryIndex((i) => (i - 1 + (selectedProfile?.media?.length || 1)) % (selectedProfile?.media?.length || 1));
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [galleryOpen, selectedProfile]);

  // touch swipe for gallery
  useEffect(() => {
    const el = galleryRef.current;
    if (!el) return;
    let startX = 0;
    let moved = false;
    const onTouchStart = (e) => {
      startX = e.touches[0].clientX;
      moved = false;
    };
    const onTouchMove = (e) => {
      const dx = e.touches[0].clientX - startX;
      if (Math.abs(dx) > 20) moved = true;
    };
    const onTouchEnd = (e) => {
      if (!moved) return;
      const endX = e.changedTouches[0].clientX;
      const dx = endX - startX;
      if (dx < -40) setGalleryIndex((i) => (i + 1) % (selectedProfile.media.length));
      else if (dx > 40) setGalleryIndex((i) => (i - 1 + selectedProfile.media.length) % selectedProfile.media.length);
    };
    el.addEventListener("touchstart", onTouchStart);
    el.addEventListener("touchmove", onTouchMove);
    el.addEventListener("touchend", onTouchEnd);
    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [galleryRef.current, selectedProfile]);

  const openGallery = (profile, index = 0) => {
    setSelectedProfile(profile);
    setGalleryIndex(index);
    setGalleryOpen(true);
  };

  const cardBg = isLightMode ? "#fff" : "#060606";
  const pageStyle = { background: isLightMode ? "#f5f6f8" : "#000", color: isLightMode ? "#0f1720" : "#fff" };

  return (
    <div className="relative min-h-screen overflow-hidden" style={pageStyle}>
      {/* backgrounds: dot + scanline */}
      <div aria-hidden className="absolute inset-0 -z-20" style={{ backgroundImage: "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.95) 1px, transparent 1px)", backgroundSize: "18px 18px", opacity: isLightMode ? 0.03 : 0.08, mixBlendMode: "screen" }} />
      <div aria-hidden className="absolute inset-0 -z-10" style={{ backgroundImage: "radial-gradient(circle, rgba(255,255,255,0.02) 1px, transparent 1px)", backgroundSize: "350% 350%", animation: "bgShift 20s linear infinite", opacity: isLightMode ? 0.02 : 0.06 }} />
      <div aria-hidden className="absolute inset-0 -z-5 pointer-events-none" style={{ background: "repeating-linear-gradient(180deg, rgba(255,255,255,0.02) 0px, rgba(255,255,255,0.01) 1px, transparent 2px)", mixBlendMode: "overlay", opacity: isLightMode ? 0.35 : 0.5 }} />

      <div className="relative z-10 max-w-4xl mx-auto px-6 py-10">
        {/* nav */}
        <nav className="flex items-center justify-center mb-8">
          <div className="flex items-center gap-3">
          </div>

          <div className="flex items-center gap-4">
            <Link href="/livegcpage" className="text-sm" style={{ color: isLightMode ? "#374151" : "#9ca3af" }}>
  Live Chat
</Link>
<Link href="/scoreboard" className="text-sm" style={{ color: isLightMode ? "#374151" : "#9ca3af" }}>
  Scoreboard
</Link>
<Link href="/ratinggame" className="text-sm" style={{ color: isLightMode ? "#374151" : "#9ca3af" }}>
  RatingGame
</Link>
            <button onClick={() => setIsLightMode((s) => !s)} className="flex items-center gap-2 px-3 py-1 rounded-md border" style={{ borderColor: isLightMode ? "rgba(0,0,0,0.08)" : "rgba(255,255,255,0.06)", background: isLightMode ? "#fff" : "transparent" }}>
              {isLightMode ? <Sun size={16} /> : <Moon size={16} />}
              <span className="text-xs" style={{ color: isLightMode ? "#111" : "#d1d5db" }}>{isLightMode ? "Light" : "Dark"}</span>
            </button>
          </div>
        </nav>

        {/* title */}
        <header className="text-center mb-6">
          <h1 className="text-3xl md:text-4xl font-extrabold leading-tight" style={{ color: isLightMode ? "#0f1720" : "#fff", textShadow: isLightMode ? "none" : `0 0 18px ${ACCENT}22` }}>
            Every BDC Grade 11 Girl Profile — Unfiltered
          </h1>
          <p className="text-sm mt-2" style={{ color: isLightMode ? "#6b7280" : "#9caaf" }}>
            Search names to reveal profiles. Don't mess with us — your private data will be next babe.
          </p>
        </header>

        {/* search */}
        <section className="flex justify-center">
          <div className="w-full max-w-2xl">
            <input
              aria-label="Search profiles"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setSelectedProfile(null); }}
              placeholder="Search by name..."
              className="w-full px-4 py-3 rounded-xl border outline-none"
              style={{
                background: isLightMode ? "#fff" : "#000",
                color: isLightMode ? "#111" : "#fff",
                borderColor: isLightMode ? "#e6e9ee" : "rgba(255,255,255,0.06)",
                boxShadow: isLightMode ? "0 4px 20px rgba(2,6,23,0.04)" : `0 0 28px ${ACCENT}10 inset`,
              }}
            />

            {/* only show results when there is a search */}
            <div className="mt-3 w-full">
              <AnimatePresence>
                {filteredProfiles.length > 0 && (
                  <motion.ul initial={false} animate="show" exit="hidden" className="grid gap-2" variants={{ show: { transition: { staggerChildren: 0.03 } } }}>
                    {filteredProfiles.map((p) => (
                      <motion.li
                        key={p.id}
                        onClick={() => setSelectedProfile(p)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => e.key === "Enter" && setSelectedProfile(p)}
                        className="flex items-center gap-3 p-3 rounded-lg cursor-pointer select-none"
                        style={{
                          background: isLightMode ? "#fff" : "rgba(255,255,255,0.02)",
                          border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}`,
                          backdropFilter: isLightMode ? "none" : "blur(6px)",
                          transition: "transform 120ms ease, box-shadow 160ms ease",
                        }}
                        whileHover={{ scale: 1.01 }}
                        variants={{
                          hidden: { opacity: 0, y: 8 },
                          visible: { opacity: 1, y: 0 },
                        }}
                        initial="hidden"
                        animate="visible"
                        exit="hidden"
                        transition={{ type: "tween", duration: 0.14 }}
                      >
                        <div className="relative w-10 h-10 rounded-full overflow-hidden shrink-0" style={{ border: `1px solid ${isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.04)"}` }}>
                          <Image src={p.image} alt={p.name} fill style={{ objectFit: "cover" }} />
                        </div>

                        <div>
                          <div className="text-sm font-medium" style={{ color: isLightMode ? "#111" : "#fff" }}>{p.name}</div>
                          <div className="text-xs" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>• {p.class}</div>
                        </div>

                        <div className="ml-auto text-xs" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>open →</div>
                      </motion.li>
                    ))}
                  </motion.ul>
                )}
              </AnimatePresence>
            </div>
          </div>
        </section>
      </div>

      {/* PROFILE MODAL — improved, intuitive layout */}
      <AnimatePresence>
        {selectedProfile && !galleryOpen && (
          <motion.div className="fixed inset-0 z-50 flex items-start justify-center p-6 overflow-auto" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={() => setSelectedProfile(null)} style={{ backdropFilter: "blur(6px)", WebkitOverflowScrolling: "touch" }}>
            <motion.div
              className="w-full max-w-3xl rounded-2xl p-6 relative"
              onClick={(e) => e.stopPropagation()}
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ type: "spring", stiffness: 220, damping: 22 }}
              style={{
                background: cardBg,
                border: `1px solid ${isLightMode ? "rgba(2,6,23,0.06)" : "rgba(255,255,255,0.04)"}`,
                boxShadow: isLightMode ? "0 10px 40px rgba(2,6,23,0.06)" : `0 20px 60px ${ACCENT}11`,
              }}
            >
              <div className="flex flex-col md:flex-row gap-6">
                {/* Left: avatar + quick actions */}
                <div className="w-full md:w-44 flex flex-col items-center gap-4">
                  <div className="relative w-36 h-36 rounded-xl overflow-hidden" style={{ border: `1px solid ${isLightMode ? "#eee" : "rgba(255,255,255,0.04)"}` }}>
                    <Image src={selectedProfile.image} alt={selectedProfile.name} fill style={{ objectFit: "cover" }} />
                  </div>

                  <div className="w-full text-center">
                    <div className="text-lg font-bold" style={{ color: isLightMode ? "#0f1720" : ACCENT }}>{selectedProfile.name}</div>
                    <div className="text-xs" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>{selectedProfile.location}</div>
                  </div>

                  <div className="w-full flex gap-2">
                    <button onClick={() => openGallery(selectedProfile, 0)} className="flex-1 px-3 py-2 rounded-md text-sm" style={{ background: isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.02)", border: `1px solid ${isLightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"}` }}>
                      Click for Full Experience😉
                    </button>
                    <button onClick={() => setSelectedProfile(null)} className="px-3 py-2 rounded-md text-sm" style={{ backgroundColor: "#FF2400", border: `1px solid ${isLightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.04)"}` }}>
                      Close Profile
                    </button>
                  </div>
                </div>

                {/* Right: info grid + media + rating */}
                <div className="flex-1">
                  {/* top row info */}
                  <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="px-3 py-2 rounded-md" style={{ background: isLightMode ? "#fafafa" : "rgba(255,255,255,0.02)", border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}` }}>
                      <div className="text-xs text-muted" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>Age</div>
                      <div className="font-medium">{selectedProfile.age}</div>
                    </div>

                    <div className="px-3 py-2 rounded-md" style={{ background: isLightMode ? "#fafafa" : "rgba(255,255,255,0.02)", border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}` }}>
                      <div className="text-xs text-muted" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>Relationship</div>
                      <div className="font-medium">{selectedProfile.rls}</div>
                    </div>

                    <div className="px-3 py-2 rounded-md" style={{ background: isLightMode ? "#fafafa" : "rgba(255,255,255,0.02)", border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}` }}>
                      <div className="text-xs text-muted" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>Birth date</div>
                      <div className="font-medium">{selectedProfile.dob}</div>
                    </div>

                    <div className="px-3 py-2 rounded-md" style={{ background: isLightMode ? "#fafafa" : "rgba(255,255,255,0.02)", border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}` }}>
                      <div className="text-xs text-muted" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>Class</div>
                      <div className="font-medium">{selectedProfile.class}</div>
                    </div>
                  </div>

                  {/* media grid adaptive */}
                  <div className="grid gap-2 mb-4" style={{ gridTemplateColumns: `repeat(${Math.min(3, Math.max(1, selectedProfile.media.length))}, 1fr)` }}>
                    {selectedProfile.media.map((m, idx) => (
                      <div key={idx} className="rounded-md overflow-hidden cursor-pointer" onClick={() => openGallery(selectedProfile, idx)} style={{ minHeight: 96, border: `1px solid ${isLightMode ? "#eef2f7" : "rgba(255,255,255,0.03)"}` }}>
                        {m.type === "image" ? (
                          <Image src={m.src} alt={`${selectedProfile.name}-${idx}`} width={800} height={600} style={{ objectFit: "cover", width: "100%", height: "100%" }} />
                        ) : (
                          <video
                          src={m.src}
                          muted
                          loop
                          autoPlay
                          playsInline
                          style={{ width: "100%", height: "100%", objectFit: "cover" }}
                                />

                        )}
                      </div>
                    ))}
                  </div>

                  {/* rating */}
                  <div>
                    <div className="text-xs mb-2" style={{ color: isLightMode ? "#6b7280" : "#9ca3af" }}>Rate (once)</div>
                    <div className="flex flex-wrap gap-2">
                      {[...Array(10)].map((_, i) => {
                        const val = i + 1;
                        const sel = ratings[selectedProfile.id] === val;
                        return (
                          <motion.button key={val} onClick={() => handleRate(selectedProfile.id, val)} disabled={!!ratings[selectedProfile.id]} whileTap={{ scale: sel ? 1 : 0.93 }} className="px-3 py-1 rounded-full text-sm font-semibold" style={{ background: sel ? `${ACCENT}20` : isLightMode ? "#f3f4f6" : "rgba(255,255,255,0.02)", color: sel ? ACCENT : (isLightMode ? "#111" : "#d6d6d6"), border: `1px solid ${isLightMode ? "rgba(0,0,0,0.06)" : "rgba(255,255,255,0.03)"}`, cursor: ratings[selectedProfile.id] ? "not-allowed" : "pointer" }}>
                            {val}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* FULL-SCREEN GALLERY */}
      <AnimatePresence>
        {galleryOpen && selectedProfile && (
          <motion.div className="fixed inset-0 z-60 flex items-center justify-center p-4" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={{ background: "rgba(0,0,0,0.85)" }} onClick={() => setGalleryOpen(false)}>
            <div ref={galleryRef} className="w-full max-w-4xl relative" onClick={(e) => e.stopPropagation()}>
              <motion.div initial={{ x: 60, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -60, opacity: 0 }} transition={{ type: "spring", stiffness: 220, damping: 26 }} className="w-full rounded-lg overflow-hidden" style={{ minHeight: 320, display: "flex", alignItems: "center", justifyContent: "center" }}>
                {selectedProfile.media[galleryIndex]?.type === "image" ? (
                  <Image src={selectedProfile.media[galleryIndex].src} alt="gallery" width={1600} height={900} style={{ objectFit: "contain", maxHeight: "80vh" }} />
                ) : (
                  <video src={selectedProfile.media[galleryIndex].src} controls autoPlay style={{ maxHeight: "80vh", width: "100%", objectFit: "contain" }} />
                )}
              </motion.div>

              <div className="absolute inset-0 flex items-center justify-between pointer-events-none">
                <button className="pointer-events-auto p-3 rounded-full" onClick={() => setGalleryIndex((i) => (i - 1 + selectedProfile.media.length) % selectedProfile.media.length)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>◀</button>
                <button className="pointer-events-auto p-3 rounded-full" onClick={() => setGalleryIndex((i) => (i + 1) % selectedProfile.media.length)} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)" }}>▶</button>
              </div>

              <div className="flex items-center justify-between mt-3 text-sm" style={{ color: isLightMode ? "#374151" : "#d1d5db" }}>
                <div>{selectedProfile.name} — {galleryIndex + 1}/{selectedProfile.media.length}</div>
                <div className="flex gap-2">
                  <button onClick={() => setGalleryOpen(false)} className="px-3 py-1 rounded-md" style={{ backgroundColor: "#FF2400", border: "1px solid rgba(255,255,255,0.03)" }}>Close Preview</button>
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* toast */}
      <AnimatePresence>
        {toastMsg && (
          <motion.div initial={{ y: 24, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 24, opacity: 0 }} className="fixed left-1/2 bottom-8 -translate-x-1/2 z-50 px-4 py-2 rounded-lg" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.04)", color: ACCENT }}>
            {toastMsg}
          </motion.div>
        )}
      </AnimatePresence>

      <style jsx global>{`
        @keyframes bgShift {
          0% { background-position: 0% 0%; }
          50% { background-position: 50% 50%; }
          100% { background-position: 0% 0%; }
        }

        /* subtle scrollbar */
        ::-webkit-scrollbar { width: 10px; height: 10px; }
        ::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.03); border-radius: 999px; }
      `}</style>
    </div>
  );
}

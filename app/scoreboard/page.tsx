'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { createClient } from '@supabase/supabase-js';

// Replace with your actual Supabase project URL and anon key:
const supabase = createClient(
  'https://dggdbwpyhvoopfnocvau.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRnZ2Rid3B5aHZvb3Bmbm9jdmF1Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTExMzg0NTksImV4cCI6MjA2NjcxNDQ1OX0.ZWMK6UNvjS7SJekArWxs_BVEa_1K7Wev5vmL_mWTF5o'
);

const profiles = [
  { id: 1, name: 'Amina Abid' },
  { id: 2, name: 'Minahil Fatima' },
  { id: 3, name: 'Jweriyah Faizi' },
  { id: 4, name: 'Test Profile 4' },
  { id: 5, name: 'Test Profile 5' },
];

export default function ScoreboardPage() {
  const [scoreboard, setScoreboard] = useState([]);
  const [darkMode, setDarkMode] = useState(true);

  const fetchRatings = async () => {
    const { data: ratings, error } = await supabase.from('ratings').select('*');
    console.log('Fetched ratings:', ratings);
    if (error) {
      console.error('Error fetching ratings:', error.message);
      return;
    }

    const grouped = {};
    for (const r of ratings) {
      if (!grouped[r.profile_id]) {
        grouped[r.profile_id] = { total: 0, count: 0 };
      }
      grouped[r.profile_id].total += r.score;
      grouped[r.profile_id].count += 1;
    }

    const results = Object.entries(grouped).map(([id, stats]) => {
      const profile = profiles.find((p) => p.id === parseInt(id));
      return {
        id: parseInt(id),
        name: profile?.name || 'Unknown',
        // @ts-ignore
        average: (stats.total / stats.count).toFixed(2),
        // @ts-ignore
        count: stats.count,
      };
    });
        // @ts-ignore
    results.sort((a, b) => b.average - a.average);
    setScoreboard(results);
  };

  useEffect(() => {
    fetchRatings();

    // ✅ Real-time subscription
    const subscription = supabase
      .channel('ratings-realtime')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'ratings' },
        () => {
          fetchRatings(); // Re-fetch on insert/update/delete
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(subscription);
    };
  }, []);

  const getMedal = (index) => {
    if (index === 0) return '🥇';
    if (index === 1) return '🥈';
    if (index === 2) return '🥉';
    return '';
  };

  const bg = darkMode ? '#000' : '#fff';
  const text = darkMode ? '#fff' : '#000';
  const secondary = darkMode ? '#ccc' : '#444';
  const border = darkMode ? '#222' : '#ddd';
  const row1 = darkMode ? '#0c0c0c' : '#f9f9f9';
  const row2 = darkMode ? '#111' : '#fff';

  return (
    <div
      style={{
        background: bg,
        color: text,
        padding: '1.5rem',
        minHeight: '100vh',
        fontFamily: 'sans-serif',
        transition: 'all 0.3s ease',
      }}
    >
      {/* 🔝 Navbar */}
      <nav
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2rem',
          fontSize: '1rem',
        }}
      >
        <div style={{ display: 'flex', gap: '2rem' }}>
          <Link href="/" style={{ color: secondary, textDecoration: 'none' }}>
            🏠 Home
          </Link>
          <Link href="/livegcpage" style={{ color: secondary, textDecoration: 'none' }}>
            💬 Live Chat
          </Link>
        </div>
        <button
          onClick={() => setDarkMode(!darkMode)}
          style={{
            background: 'transparent',
            color: secondary,
            border: `1px solid ${border}`,
            borderRadius: '8px',
            padding: '0.4rem 0.8rem',
            cursor: 'pointer',
            fontSize: '0.9rem',
          }}
        >
          {darkMode ? '☀️ Light Mode' : '🌙 Dark Mode'}
        </button>
      </nav>

      {/* 📊 Title + Info */}
      <h1
        style={{
          textAlign: 'center',
          fontSize: 'clamp(1.5rem, 5vw, 2.3rem)',
          marginBottom: '0.5rem',
        }}
      >
        📊 Live Rating Scoreboard
      </h1>
      <p
        style={{
          textAlign: 'center',
          fontSize: '0.95rem',
          color: secondary,
          marginBottom: '2rem',
        }}
      >
        (Average rating is calculated out of 10)
      </p>

      {/* 📉 Table */}
      {scoreboard.length === 0 ? (
        <p style={{ textAlign: 'center', color: secondary }}>No ratings yet.</p>
      ) : (
        <table
          style={{
            width: '100%',
            borderCollapse: 'collapse',
            textAlign: 'center',
            fontSize: '0.95rem',
            transition: 'all 0.3s ease',
          }}
        >
          <thead>
            <tr style={{ backgroundColor: row2, color: secondary }}>
              <th style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>#</th>
              <th style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>Name</th>
              <th style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>Average</th>
              <th style={{ padding: '1rem', borderBottom: `1px solid ${border}` }}>Votes</th>
            </tr>
          </thead>
          <tbody>
            {scoreboard.map((profile, i) => (
              <tr
                key={profile.id}
                style={{
                  backgroundColor: i % 2 === 0 ? row1 : row2,
                }}
              >
                <td style={{ padding: '1rem' }}>{i + 1} {getMedal(i)}</td>
                <td style={{ padding: '1rem' }}>{profile.name}</td>
                <td style={{ padding: '1rem' }}>{profile.average}</td>
                <td style={{ padding: '1rem' }}>{profile.count}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}

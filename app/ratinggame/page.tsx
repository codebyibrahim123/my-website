'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

export default function RatingGamePage() {
  const [stage, setStage] = useState<'intro' | 'game' | 'winner'>('intro');
  const [profiles, setProfiles] = useState<any[]>([]);
  const [currentPair, setCurrentPair] = useState([0, 1]);
  const [winner, setWinner] = useState<any>(null);
  const [isDark, setIsDark] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [winners, setWinners] = useState<any[]>([]);
  const [loadingWinners, setLoadingWinners] = useState(false);
  const [winnersError, setWinnersError] = useState<string | null>(null);

  function shuffle(arr: any[]) {
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }

  const fetchWinners = async () => {
    setLoadingWinners(true);
    setWinnersError(null);
    const { data, error } = await supabase
      .from('scoreboard')
      .select('id, name, wins, image')
      .order('wins', { ascending: false });
    if (error) {
      setWinnersError(error.message);
      console.error('Error fetching winners:', error);
    } else {
      setWinners(data || []);
    }
    setLoadingWinners(false);
  };

  useEffect(() => {
    const fetchProfiles = async () => {
      const { data, error } = await supabase.from('rating_profiles').select('*');
      if (error) {
        console.error('Error fetching profiles:', error);
      } else if (data) {
        setProfiles(shuffle(data));
      }
    };
    fetchProfiles();
    fetchWinners();
  }, []);

  async function handleVote(winnerIndex: number) {
    const winnerProfile = profiles[currentPair[winnerIndex]];
    const nextIndex = Math.max(...currentPair) + 1;

    if (nextIndex >= profiles.length) {
      setWinner(winnerProfile);
      setStage('winner');

      console.log("Looking for scoreboard entry with ID:", winnerProfile.id);

      const { data: existing, error: selectError } = await supabase
        .from('scoreboard')
        .select('*')
        .eq('id', winnerProfile.id)
        .single();

      if (selectError && selectError.code !== 'PGRST116') {
        console.error('Select error:', selectError);
        return;
      }

      if (existing) {
        const updatedWins = existing.wins + 1;
        const { error: updateError } = await supabase
          .from('scoreboard')
          .update({ wins: existing.wins + 1 })
          .eq('id', winnerProfile.id);

        if (updateError) {
          console.error('Update error:', updateError);
        } else {
        console.log (`Updated Wins to ${updatedWins}`);
          await fetchWinners();
        }
      } else {
        const { error: insertError } = await supabase.from('scoreboard').insert([
          {
            id: winnerProfile.id,
            name: winnerProfile.name,
            image: winnerProfile.image,
            wins: 1,
          },
        ]);

        if (insertError) {
          console.error('Insert error:', insertError);
        } else {
            console.log("Inserted new winner with 1 win")
          await fetchWinners();
        }
      }
    } else {
      setCurrentPair([profiles.indexOf(winnerProfile), nextIndex]);
    }
  }

  function exitGame() {
    setShowExitModal(false);
    setCurrentPair([0, 1]);
    setStage('intro');
  }

  function playAgain() {
    setProfiles(shuffle([...profiles]));
    setCurrentPair([0, 1]);
    setWinner(null);
    setStage('intro');
  }

  return (
    <div className={`${isDark ? 'bg-black text-white' : 'bg-white text-black'} min-h-screen p-4 relative`}>
      {showExitModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black/50 z-50">
          <div className={`rounded-xl shadow-lg p-6 w-full max-w-sm ${isDark ? 'bg-zinc-900' : 'bg-white text-black'}`}>
            <h2 className="text-xl font-bold mb-4">Exit Game?</h2>
            <p className="mb-6">Are you sure you want to leave this incomplete game?</p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowExitModal(false)}
                className={`px-4 py-2 rounded ${isDark ? 'bg-zinc-700 hover:bg-zinc-600' : 'bg-zinc-200 hover:bg-zinc-300'}`}
              >
                Stay
              </button>
              <button
                onClick={exitGame}
                className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              >
                Exit
              </button>
            </div>
          </div>
        </div>
      )}

      {stage === 'intro' && (
        <nav className="flex flex-wrap items-center justify-between gap-2 text-sm sm:text-base mb-7">
          <div className="flex flex-wrap items-center text-[18px] gap-6">
            <a href="/" className="font-semibold">Home</a>
            <a href="/livegcpage" className="font-semibold">LiveChat</a>
            <a href="/scoreboard" className="font-semibold">Scoreboard</a>
          </div>
          <button
            onClick={() => setIsDark(!isDark)}
            className="ml-auto px-3 py-1 rounded bg-gray-300 dark:bg-zinc-700 text-black dark:text-white text-xs sm:text-sm whitespace-nowrap"
          >
            {isDark ? 'Dark Mode' : 'Light Mode'}
          </button>
        </nav>
      )}

      {(stage === 'intro' || stage === 'game') && (
        <h1 className="text-3xl font-bold mb-6 text-center">
          {stage === 'intro' ? '🏆 The Rating Game' : '🔥 Choose the hotter girl'}
        </h1>
      )}

      {stage === 'intro' && (
        <>
          <div className="flex justify-center mb-6">
            <button
              onClick={() => setStage('game')}
              className={`px-6 py-3 rounded-xl text-lg font-semibold transition ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
            >
              ▶️ Play the Game
            </button>
          </div>

          <div className={`mx-auto w-full max-w-3xl rounded-xl p-4 shadow ${isDark ? 'bg-zinc-900' : 'bg-zinc-100'}`}>
            <h2 className="text-xl font-semibold mb-4">All-Time Game Winners</h2>
            <p className="text-sm mb-2 text-zinc-400 italic">Scores auto-update when games are played.</p>

            {loadingWinners && <p>Loading winners...</p>}
            {winnersError && <p className="text-red-500">Error: {winnersError}</p>}

            {!loadingWinners && !winnersError && winners.length > 0 && (
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr>
                    <th className="border-b border-zinc-600 p-2">#</th>
                    <th className="border-b border-zinc-600 p-2">Player</th>
                    <th className="border-b border-zinc-600 p-2">Wins</th>
                    <th className="border-b border-zinc-600 p-2">Image</th>
                  </tr>
                </thead>
                <tbody>
                  {winners.map((w, i) => (
                    <tr key={w.id} className={i % 2 === 0 ? (isDark ? 'bg-zinc-800' : 'bg-zinc-200') : ''}>
                      <td className="p-2">{i + 1}</td>
                      <td className="p-2 font-semibold">{w.name}</td>
                      <td className="p-2">{w.wins}</td>
                      <td className="p-2">
                        {w.image ? (
                          <Image src={w.image} alt={w.name} width={50} height={50} className="rounded-full object-cover" />
                        ) : (
                          'No Image'
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}

            {!loadingWinners && !winnersError && winners.length === 0 && (
              <p>No winners found yet.</p>
            )}
          </div>
        </>
      )}

      {stage === 'game' && (
        <>
          <button
            onClick={() => setShowExitModal(true)}
            className="fixed bottom-6 right-6 z-40 px-4 py-2 bg-red-600 text-white rounded-full shadow-lg hover:bg-red-700"
          >
            Exit Game
          </button>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mx-auto">
            {[0, 1].map((i) => {
              const profile = profiles[currentPair[i]];
              if (!profile) return null;
              return (
                <button
                  key={profile.id}
                  onClick={() => handleVote(i)}
                  className={`rounded-xl flex flex-col items-center shadow-lg transition ${isDark ? 'bg-zinc-800 hover:bg-zinc-700' : 'bg-zinc-100 hover:bg-zinc-200'} p-4`}
                >
                  <Image
                    src={profile.image}
                    alt={profile.name}
                    width={300}
                    height={300}
                    className="rounded-xl object-cover"
                  />
                  <p className="mt-3 font-semibold text-lg">{profile.name}</p>
                </button>
              );
            })}
          </div>
        </>
      )}

      {stage === 'winner' && winner && (
        <div className="text-center mt-10">
          <h1 className="text-4xl font-bold mb-6">🏆 Winner</h1>
          <Image
            src={winner.image}
            alt={winner.name}
            width={220}
            height={220}
            className="mx-auto mb-6 rounded-xl object-cover"
          />
          <p className="text-3xl font-semibold">{winner.name}</p>
          <button
            className={`mt-6 px-5 py-2 rounded-lg font-medium transition ${isDark ? 'bg-zinc-800 text-white hover:bg-zinc-700' : 'bg-zinc-100 text-black hover:bg-zinc-200'}`}
            onClick={playAgain}
          >
            🔁 Play Again
          </button>
        </div>
      )}
    </div>
  );
}

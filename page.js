"use client";
import React, { useState, useEffect, Suspense } from 'react';
import dynamic from 'next/dynamic';
import { Search, Heart, Play, Pause, TrendingUp, X, Music } from 'lucide-react';

// Важно: ReactPlayer должен рендериться ТОЛЬКО на клиенте
const ReactPlayer = dynamic(() => import('react-player/youtube'), { ssr: false });

export default function PlayerPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [charts, setCharts] = useState([]);
  const [currentVideo, setCurrentVideo] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [favorites, setFavorites] = useState([]);
  const [activeTab, setActiveTab] = useState('charts');
  const [mounted, setMounted] = useState(false);

  // 1. Инициализация при монтировании
  useEffect(() => {
    setMounted(true);
    
    // Работа с Telegram и LocalStorage только на клиенте
    if (typeof window !== 'undefined') {
      if (window.Telegram?.WebApp) {
        window.Telegram.WebApp.ready();
        window.Telegram.WebApp.expand();
      }
      
      const saved = localStorage.getItem('tg_favs');
      if (saved) {
        try {
          setFavorites(JSON.parse(saved));
        } catch (e) {
          console.error("LS Error", e);
        }
      }
    }
    fetchCharts();
  }, []);

  // 2. Сохранение лайков
  useEffect(() => {
    if (mounted) {
      localStorage.setItem('tg_favs', JSON.stringify(favorites));
    }
  }, [favorites, mounted]);

  const fetchCharts = async () => {
    try {
      const res = await fetch('/api/search?q=top+music+hits+2026');
      const data = await res.json();
      setCharts(data.items || []);
    } catch (err) {
      console.log("Fetch error:", err);
    }
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;
    setActiveTab('search');
    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
    const data = await res.json();
    setResults(data.items || []);
  };

  const toggleLike = (video) => {
    if (window.Telegram?.WebApp?.HapticFeedback) {
      window.Telegram.WebApp.HapticFeedback.impactOccurred('light');
    }
    const isLiked = favorites.find(v => v.id.videoId === video.id.videoId);
    if (isLiked) {
      setFavorites(favorites.filter(v => v.id.videoId !== video.id.videoId));
    } else {
      setFavorites([...favorites, video]);
    }
  };

  // Предотвращаем ошибку гидратации
  if (!mounted) return <div className="min-h-screen bg-[#050505]" />;

  return (
    <div className="min-h-screen bg-[#050505] text-white pb-32 selection:bg-blue-500">
      {/* Search Section */}
      <header className="sticky top-0 z-50 p-4 bg-black/60 backdrop-blur-xl border-b border-white/5">
        <form onSubmit={handleSearch} className="relative max-w-2xl mx-auto">
          <input 
            className="w-full bg-white/5 border border-white/10 rounded-2xl py-3 pl-12 pr-4 outline-none focus:ring-2 focus:ring-blue-500/50 transition-all shadow-inner"
            placeholder="Поиск музыки..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <Search className="absolute left-4 top-3.5 text-slate-500" size={18} />
        </form>
      </header>

      {/* Navigation */}
      <nav className="flex justify-center gap-8 py-4 bg-black/40 border-b border-white/5 text-[11px] font-bold uppercase tracking-widest">
        <button onClick={() => setActiveTab('charts')} className={activeTab === 'charts' ? 'text-blue-500' : 'text-slate-500'}>Чарты</button>
        <button onClick={() => setActiveTab('search')} className={activeTab === 'search' ? 'text-blue-500' : 'text-slate-500'}>Поиск</button>
        <button onClick={() => setActiveTab('library')} className={activeTab === 'library' ? 'text-blue-500' : 'text-slate-500'}>Медиатека</button>
      </nav>

      <main className="p-4 max-w-5xl mx-auto">
        {/* Charts View */}
        {activeTab === 'charts' && (
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 animate-in fade-in duration-500">
            {charts.map((v) => (
              <div key={v.id.videoId} className="bg-white/5 p-3 rounded-3xl border border-white/5 hover:bg-white/10 transition-all group shadow-lg">
                <div className="relative aspect-square rounded-2xl overflow-hidden cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <img src={v.snippet.thumbnails.high.url} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt="cover" />
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                    <Play fill="white" size={32} />
                  </div>
                </div>
                <div className="mt-3">
                  <h3 className="font-bold text-sm truncate">{v.snippet.title}</h3>
                  <div className="flex justify-between items-center mt-2">
                    <p className="text-[10px] text-slate-500 truncate">{v.snippet.channelTitle}</p>
                    <button onClick={() => toggleLike(v)}>
                      <Heart size={16} fill={favorites.find(f => f.id.videoId === v.id.videoId) ? "#3b82f6" : "none"} className={favorites.find(f => f.id.videoId === v.id.videoId) ? "text-blue-500" : "text-slate-600"} />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Library View */}
        {activeTab === 'library' && (
          <div className="space-y-3 animate-in slide-in-from-right-5 duration-300">
            <h2 className="text-xl font-black mb-4 flex items-center gap-2 px-2"><Music size={20} className="text-blue-500"/> Моя Музыка</h2>
            {favorites.length === 0 && <p className="text-center text-slate-500 py-10">Добавь что-нибудь в избранное!</p>}
            {favorites.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5 group shadow-md">
                <img src={v.snippet.thumbnails.default.url} className="w-14 h-14 rounded-xl object-cover" alt="thumb" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}} />
                <div className="flex-1 cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                  <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                  <p className="text-[10px] text-slate-500 uppercase">{v.snippet.channelTitle}</p>
                </div>
                <button onClick={() => toggleLike(v)} className="p-2 opacity-50 hover:opacity-100 text-red-400"><X size={18} /></button>
              </div>
            ))}
          </div>
        )}

        {/* Search Results */}
        {activeTab === 'search' && (
           <div className="space-y-3 animate-in fade-in">
            {results.map(v => (
              <div key={v.id.videoId} className="flex items-center gap-4 p-3 bg-white/5 rounded-2xl border border-white/5 hover:bg-blue-500/10 transition shadow-md cursor-pointer" onClick={() => {setCurrentVideo(v); setIsPlaying(true)}}>
                 <img src={v.snippet.thumbnails.default.url} className="w-16 h-16 rounded-xl object-cover" alt="thumb" />
                 <div className="flex-1 min-w-0">
                    <p className="font-bold text-sm truncate">{v.snippet.title}</p>
                    <p className="text-[10px] text-slate-500 uppercase tracking-tighter mt-1">{v.snippet.channelTitle}</p>
                 </div>
              </div>
            ))}
           </div>
        )}
      </main>

      {/* 📀 Плеер (Sticky Bottom) */}
      {currentVideo && (
        <div className="fixed bottom-6 left-4 right-4 z-[100] animate-in slide-in-from-bottom-5">
          <div className="bg-white/10 backdrop-blur-3xl border border-white/20 p-4 rounded-[2.5rem] flex items-center gap-4 shadow-2xl">
            <div className="w-12 h-12 relative flex-shrink-0">
               <img 
                 src={currentVideo.snippet.thumbnails.default.url} 
                 className={`w-full h-full rounded-full object-cover border-2 border-blue-500/50 p-0.5 ${isPlaying ? 'animate-spin-slow' : ''}`} 
                 alt="disk"
               />
            </div>
            <div className="flex-1 min-w-0" onClick={() => setIsPlaying(!isPlaying)}>
              <p className="font-bold text-[12px] truncate">{currentVideo.snippet.title}</p>
              <p className="text-[9px] text-blue-400 font-black tracking-[0.2em] uppercase mt-0.5 animate-pulse">Now Playing</p>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={() => setIsPlaying(!isPlaying)} className="w-12 h-12 bg-white text-black rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg shadow-white/10">
                  {isPlaying ? <Pause size={20} fill="black" /> : <Play size={20} fill="black" className="ml-0.5" />}
                </button>
                <button onClick={() => setCurrentVideo(null)} className="p-2 text-slate-500 hover:text-white transition"><X size={18} /></button>
            </div>
          </div>
          <ReactPlayer 
            url={`https://www.youtube.com/watch?v=${currentVideo.id.videoId}`}
            playing={isPlaying}
            width="0" height="0"
            style={{ display: 'none' }}
            onEnded={() => setIsPlaying(false)}
          />
        </div>
      )}

      <style jsx global>{`
        .animate-spin-slow { animation: spin 8s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}

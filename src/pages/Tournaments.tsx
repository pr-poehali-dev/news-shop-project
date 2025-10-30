import { useState, useEffect } from 'react';
import TournamentsTab from '@/components/TournamentsTab';

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface Tournament {
  id: number;
  name: string;
  description: string;
  prize_pool: number;
  max_participants: number;
  status: string;
  tournament_type: string;
  game: string;
  start_date: string;
  participants_count: number;
  is_registered?: boolean;
}

const Tournaments = () => {
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isRegistering, setIsRegistering] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    const params = new URLSearchParams(window.location.search);
    const claimedId = params.get('openid.claimed_id');
    
    if (claimedId) {
      const verifyParams = new URLSearchParams();
      params.forEach((value, key) => {
        verifyParams.append(key, value);
      });
      verifyParams.append('mode', 'verify');
      
      fetch(`https://functions.poehali.dev/1fc223ef-7704-4b55-a8b5-fea6b000272f?${verifyParams.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.steamId) {
            setUser(data);
            localStorage.setItem('steamUser', JSON.stringify(data));
            window.history.replaceState({}, '', window.location.pathname);
          }
        })
        .catch(err => console.error('Steam auth error:', err));
    }
  }, []);

  useEffect(() => {
    loadTournaments();
  }, [user]);

  const loadTournaments = async () => {
    const cacheKey = user ? `tournaments_${user.steamId}` : 'tournaments';
    const cachedTournaments = localStorage.getItem(cacheKey);
    if (cachedTournaments) {
      setTournaments(JSON.parse(cachedTournaments));
    }

    try {
      const url = user 
        ? `https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675?steam_id=${user.steamId}`
        : 'https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675';
      
      const response = await fetch(url);
      const data = await response.json();
      setTournaments(data.tournaments || []);
      localStorage.setItem(cacheKey, JSON.stringify(data.tournaments || []));
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    }
  };

  const handleTournamentRegister = async (tournamentId: number) => {
    if (!user) {
      alert('Войдите через Steam для регистрации на турнир');
      return;
    }

    setIsRegistering(tournamentId);

    try {
      const response = await fetch('https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: tournamentId,
          steam_id: user.steamId,
          persona_name: user.personaName,
          avatar_url: user.avatarUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Регистрация успешна! Увидимся на турнире!');
        await loadTournaments();
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Ошибка при регистрации');
    } finally {
      setIsRegistering(null);
    }
  };

  const handleSteamLogin = async () => {
    const returnUrl = `${window.location.origin}${window.location.pathname}`;
    const response = await fetch(`https://functions.poehali.dev/1fc223ef-7704-4b55-a8b5-fea6b000272f?mode=login&return_url=${encodeURIComponent(returnUrl)}`);
    const data = await response.json();
    
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('steamUser');
  };

  return (
      <main className="container mx-auto px-6 py-16">
        <TournamentsTab
          tournaments={tournaments}
          user={user}
          isRegistering={isRegistering}
          onRegister={handleTournamentRegister}
        />
      </main>
  );
};

export default Tournaments;
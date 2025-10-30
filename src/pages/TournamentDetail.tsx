import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';
import TournamentInfo from '@/components/tournament/TournamentInfo';
import CountdownTimer from '@/components/tournament/CountdownTimer';
import TournamentActions from '@/components/tournament/TournamentActions';
import ParticipantsList from '@/components/tournament/ParticipantsList';
import { TournamentDetail as TournamentDetailType, SteamUser } from '@/components/tournament/types';
import { getTimeUntilStart } from '@/components/tournament/utils';

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentDetailType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [isConfirming, setIsConfirming] = useState(false);
  const [, setTick] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setTick(t => t + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadTournamentDetails();

    const params = new URLSearchParams(window.location.search);
    const claimedId = params.get('openid.claimed_id');
    
    if (claimedId) {
      const verifyParams = new URLSearchParams();
      params.forEach((value, key) => {
        verifyParams.append(key, value);
      });
      verifyParams.append('mode', 'verify');
      
      fetch(`${func2url['steam-auth']}?${verifyParams.toString()}`)
        .then(res => res.json())
        .then(data => {
          if (data.steamId) {
            setUser(data);
            localStorage.setItem('steamUser', JSON.stringify(data));
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        })
        .catch(error => console.error('Steam auth failed:', error));
    }
  }, [id]);

  const loadTournamentDetails = async () => {
    try {
      const response = await fetch(
        `${func2url.tournaments}?tournament_id=${id}`
      );
      const data = await response.json();
      setTournament(data);
    } catch (error) {
      console.error('Failed to load tournament details:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!user) {
      alert('Войдите через Steam для регистрации на турнир');
      return;
    }

    setIsRegistering(true);

    try {
      const response = await fetch(func2url.tournaments, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: Number(id),
          steam_id: user.steamId,
          persona_name: user.personaName,
          avatar_url: user.avatarUrl
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Регистрация успешна! Увидимся на турнире!');
        await loadTournamentDetails();
      } else {
        alert(data.error || 'Ошибка регистрации');
      }
    } catch (error) {
      console.error('Registration failed:', error);
      alert('Ошибка при регистрации');
    } finally {
      setIsRegistering(false);
    }
  };

  const handleUnregister = async () => {
    if (!user) return;

    if (!confirm('Вы уверены, что хотите отменить регистрацию на турнир?')) {
      return;
    }

    setIsUnregistering(true);

    try {
      const response = await fetch(func2url.tournaments, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: Number(id),
          steam_id: user.steamId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Регистрация отменена');
        await loadTournamentDetails();
      } else {
        alert(data.error || 'Ошибка отмены регистрации');
      }
    } catch (error) {
      console.error('Unregistration failed:', error);
      alert('Ошибка при отмене регистрации');
    } finally {
      setIsUnregistering(false);
    }
  };

  const handleConfirmParticipation = async () => {
    if (!user || !tournament) return;

    setIsConfirming(true);

    try {
      const response = await fetch(func2url.tournaments, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          tournament_id: tournament.id,
          steam_id: user.steamId
        })
      });

      const data = await response.json();

      if (response.ok) {
        alert('Участие подтверждено!');
        await loadTournamentDetails();
      } else {
        alert(data.error || 'Ошибка подтверждения');
      }
    } catch (error) {
      console.error('Confirmation failed:', error);
      alert('Ошибка при подтверждении участия');
    } finally {
      setIsConfirming(false);
    }
  };

  if (isLoading) {
    return (
      <main className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Icon name="Loader2" size={48} className="animate-spin text-primary mx-auto" />
            <p className="text-muted-foreground">Загрузка турнира...</p>
          </div>
        </div>
      </main>
    );
  }

  if (!tournament) {
    return (
      <main className="container mx-auto px-6 py-16">
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center space-y-4">
            <Icon name="AlertCircle" size={48} className="text-destructive mx-auto" />
            <h2 className="text-2xl font-bold">Турнир не найден</h2>
            <p className="text-muted-foreground">Такого турнира не существует или он был удален</p>
            <Button onClick={() => navigate('/tournaments')} className="gap-2 mt-4">
              <Icon name="ArrowLeft" size={16} />
              К списку турниров
            </Button>
          </div>
        </div>
      </main>
    );
  }

  const isRegistered = tournament.participants.some(p => p.steam_id === user?.steamId);
  const isFull = tournament.participants_count >= tournament.max_participants;

  return (
    <main className="container mx-auto px-6 py-16">
      <Button 
        variant="ghost" 
        onClick={() => navigate('/tournaments')}
        className="mb-6 gap-2"
      >
        <Icon name="ArrowLeft" size={16} />
        Назад к турнирам
      </Button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          <TournamentInfo tournament={tournament} />

          {tournament.status === 'upcoming' && getTimeUntilStart(tournament.start_date) && (
            <CountdownTimer startDate={tournament.start_date} />
          )}

          <ParticipantsList participants={tournament.participants} />
        </div>

        <div>
          <TournamentActions
            tournament={tournament}
            user={user}
            isRegistered={isRegistered}
            isFull={isFull}
            isRegistering={isRegistering}
            isUnregistering={isUnregistering}
            isConfirming={isConfirming}
            onRegister={handleRegister}
            onUnregister={handleUnregister}
            onConfirm={handleConfirmParticipation}
          />
        </div>
      </div>
    </main>
  );
};

export default TournamentDetail;

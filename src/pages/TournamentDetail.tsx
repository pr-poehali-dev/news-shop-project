import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatShortDate, formatDateTime } from '@/utils/dateFormat';
import func2url from '../../backend/func2url.json';

interface Participant {
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  registered_at: string;
  is_admin?: boolean;
  is_moderator?: boolean;
}

interface TournamentDetail {
  id: number;
  name: string;
  description: string;
  prize_pool: number;
  max_participants: number;
  status: string;
  tournament_type: string;
  start_date: string;
  participants_count: number;
  participants: Participant[];
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

const TournamentDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [tournament, setTournament] = useState<TournamentDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);

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

  const handleSteamLogin = async () => {
    const returnUrl = `${window.location.origin}${window.location.pathname}`;
    const response = await fetch(`${func2url['steam-auth']}?mode=login&return_url=${encodeURIComponent(returnUrl)}`);
    const data = await response.json();
    
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('steamUser');
  };

  if (isLoading || !tournament) {
    return null;
  }

  const isRegistered = tournament.participants.some(p => p.steam_id === user?.steamId);
  const isFull = tournament.participants_count >= tournament.max_participants;

  return (
      <main className="container mx-auto px-6 py-16">
        <div className="space-y-10">
          <Card className={`p-10 border border-border backdrop-blur ${
            tournament.status === 'active' 
              ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' 
              : 'bg-card/50'
          }`}>
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  {tournament.status === 'active' && (
                    <div className="px-4 py-1.5 bg-primary rounded-full">
                      <span className="text-sm font-bold text-primary-foreground">АКТИВНЫЙ</span>
                    </div>
                  )}
                  {tournament.status === 'open' && (
                    <div className="px-4 py-1.5 bg-green-500/20 border border-green-500/30 rounded-full">
                      <span className="text-sm font-bold text-green-500">ОТКРЫТА РЕГИСТРАЦИЯ</span>
                    </div>
                  )}
                  {tournament.status === 'upcoming' && (
                    <div className="px-4 py-1.5 bg-blue-500/20 border border-blue-500/30 rounded-full">
                      <span className="text-sm font-bold text-blue-500">СКОРО</span>
                    </div>
                  )}
                  {tournament.tournament_type === 'vip' && (
                    <div className="px-4 py-1.5 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                      <span className="text-sm font-bold text-yellow-500">VIP</span>
                    </div>
                  )}
                  {isRegistered && (
                    <div className="px-4 py-1.5 bg-green-500 rounded-full">
                      <span className="text-sm font-bold text-white">ВЫ ЗАРЕГИСТРИРОВАНЫ</span>
                    </div>
                  )}
                </div>
                <h1 className="text-5xl font-bold tracking-tight">{tournament.name}</h1>
                <p className="text-xl text-muted-foreground">{tournament.description}</p>
              </div>
              <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Icon 
                  name={tournament.tournament_type === 'team' ? 'Users' : tournament.tournament_type === 'weekly' ? 'Zap' : 'Trophy'} 
                  size={40} 
                  className="text-primary" 
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
              <div className="p-6 rounded-xl border border-border bg-background/50">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="DollarSign" size={24} className="text-primary" />
                  <p className="text-muted-foreground font-medium">Призовой фонд</p>
                </div>
                <p className="text-4xl font-bold text-primary">
                  {tournament.prize_pool.toLocaleString('ru-RU')}₽
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-background/50">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="Users" size={24} className="text-primary" />
                  <p className="text-muted-foreground font-medium">
                    {tournament.tournament_type === 'team' ? 'Команд' : 'Участников'}
                  </p>
                </div>
                <p className="text-4xl font-bold">
                  {tournament.participants_count} / {tournament.max_participants}
                </p>
              </div>

              <div className="p-6 rounded-xl border border-border bg-background/50">
                <div className="flex items-center gap-3 mb-3">
                  <Icon name="Calendar" size={24} className="text-primary" />
                  <p className="text-muted-foreground font-medium">Начало турнира</p>
                </div>
                <p className="text-4xl font-bold text-orange-500">
                  {formatShortDate(tournament.start_date)}
                </p>
              </div>
            </div>

            {tournament.status !== 'upcoming' && !isRegistered && (
              <Button 
                size="lg" 
                className="w-full py-6 text-lg font-bold"
                onClick={handleRegister}
                disabled={isRegistering || isFull}
              >
                {isRegistering ? 'Регистрация...' : isFull ? 'Турнир заполнен' : 'Зарегистрироваться на турнир'}
              </Button>
            )}
            {isRegistered && (
              <Button size="lg" className="w-full py-6 text-lg font-bold" disabled>
                Вы зарегистрированы
              </Button>
            )}
          </Card>

          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-3xl font-bold">Участники</h2>
                <p className="text-muted-foreground mt-2">
                  {tournament.participants_count} из {tournament.max_participants} мест занято
                </p>
              </div>
            </div>

            {tournament.participants.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {tournament.participants.map((participant, index) => (
                  <Card 
                    key={participant.steam_id}
                    className="p-6 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300"
                  >
                    <div className="flex items-center gap-4">
                      <div className="relative">
                        <img 
                          src={participant.avatar_url} 
                          alt={participant.persona_name}
                          className="w-16 h-16 rounded-full border-2 border-primary"
                        />
                        <div className="absolute -top-1 -right-1 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                          #{index + 1}
                        </div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                          <h3 className="font-bold text-lg truncate">{participant.persona_name}</h3>
                          {participant.is_admin && (
                            <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] font-semibold rounded uppercase">
                              Админ
                            </span>
                          )}
                          {participant.is_moderator && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-semibold rounded uppercase">
                              Модер
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {formatDateTime(participant.registered_at)}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border border-dashed border-border bg-card/30">
                <Icon name="Users" size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground">Пока нет участников</p>
                <p className="text-muted-foreground mt-2">Станьте первым, кто зарегистрируется!</p>
              </Card>
            )}
          </div>
        </div>
      </main>
  );
};

export default TournamentDetail;
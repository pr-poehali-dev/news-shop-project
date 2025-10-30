import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatShortDate, formatDateTime, formatShortDateTime } from '@/utils/dateFormat';
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
  game: string;
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
  const [isUnregistering, setIsUnregistering] = useState(false);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
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

  const getTimeUntilStart = (dateString: string) => {
    const start = new Date(dateString).getTime();
    const now = Date.now();
    const diff = start - now;

    if (diff <= 0) return null;

    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((diff % (1000 * 60)) / 1000);

    return { days, hours, minutes, seconds };
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
        <div className="space-y-10">
          <Card className={`p-10 border border-border backdrop-blur ${
            tournament.status === 'active' 
              ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20' 
              : 'bg-card/50'
          }`}>
            <div className="flex items-start justify-between mb-8">
              <div className="space-y-4 flex-1">
                <div className="flex items-center gap-3 flex-wrap">
                  <div className="px-4 py-1.5 bg-primary/20 border border-primary/30 rounded-full">
                    <span className="text-sm font-bold text-primary">{tournament.game || 'CS2'}</span>
                  </div>
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
                  {formatShortDateTime(tournament.start_date)}
                </p>
              </div>
            </div>

            {tournament.status === 'upcoming' && getTimeUntilStart(tournament.start_date) && (
              <div className="mb-8 p-6 rounded-xl border-2 border-primary bg-primary/5">
                <div className="text-center space-y-3">
                  <div className="flex items-center justify-center gap-2 text-primary">
                    <Icon name="Clock" size={24} />
                    <p className="text-lg font-semibold">До начала турнира</p>
                  </div>
                  <div className="flex justify-center gap-6 flex-wrap">
                    {(() => {
                      const time = getTimeUntilStart(tournament.start_date);
                      if (!time) return null;
                      return (
                        <>
                          {time.days > 0 && (
                            <div className="text-center">
                              <div className="text-5xl font-bold text-primary">{time.days}</div>
                              <div className="text-sm text-muted-foreground mt-1">дней</div>
                            </div>
                          )}
                          <div className="text-center">
                            <div className="text-5xl font-bold text-primary">{String(time.hours).padStart(2, '0')}</div>
                            <div className="text-sm text-muted-foreground mt-1">часов</div>
                          </div>
                          <div className="text-center">
                            <div className="text-5xl font-bold text-primary">{String(time.minutes).padStart(2, '0')}</div>
                            <div className="text-sm text-muted-foreground mt-1">минут</div>
                          </div>
                          <div className="text-center">
                            <div className="text-5xl font-bold text-primary">{String(time.seconds).padStart(2, '0')}</div>
                            <div className="text-sm text-muted-foreground mt-1">секунд</div>
                          </div>
                        </>
                      );
                    })()}
                  </div>
                </div>
              </div>
            )}

            {!isRegistered && (
              <Button 
                size="lg" 
                className="w-full py-6 text-lg font-bold"
                onClick={handleRegister}
                disabled={isRegistering || isFull}
              >
                {isRegistering ? (
                  <>
                    <Icon name="Loader2" size={20} className="mr-2 animate-spin" />
                    Регистрация...
                  </>
                ) : isFull ? (
                  <>
                    <Icon name="Users" size={20} className="mr-2" />
                    Турнир заполнен
                  </>
                ) : (
                  <>
                    <Icon name="UserPlus" size={20} className="mr-2" />
                    Зарегистрироваться на турнир
                  </>
                )}
              </Button>
            )}
            {isRegistered && (
              <Button 
                size="lg" 
                variant="destructive"
                className="w-full py-6 text-lg font-bold"
                onClick={handleUnregister}
                disabled={isUnregistering}
              >
                <Icon name="X" size={20} className="mr-2" />
                {isUnregistering ? 'Отмена...' : 'Отменить регистрацию'}
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
                            <span className="px-1.5 py-0.5 bg-destructive/20 text-destructive text-[10px] font-semibold rounded">
                              Администратор
                            </span>
                          )}
                          {participant.is_moderator && (
                            <span className="px-1.5 py-0.5 bg-primary/20 text-primary text-[10px] font-semibold rounded">
                              Модератор
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
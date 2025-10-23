import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Participant {
  steam_id: string;
  persona_name: string;
  avatar_url: string;
  registered_at: string;
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

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadTournamentDetails();
  }, [id]);

  const loadTournamentDetails = async () => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675?tournament_id=${id}`
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
      const response = await fetch('https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675', {
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

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl text-muted-foreground">Турнир не найден</div>
          <Button onClick={() => navigate('/')}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  const isRegistered = tournament.participants.some(p => p.steam_id === user?.steamId);
  const isFull = tournament.participants_count >= tournament.max_participants;

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
                <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>Okyes</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-2 bg-card p-1.5 rounded-xl border border-border">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Newspaper" size={18} />
                    <span className="font-medium">Новости</span>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="ShoppingBag" size={18} />
                    <span className="font-medium">Магазин</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Server" size={18} />
                    <span className="font-medium">Наши сервера</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Trophy" size={18} />
                    <span className="font-medium">Турниры</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Handshake" size={18} />
                    <span className="font-medium">Партнёры</span>
                  </div>
                </button>
              </div>

              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <img src={user.avatarUrl} alt={user.personaName} className="w-8 h-8 rounded-full" />
                  <span className="font-medium hidden sm:block">{user.personaName}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

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
                  {new Date(tournament.start_date).toLocaleDateString('ru-RU', { 
                    day: 'numeric', 
                    month: 'short',
                    hour: '2-digit',
                    minute: '2-digit',
                    timeZone: 'Europe/Moscow'
                  })}
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
                        <h3 className="font-bold text-lg truncate">{participant.persona_name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(participant.registered_at).toLocaleDateString('ru-RU', {
                            day: 'numeric',
                            month: 'short',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
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

      <footer className="border-t border-border mt-32 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={20} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Okyes</span>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 Okyes. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default TournamentDetail;
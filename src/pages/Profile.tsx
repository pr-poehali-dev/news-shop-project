import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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
  start_date: string;
  registered_at: string;
  registration_position: number;
}

interface ProfileData {
  tournaments: Tournament[];
  statistics: {
    tournaments_count: number;
    purchases_count: number;
    total_spent: number;
  };
}

const Profile = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<SteamUser | null>(null);
  const [profileData, setProfileData] = useState<ProfileData | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (!savedUser) {
      navigate('/');
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);
    loadProfileData(userData.steamId);
  }, [navigate]);

  const loadProfileData = async (steamId: string) => {
    try {
      const response = await fetch(
        `https://functions.poehali.dev/88f7bd27-aac7-4eab-b045-2d423b092ebb?steam_id=${steamId}`
      );
      const data = await response.json();
      setProfileData(data);
    } catch (error) {
      console.error('Failed to load profile data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('steamUser');
    navigate('/');
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Загрузка профиля...</div>
      </div>
    );
  }

  if (!user || !profileData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
                <Icon name="ArrowLeft" size={20} />
              </Button>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                  <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight">Okyes</h1>
              </div>
            </div>

            <Button 
              variant="ghost" 
              size="sm"
              onClick={handleLogout}
              className="text-muted-foreground hover:text-foreground"
            >
              <Icon name="LogOut" size={18} className="mr-2" />
              Выйти
            </Button>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        <div className="space-y-10">
          <Card className="p-10 border border-border bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur border-primary/20">
            <div className="flex items-start gap-8">
              <img 
                src={user.avatarUrl} 
                alt={user.personaName}
                className="w-32 h-32 rounded-2xl border-4 border-primary shadow-2xl shadow-primary/20"
              />
              <div className="flex-1 space-y-4">
                <div>
                  <h1 className="text-4xl font-bold tracking-tight mb-2">{user.personaName}</h1>
                  <a 
                    href={user.profileUrl} 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-2"
                  >
                    <Icon name="ExternalLink" size={16} />
                    Открыть профиль Steam
                  </a>
                </div>

                <div className="grid grid-cols-3 gap-6 pt-4">
                  <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Trophy" size={20} className="text-primary" />
                      <p className="text-sm text-muted-foreground">Турниров</p>
                    </div>
                    <p className="text-3xl font-bold">{profileData.statistics.tournaments_count}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="ShoppingBag" size={20} className="text-primary" />
                      <p className="text-sm text-muted-foreground">Покупок</p>
                    </div>
                    <p className="text-3xl font-bold">{profileData.statistics.purchases_count}</p>
                  </div>

                  <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Coins" size={20} className="text-primary" />
                      <p className="text-sm text-muted-foreground">Потрачено</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">${profileData.statistics.total_spent}</p>
                  </div>
                </div>
              </div>
            </div>
          </Card>

          <div className="space-y-6">
            <div>
              <h2 className="text-3xl font-bold mb-2">Мои турниры</h2>
              <p className="text-muted-foreground">История участия в турнирах</p>
            </div>

            {profileData.tournaments.length > 0 ? (
              <div className="space-y-4">
                {profileData.tournaments.map((tournament) => (
                  <Card 
                    key={tournament.id}
                    className="p-6 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/tournament/${tournament.id}`)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1 space-y-3">
                        <div className="flex items-center gap-3 flex-wrap">
                          {tournament.status === 'active' && (
                            <div className="px-3 py-1 bg-primary rounded-full">
                              <span className="text-xs font-bold text-primary-foreground">АКТИВНЫЙ</span>
                            </div>
                          )}
                          {tournament.status === 'open' && (
                            <div className="px-3 py-1 bg-green-500/20 border border-green-500/30 rounded-full">
                              <span className="text-xs font-bold text-green-500">ОТКРЫТА РЕГИСТРАЦИЯ</span>
                            </div>
                          )}
                          {tournament.status === 'upcoming' && (
                            <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/30 rounded-full">
                              <span className="text-xs font-bold text-blue-500">СКОРО</span>
                            </div>
                          )}
                          {tournament.tournament_type === 'vip' && (
                            <div className="px-3 py-1 bg-yellow-500/20 border border-yellow-500/30 rounded-full">
                              <span className="text-xs font-bold text-yellow-500">VIP</span>
                            </div>
                          )}
                          <div className="px-3 py-1 bg-primary/20 rounded-full">
                            <span className="text-xs font-bold text-primary">Место регистрации: #{tournament.registration_position}</span>
                          </div>
                        </div>

                        <div>
                          <h3 className="text-2xl font-bold mb-1">{tournament.name}</h3>
                          <p className="text-muted-foreground">{tournament.description}</p>
                        </div>

                        <div className="flex items-center gap-6 text-sm">
                          <div className="flex items-center gap-2">
                            <Icon name="DollarSign" size={16} className="text-primary" />
                            <span className="text-muted-foreground">Призовой фонд:</span>
                            <span className="font-bold text-primary">{tournament.prize_pool.toLocaleString('ru-RU')}₽</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Users" size={16} className="text-primary" />
                            <span className="text-muted-foreground">Участников:</span>
                            <span className="font-bold">{tournament.max_participants}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon name="Calendar" size={16} className="text-primary" />
                            <span className="text-muted-foreground">Начало:</span>
                            <span className="font-bold">
                              {new Date(tournament.start_date).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon name="Clock" size={14} />
                            <span>
                              Зарегистрирован {new Date(tournament.registered_at).toLocaleDateString('ru-RU', {
                                day: 'numeric',
                                month: 'long',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="w-16 h-16 rounded-xl bg-primary/10 flex items-center justify-center">
                        <Icon 
                          name={tournament.tournament_type === 'team' ? 'Users' : tournament.tournament_type === 'weekly' ? 'Zap' : 'Trophy'} 
                          size={32} 
                          className="text-primary" 
                        />
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className="p-12 text-center border border-dashed border-border bg-card/30">
                <Icon name="Trophy" size={48} className="text-muted-foreground mx-auto mb-4" />
                <p className="text-xl text-muted-foreground mb-2">Вы ещё не участвовали в турнирах</p>
                <p className="text-muted-foreground mb-6">Зарегистрируйтесь на турнир и начните соревноваться!</p>
                <Button onClick={() => navigate('/?tab=tournaments')}>
                  Перейти к турнирам
                </Button>
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

export default Profile;

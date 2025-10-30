import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import { formatDateTime, formatShortDate } from '@/utils/dateFormat';
import func2url from '../../backend/func2url.json';

interface SteamUser {
  steamId?: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl?: string;
  battlenetId?: string;
  battletag?: string;
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
  user: {
    balance: number;
    isBlocked: boolean;
    blockReason?: string;
  };
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
  const [isLoading, setIsLoading] = useState(false);

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

  const loadProfileData = async (steamId?: string) => {
    if (!steamId) return;
    
    const cacheKey = `profile_${steamId}`;
    const cachedProfile = localStorage.getItem(cacheKey);
    if (cachedProfile) {
      setProfileData(JSON.parse(cachedProfile));
    }

    try {
      const response = await fetch(
        `https://functions.poehali.dev/88f7bd27-aac7-4eab-b045-2d423b092ebb?steam_id=${steamId}`
      );
      const data = await response.json();
      setProfileData(data);
      localStorage.setItem(cacheKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to load profile data:', error);
    }
  };

  const handleLinkBattlenet = async () => {
    if (!user?.steamId) return;
    
    localStorage.setItem('linkBattlenetToSteam', user.steamId);
    const redirectUri = `${window.location.origin}/battlenet-callback`;
    const response = await fetch(`${func2url['battlenet-auth']}?mode=login&redirect_uri=${encodeURIComponent(redirectUri)}`);
    const data = await response.json();
    
    if (data.authUrl) {
      window.location.href = data.authUrl;
    }
  };

  const handleLinkSteam = async () => {
    if (!user?.battlenetId) return;
    
    const returnUrl = `${window.location.origin}/profile`;
    const response = await fetch(`https://functions.poehali.dev/1fc223ef-7704-4b55-a8b5-fea6b000272f?mode=login&return_url=${encodeURIComponent(returnUrl)}`);
    const data = await response.json();
    
    if (data.redirectUrl) {
      localStorage.setItem('linkSteamToBattlenet', user.battlenetId);
      window.location.href = data.redirectUrl;
    }
  };



  if (!user) {
    return null;
  }

  return (
      <main className="container mx-auto px-6 py-16">
        <div className="space-y-10">
          <Card className="p-10 border border-border bg-gradient-to-br from-primary/5 to-primary/10 backdrop-blur border-primary/20">
            <div className="flex items-start gap-8">
              {user.avatarUrl ? (
                <img 
                  src={user.avatarUrl} 
                  alt={user.personaName}
                  className="w-32 h-32 rounded-2xl border-4 border-primary shadow-2xl shadow-primary/20"
                />
              ) : (
                <div className="w-32 h-32 rounded-2xl border-4 border-primary shadow-2xl shadow-primary/20 bg-primary/20 flex items-center justify-center">
                  <Icon name="User" size={48} className="text-primary" />
                </div>
              )}
              <div className="flex-1 space-y-4">
                <div className="space-y-2">
                  <h1 className="text-4xl font-bold tracking-tight">{user.personaName}</h1>
                  <div className="flex flex-col gap-2">
                    {user.steamId && user.profileUrl && (
                      <a 
                        href={user.profileUrl} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-primary hover:underline flex items-center gap-2 w-fit"
                      >
                        <Icon name="Gamepad2" size={16} />
                        Steam: {user.personaName}
                      </a>
                    )}
                    {user.battlenetId && (
                      <div className="text-[#00aeff] flex items-center gap-2">
                        <Icon name="Swords" size={16} />
                        Battle.net: {user.battletag}
                      </div>
                    )}
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  {user.steamId && !user.battlenetId && (
                    <Button
                      onClick={handleLinkBattlenet}
                      variant="outline"
                      className="gap-2 border-[#00aeff] text-[#00aeff] hover:bg-[#00aeff] hover:text-white"
                    >
                      <Icon name="Link" size={18} />
                      Привязать Battle.net
                    </Button>
                  )}
                  {user.battlenetId && !user.steamId && (
                    <Button
                      onClick={handleLinkSteam}
                      variant="outline"
                      className="gap-2 border-[#171a21] hover:bg-[#171a21] hover:text-white"
                    >
                      <Icon name="Link" size={18} />
                      Привязать Steam
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-6">
                  <div className="p-4 rounded-xl bg-gradient-to-br from-primary/20 to-primary/10 border border-primary/30">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Wallet" size={20} className="text-primary" />
                      <p className="text-sm text-muted-foreground">Баланс</p>
                    </div>
                    <p className="text-3xl font-bold text-primary">{profileData.user.balance}₽</p>
                  </div>

                  <div className="p-4 rounded-xl bg-background/50 border border-border">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="Trophy" size={20} className="text-primary" />
                      <p className="text-sm text-muted-foreground">Турниров</p>
                    </div>
                    <p className="text-3xl font-bold">{profileData.statistics.tournaments_count}</p>
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
                              {formatShortDate(tournament.start_date)}
                            </span>
                          </div>
                        </div>

                        <div className="pt-3 border-t border-border">
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Icon name="Clock" size={14} />
                            <span>
                              Зарегистрирован {formatDateTime(tournament.registered_at)}
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
  );
};

export default Profile;
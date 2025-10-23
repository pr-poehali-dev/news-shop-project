import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
}

interface Product {
  id: number;
  name: string;
  amount: string;
  price: number;
}

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
  participants_count: number;
  is_registered?: boolean;
}

const Index = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'news' | 'shop' | 'servers' | 'tournaments'>('news');
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
    try {
      const url = user 
        ? `https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675?steam_id=${user.steamId}`
        : 'https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675';
      
      const response = await fetch(url);
      const data = await response.json();
      setTournaments(data);
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

  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: 'Обновление 2.5: Новая локация',
      description: 'Исследуйте загадочные руины древней цивилизации. Открывайте секреты прошлого и получайте уникальные награды.',
      date: '22 октября 2025'
    },
    {
      id: 2,
      title: 'Турнир сезона начинается',
      description: 'Зарегистрируйтесь на главный турнир сезона. Призовой фонд 100,000 игровой валюты ждёт лучших игроков.',
      date: '20 октября 2025'
    },
    {
      id: 3,
      title: 'Новые персонажи доступны',
      description: 'Встречайте трёх новых легендарных героев. Каждый обладает уникальными способностями и стилем игры.',
      date: '18 октября 2025'
    },
    {
      id: 4,
      title: 'Исправление багов',
      description: 'Улучшена стабильность игры, исправлены проблемы с подключением и оптимизирована производительность.',
      date: '15 октября 2025'
    }
  ];

  const products: Product[] = [
    {
      id: 1,
      name: 'Стартовый пакет',
      amount: '500 монет',
      price: 199
    },
    {
      id: 2,
      name: 'Базовый пакет',
      amount: '1,200 монет',
      price: 399
    },
    {
      id: 3,
      name: 'Премиум пакет',
      amount: '2,800 монет',
      price: 799
    },
    {
      id: 4,
      name: 'Элитный пакет',
      amount: '6,000 монет',
      price: 1499
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">Okyes</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="flex gap-2 bg-card p-1.5 rounded-xl border border-border">
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === 'news'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Newspaper" size={18} />
                  <span className="font-medium">Новости</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === 'shop'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="ShoppingBag" size={18} />
                  <span className="font-medium">Магазин</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('servers')}
                className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === 'servers'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Server" size={18} />
                  <span className="font-medium">Наши сервера</span>
                </div>
              </button>

              <button
                onClick={() => setActiveTab('tournaments')}
                className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === 'tournaments'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Trophy" size={18} />
                  <span className="font-medium">Турниры</span>
                </div>
              </button>
            </div>

            <div className="flex items-center gap-3">
              {user ? (
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => navigate('/profile')}
                    className="flex items-center gap-3 hover:opacity-80 transition-opacity"
                  >
                    <img 
                      src={user.avatarUrl} 
                      alt={user.personaName} 
                      className="w-10 h-10 rounded-full border-2 border-primary cursor-pointer"
                    />
                    <span className="font-medium text-foreground">{user.personaName}</span>
                  </button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={handleLogout}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Icon name="LogOut" size={18} />
                  </Button>
                </div>
              ) : (
                <Button 
                  onClick={handleSteamLogin}
                  className="bg-[#171a21] hover:bg-[#1b2838] text-white shadow-lg shadow-black/20 hover:shadow-xl hover:shadow-black/30"
                >
                  <svg className="w-5 h-5 mr-2" viewBox="0 0 256 256" fill="currentColor">
                    <path d="M127.778 0C57.384 0 0 57.384 0 127.778c0 61.119 43.144 112.205 100.583 124.486l34.034-49.784c-4.148.925-8.465 1.417-12.901 1.417-33.526 0-60.764-27.238-60.764-60.764 0-33.526 27.238-60.764 60.764-60.764 33.526 0 60.764 27.238 60.764 60.764 0 4.435-.492 8.753-1.417 12.901l49.784 34.034C243.616 171.189 256 151.148 256 127.778 256 57.384 198.616 0 127.778 0zm0 40.96c-47.897 0-86.818 38.921-86.818 86.818 0 47.897 38.921 86.818 86.818 86.818 47.897 0 86.818-38.921 86.818-86.818 0-47.897-38.921-86.818-86.818-86.818z"/>
                  </svg>
                  Войти через Steam
                </Button>
              )}
            </div>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        {activeTab === 'news' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Последние обновления</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Новости
              </h2>
              <p className="text-muted-foreground text-xl">Следите за событиями и обновлениями игры</p>
            </div>
            
            <div className="grid gap-6">
              {newsItems.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="group p-8 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Icon name="ArrowRight" size={24} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Calendar" size={16} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Пополнение</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Магазин
              </h2>
              <p className="text-muted-foreground text-xl">Выберите пакет игровой валюты</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 bg-card/50 backdrop-blur"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-2">
                        <Icon name="Coins" size={32} className="text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{product.name}</h3>
                      <p className="text-2xl font-bold text-primary">{product.amount}</p>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-border">
                      <p className="text-4xl font-bold">${product.price}</p>
                      <Button className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
                        КУПИТЬ
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'servers' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Игровые площадки</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Наши сервера
              </h2>
              <p className="text-muted-foreground text-xl">Выберите сервер и начните играть</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Card className="p-8 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-green-500">Онлайн</span>
                    </div>
                    <h3 className="text-2xl font-bold">EU Server #1</h3>
                    <p className="text-muted-foreground">Европейский регион</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Server" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Игроков онлайн</span>
                    <span className="font-bold text-lg">247 / 500</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Ping</span>
                    <span className="font-bold text-lg text-green-500">12 ms</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Режим игры</span>
                    <span className="font-bold text-lg">Классика</span>
                  </div>
                </div>
                <Button className="w-full mt-6">Подключиться</Button>
              </Card>

              <Card className="p-8 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-green-500">Онлайн</span>
                    </div>
                    <h3 className="text-2xl font-bold">RU Server #1</h3>
                    <p className="text-muted-foreground">Российский регион</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Server" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Игроков онлайн</span>
                    <span className="font-bold text-lg">189 / 500</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Ping</span>
                    <span className="font-bold text-lg text-green-500">8 ms</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Режим игры</span>
                    <span className="font-bold text-lg">Классика</span>
                  </div>
                </div>
                <Button className="w-full mt-6">Подключиться</Button>
              </Card>

              <Card className="p-8 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-green-500">Онлайн</span>
                    </div>
                    <h3 className="text-2xl font-bold">US Server #1</h3>
                    <p className="text-muted-foreground">Американский регион</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Server" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Игроков онлайн</span>
                    <span className="font-bold text-lg">312 / 500</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Ping</span>
                    <span className="font-bold text-lg text-yellow-500">156 ms</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Режим игры</span>
                    <span className="font-bold text-lg">Турнир</span>
                  </div>
                </div>
                <Button className="w-full mt-6">Подключиться</Button>
              </Card>

              <Card className="p-8 border border-border bg-card/50 backdrop-blur hover:shadow-xl hover:shadow-primary/5 transition-all duration-300">
                <div className="flex items-start justify-between mb-6">
                  <div className="space-y-2">
                    <div className="flex items-center gap-3">
                      <div className="w-3 h-3 rounded-full bg-orange-500 animate-pulse"></div>
                      <span className="text-sm font-medium text-orange-500">Заполнен</span>
                    </div>
                    <h3 className="text-2xl font-bold">ASIA Server #1</h3>
                    <p className="text-muted-foreground">Азиатский регион</p>
                  </div>
                  <div className="w-12 h-12 rounded-lg bg-primary/10 flex items-center justify-center">
                    <Icon name="Server" size={24} className="text-primary" />
                  </div>
                </div>
                <div className="space-y-4">
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Игроков онлайн</span>
                    <span className="font-bold text-lg">500 / 500</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Ping</span>
                    <span className="font-bold text-lg text-red-500">245 ms</span>
                  </div>
                  <div className="flex items-center justify-between py-3 border-t border-border">
                    <span className="text-muted-foreground">Режим игры</span>
                    <span className="font-bold text-lg">Классика</span>
                  </div>
                </div>
                <Button className="w-full mt-6" disabled>Сервер заполнен</Button>
              </Card>
            </div>
          </div>
        )}

        {activeTab === 'tournaments' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Соревнования</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Турниры
              </h2>
              <p className="text-muted-foreground text-xl">Участвуйте в турнирах и выигрывайте призы</p>
            </div>

            <div className="space-y-6">
              {tournaments.map((tournament) => (
                <Card 
                  key={tournament.id}
                  className={`p-8 border border-border backdrop-blur hover:shadow-xl transition-all duration-300 ${
                    tournament.status === 'active' 
                      ? 'bg-gradient-to-br from-primary/5 to-primary/10 border-primary/20 hover:shadow-primary/10' 
                      : 'bg-card/50 hover:shadow-primary/5'
                  }`}
                >
                  <div className="flex items-start justify-between mb-6">
                    <div className="space-y-3">
                      <div className="flex items-center gap-3">
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
                        {tournament.is_registered && (
                          <div className="px-3 py-1 bg-green-500 rounded-full">
                            <span className="text-xs font-bold text-white">ВЫ ЗАРЕГИСТРИРОВАНЫ</span>
                          </div>
                        )}
                      </div>
                      <h3 className={`font-bold ${tournament.status === 'active' ? 'text-3xl' : 'text-2xl'}`}>
                        {tournament.name}
                      </h3>
                      <p className={`text-muted-foreground ${tournament.status === 'active' ? 'text-lg' : ''}`}>
                        {tournament.description}
                      </p>
                    </div>
                    <div className={`rounded-xl bg-primary/10 flex items-center justify-center ${
                      tournament.status === 'active' ? 'w-16 h-16' : 'w-12 h-12'
                    }`}>
                      <Icon 
                        name={tournament.tournament_type === 'team' ? 'Users' : tournament.tournament_type === 'weekly' ? 'Zap' : 'Trophy'} 
                        size={tournament.status === 'active' ? 32 : 24} 
                        className="text-primary" 
                      />
                    </div>
                  </div>
                  <div className={`grid grid-cols-3 ${tournament.status === 'active' ? 'gap-6' : 'gap-4'} mb-6`}>
                    <div className={tournament.status === 'active' ? 'text-center' : ''}>
                      <p className={`text-muted-foreground ${tournament.status === 'active' ? 'mb-2' : 'text-sm mb-1'}`}>
                        Призовой фонд
                      </p>
                      <p className={`font-bold ${tournament.status === 'active' ? 'text-3xl text-primary' : 'text-xl'}`}>
                        {tournament.prize_pool.toLocaleString('ru-RU')}₽
                      </p>
                    </div>
                    <div className={tournament.status === 'active' ? 'text-center' : ''}>
                      <p className={`text-muted-foreground ${tournament.status === 'active' ? 'mb-2' : 'text-sm mb-1'}`}>
                        {tournament.tournament_type === 'team' ? 'Команд' : 'Участников'}
                      </p>
                      <p className={`font-bold ${tournament.status === 'active' ? 'text-3xl' : 'text-xl'}`}>
                        {tournament.participants_count} / {tournament.max_participants}
                      </p>
                    </div>
                    <div className={tournament.status === 'active' ? 'text-center' : ''}>
                      <p className={`text-muted-foreground ${tournament.status === 'active' ? 'mb-2' : 'text-sm mb-1'}`}>
                        {tournament.status === 'upcoming' ? 'Старт' : 'До начала'}
                      </p>
                      <p className={`font-bold ${tournament.status === 'active' ? 'text-3xl text-orange-500' : 'text-xl text-green-500'}`}>
                        {tournament.status === 'upcoming' 
                          ? new Date(tournament.start_date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })
                          : new Date(tournament.start_date) > new Date() 
                            ? `${Math.ceil((new Date(tournament.start_date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} дн.`
                            : 'Идёт'
                        }
                      </p>
                    </div>
                  </div>
                  <div className={tournament.status === 'active' ? 'flex gap-3' : ''}>
                    {tournament.status !== 'upcoming' && !tournament.is_registered && (
                      <Button 
                        className={tournament.status === 'active' ? 'flex-1' : 'w-full'}
                        size={tournament.status === 'active' ? 'lg' : 'default'}
                        onClick={() => handleTournamentRegister(tournament.id)}
                        disabled={isRegistering === tournament.id || tournament.participants_count >= tournament.max_participants}
                      >
                        {isRegistering === tournament.id ? 'Регистрация...' : 'Зарегистрироваться'}
                      </Button>
                    )}
                    {tournament.status === 'upcoming' && (
                      <Button className="w-full" variant="outline">
                        Уведомить о старте
                      </Button>
                    )}
                    {tournament.is_registered && (
                      <Button className={tournament.status === 'active' ? 'flex-1' : 'w-full'} disabled>
                        Вы зарегистрированы
                      </Button>
                    )}
                    <Button 
                      variant="outline" 
                      size={tournament.status === 'active' ? 'lg' : 'default'}
                      onClick={() => navigate(`/tournament/${tournament.id}`)}
                    >
                      Подробнее
                    </Button>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-32 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={20} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">Okyes</span>
            </div>
            <p className="text-center text-muted-foreground">© 2025 Okyes. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
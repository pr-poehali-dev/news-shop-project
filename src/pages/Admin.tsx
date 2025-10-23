import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';
import NewsManagement from '@/components/admin/NewsManagement';
import ShopManagement from '@/components/admin/ShopManagement';
import ServersManagement from '@/components/admin/ServersManagement';
import UsersManagement from '@/components/admin/UsersManagement';
import TournamentsManagement from '@/components/admin/TournamentsManagement';

interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  image_url?: string;
  content: string;
  badge?: string;
}

interface ShopItem {
  id: number;
  name: string;
  amount: string;
  price: number;
  is_active: boolean;
  order_position: number;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface Server {
  id: number;
  name: string;
  ipAddress: string;
  port: number;
  gameType: string;
  map: string;
  maxPlayers: number;
  currentPlayers: number;
  status: string;
  description: string;
  isActive: boolean;
  orderPosition: number;
}

interface User {
  id: number;
  steamId: string;
  personaName: string;
  avatarUrl: string | null;
  profileUrl: string | null;
  balance: number;
  isBlocked: boolean;
  blockReason: string | null;
  isAdmin: boolean;
  lastLogin: string | null;
  createdAt: string | null;
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
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'news' | 'shop' | 'servers' | 'users' | 'tournaments'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [servers, setServers] = useState<Server[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingShop, setIsLoadingShop] = useState(false);
  const [isLoadingServers, setIsLoadingServers] = useState(false);
  const [isLoadingUsers, setIsLoadingUsers] = useState(false);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(false);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadNews();
      loadShopItems();
      loadServers();
      loadUsers();
      loadTournaments();
    }
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin && activeTab === 'servers') {
      updateServersStatus();
      const interval = setInterval(updateServersStatus, 30000);
      return () => clearInterval(interval);
    }
  }, [isAdmin, activeTab]);

  const checkAccess = async () => {
    const savedUser = localStorage.getItem('steamUser');
    if (!savedUser) {
      setIsCheckingAccess(false);
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    try {
      const response = await fetch(`${func2url['check-admin']}?steam_id=${userData.steamId}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleSteamLogin = async () => {
    const returnUrl = `${window.location.origin}/admin`;
    const response = await fetch(`${func2url['steam-auth']}?mode=login&return_url=${encodeURIComponent(returnUrl)}`);
    const data = await response.json();
    
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  };

  const loadNews = async () => {
    try {
      const response = await fetch(func2url.news);
      const data = await response.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadShopItems = async () => {
    setIsLoadingShop(true);
    try {
      const response = await fetch(`${func2url['shop-items']}?include_inactive=true`);
      const data = await response.json();
      setShopItems(data.items || []);
    } catch (error) {
      console.error('Failed to load shop items:', error);
    } finally {
      setIsLoadingShop(false);
    }
  };

  const loadServers = async () => {
    setIsLoadingServers(true);
    try {
      const response = await fetch(func2url.servers);
      const data = await response.json();
      setServers(data.servers || []);
    } catch (error) {
      console.error('Failed to load servers:', error);
    } finally {
      setIsLoadingServers(false);
    }
  };

  const loadUsers = async () => {
    setIsLoadingUsers(true);
    try {
      const response = await fetch(func2url.users);
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setIsLoadingUsers(false);
    }
  };

  const loadTournaments = async () => {
    setIsLoadingTournaments(true);
    try {
      const response = await fetch(func2url.tournaments);
      const data = await response.json();
      setTournaments(data.tournaments || []);
    } catch (error) {
      console.error('Failed to load tournaments:', error);
    } finally {
      setIsLoadingTournaments(false);
    }
  };

  const updateServersStatus = async () => {
    try {
      const response = await fetch(func2url['server-status'], {
        method: 'POST'
      });
      const data = await response.json();
      if (data.servers) {
        setServers(prevServers => {
          return prevServers.map(server => {
            const updatedServer = data.servers.find((s: any) => s.id === server.id);
            return updatedServer ? { ...server, ...updatedServer } : server;
          });
        });
      }
    } catch (error) {
      console.error('Failed to update server status:', error);
    }
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 bg-card/80 backdrop-blur border-primary/20">
          <div className="flex items-center gap-3">
            <Icon name="Loader2" size={24} className="animate-spin" />
            <span className="text-lg">Проверка доступа...</span>
          </div>
        </Card>
      </div>
    );
  }

  if (!user || !isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center p-4">
        <Card className="p-8 bg-card/80 backdrop-blur border-primary/20 max-w-md w-full">
          <div className="text-center space-y-6">
            <div className="w-20 h-20 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Icon name="Shield" size={40} className="text-primary" />
            </div>
            
            <div>
              <h1 className="text-2xl font-bold mb-2">Админ-панель</h1>
              <p className="text-muted-foreground">
                {!user 
                  ? 'Войдите через Steam для доступа к админ-панели'
                  : 'У вас нет прав доступа к этой странице'
                }
              </p>
            </div>

            <div className="flex gap-3">
              {!user ? (
                <Button onClick={handleSteamLogin} className="w-full gap-2">
                  <Icon name="LogIn" size={18} />
                  Войти через Steam
                </Button>
              ) : (
                <Button onClick={() => navigate('/')} variant="outline" className="w-full gap-2">
                  <Icon name="Home" size={18} />
                  На главную
                </Button>
              )}
            </div>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
                <Icon name="Shield" size={36} className="text-primary" />
                Админ-панель
              </h1>
              <p className="text-muted-foreground">
                Добро пожаловать, {user.personaName}
              </p>
            </div>
            <Button onClick={() => navigate('/')} variant="outline" className="gap-2">
              <Icon name="Home" size={18} />
              На главную
            </Button>
          </div>

          <div className="flex gap-3 border-b border-border">
            <button
              onClick={() => setActiveTab('news')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'news'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Newspaper" size={20} />
                Новости
              </div>
              {activeTab === 'news' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('shop')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'shop'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="ShoppingBag" size={20} />
                Магазин
              </div>
              {activeTab === 'shop' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('servers')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'servers'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Server" size={20} />
                Серверы
              </div>
              {activeTab === 'servers' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('users')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'users'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Users" size={20} />
                Пользователи
              </div>
              {activeTab === 'users' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>

            <button
              onClick={() => setActiveTab('tournaments')}
              className={`px-6 py-3 font-medium transition-colors relative ${
                activeTab === 'tournaments'
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <div className="flex items-center gap-2">
                <Icon name="Trophy" size={20} />
                Турниры
              </div>
              {activeTab === 'tournaments' && (
                <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />
              )}
            </button>
          </div>
        </div>

        {activeTab === 'news' && (
          <NewsManagement
            news={news}
            isLoading={isLoading}
            user={user}
            onReload={loadNews}
          />
        )}

        {activeTab === 'shop' && (
          <ShopManagement
            shopItems={shopItems}
            isLoadingShop={isLoadingShop}
            user={user}
            onReload={loadShopItems}
          />
        )}

        {activeTab === 'servers' && (
          <ServersManagement
            servers={servers}
            isLoadingServers={isLoadingServers}
            user={user}
            onReload={loadServers}
            onUpdateStatus={updateServersStatus}
          />
        )}

        {activeTab === 'users' && (
          <UsersManagement
            users={users}
            isLoadingUsers={isLoadingUsers}
            adminUser={user}
            onReload={loadUsers}
          />
        )}

        {activeTab === 'tournaments' && (
          <TournamentsManagement
            tournaments={tournaments}
            user={user}
            onReload={loadTournaments}
          />
        )}
      </div>
    </div>
  );
}
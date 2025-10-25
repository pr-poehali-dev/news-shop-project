import { useState, useEffect } from 'react';
import NewsTab from '@/components/NewsTab';
import ShopTab from '@/components/ShopTab';
import ServersTab from '@/components/ServersTab';
import TournamentsTab from '@/components/TournamentsTab';
import PartnersTab from '@/components/PartnersTab';
import GlobalChat from '@/components/GlobalChat';
import func2url from '../../backend/func2url.json';
import { formatShortDate } from '@/utils/dateFormat';

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
  const [activeTab, setActiveTab] = useState<'news' | 'shop' | 'servers' | 'tournaments' | 'partners'>('news');
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [isRegistering, setIsRegistering] = useState<number | null>(null);
  const [newsItems, setNewsItems] = useState<NewsItem[]>([]);
  const [products, setProducts] = useState<Product[]>([]);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadNews();
    loadProducts();

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

  const loadNews = async () => {
    const cachedNews = localStorage.getItem('newsItems');
    if (cachedNews) {
      setNewsItems(JSON.parse(cachedNews));
    }

    try {
      const response = await fetch(func2url.news);
      const data = await response.json();
      const formattedNews = (data.news || []).map((item: any) => ({
        id: item.id,
        title: item.title,
        description: item.content.substring(0, 150) + '...',
        date: formatShortDate(item.date)
      }));
      setNewsItems(formattedNews);
      localStorage.setItem('newsItems', JSON.stringify(formattedNews));
    } catch (error) {
      console.error('Failed to load news:', error);
    }
  };

  const loadProducts = async () => {
    const cachedProducts = localStorage.getItem('shopProducts');
    const cacheTime = localStorage.getItem('shopProductsTime');
    const now = new Date().getTime();
    const CACHE_DURATION = 5 * 60 * 1000; // 5 минут

    if (cachedProducts && cacheTime && (now - parseInt(cacheTime)) < CACHE_DURATION) {
      setProducts(JSON.parse(cachedProducts));
      return;
    }

    try {
      const response = await fetch(func2url['shop-items']);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.items || []);
      localStorage.setItem('shopProducts', JSON.stringify(data.items || []));
      localStorage.setItem('shopProductsTime', now.toString());
    } catch (error) {
      console.error('Failed to load shop items:', error);
    }
  };

  const loadTournaments = async () => {
    try {
      const url = user 
        ? `https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675?steam_id=${user.steamId}`
        : 'https://functions.poehali.dev/bbe58a49-e2ff-44b8-a59a-1e66ad5ed675';
      
      const response = await fetch(url);
      const data = await response.json();
      setTournaments(data.tournaments || []);
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
        <div className="flex gap-6">
          <div className="flex-1 min-w-0">
            {activeTab === 'news' && <NewsTab newsItems={newsItems} />}
            {activeTab === 'shop' && <ShopTab products={products} user={user} />}
            {activeTab === 'servers' && <ServersTab />}
            {activeTab === 'tournaments' && (
              <TournamentsTab
                tournaments={tournaments}
                user={user}
                isRegistering={isRegistering}
                onRegister={handleTournamentRegister}
              />
            )}
            {activeTab === 'partners' && <PartnersTab />}
          </div>
          
          <aside className="w-96 flex-shrink-0">
            <GlobalChat user={user} onLoginClick={handleSteamLogin} />
          </aside>
        </div>
      </main>
  );
};

export default Index;
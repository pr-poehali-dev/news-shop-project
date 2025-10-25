import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

const MainLayout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<SteamUser | null>(null);

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
    navigate('/');
  };

  const getActiveTab = (): 'news' | 'shop' | 'servers' | 'tournaments' | 'partners' => {
    const path = location.pathname;
    if (path === '/news' || path.startsWith('/news/')) return 'news';
    if (path === '/shop') return 'shop';
    if (path === '/servers') return 'servers';
    if (path === '/tournaments' || path.startsWith('/tournament/')) return 'tournaments';
    if (path === '/partners') return 'partners';
    return 'news';
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation
        activeTab={getActiveTab()}
        setActiveTab={() => {}}
        user={user}
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isRegisterOpen={isRegisterOpen}
        setIsRegisterOpen={setIsRegisterOpen}
        handleSteamLogin={handleSteamLogin}
        handleLogout={handleLogout}
      />
      <Outlet />
    </div>
  );
};

export default MainLayout;

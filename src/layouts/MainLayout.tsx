import { useState, useEffect } from 'react';
import { useNavigate, useLocation, Outlet } from 'react-router-dom';
import Navigation from '../components/Navigation';
import NeonLines from '../components/NeonLines';

interface SteamUser {
  steamId?: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl?: string;
  battlenetId?: string;
  battletag?: string;
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
    const linkSteamToBattlenet = localStorage.getItem('linkSteamToBattlenet');
    
    if (claimedId) {
      const verifyParams = new URLSearchParams();
      params.forEach((value, key) => {
        verifyParams.append(key, value);
      });
      verifyParams.append('mode', 'verify');
      
      fetch(`https://functions.poehali.dev/1fc223ef-7704-4b55-a8b5-fea6b000272f?${verifyParams.toString()}`)
        .then(res => res.json())
        .then(async (data) => {
          if (data.steamId) {
            if (linkSteamToBattlenet) {
              const linkResponse = await fetch('https://functions.poehali.dev/a427ecff-b316-4c0a-a83d-989bf3c8ea21', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  action: 'link_steam',
                  battlenet_id: linkSteamToBattlenet,
                  steam_data: data
                })
              });
              
              const linkResult = await linkResponse.json();
              if (linkResult.success) {
                const savedUser = localStorage.getItem('steamUser');
                if (savedUser) {
                  const user = JSON.parse(savedUser);
                  user.steamId = data.steamId;
                  user.personaName = data.personaName;
                  user.avatarUrl = data.avatarUrl;
                  user.profileUrl = data.profileUrl;
                  localStorage.setItem('steamUser', JSON.stringify(user));
                  setUser(user);
                }
              }
              localStorage.removeItem('linkSteamToBattlenet');
            } else {
              setUser(data);
              localStorage.setItem('steamUser', JSON.stringify(data));
            }
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

  const handleBattlenetLogin = async () => {
    const redirectUri = `${window.location.origin}/battlenet-callback`;
    const response = await fetch(`https://functions.poehali.dev/a427ecff-b316-4c0a-a83d-989bf3c8ea21?mode=login&redirect_uri=${encodeURIComponent(redirectUri)}`);
    const data = await response.json();
    
    if (data.authUrl) {
      window.location.href = data.authUrl;
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
    <div className="min-h-screen bg-background flex flex-col neon-bg">
      <NeonLines />
      <Navigation
        activeTab={getActiveTab()}
        setActiveTab={() => {}}
        user={user}
        isLoginOpen={isLoginOpen}
        setIsLoginOpen={setIsLoginOpen}
        isRegisterOpen={isRegisterOpen}
        setIsRegisterOpen={setIsRegisterOpen}
        handleSteamLogin={handleSteamLogin}
        handleBattlenetLogin={handleBattlenetLogin}
        handleLogout={handleLogout}
      />
      <div className="flex-1 relative z-10">
        <Outlet />
      </div>
      <footer className="border-t border-border bg-card/50 backdrop-blur">
        <div className="container mx-auto px-6 py-8">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <div className="text-center md:text-left">
              <p className="text-sm text-muted-foreground">
                Okyes © 2025
              </p>
            </div>
            <div className="flex gap-4">
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Политика конфиденциальности
              </a>
              <a 
                href="#" 
                className="text-muted-foreground hover:text-primary transition-colors"
              >
                Условия использования
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default MainLayout;
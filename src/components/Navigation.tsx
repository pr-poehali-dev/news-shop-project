import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface NavigationProps {
  activeTab: 'news' | 'shop' | 'servers' | 'tournaments' | 'partners';
  setActiveTab: (tab: 'news' | 'shop' | 'servers' | 'tournaments' | 'partners') => void;
  user: SteamUser | null;
  isLoginOpen: boolean;
  setIsLoginOpen: (open: boolean) => void;
  isRegisterOpen: boolean;
  setIsRegisterOpen: (open: boolean) => void;
  handleSteamLogin: () => void;
  handleLogout: () => void;
}

const Navigation = ({
  activeTab,
  setActiveTab,
  user,
  isLoginOpen,
  setIsLoginOpen,
  isRegisterOpen,
  setIsRegisterOpen,
  handleSteamLogin,
  handleLogout
}: NavigationProps) => {
  const navigate = useNavigate();

  return (
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

              <button
                onClick={() => setActiveTab('partners')}
                className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                  activeTab === 'partners'
                    ? 'bg-primary text-primary-foreground shadow-lg shadow-primary/20'
                    : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Handshake" size={18} />
                  <span className="font-medium">Партнёры</span>
                </div>
              </button>
            </div>

            {user ? (
              <button
                onClick={() => navigate('/profile')}
                className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
              >
                <img src={user.avatarUrl} alt={user.personaName} className="w-8 h-8 rounded-full" />
                <span className="font-medium">{user.personaName}</span>
              </button>
            ) : (
              <div className="flex gap-3">
                <Dialog open={isLoginOpen} onOpenChange={setIsLoginOpen}>
                  <DialogTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <Icon name="LogIn" size={18} />
                      Войти
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Вход через Steam</DialogTitle>
                      <DialogDescription>
                        Войдите используя свой Steam аккаунт
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Button 
                        onClick={handleSteamLogin}
                        className="w-full gap-2 bg-[#171a21] hover:bg-[#1b2838]"
                      >
                        <Icon name="Gamepad2" size={18} />
                        Войти через Steam
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>

                <Dialog open={isRegisterOpen} onOpenChange={setIsRegisterOpen}>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Icon name="UserPlus" size={18} />
                      Регистрация
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                      <DialogTitle>Регистрация</DialogTitle>
                      <DialogDescription>
                        Создайте аккаунт используя Steam
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <Button 
                        onClick={handleSteamLogin}
                        className="w-full gap-2 bg-[#171a21] hover:bg-[#1b2838]"
                      >
                        <Icon name="Gamepad2" size={18} />
                        Регистрация через Steam
                      </Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation;
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface SteamUser {
  steamId?: string;
  personaName: string;
  avatarUrl?: string;
  profileUrl?: string;
  battlenetId?: string;
  battletag?: string;
}

interface MenuItem {
  id: number;
  name: string;
  label: string;
  route: string;
  icon: string;
  isVisible: boolean;
  orderPosition: number;
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
  handleBattlenetLogin: () => void;
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
  handleBattlenetLogin,
  handleLogout
}: NavigationProps) => {
  const navigate = useNavigate();
  const [menuItems, setMenuItems] = useState<MenuItem[]>([]);

  useEffect(() => {
    loadMenuItems();
  }, []);

  const loadMenuItems = async () => {
    try {
      const response = await fetch(func2url['menu-items']);
      const data = await response.json();
      const visibleItems = (data.menuItems || []).filter((item: MenuItem) => item.isVisible);
      setMenuItems(visibleItems);
    } catch (error) {
      console.error('Failed to load menu items:', error);
    }
  };

  return (
    <nav className="border-b neon-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
      <div className="container mx-auto px-6 py-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => navigate('/')}>
            <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center neon-border">
              <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold tracking-tight neon-glow">Okyes</h1>
          </div>

          <div className="flex items-center gap-6">
            <div className="flex gap-2 bg-card p-1.5 rounded-xl border border-border">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => navigate(item.route)}
                  className={`px-6 py-2.5 rounded-lg transition-all duration-300 ${
                    activeTab === item.name
                      ? 'bg-primary text-primary-foreground neon-button'
                      : 'text-muted-foreground hover:text-foreground hover:bg-secondary'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <Icon name={item.icon as any} size={18} />
                    <span className="font-medium">{item.label}</span>
                  </div>
                </button>
              ))}
            </div>

            {user ? (
              <DropdownMenu modal={false}>
                <DropdownMenuTrigger asChild>
                  <button className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors">
                    {user.avatarUrl && <img src={user.avatarUrl} alt={user.personaName} className="w-8 h-8 rounded-full" />}
                    <span className="font-medium">{user.personaName}</span>
                    <Icon name="ChevronDown" size={16} className="text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate('/profile')} className="cursor-pointer">
                    <Icon name="User" size={16} className="mr-2" />
                    Профиль
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="cursor-pointer text-destructive focus:text-destructive">
                    <Icon name="LogOut" size={16} className="mr-2" />
                    Выйти
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
                    <div className="space-y-3">
                      <Button 
                        onClick={handleSteamLogin}
                        className="w-full gap-2 bg-[#171a21] hover:bg-[#1b2838]"
                      >
                        <Icon name="Gamepad2" size={18} />
                        Войти через Steam
                      </Button>
                      <Button 
                        onClick={handleBattlenetLogin}
                        className="w-full gap-2 bg-[#00aeff] hover:bg-[#0095dd]"
                      >
                        <Icon name="Swords" size={18} />
                        Войти через Battle.net
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
                    <div className="space-y-3">
                      <Button 
                        onClick={handleSteamLogin}
                        className="w-full gap-2 bg-[#171a21] hover:bg-[#1b2838]"
                      >
                        <Icon name="Gamepad2" size={18} />
                        Регистрация через Steam
                      </Button>
                      <Button 
                        onClick={handleBattlenetLogin}
                        className="w-full gap-2 bg-[#00aeff] hover:bg-[#0095dd]"
                      >
                        <Icon name="Swords" size={18} />
                        Регистрация через Battle.net
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
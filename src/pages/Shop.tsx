import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface Product {
  id: number;
  name: string;
  amount: string;
  price: number;
  is_active?: boolean;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

interface UserBalance {
  balance: number;
}

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [balance, setBalance] = useState<number | null>(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      const userData = JSON.parse(savedUser);
      setUser(userData);
      loadBalance(userData.steamId);
    }

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

  const loadProducts = async () => {
    try {
      const timestamp = new Date().getTime();
      const response = await fetch(`${func2url['shop-items']}?_=${timestamp}`);
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      
      const data = await response.json();
      setProducts(data.items || []);
    } catch (error) {
      console.error('Failed to load shop items:', error);
    }
  };

  const loadBalance = async (steamId: string) => {
    try {
      const response = await fetch(`${func2url['balance']}?steam_id=${steamId}`);
      const data = await response.json();
      setBalance(data.balance);
    } catch (error) {
      console.error('Failed to load balance:', error);
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
      <main className="container mx-auto px-6 py-16 max-w-6xl">
        <div className="space-y-10">
          <div className="space-y-3">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
              <span className="text-sm font-medium text-primary">Пополнение баланса</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Магазин
            </h2>
            <p className="text-muted-foreground text-xl">Пополняйте баланс рублей</p>
          </div>
          
          {user && balance !== null && (
            <Card className="p-6 backdrop-blur-sm bg-card/50 border-border">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center">
                    <Icon name="Wallet" size={32} className="text-primary" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Ваш баланс</p>
                    <p className="text-3xl font-bold">{balance} ₽</p>
                  </div>
                </div>
                <Button size="lg" className="h-12 px-6">
                  <Icon name="Plus" size={20} className="mr-2" />
                  Пополнить
                </Button>
              </div>
            </Card>
          )}
          
          {products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xl">Загрузка товаров...</p>
            </div>
          ) : (
            <div className="space-y-6">
              {products.map((product) => (
              <Card key={product.id} className="group p-8 backdrop-blur-sm bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10">
                <div className="flex items-center justify-between gap-8">
                  <div className="flex items-center gap-6 flex-1">
                    <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center group-hover:scale-110 transition-transform flex-shrink-0">
                      <Icon name="Coins" size={40} className="text-primary" />
                    </div>
                    
                    <div className="space-y-2 flex-1">
                      <h3 className="text-3xl font-bold">{product.name}</h3>
                      <p className="text-xl text-primary font-semibold">{product.amount}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-8">
                    <div className="text-right">
                      <div className="flex items-baseline gap-1">
                        <span className="text-5xl font-bold">{product.price}</span>
                        <span className="text-2xl text-muted-foreground">₽</span>
                      </div>
                    </div>
                    
                    <Button size="lg" className="h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30">
                      <Icon name="ShoppingCart" size={24} className="mr-2" />
                      Купить
                    </Button>
                  </div>
                </div>
              </Card>
              ))}
            </div>
          )}
        </div>
      </main>
  );
};

export default Shop;
import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import func2url from '../../backend/func2url.json';

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

interface ShopTabProps {
  products: Product[];
  user: SteamUser | null;
}

const ShopTab = ({ products, user }: ShopTabProps) => {
  const [balance, setBalance] = useState<number>(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [purchasingItemId, setPurchasingItemId] = useState<number | null>(null);
  const [isCreatingPayment, setIsCreatingPayment] = useState(false);
  const [showTopUpDialog, setShowTopUpDialog] = useState(false);

  useEffect(() => {
    if (user) {
      loadBalance();
    }
  }, [user]);

  const loadBalance = async () => {
    if (!user) return;
    
    setIsLoadingBalance(true);
    try {
      const response = await fetch(`${func2url.balance}?steam_id=${user.steamId}`);
      const data = await response.json();
      setBalance(data.balance || 0);
    } catch (error) {
      console.error('Failed to load balance:', error);
    } finally {
      setIsLoadingBalance(false);
    }
  };

  const handleTopUp = () => {
    if (!user) {
      alert('Войдите через Steam для пополнения баланса');
      return;
    }

    if (products.length === 0) {
      alert('Нет доступных товаров для пополнения');
      return;
    }

    setShowTopUpDialog(true);
  };

  const createPayment = async (product: Product) => {
    setIsCreatingPayment(true);
    setPurchasingItemId(product.id);

    try {
      const response = await fetch(func2url.payment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steam_id: user?.steamId,
          persona_name: user?.personaName,
          shop_item_id: product.id
        })
      });

      const data = await response.json();

      if (response.ok && data.payment_url) {
        window.open(data.payment_url, '_blank');
        setShowTopUpDialog(false);
      } else {
        alert(data.error || 'Ошибка при создании платежа');
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Ошибка при создании платежа');
    } finally {
      setIsCreatingPayment(false);
      setPurchasingItemId(null);
    }
  };

  const handleBuy = async (product: Product) => {
    if (!user) {
      alert('Войдите через Steam для покупки');
      return;
    }

    await createPayment(product);
  };

  return (
    <div className="space-y-10">
      <div className="space-y-3">
        <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
          <span className="text-sm font-medium text-primary">Пополнение</span>
        </div>
        <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
          Магазин
        </h2>
        <p className="text-muted-foreground text-xl">Пополните баланс игровой валюты</p>
      </div>

      {user && (
        <Card className="p-6 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-sm text-muted-foreground">Ваш баланс</p>
              <div className="flex items-center gap-3">
                <Icon name="Wallet" size={32} className="text-primary" />
                {isLoadingBalance ? (
                  <span className="text-3xl font-bold">...</span>
                ) : (
                  <span className="text-4xl font-bold">{balance.toLocaleString()}</span>
                )}
                <span className="text-2xl text-muted-foreground">монет</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button 
                size="lg"
                className="gap-2"
                onClick={handleTopUp}
              >
                <Icon name="Plus" size={18} />
                Пополнить
              </Button>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={loadBalance}
                disabled={isLoadingBalance}
              >
                <Icon name="RefreshCw" size={16} className={isLoadingBalance ? 'animate-spin' : ''} />
              </Button>
            </div>
          </div>
        </Card>
      )}

      <div id="topup-products" className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {products.map((product, index) => (
          <Card 
            key={product.id} 
            className="group p-8 border border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur"
            style={{ animationDelay: `${index * 100}ms` }}
          >
            <div className="space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-2">
                  <h3 className="text-2xl font-bold tracking-tight">{product.name}</h3>
                  <div className="flex items-center gap-2 text-primary">
                    <Icon name="Coins" size={20} />
                    <span className="text-xl font-bold">{product.amount}</span>
                  </div>
                </div>
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                  <Icon name="ShoppingCart" size={28} />
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-border">
                <div className="space-y-1">
                  <div className="text-3xl font-bold">{product.price} ₽</div>
                  <div className="text-sm text-muted-foreground">Единоразово</div>
                </div>
                <Button 
                  size="lg" 
                  className="gap-2 shadow-lg shadow-primary/20"
                  onClick={() => handleBuy(product)}
                  disabled={!user || purchasingItemId === product.id}
                >
                  {purchasingItemId === product.id ? (
                    <>
                      <Icon name="Loader2" size={18} className="animate-spin" />
                      Покупка...
                    </>
                  ) : (
                    <>
                      <Icon name="CreditCard" size={18} />
                      Купить
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <Dialog open={showTopUpDialog} onOpenChange={setShowTopUpDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="text-2xl">Выберите сумму пополнения</DialogTitle>
            <DialogDescription>
              Выберите пакет монет для пополнения баланса
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3 mt-4">
            {products.map((product) => {
              const coins = parseInt(product.amount.replace(/[^0-9]/g, ''));
              return (
                <Card 
                  key={product.id}
                  className="p-4 hover:border-primary/50 transition-all cursor-pointer"
                  onClick={() => !isCreatingPayment && createPayment(product)}
                >
                  <div className="flex items-center justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Icon name="Coins" size={20} className="text-primary" />
                        <span className="text-lg font-bold">{coins.toLocaleString()} монет</span>
                      </div>
                      <p className="text-sm text-muted-foreground">{product.name}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <div className="text-right">
                        <div className="text-xl font-bold">{product.price} ₽</div>
                      </div>
                      {purchasingItemId === product.id ? (
                        <Icon name="Loader2" size={20} className="animate-spin text-primary" />
                      ) : (
                        <Icon name="ArrowRight" size={20} className="text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </Card>
              );
            })}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ShopTab;
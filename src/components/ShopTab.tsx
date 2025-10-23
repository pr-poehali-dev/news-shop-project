import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import Icon from '@/components/ui/icon';
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
  const [isTopUpDialogOpen, setIsTopUpDialogOpen] = useState(false);
  const [customAmount, setCustomAmount] = useState<string>('');

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

  const handleTopUp = async (productId?: number) => {
    if (!user) {
      alert('Войдите через Steam для пополнения баланса');
      return;
    }

    let selectedProduct: Product | undefined;

    if (productId) {
      selectedProduct = products.find(p => p.id === productId);
    } else if (customAmount) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 10) {
        alert('Минимальная сумма пополнения: 10 ₽');
        return;
      }
      selectedProduct = products.find(p => p.price === amount) || products[0];
    } else {
      selectedProduct = products[0];
    }

    if (!selectedProduct) {
      alert('Нет доступных товаров для пополнения');
      return;
    }

    setIsCreatingPayment(true);

    try {
      const response = await fetch(func2url.payment, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steam_id: user.steamId,
          persona_name: user.personaName,
          shop_item_id: selectedProduct.id
        })
      });

      const data = await response.json();

      if (response.ok && data.payment_url) {
        window.open(data.payment_url, '_blank');
        setIsTopUpDialogOpen(false);
        setCustomAmount('');
      } else {
        alert(data.error || 'Ошибка при создании платежа');
      }
    } catch (error) {
      console.error('Payment creation failed:', error);
      alert('Ошибка при создании платежа');
    } finally {
      setIsCreatingPayment(false);
    }
  };

  const handleBuy = async (product: Product) => {
    if (!user) {
      alert('Войдите через Steam для покупки');
      return;
    }

    if (balance < product.price) {
      alert(`Недостаточно рублей! Требуется ${product.price} ₽, у вас ${balance} ₽`);
      return;
    }

    setPurchasingItemId(product.id);

    try {
      const response = await fetch(func2url.purchases, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          steam_id: user.steamId,
          persona_name: user.personaName,
          shop_item_id: product.id
        })
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setBalance(data.new_balance);
        alert(`Успешно куплено: ${data.item_name} (${data.item_amount})`);
      } else {
        alert(data.error || 'Ошибка при покупке');
      }
    } catch (error) {
      console.error('Purchase failed:', error);
      alert('Ошибка при покупке');
    } finally {
      setPurchasingItemId(null);
    }
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
        <p className="text-muted-foreground text-xl">Пополните баланс рублей</p>
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
                <span className="text-2xl text-muted-foreground">₽</span>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Dialog open={isTopUpDialogOpen} onOpenChange={setIsTopUpDialogOpen}>
                <DialogTrigger asChild>
                  <Button 
                    size="lg"
                    className="gap-2"
                    disabled={isCreatingPayment}
                  >
                    <Icon name="Plus" size={18} />
                    Пополнить
                  </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Пополнение баланса</DialogTitle>
                    <DialogDescription>
                      Выберите готовую сумму или укажите свою
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label htmlFor="custom-amount">Своя сумма (₽)</Label>
                      <Input
                        id="custom-amount"
                        type="number"
                        placeholder="Минимум 10 ₽"
                        value={customAmount}
                        onChange={(e) => setCustomAmount(e.target.value)}
                        min="10"
                      />
                    </div>
                    
                    <Button
                      onClick={() => handleTopUp()}
                      disabled={isCreatingPayment || !customAmount}
                      className="w-full"
                    >
                      {isCreatingPayment ? (
                        <>
                          <Icon name="Loader2" size={18} className="animate-spin mr-2" />
                          Создание...
                        </>
                      ) : (
                        <>
                          Пополнить {customAmount ? `${customAmount} ₽` : ''}
                        </>
                      )}
                    </Button>

                    <div className="grid grid-cols-2 gap-2">
                      {products.slice(0, 4).map((product) => (
                        <Button
                          key={product.id}
                          variant="outline"
                          onClick={() => handleTopUp(product.id)}
                          disabled={isCreatingPayment}
                          className="h-auto py-3 flex-col gap-1"
                        >
                          <span className="text-lg font-bold">{product.price} ₽</span>
                          <span className="text-xs text-muted-foreground">{product.amount}</span>
                        </Button>
                      ))}
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
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

      <div id="topup-products" className="space-y-6">
        {products.map((product, index) => (
          <Card 
            key={product.id} 
            className="group p-8 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 bg-card/50 backdrop-blur"
          >
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
                
                <Button 
                  size="lg" 
                  className="h-14 px-8 text-lg font-semibold shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30"
                  onClick={() => handleBuy(product)}
                  disabled={!user || purchasingItemId === product.id}
                >
                  {purchasingItemId === product.id ? (
                    <>
                      <Icon name="Loader2" size={24} className="animate-spin mr-2" />
                      Покупка...
                    </>
                  ) : (
                    <>
                      <Icon name="ShoppingCart" size={24} className="mr-2" />
                      Купить
                    </>
                  )}
                </Button>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ShopTab;
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

const Shop = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadProducts();
  }, []);

  const loadProducts = async () => {
    try {
      console.log('🛒 Loading shop items from:', func2url['shop-items']);
      const response = await fetch(func2url['shop-items'], {
        cache: 'no-store',
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      console.log('📦 Response status:', response.status);
      const data = await response.json();
      console.log('📋 Received data:', data);
      console.log('🎯 Items count:', data.items?.length || 0);
      setProducts(data.items || []);
    } catch (error) {
      console.error('❌ Failed to load shop items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16">
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
          
          {isLoading ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xl">Загрузка товаров...</p>
            </div>
          ) : products.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-xl">Товары временно недоступны</p>
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
    </div>
  );
};

export default Shop;
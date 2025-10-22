import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

interface Product {
  id: number;
  name: string;
  amount: string;
  price: number;
}

const Shop = () => {
  const products: Product[] = [
    {
      id: 1,
      name: 'Стартовый пакет',
      amount: '500 монет',
      price: 199
    },
    {
      id: 2,
      name: 'Базовый пакет',
      amount: '1,200 монет',
      price: 399
    },
    {
      id: 3,
      name: 'Премиум пакет',
      amount: '2,800 монет',
      price: 799
    },
    {
      id: 4,
      name: 'Элитный пакет',
      amount: '6,000 монет',
      price: 1499
    },
    {
      id: 5,
      name: 'Мега пакет',
      amount: '15,000 монет',
      price: 2999
    },
    {
      id: 6,
      name: 'Легендарный пакет',
      amount: '50,000 монет',
      price: 7999
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16">
        <div className="space-y-10">
          <div className="space-y-3">
            <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
              <span className="text-sm font-medium text-primary">Игровая валюта</span>
            </div>
            <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
              Магазин
            </h2>
            <p className="text-muted-foreground text-xl">Приобретайте игровую валюту и развивайте своего персонажа</p>
          </div>
          
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {products.map((product) => (
              <Card key={product.id} className="group p-8 backdrop-blur-sm bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:scale-[1.05]">
                <div className="space-y-6">
                  <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto group-hover:scale-110 transition-transform">
                    <Icon name="Coins" size={32} className="text-primary" />
                  </div>
                  
                  <div className="text-center space-y-2">
                    <h3 className="text-2xl font-bold">{product.name}</h3>
                    <p className="text-3xl font-bold text-primary">{product.amount}</p>
                  </div>
                  
                  <div className="space-y-4">
                    <div className="text-center">
                      <span className="text-4xl font-bold">{product.price}</span>
                      <span className="text-muted-foreground text-lg ml-1">₽</span>
                    </div>
                    
                    <Button className="w-full h-12 text-base font-semibold shadow-lg shadow-primary/20 group-hover:shadow-xl group-hover:shadow-primary/30">
                      <Icon name="ShoppingCart" size={20} className="mr-2" />
                      Купить
                    </Button>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Shop;

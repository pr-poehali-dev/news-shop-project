import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';

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

const Index = () => {
  const [activeTab, setActiveTab] = useState<'news' | 'shop'>('news');

  const newsItems: NewsItem[] = [
    {
      id: 1,
      title: 'Обновление 2.5: Новая локация',
      description: 'Исследуйте загадочные руины древней цивилизации. Открывайте секреты прошлого и получайте уникальные награды.',
      date: '22 октября 2025'
    },
    {
      id: 2,
      title: 'Турнир сезона начинается',
      description: 'Зарегистрируйтесь на главный турнир сезона. Призовой фонд 100,000 игровой валюты ждёт лучших игроков.',
      date: '20 октября 2025'
    },
    {
      id: 3,
      title: 'Новые персонажи доступны',
      description: 'Встречайте трёх новых легендарных героев. Каждый обладает уникальными способностями и стилем игры.',
      date: '18 октября 2025'
    },
    {
      id: 4,
      title: 'Исправление багов',
      description: 'Улучшена стабильность игры, исправлены проблемы с подключением и оптимизирована производительность.',
      date: '15 октября 2025'
    }
  ];

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
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold tracking-tight">GAME PORTAL</h1>
            
            <div className="flex gap-1 bg-secondary p-1 rounded-none">
              <button
                onClick={() => setActiveTab('news')}
                className={`px-6 py-2 transition-colors ${
                  activeTab === 'news'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:text-foreground/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="Newspaper" size={18} />
                  <span className="font-medium">Новости</span>
                </div>
              </button>
              
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-6 py-2 transition-colors ${
                  activeTab === 'shop'
                    ? 'bg-primary text-primary-foreground'
                    : 'text-foreground hover:text-foreground/80'
                }`}
              >
                <div className="flex items-center gap-2">
                  <Icon name="ShoppingBag" size={18} />
                  <span className="font-medium">Магазин</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-12">
        {activeTab === 'news' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Новости</h2>
              <p className="text-muted-foreground text-lg">Последние обновления и события</p>
            </div>
            
            <div className="grid gap-6">
              {newsItems.map((item) => (
                <Card key={item.id} className="p-8 border border-border hover:border-foreground transition-colors cursor-pointer">
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <h3 className="text-2xl font-bold tracking-tight">{item.title}</h3>
                      <Icon name="ArrowRight" size={24} className="flex-shrink-0 mt-1" />
                    </div>
                    <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                    <p className="text-sm text-muted-foreground">{item.date}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-8">
            <div className="space-y-2">
              <h2 className="text-4xl font-bold tracking-tight">Магазин</h2>
              <p className="text-muted-foreground text-lg">Пополните игровую валюту</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product) => (
                <Card key={product.id} className="p-6 border border-border hover:border-foreground transition-colors">
                  <div className="space-y-6">
                    <div className="space-y-2">
                      <h3 className="text-xl font-bold tracking-tight">{product.name}</h3>
                      <p className="text-2xl font-bold">{product.amount}</p>
                    </div>
                    
                    <div className="space-y-4">
                      <p className="text-3xl font-bold">${product.price}</p>
                      <Button className="w-full py-6 text-base font-medium">
                        КУПИТЬ
                      </Button>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="border-t border-border mt-24">
        <div className="container mx-auto px-6 py-8">
          <p className="text-center text-muted-foreground">© 2025 Game Portal. Все права защищены.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;

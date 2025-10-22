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
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight">GAME PORTAL</h1>
            </div>
            
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
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16">
        {activeTab === 'news' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Последние обновления</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Новости
              </h2>
              <p className="text-muted-foreground text-xl">Следите за событиями и обновлениями игры</p>
            </div>
            
            <div className="grid gap-6">
              {newsItems.map((item, index) => (
                <Card 
                  key={item.id} 
                  className="group p-8 border border-border hover:border-primary/50 transition-all duration-300 cursor-pointer hover:shadow-2xl hover:shadow-primary/10 hover:-translate-y-1 bg-card/50 backdrop-blur"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="space-y-2 flex-1">
                        <h3 className="text-2xl font-bold tracking-tight group-hover:text-primary transition-colors">
                          {item.title}
                        </h3>
                        <p className="text-muted-foreground text-lg leading-relaxed">{item.description}</p>
                      </div>
                      <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center flex-shrink-0 group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
                        <Icon name="ArrowRight" size={24} />
                      </div>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <Icon name="Calendar" size={16} />
                      <span>{item.date}</span>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {activeTab === 'shop' && (
          <div className="space-y-10">
            <div className="space-y-3">
              <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
                <span className="text-sm font-medium text-primary">Пополнение</span>
              </div>
              <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
                Магазин
              </h2>
              <p className="text-muted-foreground text-xl">Выберите пакет игровой валюты</p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {products.map((product, index) => (
                <Card 
                  key={product.id} 
                  className="group p-6 border border-border hover:border-primary transition-all duration-300 hover:shadow-2xl hover:shadow-primary/20 hover:-translate-y-2 bg-card/50 backdrop-blur"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <div className="space-y-6">
                    <div className="space-y-3">
                      <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-primary/60 flex items-center justify-center mb-2">
                        <Icon name="Coins" size={32} className="text-primary-foreground" />
                      </div>
                      <h3 className="text-xl font-bold tracking-tight">{product.name}</h3>
                      <p className="text-2xl font-bold text-primary">{product.amount}</p>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-border">
                      <p className="text-4xl font-bold">${product.price}</p>
                      <Button className="w-full py-6 text-base font-semibold shadow-lg shadow-primary/20 hover:shadow-xl hover:shadow-primary/30 transition-all duration-300">
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

      <footer className="border-t border-border mt-32 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={20} className="text-primary-foreground" />
              </div>
              <span className="font-bold text-lg">GAME PORTAL</span>
            </div>
            <p className="text-center text-muted-foreground">© 2025 Game Portal. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
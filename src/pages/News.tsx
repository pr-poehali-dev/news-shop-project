import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
}

const News = () => {
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
    },
    {
      id: 5,
      title: 'Летний ивент запущен',
      description: 'Специальное летнее мероприятие с эксклюзивными наградами. Выполняйте задания и получайте уникальные скины.',
      date: '12 октября 2025'
    },
    {
      id: 6,
      title: 'Улучшение графики',
      description: 'Внедрены новые визуальные эффекты и улучшено освещение. Игра стала ещё красивее и реалистичнее.',
      date: '10 октября 2025'
    }
  ];

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto px-6 py-16">
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
          
          <div className="grid gap-6 md:grid-cols-2">
            {newsItems.map((item) => (
              <Card key={item.id} className="group p-6 backdrop-blur-sm bg-card/50 border-border hover:border-primary/50 transition-all duration-300 hover:shadow-xl hover:shadow-primary/10 hover:scale-[1.02]">
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0 group-hover:bg-primary/20 transition-colors">
                    <Icon name="Newspaper" size={24} className="text-primary" />
                  </div>
                  <div className="space-y-3 flex-1">
                    <div className="space-y-1">
                      <h3 className="text-xl font-bold group-hover:text-primary transition-colors">{item.title}</h3>
                      <p className="text-sm text-muted-foreground flex items-center gap-2">
                        <Icon name="Calendar" size={14} />
                        {item.date}
                      </p>
                    </div>
                    <p className="text-muted-foreground leading-relaxed line-clamp-none">{item.description}</p>
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

export default News;
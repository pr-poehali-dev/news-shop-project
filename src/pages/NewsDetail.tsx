import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import Comments from '@/components/Comments';
import func2url from '../../backend/func2url.json';

interface NewsItem {
  id: number;
  title: string;
  description: string;
  date: string;
  content: string;
  image?: string;
  category: string;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

const NewsDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem | null>(null);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedUser = localStorage.getItem('steamUser');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }

    loadNews();
  }, [id]);

  const loadNews = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${func2url.news}?id=${id}`);
      const data = await response.json();
      if (data.news) {
        setNews({
          id: data.news.id,
          title: data.news.title,
          description: data.news.content.substring(0, 150) + '...',
          date: data.news.date,
          content: data.news.content,
          image: data.news.image_url,
          category: data.news.category
        });
      }
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadNewsOld = () => {
    const newsData: NewsItem[] = [
      {
        id: 1,
        title: 'Обновление 2.5: Новая локация',
        description: 'Исследуйте загадочные руины древней цивилизации. Открывайте секреты прошлого и получайте уникальные награды.',
        date: '22 октября 2025',
        category: 'Обновления',
        image: 'https://images.unsplash.com/photo-1614732414444-096e5f1122d5?w=1200&h=600&fit=crop',
        content: `
# Добро пожаловать в обновление 2.5!

Мы рады представить вам крупнейшее обновление этого сезона. **Новая локация** принесет множество захватывающих приключений и тайн, которые ждут своих исследователей.

## Что нового?

### 🏛️ Руины древней цивилизации
Откройте для себя загадочные руины, полные секретов и опасностей. Каждый уголок этой локации скрывает древние артефакты и уникальные истории.

### 🎁 Уникальные награды
За исследование руин вы получите:
- Эксклюзивные скины оружия
- Редкие достижения
- Специальные титулы
- Игровую валюту

### 🗺️ Новые квесты
Более 15 новых заданий, связанных с историей древней цивилизации. Раскройте тайну исчезнувшей культуры и получите легендарные награды.

## Технические улучшения

- Оптимизирована производительность на 30%
- Улучшена графика окружения
- Добавлены новые звуковые эффекты
- Исправлены известные баги

Приятной игры!
        `
      },
      {
        id: 2,
        title: 'Турнир сезона начинается',
        description: 'Зарегистрируйтесь на главный турнир сезона. Призовой фонд 100,000 игровой валюты ждёт лучших игроков.',
        date: '20 октября 2025',
        category: 'Турниры',
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=1200&h=600&fit=crop',
        content: `
# Чемпионат Осени 2025 стартует!

Самое ожидаемое событие сезона уже совсем скоро. Готовьтесь к эпическим сражениям за главный приз!

## 💰 Призовой фонд

Общий призовой фонд составляет **100,000 игровой валюты**:
- 🥇 1 место: 50,000
- 🥈 2 место: 30,000
- 🥉 3 место: 15,000
- 4-10 места: по 1,000

## 📋 Правила участия

1. Регистрация до 25 октября
2. Минимальный уровень: 30
3. Командный формат 5 на 5
4. Турнир проходит в формате Double Elimination

## 🎮 Формат турнира

- **Групповой этап**: 8 групп по 4 команды
- **Плей-офф**: BO3 (Best of 3)
- **Финал**: BO5 (Best of 5)

## 📅 Расписание

- 25 октября: Закрытие регистрации
- 26 октября: Жеребьевка
- 27-28 октября: Групповой этап
- 29 октября: Плей-офф и финал

Регистрируйтесь в разделе "Турниры" прямо сейчас!
        `
      },
      {
        id: 3,
        title: 'Новые персонажи доступны',
        description: 'Встречайте трёх новых легендарных героев. Каждый обладает уникальными способностями и стилем игры.',
        date: '18 октября 2025',
        category: 'Контент',
        image: 'https://images.unsplash.com/photo-1552820728-8b83bb6b773f?w=1200&h=600&fit=crop',
        content: `
# Три новых легендарных героя!

Пополнение в ростере! Встречайте трёх уникальных персонажей с совершенно разными игровыми стилями.

## ⚔️ Арион - Страж Рассвета

**Роль**: Танк / Поддержка

**Способности**:
- **Щит света**: Создает защитный барьер для союзников
- **Благословение**: Восстанавливает здоровье команды
- **Небесный удар**: Мощная атака ближнего боя
- **Ульта - Божественное вмешательство**: Временная неуязвимость всей команды

## 🗡️ Тень - Ночной Охотник

**Роль**: Ассасин / DPS

**Способности**:
- **Невидимость**: Скрывается от врагов на 5 секунд
- **Ядовитый клинок**: Наносит урон с эффектом отравления
- **Рывок**: Быстрое перемещение к цели
- **Ульта - Танец смерти**: Серия молниеносных ударов

## 🔥 Пироманта - Повелительница Огня

**Роль**: Маг / AoE DPS

**Способности**:
- **Огненный шар**: Базовая атака с уроном по области
- **Стена пламени**: Создает барьер из огня
- **Метеоритный дождь**: АоЕ урон в указанной зоне
- **Ульта - Инферно**: Превращает поле боя в пылающую арену

## 🎯 Как получить

Новые герои доступны:
- За игровую валюту (5,000 монет)
- В премиум пакетах
- За выполнение специальных заданий

Экспериментируйте с новыми героями и находите идеальные комбинации для своей команды!
        `
      },
      {
        id: 4,
        title: 'Исправление багов',
        description: 'Улучшена стабильность игры, исправлены проблемы с подключением и оптимизирована производительность.',
        date: '15 октября 2025',
        category: 'Исправления',
        image: 'https://images.unsplash.com/photo-1555949963-aa79dcee981c?w=1200&h=600&fit=crop',
        content: `
# Техническое обновление 2.4.1

Выпущен патч, направленный на улучшение стабильности и производительности игры.

## 🐛 Исправленные баги

### Критические исправления
- ✅ Исправлен краш при загрузке определенных локаций
- ✅ Решена проблема с зависанием в лобби
- ✅ Исправлена ошибка соединения с сервером
- ✅ Устранены проблемы с синхронизацией инвентаря

### Баланс
- Уменьшен урон способности "Огненный шар" на 10%
- Увеличена скорость перезарядки щитов на 15%
- Скорректирован баланс оружия ближнего боя

### UI/UX улучшения
- Обновлен интерфейс магазина
- Улучшена читаемость шрифтов
- Добавлены новые подсказки для новичков
- Оптимизировано меню настроек

## ⚡ Оптимизация производительности

### Что улучшилось
- **+30% FPS** в групповых сражениях
- **-40%** времени загрузки уровней
- **-25%** использования памяти
- Улучшена работа на слабых ПК

### Системные требования
Минимальные требования снижены:
- CPU: Intel Core i3 (было i5)
- RAM: 4GB (было 8GB)
- GPU: GTX 750 Ti (было GTX 960)

## 🔧 Известные проблемы

Мы работаем над следующими проблемами:
- Редкие вылеты в режиме соревнований
- Проблемы с отображением скинов в меню
- Задержка голосового чата в некоторых регионах

## 📦 Размер обновления

- PC: 1.2 GB
- Консоли: 1.8 GB

Спасибо за ваше терпение и отзывы!
        `
      }
    ];

    const foundNews = newsData.find(n => n.id === Number(id));
    setNews(foundNews || null);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-2xl text-muted-foreground">Загрузка...</div>
      </div>
    );
  }

  if (!news) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl text-muted-foreground">Новость не найдена</div>
          <Button onClick={() => navigate('/')}>Вернуться назад</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <nav className="border-b border-border backdrop-blur-xl bg-background/80 sticky top-0 z-50">
        <div className="container mx-auto px-6 py-5">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-primary rounded-lg flex items-center justify-center cursor-pointer" onClick={() => navigate('/')}>
                <Icon name="Gamepad2" size={24} className="text-primary-foreground" />
              </div>
              <h1 className="text-2xl font-bold tracking-tight cursor-pointer" onClick={() => navigate('/')}>Okyes</h1>
            </div>

            <div className="flex items-center gap-6">
              <div className="hidden md:flex gap-2 bg-card p-1.5 rounded-xl border border-border">
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Newspaper" size={18} />
                    <span className="font-medium">Новости</span>
                  </div>
                </button>
                
                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="ShoppingBag" size={18} />
                    <span className="font-medium">Магазин</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Server" size={18} />
                    <span className="font-medium">Наши сервера</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Trophy" size={18} />
                    <span className="font-medium">Турниры</span>
                  </div>
                </button>

                <button
                  onClick={() => navigate('/')}
                  className="px-6 py-2.5 rounded-lg transition-all duration-300 text-muted-foreground hover:text-foreground hover:bg-secondary"
                >
                  <div className="flex items-center gap-2">
                    <Icon name="Handshake" size={18} />
                    <span className="font-medium">Партнёры</span>
                  </div>
                </button>
              </div>

              {user && (
                <button
                  onClick={() => navigate('/profile')}
                  className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-secondary transition-colors"
                >
                  <img src={user.avatarUrl} alt={user.personaName} className="w-8 h-8 rounded-full" />
                  <span className="font-medium hidden sm:block">{user.personaName}</span>
                </button>
              )}
            </div>
          </div>
        </div>
      </nav>

      <main className="container mx-auto px-6 py-16 max-w-4xl">
        <article className="space-y-8">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full">
                <span className="text-sm font-medium text-primary">{news.category}</span>
              </div>
              <div className="flex items-center gap-2 text-muted-foreground">
                <Icon name="Calendar" size={16} />
                <span className="text-sm">{news.date}</span>
              </div>
            </div>

            <h1 className="text-5xl font-bold tracking-tight leading-tight">
              {news.title}
            </h1>

            <p className="text-xl text-muted-foreground leading-relaxed">
              {news.description}
            </p>
          </div>

          {news.image && (
            <div className="rounded-2xl overflow-hidden border border-border">
              <img 
                src={news.image} 
                alt={news.title}
                className="w-full h-auto object-cover"
              />
            </div>
          )}

          <Card className="p-10 border border-border bg-card/50 backdrop-blur">
            <div 
              className="prose prose-lg prose-invert max-w-none"
              style={{
                fontSize: '1.125rem',
                lineHeight: '1.75rem'
              }}
            >
              {news.content.split('\n').map((line, index) => {
                line = line.trim();
                
                if (!line) return <div key={index} className="h-4" />;
                
                if (line.startsWith('# ')) {
                  return (
                    <h1 key={index} className="text-4xl font-bold mb-6 mt-8">
                      {line.substring(2)}
                    </h1>
                  );
                }
                
                if (line.startsWith('## ')) {
                  return (
                    <h2 key={index} className="text-3xl font-bold mb-4 mt-8 flex items-center gap-3">
                      {line.substring(3)}
                    </h2>
                  );
                }
                
                if (line.startsWith('### ')) {
                  return (
                    <h3 key={index} className="text-2xl font-bold mb-3 mt-6">
                      {line.substring(4)}
                    </h3>
                  );
                }
                
                if (line.startsWith('- ')) {
                  return (
                    <li key={index} className="ml-6 mb-2 text-muted-foreground">
                      {line.substring(2).replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>').split('<strong').map((part, i) => {
                        if (i === 0) return part;
                        const [strong, ...rest] = part.split('</strong>');
                        return (
                          <span key={i}>
                            <strong className="text-foreground font-bold">{strong.replace(' class="text-foreground font-bold">', '')}</strong>
                            {rest.join('</strong>')}
                          </span>
                        );
                      })}
                    </li>
                  );
                }
                
                return (
                  <p key={index} className="mb-4 text-muted-foreground leading-relaxed">
                    {line.replace(/\*\*(.*?)\*\*/g, '<strong class="text-foreground font-bold">$1</strong>').split('<strong').map((part, i) => {
                      if (i === 0) return part;
                      const [strong, ...rest] = part.split('</strong>');
                      return (
                        <span key={i}>
                          <strong className="text-foreground font-bold">{strong.replace(' class="text-foreground font-bold">', '')}</strong>
                          {rest.join('</strong>')}
                        </span>
                      );
                    })}
                  </p>
                );
              })}
            </div>
          </Card>

          <div className="mt-16 pt-12 border-t border-border">
            <Comments newsId={id || '1'} />
          </div>

          <div className="flex justify-center pt-8">
            <Button size="lg" onClick={() => navigate('/')}>
              <Icon name="ArrowLeft" size={20} className="mr-2" />
              Вернуться к новостям
            </Button>
          </div>
        </article>
      </main>

      <footer className="border-t border-border mt-32 bg-card/30 backdrop-blur">
        <div className="container mx-auto px-6 py-12">
          <div className="flex flex-col items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <Icon name="Gamepad2" size={20} className="text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold">Okyes</span>
            </div>
            <p className="text-muted-foreground text-sm">© 2025 Okyes. Все права защищены.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default NewsDetail;
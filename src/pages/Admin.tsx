import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface NewsItem {
  id: number;
  title: string;
  category: string;
  date: string;
  image_url?: string;
  content: string;
  badge?: string;
}

interface Comment {
  id: number;
  news_id: number;
  author: string;
  text: string;
  avatar: string;
  steam_id: string | null;
  avatar_url: string | null;
  date: string;
}

interface ShopItem {
  id: number;
  name: string;
  amount: string;
  price: number;
  is_active: boolean;
}

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'news' | 'shop'>('news');
  const [news, setNews] = useState<NewsItem[]>([]);
  const [comments, setComments] = useState<Comment[]>([]);
  const [shopItems, setShopItems] = useState<ShopItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isLoadingComments, setIsLoadingComments] = useState(false);
  const [isLoadingShop, setIsLoadingShop] = useState(false);
  const [selectedNewsId, setSelectedNewsId] = useState<number | null>(null);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editingShopId, setEditingShopId] = useState<number | null>(null);
  const [user, setUser] = useState<SteamUser | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [isCheckingAccess, setIsCheckingAccess] = useState(true);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    image_url: '',
    content: '',
    badge: ''
  });
  const [shopFormData, setShopFormData] = useState({
    name: '',
    amount: '',
    price: 0,
    is_active: true
  });

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadNews();
      loadShopItems();
    }
  }, [isAdmin]);

  const checkAccess = async () => {
    const savedUser = localStorage.getItem('steamUser');
    if (!savedUser) {
      setIsCheckingAccess(false);
      return;
    }

    const userData = JSON.parse(savedUser);
    setUser(userData);

    try {
      const response = await fetch(`${func2url['check-admin']}?steam_id=${userData.steamId}`);
      const data = await response.json();
      setIsAdmin(data.isAdmin);
    } catch (error) {
      console.error('Failed to check admin access:', error);
      setIsAdmin(false);
    } finally {
      setIsCheckingAccess(false);
    }
  };

  const handleSteamLogin = async () => {
    const returnUrl = `${window.location.origin}/admin`;
    const response = await fetch(`${func2url['steam-auth']}?mode=login&return_url=${encodeURIComponent(returnUrl)}`);
    const data = await response.json();
    
    if (data.redirectUrl) {
      window.location.href = data.redirectUrl;
    }
  };

  const loadNews = async () => {
    try {
      const response = await fetch(func2url.news);
      const data = await response.json();
      setNews(data.news || []);
    } catch (error) {
      console.error('Failed to load news:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const url = editingId ? func2url.news : func2url.news;
      const method = editingId ? 'PUT' : 'POST';
      const body = editingId 
        ? { ...formData, id: editingId }
        : formData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadNews();
        resetForm();
      }
    } catch (error) {
      console.error('Failed to save news:', error);
    }
  };

  const handleEdit = (item: NewsItem) => {
    setEditingId(item.id);
    setFormData({
      title: item.title,
      category: item.category,
      image_url: item.image_url || '',
      content: item.content,
      badge: item.badge || ''
    });
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Удалить эту новость?')) return;

    try {
      const response = await fetch(`${func2url.news}?id=${id}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        await loadNews();
      }
    } catch (error) {
      console.error('Failed to delete news:', error);
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      title: '',
      category: '',
      image_url: '',
      content: '',
      badge: ''
    });
  };

  const loadComments = async (newsId: number) => {
    setIsLoadingComments(true);
    setSelectedNewsId(newsId);
    
    try {
      const response = await fetch(`${func2url.comments}?news_id=${newsId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
      setComments([]);
    } finally {
      setIsLoadingComments(false);
    }
  };

  const handleDeleteComment = async (commentId: number) => {
    if (!confirm('Удалить этот комментарий?')) return;
    if (!user) return;

    try {
      const response = await fetch(
        `${func2url.comments}?id=${commentId}&admin_steam_id=${user.steamId}`,
        { method: 'DELETE' }
      );

      if (response.ok && selectedNewsId) {
        await loadComments(selectedNewsId);
      }
    } catch (error) {
      console.error('Failed to delete comment:', error);
    }
  };

  const loadShopItems = async () => {
    setIsLoadingShop(true);
    try {
      const response = await fetch(`${func2url['shop-items']}?include_inactive=true`);
      const data = await response.json();
      setShopItems(data.items || []);
    } catch (error) {
      console.error('Failed to load shop items:', error);
    } finally {
      setIsLoadingShop(false);
    }
  };

  const handleShopSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      const url = func2url['shop-items'];
      const method = editingShopId ? 'PUT' : 'POST';
      const body = editingShopId 
        ? { ...shopFormData, id: editingShopId }
        : shopFormData;

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'X-Admin-Steam-Id': user.steamId
        },
        body: JSON.stringify(body)
      });

      if (response.ok) {
        await loadShopItems();
        resetShopForm();
      }
    } catch (error) {
      console.error('Failed to save shop item:', error);
    }
  };

  const handleEditShopItem = (item: ShopItem) => {
    setEditingShopId(item.id);
    setShopFormData({
      name: item.name,
      amount: item.amount,
      price: item.price,
      is_active: item.is_active
    });
  };

  const handleDeleteShopItem = async (id: number) => {
    if (!confirm('Удалить этот товар?')) return;
    if (!user) return;

    try {
      const response = await fetch(`${func2url['shop-items']}?id=${id}`, {
        method: 'DELETE',
        headers: {
          'X-Admin-Steam-Id': user.steamId
        }
      });

      if (response.ok) {
        await loadShopItems();
      }
    } catch (error) {
      console.error('Failed to delete shop item:', error);
    }
  };

  const resetShopForm = () => {
    setEditingShopId(null);
    setShopFormData({
      name: '',
      amount: '',
      price: 0,
      is_active: true
    });
  };

  if (isCheckingAccess) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="text-2xl font-bold">Проверка доступа...</div>
          <div className="text-muted-foreground">Пожалуйста, подождите</div>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <Icon name="Lock" size={48} className="mx-auto text-primary" />
            <h1 className="text-3xl font-bold">Админ-панель</h1>
            <p className="text-muted-foreground">
              Для доступа необходимо войти через Steam
            </p>
          </div>
          <Button onClick={handleSteamLogin} className="w-full gap-2">
            <Icon name="Gamepad2" size={20} />
            Войти через Steam
          </Button>
          <Button variant="outline" onClick={() => navigate('/')} className="w-full">
            Вернуться на главную
          </Button>
        </Card>
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 flex items-center justify-center">
        <Card className="p-8 max-w-md w-full text-center space-y-6">
          <div className="space-y-2">
            <Icon name="ShieldAlert" size={48} className="mx-auto text-destructive" />
            <h1 className="text-3xl font-bold">Доступ запрещён</h1>
            <p className="text-muted-foreground">
              У вас нет прав администратора для доступа к этой странице
            </p>
            <div className="pt-4 text-sm text-muted-foreground">
              Текущий аккаунт: <strong>{user.personaName}</strong>
            </div>
          </div>
          <Button onClick={() => navigate('/')} className="w-full">
            Вернуться на главную
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5 pt-24 pb-12">
      <div className="container max-w-6xl mx-auto px-4">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Icon name="Settings" size={36} />
            Админ-панель
          </h1>
          <p className="text-muted-foreground">Управление контентом сайта</p>
          
          <div className="flex gap-2 mt-6">
            <Button 
              variant={activeTab === 'news' ? 'default' : 'outline'}
              onClick={() => setActiveTab('news')}
              className="gap-2"
            >
              <Icon name="Newspaper" size={18} />
              Новости
            </Button>
            <Button 
              variant={activeTab === 'shop' ? 'default' : 'outline'}
              onClick={() => setActiveTab('shop')}
              className="gap-2"
            >
              <Icon name="ShoppingBag" size={18} />
              Магазин
            </Button>
          </div>
        </div>

        {activeTab === 'news' && (
        <div className="grid gap-8 lg:grid-cols-3">
          <div>
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name={editingId ? "Edit" : "Plus"} size={24} />
                {editingId ? 'Редактировать новость' : 'Создать новость'}
              </h2>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Заголовок</label>
                  <Input
                    value={formData.title}
                    onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                    placeholder="Заголовок новости"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Категория</label>
                  <Input
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    placeholder="Обновления, Турниры, Сообщество"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">URL изображения</label>
                  <Input
                    value={formData.image_url}
                    onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                    placeholder="https://..."
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Бейдж (опционально)</label>
                  <Input
                    value={formData.badge}
                    onChange={(e) => setFormData({ ...formData, badge: e.target.value })}
                    placeholder="Новое, Важно, Горячее"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Содержание</label>
                  <Textarea
                    value={formData.content}
                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                    placeholder="Текст новости..."
                    className="min-h-[200px]"
                    required
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Icon name={editingId ? "Save" : "Plus"} size={18} className="mr-2" />
                    {editingId ? 'Сохранить' : 'Создать'}
                  </Button>
                  {editingId && (
                    <Button type="button" variant="outline" onClick={resetForm}>
                      Отмена
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          <div>
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="Newspaper" size={24} />
                Список новостей ({news.length})
              </h2>

              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : news.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Новостей пока нет</div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {news.map((item) => (
                    <div
                      key={item.id}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <h3 className="font-semibold mb-1 truncate">{item.title}</h3>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Icon name="Tag" size={14} />
                              {item.category}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1">
                              <Icon name="Calendar" size={14} />
                              {item.date}
                            </span>
                          </div>
                          <p className="text-sm text-muted-foreground line-clamp-2">
                            {item.content}
                          </p>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => loadComments(item.id)}
                            title="Комментарии"
                          >
                            <Icon name="MessageSquare" size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEdit(item)}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDelete(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          <div>
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="MessageSquare" size={24} />
                Комментарии
              </h2>

              {!selectedNewsId ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Icon name="MessageSquare" size={48} className="mx-auto mb-4 opacity-30" />
                  <p>Выберите новость для просмотра комментариев</p>
                </div>
              ) : isLoadingComments ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : comments.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  Комментариев пока нет
                </div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {comments.map((comment) => (
                    <div
                      key={comment.id}
                      className="p-4 rounded-lg border border-border bg-background/50 hover:border-primary/30 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        {comment.avatar_url ? (
                          <img 
                            src={comment.avatar_url} 
                            alt={comment.author}
                            className="w-10 h-10 rounded-full"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                            {comment.avatar}
                          </div>
                        )}
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <span className="font-semibold text-sm">{comment.author}</span>
                            <span className="text-xs text-muted-foreground">{comment.date}</span>
                          </div>
                          <p className="text-sm text-muted-foreground mb-2">{comment.text}</p>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDeleteComment(comment.id)}
                            className="text-destructive hover:text-destructive h-7 px-2"
                          >
                            <Icon name="Trash2" size={14} className="mr-1" />
                            Удалить
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
        )}

        {activeTab === 'shop' && (
        <div className="grid gap-8 lg:grid-cols-2">
          <div>
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name={editingShopId ? "Edit" : "Plus"} size={24} />
                {editingShopId ? 'Редактировать товар' : 'Добавить товар'}
              </h2>
              
              <form onSubmit={handleShopSubmit} className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Название</label>
                  <Input
                    value={shopFormData.name}
                    onChange={(e) => setShopFormData({ ...shopFormData, name: e.target.value })}
                    placeholder="Стартовый пакет"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Количество</label>
                  <Input
                    value={shopFormData.amount}
                    onChange={(e) => setShopFormData({ ...shopFormData, amount: e.target.value })}
                    placeholder="500 монет"
                    required
                  />
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">Цена (₽)</label>
                  <Input
                    type="number"
                    value={shopFormData.price}
                    onChange={(e) => setShopFormData({ ...shopFormData, price: Number(e.target.value) })}
                    placeholder="199"
                    required
                  />
                </div>

                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={shopFormData.is_active}
                    onChange={(e) => setShopFormData({ ...shopFormData, is_active: e.target.checked })}
                    className="w-4 h-4"
                  />
                  <label htmlFor="is_active" className="text-sm font-medium">
                    Активен (отображается на сайте)
                  </label>
                </div>

                <div className="flex gap-3 pt-4">
                  <Button type="submit" className="flex-1">
                    <Icon name={editingShopId ? "Save" : "Plus"} size={18} className="mr-2" />
                    {editingShopId ? 'Сохранить' : 'Добавить'}
                  </Button>
                  {editingShopId && (
                    <Button type="button" variant="outline" onClick={resetShopForm}>
                      Отмена
                    </Button>
                  )}
                </div>
              </form>
            </Card>
          </div>

          <div>
            <Card className="p-6 bg-card/80 backdrop-blur border-primary/20">
              <h2 className="text-2xl font-bold mb-6 flex items-center gap-2">
                <Icon name="ShoppingBag" size={24} />
                Товары в магазине ({shopItems.length})
              </h2>

              {isLoadingShop ? (
                <div className="text-center py-8 text-muted-foreground">Загрузка...</div>
              ) : shopItems.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">Товаров пока нет</div>
              ) : (
                <div className="space-y-3 max-h-[600px] overflow-y-auto pr-2">
                  {shopItems.map((item) => (
                    <div
                      key={item.id}
                      className={`p-4 rounded-lg border ${item.is_active ? 'border-border bg-background/50' : 'border-border/50 bg-background/20 opacity-60'} hover:border-primary/30 transition-colors`}
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-semibold truncate">{item.name}</h3>
                            {!item.is_active && (
                              <span className="text-xs bg-destructive/20 text-destructive px-2 py-0.5 rounded">
                                Скрыт
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-3 text-sm text-muted-foreground mb-2">
                            <span className="flex items-center gap-1">
                              <Icon name="Coins" size={14} />
                              {item.amount}
                            </span>
                            <span>•</span>
                            <span className="flex items-center gap-1 font-semibold text-primary">
                              {item.price} ₽
                            </span>
                          </div>
                        </div>
                        <div className="flex gap-2 flex-shrink-0">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleEditShopItem(item)}
                          >
                            <Icon name="Edit" size={16} />
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleDeleteShopItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Icon name="Trash2" size={16} />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
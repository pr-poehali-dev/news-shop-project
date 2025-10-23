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

interface SteamUser {
  steamId: string;
  personaName: string;
  avatarUrl: string;
  profileUrl: string;
}

export default function Admin() {
  const navigate = useNavigate();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
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

  useEffect(() => {
    checkAccess();
  }, []);

  useEffect(() => {
    if (isAdmin) {
      loadNews();
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
          <p className="text-muted-foreground">Управление новостями сайта</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
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
        </div>
      </div>
    </div>
  );
}
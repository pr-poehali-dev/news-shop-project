import { useState, useEffect } from 'react';
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

export default function Admin() {
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState({
    title: '',
    category: '',
    image_url: '',
    content: '',
    badge: ''
  });

  useEffect(() => {
    loadNews();
  }, []);

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

import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface Comment {
  id: number;
  author: string;
  text: string;
  date: string;
  avatar: string;
}

interface CommentsProps {
  newsId: string;
}

export default function Comments({ newsId }: CommentsProps) {
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState({ author: '', text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadComments();
  }, [newsId]);

  const loadComments = async () => {
    try {
      const response = await fetch(`${func2url.comments}?news_id=${newsId}`);
      const data = await response.json();
      setComments(data.comments || []);
    } catch (error) {
      console.error('Failed to load comments:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.author.trim() && newComment.text.trim()) {
      try {
        const avatars = ['🎮', '⚔️', '🔮', '🏆', '👥', '🔥', '🛡️', '🐛', '👤'];
        const randomAvatar = avatars[Math.floor(Math.random() * avatars.length)];

        const response = await fetch(func2url.comments, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            news_id: parseInt(newsId),
            author: newComment.author,
            text: newComment.text,
            avatar: randomAvatar
          })
        });

        const data = await response.json();
        if (data.comment) {
          setComments([data.comment, ...comments]);
          setNewComment({ author: '', text: '' });
          setIsFormVisible(false);
        }
      } catch (error) {
        console.error('Failed to create comment:', error);
      }
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-2xl font-bold flex items-center gap-2">
          <Icon name="MessageSquare" size={28} />
          Комментарии ({comments.length})
        </h3>
        {!isFormVisible && (
          <Button onClick={() => setIsFormVisible(true)} className="gap-2">
            <Icon name="Plus" size={18} />
            Оставить комментарий
          </Button>
        )}
      </div>

      {isFormVisible && (
        <Card className="p-6 border-primary/30 bg-card/80 backdrop-blur">
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="text-sm font-medium mb-2 block">Ваше имя</label>
              <Input
                value={newComment.author}
                onChange={(e) => setNewComment({ ...newComment, author: e.target.value })}
                placeholder="Введите ваш никнейм"
                className="bg-background/50"
              />
            </div>
            <div>
              <label className="text-sm font-medium mb-2 block">Комментарий</label>
              <Textarea
                value={newComment.text}
                onChange={(e) => setNewComment({ ...newComment, text: e.target.value })}
                placeholder="Поделитесь своим мнением об обновлении..."
                className="min-h-[100px] bg-background/50"
              />
            </div>
            <div className="flex gap-3">
              <Button type="submit" className="gap-2">
                <Icon name="Send" size={18} />
                Отправить
              </Button>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => setIsFormVisible(false)}
              >
                Отмена
              </Button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-4">
        {isLoading ? (
          <div className="text-center py-8 text-muted-foreground">Загрузка комментариев...</div>
        ) : comments.length === 0 ? (
          <div className="text-center py-8 text-muted-foreground">Пока нет комментариев. Будьте первым!</div>
        ) : (
          comments.map((comment) => (
          <Card key={comment.id} className="p-6 bg-card/50 backdrop-blur border-border hover:border-primary/30 transition-colors">
            <div className="flex gap-4">
              <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center text-2xl flex-shrink-0">
                {comment.avatar}
              </div>
              <div className="flex-1 space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-lg">{comment.author}</h4>
                  <span className="text-sm text-muted-foreground flex items-center gap-1">
                    <Icon name="Clock" size={14} />
                    {comment.date}
                  </span>
                </div>
                <p className="text-muted-foreground leading-relaxed">{comment.text}</p>
                <div className="flex gap-4 pt-2">
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Icon name="ThumbsUp" size={16} />
                    Нравится
                  </button>
                  <button className="text-sm text-muted-foreground hover:text-primary transition-colors flex items-center gap-1">
                    <Icon name="Reply" size={16} />
                    Ответить
                  </button>
                </div>
              </div>
            </div>
          </Card>
        ))
        )}
      </div>
    </div>
  );
}
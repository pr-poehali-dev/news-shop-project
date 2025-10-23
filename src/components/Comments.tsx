import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import Icon from '@/components/ui/icon';

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
  const [comments, setComments] = useState<Comment[]>([
    {
      id: 1,
      author: 'DarkKnight',
      text: 'Отличное обновление! Давно ждал новые миссии.',
      date: '2 часа назад',
      avatar: '🎮'
    },
    {
      id: 2,
      author: 'ShadowHunter',
      text: 'Баланс оружия стал намного лучше, спасибо разработчикам!',
      date: '5 часов назад',
      avatar: '⚔️'
    },
    {
      id: 3,
      author: 'MysticMage',
      text: 'Когда добавите новую локацию? Очень жду продолжения истории.',
      date: '1 день назад',
      avatar: '🔮'
    }
  ]);

  const [newComment, setNewComment] = useState({ author: '', text: '' });
  const [isFormVisible, setIsFormVisible] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (newComment.author.trim() && newComment.text.trim()) {
      const comment: Comment = {
        id: comments.length + 1,
        author: newComment.author,
        text: newComment.text,
        date: 'Только что',
        avatar: '👤'
      };
      setComments([comment, ...comments]);
      setNewComment({ author: '', text: '' });
      setIsFormVisible(false);
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
        {comments.map((comment) => (
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
        ))}
      </div>
    </div>
  );
}

import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import Icon from '@/components/ui/icon';
import GlobalChat from '@/components/GlobalChat';

const Index = () => {
  const navigate = useNavigate();

  const features = [
    {
      icon: 'Newspaper',
      title: 'Новости',
      description: 'Следите за последними обновлениями и событиями',
      route: '/news',
      color: 'from-blue-500/20 to-blue-600/20'
    },
    {
      icon: 'Server',
      title: 'Наши сервера',
      description: 'Выбирайте и подключайтесь к игровым серверам',
      route: '/servers',
      color: 'from-green-500/20 to-green-600/20'
    },
    {
      icon: 'Trophy',
      title: 'Турниры',
      description: 'Участвуйте в турнирах и выигрывайте призы',
      route: '/tournaments',
      color: 'from-yellow-500/20 to-yellow-600/20'
    },
    {
      icon: 'ShoppingBag',
      title: 'Магазин',
      description: 'Покупайте игровые предметы и улучшения',
      route: '/shop',
      color: 'from-purple-500/20 to-purple-600/20'
    },
    {
      icon: 'Handshake',
      title: 'Партнёры',
      description: 'Наши партнёры и сотрудничество',
      route: '/partners',
      color: 'from-red-500/20 to-red-600/20'
    }
  ];

  return (
    <div className="min-h-screen">
      <section className="bg-gradient-to-br from-primary/20 via-background to-background border-b border-border">
        <div className="container mx-auto px-6 py-24">
          <div className="text-center max-w-4xl mx-auto">
            <h1 className="text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Добро пожаловать в Okyes
            </h1>
            <p className="text-2xl text-muted-foreground mb-8">
              Игровое сообщество CS2 с турнирами, серверами и магазином
            </p>
            <div className="flex gap-4 justify-center">
              <Button size="lg" onClick={() => navigate('/tournaments')} className="gap-2">
                <Icon name="Trophy" size={20} />
                Турниры
              </Button>
              <Button size="lg" variant="outline" onClick={() => navigate('/servers')} className="gap-2">
                <Icon name="Server" size={20} />
                Серверы
              </Button>
            </div>
          </div>
        </div>
      </section>

      <main className="container mx-auto px-6 py-16">
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
          {features.map((feature) => (
            <Card
              key={feature.route}
              className="p-6 hover:shadow-lg transition-all cursor-pointer border-2 hover:border-primary/50 group"
              onClick={() => navigate(feature.route)}
            >
              <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}>
                <Icon name={feature.icon as any} size={28} className="text-foreground" />
              </div>
              <h3 className="text-xl font-bold mb-2">{feature.title}</h3>
              <p className="text-muted-foreground">{feature.description}</p>
            </Card>
          ))}
        </div>

        <GlobalChat />
      </main>
    </div>
  );
};

export default Index;

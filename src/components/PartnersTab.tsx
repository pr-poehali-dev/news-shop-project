import { useState, useEffect } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import Icon from '@/components/ui/icon';
import func2url from '../../backend/func2url.json';

interface Partner {
  id: number;
  name: string;
  description: string;
  logo: string;
  website: string;
  category: string;
  isActive: boolean;
  orderPosition: number;
}

const PartnersTab = () => {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadPartners();
  }, []);

  const loadPartners = async () => {
    const cachedPartners = localStorage.getItem('partners');
    if (cachedPartners) {
      setPartners(JSON.parse(cachedPartners));
    }

    try {
      const response = await fetch(func2url.partners);
      const data = await response.json();
      setPartners(data.partners || []);
      localStorage.setItem('partners', JSON.stringify(data.partners || []));
    } catch (error) {
      console.error('Failed to load partners:', error);
    }
  };

  const categories = Array.from(new Set(partners.map(p => p.category)));

  return (
    <div className="container mx-auto px-6 py-16">
      <div className="space-y-10">
        <div className="space-y-3">
          <div className="inline-block px-4 py-1.5 bg-primary/10 border border-primary/20 rounded-full mb-2">
            <span className="text-sm font-medium text-primary">Партнёрство</span>
          </div>
          <h2 className="text-5xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text text-transparent">
            Наши партнёры
          </h2>
          <p className="text-muted-foreground text-xl">
            Компании и проекты, с которыми мы работаем
          </p>
        </div>

        {partners.length === 0 ? (
          <div className="text-center py-12">
            <Icon name="Loader2" size={48} className="mx-auto mb-3 animate-spin text-primary" />
            <p className="text-lg text-muted-foreground">Загрузка партнёров...</p>
          </div>
        ) : (
          categories.map((category) => (
            <div key={category} className="space-y-6">
              <h3 className="text-2xl font-bold flex items-center gap-3">
                <Icon name="Building2" size={24} className="text-primary" />
                {category}
              </h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {partners
                .filter(p => p.category === category)
                .map((partner) => (
                  <Card
                    key={partner.id}
                    className="p-6 bg-card/80 backdrop-blur border-primary/20 hover:border-primary/40 transition-all duration-300 hover:shadow-lg hover:shadow-primary/10"
                  >
                    <div className="flex flex-col items-center text-center space-y-4">
                      <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center text-5xl">
                        {partner.logo}
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="text-xl font-bold">{partner.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {partner.description}
                        </p>
                      </div>

                      <Button
                        variant="outline"
                        className="w-full gap-2"
                        onClick={() => window.open(partner.website, '_blank')}
                      >
                        <Icon name="ExternalLink" size={16} />
                        Перейти на сайт
                      </Button>
                    </div>
                  </Card>
                ))}
            </div>
          </div>
          ))
        )}

        <Card className="p-8 bg-gradient-to-r from-primary/10 to-primary/5 border-primary/20">
          <div className="text-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-primary/20 flex items-center justify-center mx-auto">
              <Icon name="Handshake" size={32} className="text-primary" />
            </div>
            <h3 className="text-2xl font-bold">Хотите стать партнёром?</h3>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Мы всегда открыты к новым предложениям о сотрудничестве. 
              Свяжитесь с нами, чтобы обсудить возможности партнёрства.
            </p>
            <Button className="gap-2" size="lg">
              <Icon name="Mail" size={18} />
              Связаться с нами
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default PartnersTab;
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  MessageCircle, 
  Users, 
  Heart, 
  Zap, 
  Smartphone, 
  Filter,
  Image as ImageIcon,
  Shuffle,
  Play,
  Info,
  UserPlus
} from "lucide-react";
import { Navbar } from "@/components/layout/navbar";
import { LoginModal } from "@/components/auth/login-modal";
import { RegisterModal } from "@/components/auth/register-modal";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";

export default function Landing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [showRegisterModal, setShowRegisterModal] = useState(false);

  // Redirect authenticated users to profile
  useEffect(() => {
    if (isAuthenticated) {
      setLocation('/profile');
    }
  }, [isAuthenticated, setLocation]);

  const handleStartChatting = () => {
    if (isAuthenticated) {
      setLocation("/chat");
    } else {
      setShowRegisterModal(true);
    }
  };

  const handleLearnMore = () => {
    document.getElementById("features")?.scrollIntoView({ behavior: "smooth" });
  };

  const features = [
    {
      icon: Shuffle,
      title: "Conversas Aleatórias",
      description: "Liga-te instantaneamente com pessoas de todo o Portugal. Cada conversa é uma nova aventura!",
      gradient: "from-primary to-green-600"
    },
    {
      icon: Filter,
      title: "Filtros por Género",
      description: "Personaliza a tua experiência escolhendo conversar com homens, mulheres ou ambos.",
      gradient: "from-blue-500 to-blue-600"
    },
    {
      icon: Users,
      title: "Sistema de Amigos",
      description: "Encontraste alguém especial? Envia um pedido de amizade e conversem em privado!",
      gradient: "from-purple-500 to-purple-600"
    },
    {
      icon: ImageIcon,
      title: "Partilha de Imagens",
      description: "Partilha momentos através de imagens. Torna as conversas mais visuais e divertidas!",
      gradient: "from-orange-500 to-red-500"
    },
    {
      icon: Zap,
      title: "Tempo Real",
      description: "Comunicação instantânea com tecnologia WebSocket. As mensagens chegam em milissegundos!",
      gradient: "from-teal-500 to-cyan-600"
    },
    {
      icon: Smartphone,
      title: "Multi-Dispositivo",
      description: "Conversa onde quiseres! Funciona perfeitamente no computador, tablet e telemóvel.",
      gradient: "from-pink-500 to-rose-600"
    }
  ];

  const stats = [
    { value: "50K+", label: "Utilizadores Ativos" },
    { value: "2M+", label: "Conversas Criadas" },
    { value: "15K+", label: "Amizades Formadas" }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar 
        onOpenLogin={() => setShowLoginModal(true)}
        onOpenRegister={() => setShowRegisterModal(true)}
      />

      {/* Hero Section */}
      <section 
        className="relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          backgroundImage: `linear-gradient(rgba(16, 185, 129, 0.8), rgba(5, 150, 105, 0.8)), url('https://images.unsplash.com/photo-1555881400-74d7acaacd8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&h=1080')`,
          backgroundSize: "cover",
          backgroundPosition: "center"
        }}
      >
        <div className="relative z-10 text-center text-white px-4 sm:px-6 lg:px-8 max-w-4xl mx-auto">
          <h1 className="text-4xl sm:text-6xl font-bold mb-6 animate-in slide-in-from-bottom duration-700">
            Conhece Pessoas <br />
            <span className="text-yellow-300">Incríveis</span> em Portugal
          </h1>
          <p className="text-xl sm:text-2xl mb-8 text-gray-100 animate-in slide-in-from-bottom duration-700 delay-200">
            Conversas aleatórias 1-on-1 com portugueses de todo o país. Faz novos amigos e cria ligações autênticas.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center animate-in slide-in-from-bottom duration-700 delay-400">
            <Button 
              size="lg"
              className="bg-white text-primary hover:bg-gray-100 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={handleStartChatting}
            >
              <Play className="w-5 h-5 mr-2" />
              Começar a Conversar
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-white text-white hover:bg-white hover:text-primary px-8 py-4 text-lg font-semibold rounded-full transform hover:scale-105 transition-all duration-300"
              onClick={handleLearnMore}
            >
              <Info className="w-5 h-5 mr-2" />
              Saber Mais
            </Button>
          </div>
        </div>

        {/* Floating Elements */}
        <div className="absolute top-20 left-10 text-white opacity-60 animate-bounce">
          <Heart className="w-8 h-8" />
        </div>
        <div className="absolute top-40 right-20 text-white opacity-60 animate-bounce delay-1000">
          <MessageCircle className="w-6 h-6" />
        </div>
        <div className="absolute bottom-40 left-20 text-white opacity-60 animate-bounce delay-2000">
          <Users className="w-6 h-6" />
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Funcionalidades Incríveis
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Descobre tudo o que o ChatPortugal tem para te oferecer
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feature, index) => {
              const Icon = feature.icon;
              return (
                <Card 
                  key={index}
                  className={`bg-gradient-to-br ${feature.gradient} text-white transform hover:scale-105 transition-all duration-300 shadow-xl border-0 overflow-hidden`}
                >
                  <CardContent className="p-8">
                    <div className="bg-white bg-opacity-20 rounded-full w-16 h-16 flex items-center justify-center mb-6">
                      <Icon className="w-8 h-8" />
                    </div>
                    <h3 className="text-xl font-bold mb-4">{feature.title}</h3>
                    <p className="text-white/90">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Chat Preview Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Experimenta a Interface
            </h2>
            <p className="text-xl text-gray-600">
              Vê como é fácil e intuitivo conversar no ChatPortugal
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden shadow-2xl border-0">
              {/* Chat Header */}
              <div className="bg-primary text-white p-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center mr-4">
                    <Users className="w-5 h-5 text-green-800" />
                  </div>
                  <div>
                    <h3 className="font-semibold">Maria, 25 anos</h3>
                    <p className="text-green-200 text-sm">Online - Lisboa</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-600">
                    <UserPlus className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="text-white hover:bg-green-600">
                    <Shuffle className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              {/* Chat Messages */}
              <div className="h-96 overflow-y-auto p-6 space-y-4 bg-gray-50">
                {/* Sample Messages */}
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm max-w-xs">
                    <p className="text-gray-800">Olá! Como estás? 😊</p>
                    <span className="text-xs text-gray-500 mt-2 block">14:32</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-br-sm max-w-xs">
                    <p>Oi! Estou bem, obrigado! E tu? De que parte de Portugal és?</p>
                    <span className="text-xs text-green-200 mt-2 block">14:33</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl rounded-bl-sm shadow-sm max-w-xs">
                    <p className="text-gray-800 mb-2">Sou de Lisboa! Acabei de tirar esta foto na Baixa</p>
                    <img 
                      src="https://images.unsplash.com/photo-1513735492246-483525079686?w=400&h=300&fit=crop" 
                      alt="Baixa de Lisboa" 
                      className="rounded-lg w-full"
                    />
                    <span className="text-xs text-gray-500 mt-2 block">14:35</span>
                  </div>
                </div>

                <div className="flex justify-end">
                  <div className="bg-primary text-white p-4 rounded-2xl rounded-br-sm max-w-xs">
                    <p>Que linda! Eu sou do Porto. Adoro Lisboa! ❤️</p>
                    <span className="text-xs text-green-200 mt-2 block">14:36</span>
                  </div>
                </div>

                {/* Typing Indicator */}
                <div className="flex justify-start">
                  <div className="bg-white p-4 rounded-2xl shadow-sm">
                    <div className="flex space-x-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-100"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse delay-200"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Chat Input */}
              <div className="p-6 bg-white border-t border-gray-200">
                <div className="flex items-center space-x-4">
                  <Button variant="ghost" size="sm" className="text-gray-500 hover:text-primary">
                    <ImageIcon className="w-5 h-5" />
                  </Button>
                  <div className="flex-1 relative">
                    <input 
                      type="text" 
                      placeholder="Escreve a tua mensagem..." 
                      className="w-full p-3 pr-12 border border-gray-300 rounded-full focus:outline-none focus:border-primary transition-colors bg-gray-50"
                      readOnly
                    />
                    <Button size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8">
                      <MessageCircle className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 bg-gradient-to-r from-primary to-green-600 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Junta-te à Nossa Comunidade
            </h2>
            <p className="text-xl text-green-100">
              Milhares de pessoas já estão a conversar no ChatPortugal
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 text-center">
            {stats.map((stat, index) => (
              <Card key={index} className="bg-white/10 backdrop-blur-sm border-0 text-white">
                <CardContent className="p-8">
                  <div className="text-4xl font-bold mb-2">{stat.value}</div>
                  <div className="text-green-200">{stat.label}</div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl sm:text-5xl font-bold mb-6">
            Pronto para Conhecer <br />
            <span className="text-primary">Pessoas Incríveis?</span>
          </h2>
          <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto">
            Regista-te gratuitamente e começa já a ter conversas interessantes com pessoas de todo o Portugal.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg"
              className="bg-primary hover:bg-green-600 px-8 py-4 text-lg font-semibold rounded-full shadow-lg transform hover:scale-105 transition-all duration-300"
              onClick={() => setShowRegisterModal(true)}
            >
              <UserPlus className="w-5 h-5 mr-2" />
              Registar Gratuitamente
            </Button>
            <Button 
              variant="outline"
              size="lg"
              className="border-2 border-gray-600 text-gray-300 hover:border-primary hover:text-primary px-8 py-4 text-lg font-semibold rounded-full transition-all duration-300"
              onClick={handleStartChatting}
            >
              <Play className="w-5 h-5 mr-2" />
              Experimentar como Visitante
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-300 py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center mb-4">
                <MessageCircle className="text-primary text-2xl mr-3" />
                <span className="text-xl font-bold text-white">ChatPortugal</span>
              </div>
              <p className="text-gray-400">
                A plataforma líder em conversas aleatórias em Portugal. Conhece pessoas novas todos os dias!
              </p>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Funcionalidades</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Chat Aleatório</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Sistema de Amigos</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Partilha de Imagens</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Filtros</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Suporte</h3>
              <ul className="space-y-2 text-gray-400">
                <li><a href="#" className="hover:text-primary transition-colors">Centro de Ajuda</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacidade</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Contactos</a></li>
              </ul>
            </div>
            
            <div>
              <h3 className="text-white font-semibold mb-4">Segue-nos</h3>
              <div className="flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z"/>
                  </svg>
                </a>
                <a href="#" className="text-gray-400 hover:text-primary transition-colors">
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M22.46 6c-.77.35-1.6.58-2.46.69.88-.53 1.56-1.37 1.88-2.38-.83.5-1.75.85-2.72 1.05C18.37 4.5 17.26 4 16 4c-2.35 0-4.27 1.92-4.27 4.29 0 .34.04.67.11.98C8.28 9.09 5.11 7.38 3 4.79c-.37.63-.58 1.37-.58 2.15 0 1.49.75 2.81 1.91 3.56-.71 0-1.37-.2-1.95-.5v.03c0 2.08 1.48 3.82 3.44 4.21a4.22 4.22 0 0 1-1.93.07 4.28 4.28 0 0 0 4 2.98 8.521 8.521 0 0 1-5.33 1.84c-.34 0-.68-.02-1.02-.06C3.44 20.29 5.7 21 8.12 21 16 21 20.33 14.46 20.33 8.79c0-.19 0-.37-.01-.56.84-.6 1.56-1.36 2.14-2.23z"/>
                  </svg>
                </a>
              </div>
            </div>
          </div>
          
          <div className="border-t border-gray-800 mt-8 pt-8 text-center text-gray-400">
            <p>&copy; 2024 ChatPortugal. Todos os direitos reservados. Feito com ❤️ em Portugal.</p>
          </div>
        </div>
      </footer>

      {/* Modals */}
      <LoginModal 
        isOpen={showLoginModal} 
        onClose={() => setShowLoginModal(false)} 
      />
      <RegisterModal 
        isOpen={showRegisterModal} 
        onClose={() => setShowRegisterModal(false)} 
      />
    </div>
  );
}

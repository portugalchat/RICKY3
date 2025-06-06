import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChatInterface } from "@/components/chat/chat-interface";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";
import { Search, ArrowLeft, MessageCircle, Info } from "lucide-react";
import { useLocation } from "wouter";

export default function Chat() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { isSearching, currentChat, startSearch, stopSearch } = useChat();
  const [preferredGender, setPreferredGender] = useState("both");

  const handleStartSearch = () => {
    startSearch(preferredGender);
  };

  const handleBackToProfile = () => {
    setLocation("/profile");
  };

  const handleStopSearch = () => {
    stopSearch();
  };

  if (!user) {
    setLocation("/");
    return null;
  }

  if (currentChat) {
    return (
      <div className="h-screen flex flex-col">
        <ChatInterface />
      </div>
    );
  }

  if (isSearching) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card className="w-full max-w-md mx-4">
          <CardContent className="pt-6">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-4 border-primary border-t-transparent mx-auto mb-4"></div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">A procurar alguém para conversar...</h2>
              <p className="text-gray-600 mb-4">Isto pode demorar alguns segundos</p>
              <div className="w-full bg-gray-200 rounded-full h-2 mb-6">
                <div className="bg-primary h-2 rounded-full animate-pulse" style={{ width: "60%" }}></div>
              </div>
              <Button 
                variant="outline" 
                onClick={handleStopSearch}
                className="w-full"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Voltar Atrás
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-2xl mx-auto">
          
          {/* Header */}
          <div className="text-center mb-8">
            <Button
              variant="ghost"
              size="sm"
              className="mb-6"
              onClick={handleBackToProfile}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Perfil
            </Button>
            
            <div className="bg-white dark:bg-gray-800 rounded-2xl p-8 shadow-lg border">
              <div className="flex items-center justify-center mb-6">
                <div className="bg-gradient-to-r from-purple-600 to-blue-600 rounded-full p-4">
                  <MessageCircle className="w-8 h-8 text-white" />
                </div>
              </div>
              
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-3">
                Olá, {user.name}! 👋
              </h1>
              <p className="text-gray-600 dark:text-gray-300 text-lg">
                Pronto para conhecer pessoas incríveis? Escolhe as tuas preferências e vamos começar!
              </p>
            </div>
          </div>

          {/* Preferences Card */}
          <Card className="mb-6 bg-white dark:bg-gray-800 shadow-lg border-0">
            <CardContent className="p-8">
              <div className="space-y-6">
                <div>
                  <label className="block text-lg font-semibold text-gray-900 dark:text-white mb-4">
                    Com quem queres conversar?
                  </label>
                  <Select value={preferredGender} onValueChange={setPreferredGender}>
                    <SelectTrigger className="h-12 text-lg">
                      <SelectValue placeholder="Seleciona a tua preferência" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="both">Homens e Mulheres</SelectItem>
                      <SelectItem value="male">Apenas Homens</SelectItem>
                      <SelectItem value="female">Apenas Mulheres</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-blue-50 dark:from-purple-900/20 dark:to-blue-900/20 rounded-xl p-6 border border-purple-200 dark:border-purple-700">
                  <h3 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
                    <Info className="w-5 h-5 mr-2 text-purple-600" />
                    Antes de começares:
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Sê respeitoso e amigável
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Não partilhes informações pessoais
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-purple-600 rounded-full mr-3"></div>
                      Podes pular a conversa a qualquer momento
                    </div>
                    <div className="flex items-center text-sm text-gray-700 dark:text-gray-300">
                      <div className="w-2 h-2 bg-blue-600 rounded-full mr-3"></div>
                      Diverte-te e faz novos amigos!
                    </div>
                  </div>
                </div>

                <Button 
                  className="w-full bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700 py-4 text-lg font-semibold rounded-xl shadow-lg transition-all duration-200 transform hover:scale-105"
                  onClick={handleStartSearch}
                >
                  <Search className="w-6 h-6 mr-3" />
                  Começar a Procurar
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-purple-600 mb-1">1000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Utilizadores Online</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600 mb-1">5000+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Conversas Hoje</div>
              </CardContent>
            </Card>
            <Card className="bg-white dark:bg-gray-800 border-0 shadow-md">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-green-600 mb-1">200+</div>
                <div className="text-sm text-gray-600 dark:text-gray-300">Novas Amizades</div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

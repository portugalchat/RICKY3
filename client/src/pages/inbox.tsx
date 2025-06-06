import { useAuth } from "@/contexts/auth-context";
import { useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, MessageCircle } from "lucide-react";
import { useLocation } from "wouter";
import { User } from "@/shared-types";
import { NavbarProfile } from "@/components/layout/navbar-profile";

export default function Inbox() {
  const { user } = useAuth();
  const [, setLocation] = useLocation();

  // Fetch user friends for inbox
  const { data: friends = [], isLoading } = useQuery<User[]>({
    queryKey: ['/api/friends', user?.id],
    enabled: !!user?.id,
  });

  if (!user) {
    setLocation('/');
    return null;
  }

  const openPrivateChat = (friendId: number) => {
    setLocation(`/private-chat/${friendId}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavbarProfile />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setLocation('/profile')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar ao Perfil
            </Button>
            <h1 className="text-2xl font-bold">Mensagens Privadas</h1>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageCircle className="w-5 h-5" />
                Os Teus Amigos
              </CardTitle>
            </CardHeader>
            
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                  <p className="mt-2 text-gray-600">A carregar amigos...</p>
                </div>
              ) : friends.length === 0 ? (
                <div className="text-center py-8">
                  <MessageCircle className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600 mb-4">Ainda não tens amigos para conversar.</p>
                  <Button onClick={() => setLocation('/chat')}>
                    Encontrar Pessoas
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <Avatar className="h-12 w-12">
                          <AvatarImage src={friend.profilePicture || undefined} />
                          <AvatarFallback>{friend.name[0]}</AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">{friend.name}</h3>
                          <p className="text-sm text-gray-600">@{friend.username}</p>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline" className="text-xs">
                              {friend.age} anos
                            </Badge>
                            <Badge variant="outline" className="text-xs">
                              {friend.gender === 'male' ? 'Masculino' : 'Feminino'}
                            </Badge>
                            <Badge variant={friend.isOnline ? 'default' : 'secondary'} className="text-xs">
                              {friend.isOnline ? 'Online' : 'Offline'}
                            </Badge>
                          </div>
                        </div>
                      </div>
                      
                      <Button onClick={() => openPrivateChat(friend.id)}>
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conversar
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
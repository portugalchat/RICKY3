import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Input } from "@/components/ui/input";
import { ArrowLeft, Send } from "lucide-react";
import { useLocation } from "wouter";
import { User, PrivateMessage } from "@/shared-types";
import { NavbarProfile } from "@/components/layout/navbar-profile";

interface PrivateChatProps {
  params: {
    friendId: string;
  };
}

export default function PrivateChat({ params }: PrivateChatProps) {
  const { user } = useAuth();
  const [, setLocation] = useLocation();
  const [message, setMessage] = useState("");
  
  const friendIdNum = parseInt(params.friendId);

  // Fetch friend details
  const { data: friend } = useQuery<User>({
    queryKey: ['/api/users', friendIdNum],
    enabled: !!friendIdNum,
  });

  // Fetch private messages
  const { data: messages = [], isLoading } = useQuery<PrivateMessage[]>({
    queryKey: ['/api/private-messages', user?.id, friendIdNum],
    enabled: !!user?.id && !!friendIdNum,
    refetchInterval: 2000, // Poll for new messages
  });

  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: async (content: string) => {
      return apiRequest('/api/private-messages', 'POST', {
        senderId: user?.id,
        receiverId: friendIdNum,
        content
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/private-messages', user?.id, friendIdNum] });
      setMessage("");
    },
  });

  const handleSendMessage = () => {
    if (message.trim() && user) {
      sendMessageMutation.mutate(message.trim());
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSendMessage();
    }
  };

  if (!user) {
    setLocation('/');
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <NavbarProfile />
      
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto">
          <div className="flex items-center gap-4 mb-6">
            <Button variant="ghost" onClick={() => setLocation('/inbox')}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Voltar para Inbox
            </Button>
            {friend && (
              <div className="flex items-center gap-3">
                <Avatar>
                  <AvatarImage src={friend.profilePicture || undefined} />
                  <AvatarFallback>{friend.name[0]}</AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-semibold">{friend.name}</h2>
                  <p className="text-gray-600">@{friend.username}</p>
                </div>
              </div>
            )}
          </div>

          <Card className="h-[600px] flex flex-col">
            <CardHeader>
              <CardTitle>Chat Privado</CardTitle>
            </CardHeader>
            
            <CardContent className="flex-1 flex flex-col">
              {/* Messages Area */}
              <div className="flex-1 overflow-y-auto mb-4 space-y-4 p-4 bg-gray-50 rounded-lg">
                {isLoading ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2 text-gray-600">A carregar mensagens...</p>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center py-8">
                    <p className="text-gray-600">Ainda não há mensagens. Envia a primeira!</p>
                  </div>
                ) : (
                  messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.senderId === user.id ? 'justify-end' : 'justify-start'}`}
                    >
                      <div
                        className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                          msg.senderId === user.id
                            ? 'bg-blue-600 text-white'
                            : 'bg-white text-gray-800 border'
                        }`}
                      >
                        <p>{msg.content}</p>
                        <p className={`text-xs mt-1 ${
                          msg.senderId === user.id ? 'text-blue-100' : 'text-gray-500'
                        }`}>
                          {new Date(msg.createdAt!).toLocaleTimeString('pt-PT', {
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Message Input */}
              <div className="flex gap-2">
                <Input
                  placeholder="Escreve a tua mensagem..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  onKeyPress={handleKeyPress}
                  disabled={sendMessageMutation.isPending}
                />
                <Button 
                  onClick={handleSendMessage}
                  disabled={!message.trim() || sendMessageMutation.isPending}
                >
                  <Send className="w-4 h-4" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
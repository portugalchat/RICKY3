import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { Users, MessageCircle, UserPlus, ArrowLeft, Check, X } from "lucide-react";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

export default function Dashboard() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: friends = [] } = useQuery({
    queryKey: [`/api/friends/${user?.id}`],
    enabled: !!user,
  });

  const { data: friendRequests = [] } = useQuery({
    queryKey: [`/api/friends/requests/${user?.id}`],
    enabled: !!user,
  });

  const respondToFriendRequestMutation = useMutation({
    mutationFn: async ({ friendshipId, status }: { friendshipId: number; status: string }) => {
      const response = await apiRequest("POST", "/api/friends/respond", { friendshipId, status });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/friends/requests/${user?.id}`] });
      queryClient.invalidateQueries({ queryKey: [`/api/friends/${user?.id}`] });
      toast({
        title: "Sucesso",
        description: "Pedido de amizade processado!",
      });
    },
  });

  if (!user) {
    setLocation("/");
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="mb-6">
          <Button
            variant="ghost"
            onClick={() => setLocation("/")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar
          </Button>
          
          <h1 className="text-3xl font-bold text-gray-900">
            Painel de Controlo
          </h1>
          <p className="text-gray-600">Gere os teus amigos e conversas</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-primary" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Amigos</p>
                  <p className="text-2xl font-bold">{friends.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center">
                <UserPlus className="h-8 w-8 text-blue-500" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Pedidos Pendentes</p>
                  <p className="text-2xl font-bold">{friendRequests.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-center">
                <Button 
                  className="w-full"
                  onClick={() => setLocation("/chat")}
                >
                  <MessageCircle className="w-4 h-4 mr-2" />
                  Começar a Conversar
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="friends" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="friends">Amigos ({friends.length})</TabsTrigger>
            <TabsTrigger value="requests">
              Pedidos ({friendRequests.length})
              {friendRequests.length > 0 && (
                <Badge variant="destructive" className="ml-2">
                  {friendRequests.length}
                </Badge>
              )}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="friends" className="space-y-4">
            {friends.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Ainda não tens amigos
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Começa a conversar e envia pedidos de amizade para pessoas interessantes!
                    </p>
                    <Button onClick={() => setLocation("/chat")}>
                      Começar a Conversar
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ) : (
              friends.map((friend: any) => (
                <Card key={friend.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-primary rounded-full flex items-center justify-center mr-4">
                          <Users className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">{friend.name}</h3>
                          <p className="text-sm text-gray-600">
                            {friend.age} anos • {friend.isOnline ? "Online" : "Offline"}
                          </p>
                        </div>
                      </div>
                      <Button variant="outline">
                        <MessageCircle className="w-4 h-4 mr-2" />
                        Conversar
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
          
          <TabsContent value="requests" className="space-y-4">
            {friendRequests.length === 0 ? (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center py-8">
                    <UserPlus className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Nenhum pedido pendente
                    </h3>
                    <p className="text-gray-600">
                      Quando alguém te enviar um pedido de amizade, aparecerá aqui.
                    </p>
                  </div>
                </CardContent>
              </Card>
            ) : (
              friendRequests.map((request: any) => (
                <Card key={request.id}>
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center mr-4">
                          <UserPlus className="w-5 h-5 text-white" />
                        </div>
                        <div>
                          <h3 className="font-semibold">Pedido de amizade</h3>
                          <p className="text-sm text-gray-600">
                            Alguém quer ser teu amigo!
                          </p>
                        </div>
                      </div>
                      <div className="flex space-x-2">
                        <Button
                          size="sm"
                          onClick={() =>
                            respondToFriendRequestMutation.mutate({
                              friendshipId: request.id,
                              status: "accepted",
                            })
                          }
                          disabled={respondToFriendRequestMutation.isPending}
                        >
                          <Check className="w-4 h-4 mr-1" />
                          Aceitar
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() =>
                            respondToFriendRequestMutation.mutate({
                              friendshipId: request.id,
                              status: "rejected",
                            })
                          }
                          disabled={respondToFriendRequestMutation.isPending}
                        >
                          <X className="w-4 h-4 mr-1" />
                          Rejeitar
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}

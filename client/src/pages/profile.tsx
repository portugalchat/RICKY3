import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/auth-context";
import { useQuery, useMutation } from "@tanstack/react-query";
import { queryClient, apiRequest } from "@/lib/queryClient";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Camera, MessageCircle, UserPlus, Check, X, Users } from "lucide-react";
import { User, Friendship } from "@/shared-types";
import { useToast } from "@/hooks/use-toast";
import { useLocation } from "wouter";
import { NavbarProfile } from "@/components/layout/navbar-profile";

export default function Profile() {
  const { user, updateUser } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  const [imageFile, setImageFile] = useState<File | null>(null);

  // Mark user as online when they access profile
  useEffect(() => {
    if (user && !user.isOnline) {
      fetch(`/api/users/${user.id}/online`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ isOnline: true })
      }).then(() => {
        updateUser({ ...user, isOnline: true });
      });
    }
  }, [user, updateUser]);

  // Fetch user friends
  const { data: friends = [], isLoading: friendsLoading } = useQuery<User[]>({
    queryKey: ['/api/friends', user?.id],
    queryFn: () => fetch(`/api/friends/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Fetch pending friend requests
  const { data: friendRequests = [], isLoading: requestsLoading } = useQuery<Friendship[]>({
    queryKey: ['/api/friends/requests', user?.id],
    queryFn: () => fetch(`/api/friends/requests/${user?.id}`).then(res => res.json()),
    enabled: !!user?.id,
  });

  // Accept friend request mutation
  const acceptRequestMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      return apiRequest('POST', `/api/friends/${friendshipId}/accept`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends'] });
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({
        title: "Pedido de amizade aceite!",
        description: "Agora podem conversar em privado.",
      });
    },
  });

  // Decline friend request mutation
  const declineRequestMutation = useMutation({
    mutationFn: async (friendshipId: number) => {
      return apiRequest('POST', `/api/friends/${friendshipId}/decline`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/friends/requests'] });
      toast({
        title: "Pedido de amizade recusado",
      });
    },
  });

  // Start chat with friend mutation
  const startChatMutation = useMutation({
    mutationFn: async (friendId: number) => {
      return apiRequest('POST', '/api/chat/private/start', { friendId });
    },
    onSuccess: () => {
      setLocation('/chat');
    },
  });

  // Start random chat function
  const startRandomChat = () => {
    setLocation('/chat');
  };

  // Upload profile picture mutation
  const uploadPictureMutation = useMutation({
    mutationFn: async (file: File) => {
      const formData = new FormData();
      formData.append('profilePicture', file);
      
      const response = await fetch('/api/users/profile-picture', {
        method: 'POST',
        body: formData,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (user && data.imageUrl) {
        // Update user with new profile picture
        const updatedUser = { ...user, profilePicture: data.imageUrl };
        updateUser(updatedUser);
        
        // Update the user in the database
        fetch(`/api/users/${user.id}/profile-picture`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ profilePicture: data.imageUrl })
        });
      }
      
      toast({
        title: "Foto de perfil atualizada!",
      });
      setImageFile(null);
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Erro ao carregar a foto de perfil",
        variant: "destructive",
      });
    },
  });

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImageFile(file);
    }
  };

  const handleUploadPicture = () => {
    if (imageFile) {
      uploadPictureMutation.mutate(imageFile);
    }
  };

  if (!user) {
    return <div>Carregando...</div>;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-100 dark:from-gray-900 dark:via-purple-900 dark:to-indigo-900">
      <NavbarProfile />
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          
          {/* Profile Header */}
          <Card>
            <CardHeader>
              <div className="flex flex-col md:flex-row items-center gap-6">
                <div className="relative">
                  <Avatar className="w-24 h-24">
                    <AvatarImage src={user.profilePicture || undefined} />
                    <AvatarFallback className="text-xl">
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <Label htmlFor="profile-picture" className="absolute -bottom-2 -right-2 bg-primary text-primary-foreground rounded-full p-2 cursor-pointer hover:bg-primary/90">
                    <Camera className="w-4 h-4" />
                    <Input
                      id="profile-picture"
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={handleImageUpload}
                    />
                  </Label>
                </div>
                
                <div className="text-center md:text-left flex-1">
                  <h1 className="text-2xl font-bold">{user.name}</h1>
                  <p className="text-muted-foreground">@{user.username}</p>
                  <div className="flex flex-wrap gap-2 mt-2 justify-center md:justify-start">
                    <Badge variant="secondary">{user.age} anos</Badge>
                    <Badge variant="outline">{user.gender === 'male' ? 'Masculino' : 'Feminino'}</Badge>
                    <Badge variant={user.isOnline ? 'default' : 'secondary'}>
                      {user.isOnline ? 'Online' : 'Offline'}
                    </Badge>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  {imageFile && (
                    <Button 
                      onClick={handleUploadPicture}
                      disabled={uploadPictureMutation.isPending}
                      size="sm"
                    >
                      {uploadPictureMutation.isPending ? "A guardar..." : "Guardar foto"}
                    </Button>
                  )}
                  <Button 
                    onClick={startRandomChat}
                    className="bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-700 hover:to-blue-700"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Começar a Conversar
                  </Button>
                  <Button 
                    onClick={() => setLocation('/inbox')}
                    variant="outline"
                    size="sm"
                  >
                    <MessageCircle className="w-4 h-4 mr-2" />
                    Mensagens Privadas
                  </Button>
                </div>
              </div>
            </CardHeader>
          </Card>

          <div className="grid md:grid-cols-2 gap-6">
            
            {/* Friends List */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Amigos ({friends.length})
                </CardTitle>
                <CardDescription>
                  Lista dos teus amigos no ChatPortugal
                </CardDescription>
              </CardHeader>
              <CardContent>
                {friendsLoading ? (
                  <div>Carregando amigos...</div>
                ) : friends.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Ainda não tens amigos. Começa uma conversa e envia pedidos de amizade!
                  </p>
                ) : (
                  <div className="space-y-3">
                    {friends.map((friend: User) => (
                      <div key={friend.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={friend.profilePicture || undefined} />
                            <AvatarFallback>
                              {friend.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{friend.name}</p>
                            <p className="text-sm text-muted-foreground">@{friend.username}</p>
                          </div>
                          <Badge variant={friend.isOnline ? 'default' : 'secondary'} className="ml-auto">
                            {friend.isOnline ? 'Online' : 'Offline'}
                          </Badge>
                        </div>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => setLocation(`/private-chat/${friend.id}`)}
                        >
                          <MessageCircle className="w-4 h-4 mr-2" />
                          Enviar Mensagem
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Friend Requests */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="w-5 h-5" />
                  Pedidos de Amizade ({friendRequests.length})
                </CardTitle>
                <CardDescription>
                  Pedidos de amizade pendentes
                </CardDescription>
              </CardHeader>
              <CardContent>
                {requestsLoading ? (
                  <div>Carregando pedidos...</div>
                ) : friendRequests.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">
                    Não tens pedidos de amizade pendentes.
                  </p>
                ) : (
                  <div className="space-y-3">
                    {friendRequests.map((request: Friendship) => (
                      <div key={request.id} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="w-10 h-10">
                            <AvatarImage src={request.senderProfilePicture || undefined} />
                            <AvatarFallback>
                              {request.senderName?.[0] || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="font-medium">{request.senderName}</p>
                            <p className="text-sm text-muted-foreground">@{request.senderUsername}</p>
                            <div className="flex gap-2 mt-1">
                              <Badge variant="outline" className="text-xs">
                                {request.senderAge} anos
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {request.senderGender === 'male' ? 'Masculino' : 'Feminino'}
                              </Badge>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            size="sm" 
                            variant="default"
                            onClick={() => acceptRequestMutation.mutate(request.id!)}
                            disabled={acceptRequestMutation.isPending}
                          >
                            <Check className="w-4 h-4" />
                          </Button>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => declineRequestMutation.mutate(request.id!)}
                            disabled={declineRequestMutation.isPending}
                          >
                            <X className="w-4 h-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
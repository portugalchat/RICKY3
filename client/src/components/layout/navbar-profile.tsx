import { useAuth } from "@/contexts/auth-context";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { MessageCircle, User, LogOut, Home } from "lucide-react";
import { useLocation } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { ThemeToggle } from "@/components/theme-toggle";

export function NavbarProfile() {
  const { user, logout } = useAuth();
  const [, setLocation] = useLocation();

  const logoutMutation = useMutation({
    mutationFn: async () => {
      return apiRequest('POST', '/api/auth/logout', { userId: user?.id });
    },
    onSuccess: () => {
      logout();
      setLocation('/');
    },
  });

  if (!user) return null;

  return (
    <nav className="bg-background border-b">
      <div className="container mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          
          {/* Logo/Brand */}
          <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-primary">
              ChatPortugal
            </h1>
            <Badge variant="outline">
              {user.isOnline ? 'Online' : 'Offline'}
            </Badge>
          </div>

          {/* Navigation Links */}
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/')}
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Início
            </Button>
            
            <Button 
              variant="ghost" 
              onClick={() => setLocation('/chat')}
              className="flex items-center gap-2"
            >
              <MessageCircle className="w-4 h-4" />
              Chat
            </Button>

            <Button 
              variant="ghost" 
              onClick={() => setLocation('/profile')}
              className="flex items-center gap-2"
            >
              <User className="w-4 h-4" />
              Perfil
            </Button>

            {/* User Menu */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src={user.profilePicture || undefined} />
                    <AvatarFallback>
                      {user.name.split(' ').map(n => n[0]).join('').toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuItem className="flex-col items-start">
                  <div className="font-medium">{user.name}</div>
                  <div className="text-sm text-muted-foreground">@{user.username}</div>
                </DropdownMenuItem>
                <DropdownMenuItem 
                  onClick={() => logoutMutation.mutate()}
                  disabled={logoutMutation.isPending}
                  className="text-red-600 dark:text-red-400"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  {logoutMutation.isPending ? 'A sair...' : 'Sair'}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>
    </nav>
  );
}
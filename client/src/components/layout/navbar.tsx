import { Button } from "@/components/ui/button";
import { MessageCircle, Users, Settings } from "lucide-react";
import { useAuth } from "@/contexts/auth-context";
import { ThemeToggle } from "@/components/theme-toggle";

interface NavbarProps {
  onOpenLogin: () => void;
  onOpenRegister: () => void;
}

export function Navbar({ onOpenLogin, onOpenRegister }: NavbarProps) {
  const { user, logout, isAuthenticated } = useAuth();

  return (
    <nav className="bg-background border-b shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <div className="flex-shrink-0 flex items-center">
              <MessageCircle className="text-primary text-2xl mr-3" />
              <span className="text-xl font-bold text-foreground">ChatPortugal</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            {isAuthenticated ? (
              <>
                <div className="flex items-center space-x-2 text-muted-foreground">
                  <span className="text-sm">Olá, {user?.name}</span>
                </div>
                <Button variant="ghost" size="sm">
                  <Users className="h-4 w-4 mr-2" />
                  Amigos
                </Button>
                <Button variant="ghost" size="sm">
                  <Settings className="h-4 w-4 mr-2" />
                  Definições
                </Button>
                <Button variant="outline" size="sm" onClick={logout}>
                  Sair
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghost" onClick={onOpenLogin}>
                  Entrar
                </Button>
                <Button onClick={onOpenRegister}>
                  Registar
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/hooks/use-toast";
import { insertUserSchema, type InsertUser } from "@/shared-types";
import { apiRequest } from "@/lib/queryClient";
import { useAuth } from "@/contexts/auth-context";
import { useLocation } from "wouter";
import { z } from "zod";

interface RegisterModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const registerFormSchema = insertUserSchema.extend({
  terms: z.boolean().refine((val: boolean) => val === true, "Deves aceitar os termos")
});

type RegisterFormData = InsertUser & { terms: boolean };

export function RegisterModal({ isOpen, onClose }: RegisterModalProps) {
  const { login } = useAuth();
  const { toast } = useToast();
  const [, setLocation] = useLocation();
  
  const form = useForm<RegisterFormData>({
    resolver: zodResolver(registerFormSchema),
    defaultValues: {
      email: "",
      username: "",
      password: "",
      name: "",
      age: 18,
      gender: "",
      preferredGender: "",
      terms: false,
    },
  });

  const registerMutation = useMutation({
    mutationFn: async (data: InsertUser) => {
      const response = await apiRequest("POST", "/api/auth/register", data);
      return response.json();
    },
    onSuccess: (data) => {
      login(data.user);
      toast({
        title: "Sucesso",
        description: "Conta criada com sucesso! Bem-vindo ao ChatPortugal!",
      });
      onClose();
      form.reset();
      // Redirect to profile page after successful registration
      setLocation('/profile');
    },
    onError: (error: any) => {
      toast({
        title: "Erro",
        description: error.message || "Erro ao criar conta",
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: RegisterFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Form errors:", form.formState.errors);
    
    if (!data.terms) {
      toast({
        title: "Erro",
        description: "Deves aceitar os termos de uso",
        variant: "destructive",
      });
      return;
    }

    const { terms, ...userData } = data;
    console.log("Sending registration data:", userData);
    registerMutation.mutate(userData);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-center text-2xl font-bold text-gray-900">
            Junta-te ao ChatPortugal
          </DialogTitle>
          <DialogDescription className="text-center text-gray-600">
            Cria a tua conta e começa a conversar!
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 mt-6">
          <div>
            <Label htmlFor="name">Nome</Label>
            <Input
              id="name"
              placeholder="O teu nome"
              {...form.register("name")}
              className="mt-1"
            />
            {form.formState.errors.name && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.name.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              placeholder="o.teu.email@exemplo.com"
              {...form.register("email")}
              className="mt-1"
            />
            {form.formState.errors.email && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.email.message}</p>
            )}
          </div>

          <div>
            <Label htmlFor="username">Username</Label>
            <Input
              id="username"
              placeholder="username único"
              {...form.register("username")}
              className="mt-1"
            />
            {form.formState.errors.username && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.username.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="age">Idade</Label>
            <Input
              id="age"
              type="number"
              min="18"
              max="99"
              {...form.register("age", { valueAsNumber: true })}
              className="mt-1"
            />
            {form.formState.errors.age && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.age.message}</p>
            )}
          </div>
          
          <div>
            <Label>Género</Label>
            <Select
              value={form.watch("gender")}
              onValueChange={(value) => form.setValue("gender", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleciona o teu género" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="male">Masculino</SelectItem>
                <SelectItem value="female">Feminino</SelectItem>
                <SelectItem value="other">Outro</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.gender && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.gender.message}</p>
            )}
          </div>
          
          <div>
            <Label>Queres conversar com</Label>
            <Select
              value={form.watch("preferredGender")}
              onValueChange={(value) => form.setValue("preferredGender", value)}
            >
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Seleciona a tua preferência" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">Homens e Mulheres</SelectItem>
                <SelectItem value="male">Apenas Homens</SelectItem>
                <SelectItem value="female">Apenas Mulheres</SelectItem>
              </SelectContent>
            </Select>
            {form.formState.errors.preferredGender && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.preferredGender.message}</p>
            )}
          </div>
          
          <div>
            <Label htmlFor="password">Palavra-passe</Label>
            <Input
              id="password"
              type="password"
              placeholder="Cria uma palavra-passe segura"
              {...form.register("password")}
              className="mt-1"
            />
            {form.formState.errors.password && (
              <p className="text-sm text-red-500 mt-1">{form.formState.errors.password.message}</p>
            )}
          </div>
          
          <div className="flex items-center space-x-2">
            <Checkbox
              id="terms"
              checked={form.watch("terms")}
              onCheckedChange={(checked) => form.setValue("terms", !!checked)}
            />
            <Label htmlFor="terms" className="text-sm text-gray-600">
              Aceito os{" "}
              <a href="#" className="text-primary hover:underline">
                Termos de Uso
              </a>{" "}
              e{" "}
              <a href="#" className="text-primary hover:underline">
                Política de Privacidade
              </a>
            </Label>
          </div>
          
          <div className="flex gap-4 mt-6">
            <Button type="button" variant="outline" className="flex-1" onClick={onClose}>
              Cancelar
            </Button>
            <Button 
              type="submit" 
              className="flex-1" 
              disabled={registerMutation.isPending}
            >
              {registerMutation.isPending ? "A registar..." : "Registar"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

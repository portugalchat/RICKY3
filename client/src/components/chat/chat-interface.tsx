import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { MessageBubble } from "./message-bubble";
import { useChat } from "@/contexts/chat-context";
import { useAuth } from "@/contexts/auth-context";
import { 
  Send, 
  Image, 
  Smile, 
  UserPlus, 
  SkipForward, 
  X,
  User
} from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export function ChatInterface() {
  const { user } = useAuth();
  const { 
    currentChat, 
    partner, 
    messages, 
    isPartnerTyping, 
    sendMessage, 
    setTyping,
    skipPartner,
    endChat,
    sendFriendRequest
  } = useChat();
  const { toast } = useToast();
  
  const [messageInput, setMessageInput] = useState("");
  const [isTyping, setIsTypingLocal] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout>();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleInputChange = (value: string) => {
    setMessageInput(value);
    
    if (!isTyping && value.length > 0) {
      setIsTypingLocal(true);
      setTyping(true);
    }

    // Clear existing timeout
    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    // Set new timeout
    typingTimeoutRef.current = setTimeout(() => {
      setIsTypingLocal(false);
      setTyping(false);
    }, 1000);
  };

  const handleSendMessage = () => {
    if (messageInput.trim()) {
      sendMessage(messageInput.trim());
      setMessageInput("");
      setIsTypingLocal(false);
      setTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleImageUpload = async () => {
    const input = document.createElement("input");
    input.type = "file";
    input.accept = "image/*";
    
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          // Simulate image upload
          const formData = new FormData();
          formData.append("image", file);
          
          const response = await fetch("/api/upload/image", {
            method: "POST",
            body: formData,
          });
          
          const data = await response.json();
          sendMessage(`Partilhou uma imagem: ${file.name}`, "image", data.imageUrl);
          
          toast({
            title: "Imagem enviada",
            description: "A tua imagem foi partilhada com sucesso!",
          });
        } catch (error) {
          toast({
            title: "Erro",
            description: "Erro ao carregar a imagem",
            variant: "destructive",
          });
        }
      }
    };
    
    input.click();
  };

  const handleSkip = async () => {
    await skipPartner();
    toast({
      title: "Utilizador ignorado",
      description: "A procurar nova pessoa para conversar...",
    });
  };

  const handleEndChat = async () => {
    await endChat();
    toast({
      title: "Conversa terminada",
      description: "A conversa foi terminada",
    });
  };

  const handleFriendRequest = async () => {
    await sendFriendRequest();
    toast({
      title: "Pedido enviado",
      description: "Pedido de amizade enviado com sucesso! ❤️",
    });
  };

  if (!currentChat || !partner) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-gray-500">Nenhuma conversa ativa</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-gray-50">
      {/* Chat Header */}
      <div className="bg-primary text-white p-4 flex items-center justify-between">
        <div className="flex items-center">
          <div className="w-10 h-10 bg-green-400 rounded-full flex items-center justify-center mr-4">
            <User className="w-5 h-5 text-green-800" />
          </div>
          <div>
            <h3 className="font-semibold">{partner.name}, {partner.age} anos</h3>
            <p className="text-green-200 text-sm">
              {isPartnerTyping ? "A escrever..." : "Online"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center space-x-2">
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-green-600"
            onClick={handleFriendRequest}
          >
            <UserPlus className="w-4 h-4 mr-2" />
            Adicionar Amigo
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-green-600"
            onClick={handleSkip}
          >
            <SkipForward className="w-4 h-4 mr-2" />
            Saltar Conversa
          </Button>
          <Button 
            variant="ghost" 
            size="sm" 
            className="text-white hover:bg-green-600"
            onClick={handleEndChat}
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {messages.map((message) => (
          <MessageBubble
            key={message.id}
            message={message}
            isOwn={message.senderId === user?.id}
            senderName={message.senderId === user?.id ? user?.name : partner.name}
          />
        ))}
        
        {/* Typing Indicator */}
        {isPartnerTyping && (
          <div className="flex justify-start">
            <div className="bg-white p-4 rounded-2xl shadow-sm">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse"></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.2s" }}></div>
                <div className="w-2 h-2 bg-gray-400 rounded-full animate-pulse" style={{ animationDelay: "0.4s" }}></div>
              </div>
            </div>
          </div>
        )}
        
        <div ref={messagesEndRef} />
      </div>

      {/* Message Input */}
      <div className="p-4 bg-white border-t border-gray-200">
        <div className="flex items-center space-x-3">
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-primary"
            onClick={handleImageUpload}
          >
            <Image className="w-5 h-5" />
          </Button>
          
          <div className="flex-1 relative">
            <Input
              value={messageInput}
              onChange={(e) => handleInputChange(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Escreve a tua mensagem..."
              className="pr-12 rounded-full"
            />
            <Button
              size="sm"
              className="absolute right-1 top-1/2 transform -translate-y-1/2 rounded-full w-8 h-8"
              onClick={handleSendMessage}
              disabled={!messageInput.trim()}
            >
              <Send className="w-4 h-4" />
            </Button>
          </div>
          
          <Button
            variant="ghost"
            size="sm"
            className="text-gray-500 hover:text-primary"
          >
            <Smile className="w-5 h-5" />
          </Button>
        </div>
      </div>
    </div>
  );
}

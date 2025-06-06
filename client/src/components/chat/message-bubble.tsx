import { format } from "date-fns";
import { User } from "lucide-react";

interface Message {
  id: string;
  content: string;
  senderId: number;
  timestamp: Date;
  type: "text" | "image";
  imageUrl?: string;
}

interface MessageBubbleProps {
  message: Message;
  isOwn: boolean;
  senderName?: string;
}

export function MessageBubble({ message, isOwn, senderName }: MessageBubbleProps) {
  const formatTime = (date: Date) => {
    return format(date, "HH:mm");
  };

  return (
    <div className={`flex ${isOwn ? "justify-end" : "justify-start"} mb-4`}>
      <div className={`
        max-w-[70%] relative
        ${isOwn 
          ? "bg-primary text-white rounded-2xl rounded-br-sm" 
          : "bg-white text-gray-800 rounded-2xl rounded-bl-sm shadow-sm"
        }
        p-4
      `}>
        {!isOwn && senderName && (
          <div className="flex items-center mb-2">
            <div className="w-6 h-6 bg-green-400 rounded-full flex items-center justify-center mr-2">
              <User className="w-3 h-3 text-green-800" />
            </div>
            <span className="text-xs font-semibold text-gray-600">{senderName}</span>
          </div>
        )}
        
        {message.type === "image" && message.imageUrl && (
          <div className="mb-2">
            <img 
              src={message.imageUrl} 
              alt="Imagem partilhada" 
              className="rounded-lg max-w-full h-auto"
            />
          </div>
        )}
        
        {message.content && (
          <p className="text-sm">{message.content}</p>
        )}
        
        <span className={`
          text-xs mt-2 block
          ${isOwn ? "text-green-200" : "text-gray-500"}
        `}>
          {formatTime(message.timestamp)}
        </span>
      </div>
    </div>
  );
}

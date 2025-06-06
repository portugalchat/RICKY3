import React, { createContext, useContext, useState, useEffect } from "react";
import { User, RandomChat } from "@/shared-types";
import { useAuth } from "./auth-context";

interface Message {
  id: string;
  content: string;
  senderId: number;
  timestamp: Date;
  type: "text" | "image";
  imageUrl?: string;
}

interface ChatContextType {
  isSearching: boolean;
  currentChat: RandomChat | null;
  partner: User | null;
  messages: Message[];
  isPartnerTyping: boolean;
  startSearch: (preferredGender: string) => Promise<void>;
  stopSearch: () => void;
  skipPartner: () => Promise<void>;
  endChat: () => Promise<void>;
  sendMessage: (content: string, type?: "text" | "image", imageUrl?: string) => void;
  setTyping: (isTyping: boolean) => void;
  sendFriendRequest: () => Promise<void>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export function ChatProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [isSearching, setIsSearching] = useState(false);
  const [currentChat, setCurrentChat] = useState<RandomChat | null>(null);
  const [partner, setPartner] = useState<User | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isPartnerTyping, setIsPartnerTyping] = useState(false);
  const [socket, setSocket] = useState<WebSocket | null>(null);
  const [searchTimeout, setSearchTimeout] = useState<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (user) {
      // Initialize WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);
      
      ws.onopen = () => {
        console.log('WebSocket connected');
        ws.send(JSON.stringify({
          type: "authenticate",
          userId: user.id
        }));
      };

      ws.onmessage = (event) => {
        const data = JSON.parse(event.data);
        
        switch (data.type) {
          case "match_found":
            setCurrentChat(data.chat);
            setPartner(data.partner);
            setIsSearching(false);
            setMessages([]);
            break;
            
          case "random_message":
            setMessages(prev => [...prev, {
              id: Date.now().toString(),
              content: data.message.content,
              senderId: data.senderId,
              timestamp: new Date(data.timestamp),
              type: data.message.type || "text",
              imageUrl: data.message.imageUrl
            }]);
            break;
            
          case "typing":
            setIsPartnerTyping(data.isTyping);
            if (data.isTyping) {
              setTimeout(() => setIsPartnerTyping(false), 3000);
            }
            break;
            
          case "partner_skipped":
          case "chat_ended":
            setCurrentChat(null);
            setPartner(null);
            setMessages([]);
            setIsPartnerTyping(false);
            break;
        }
      };

      setSocket(ws);

      return () => {
        ws.close();
      };
    }
  }, [user]);

  const startSearch = async (preferredGender: string) => {
    if (!user) return;
    
    setIsSearching(true);
    try {
      const response = await fetch("/api/chat/find-match", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, preferredGender })
      });

      if (response.status === 404) {
        // Keep searching state but don't auto-retry to avoid flashing
        // User can manually retry or stop search
        return;
      }
    } catch (error) {
      console.error("Search error:", error);
      setIsSearching(false);
    }
  };

  const stopSearch = () => {
    setIsSearching(false);
    if (searchTimeout) {
      clearTimeout(searchTimeout);
      setSearchTimeout(null);
    }
  };

  const skipPartner = async () => {
    if (!user || !partner || !currentChat) return;

    try {
      await fetch("/api/chat/skip", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, partnerId: partner.id })
      });

      setCurrentChat(null);
      setPartner(null);
      setMessages([]);
      setIsPartnerTyping(false);
    } catch (error) {
      console.error("Skip error:", error);
    }
  };

  const endChat = async () => {
    if (!user || !currentChat) return;

    try {
      await fetch("/api/chat/end", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id })
      });

      setCurrentChat(null);
      setPartner(null);
      setMessages([]);
      setIsPartnerTyping(false);
    } catch (error) {
      console.error("End chat error:", error);
    }
  };

  const sendMessage = (content: string, type: "text" | "image" = "text", imageUrl?: string) => {
    if (!user || !socket || !currentChat) return;

    const message = {
      id: Date.now().toString(),
      content,
      senderId: user.id,
      timestamp: new Date(),
      type,
      imageUrl
    };

    setMessages(prev => [...prev, message]);

    socket.send(JSON.stringify({
      type: "random_message",
      senderId: user.id,
      message: { content, type, imageUrl }
    }));
  };

  const setTyping = (isTyping: boolean) => {
    if (!user || !socket || !currentChat) return;

    socket.send(JSON.stringify({
      type: "typing",
      userId: user.id,
      isTyping
    }));
  };

  const sendFriendRequest = async () => {
    if (!user || !partner) return;

    try {
      const response = await fetch("/api/friends/request", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: user.id, friendId: partner.id })
      });

      if (response.ok) {
        // Show success notification
        console.log("Pedido de amizade enviado!");
      }
    } catch (error) {
      console.error("Friend request error:", error);
    }
  };

  return (
    <ChatContext.Provider value={{
      isSearching,
      currentChat,
      partner,
      messages,
      isPartnerTyping,
      startSearch,
      stopSearch,
      skipPartner,
      endChat,
      sendMessage,
      setTyping,
      sendFriendRequest
    }}>
      {children}
    </ChatContext.Provider>
  );
}

export function useChat() {
  const context = useContext(ChatContext);
  if (context === undefined) {
    throw new Error("useChat must be used within a ChatProvider");
  }
  return context;
}

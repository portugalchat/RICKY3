import type { Express } from "express";
import { createServer, type Server } from "http";
import { Server as SocketIOServer } from "socket.io";
import { createAdapter } from "@socket.io/redis-adapter";
import { WebSocketServer } from "ws";
import multer from "multer";
import { createRedisClient, getRedisClient } from "./redis";
import { storage } from "./storage";
import { supabase, supabaseAdmin, PROFILE_PICTURES_BUCKET } from "./supabase";
import { setupSupabaseStorage } from "./setup-storage";
import { insertUserSchema, loginSchema, insertFriendshipSchema, insertPrivateMessageSchema } from "@shared/schema";
import { z } from "zod";

// WebSocket connection management
const activeConnections = new Map<number, any>();
const userSockets = new Map<number, any>();

// Configure Multer for file uploads
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup Supabase Storage
  await setupSupabaseStorage();

  // Health check endpoint for monitoring
  app.get("/api/health", async (req, res) => {
    try {
      // Check database connection
      const user = await storage.getUser(1);
      
      // Check Redis connection if available
      let redisStatus = 'not configured';
      if (process.env.REDIS_URL) {
        redisStatus = 'configured';
      }

      res.json({
        status: 'healthy',
        timestamp: new Date().toISOString(),
        database: 'connected',
        redis: redisStatus,
        version: '1.0.0'
      });
    } catch (error) {
      res.status(500).json({
        status: 'unhealthy',
        timestamp: new Date().toISOString(),
        error: 'Database connection failed'
      });
    }
  });

  // Authentication routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email já está em uso" });
      }

      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username já está em uso" });
      }

      const user = await storage.createUser(userData);
      
      // Mark user as online after registration
      await storage.updateUserOnlineStatus(user.id, true);
      
      const { password, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inválidas" });
      }

      await storage.updateUserOnlineStatus(user.id, true);
      const { password: _, ...userWithoutPassword } = user;
      
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    try {
      const { userId } = req.body;
      if (userId) {
        await storage.updateUserOnlineStatus(userId, false);
        userSockets.delete(userId);
      }
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // User routes
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }

      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Friend routes
  app.post("/api/friends/request", async (req, res) => {
    try {
      const friendshipData = insertFriendshipSchema.parse(req.body);
      
      // Check if friendship already exists
      const existingFriendship = await storage.getFriendship(friendshipData.userId, friendshipData.friendId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Pedido de amizade já existe" });
      }

      const friendship = await storage.createFriendRequest(friendshipData);
      res.json(friendship);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/friends/respond", async (req, res) => {
    try {
      const { friendshipId, status } = req.body;
      
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status inválido" });
      }

      await storage.updateFriendshipStatus(friendshipId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/friends/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Private message routes
  app.post("/api/messages/private", async (req, res) => {
    try {
      const messageData = insertPrivateMessageSchema.parse(req.body);
      const message = await storage.createPrivateMessage(messageData);
      
      // Send message via WebSocket if receiver is online
      const receiverSocket = userSockets.get(messageData.receiverId);
      if (receiverSocket) {
        receiverSocket.send(JSON.stringify({
          type: "private_message",
          message
        }));
      }

      res.json(message);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Dados inválidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/messages/private/:userId/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      
      const messages = await storage.getPrivateMessages(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Random chat routes
  app.post("/api/chat/find-match", async (req, res) => {
    try {
      const { userId, preferredGender } = req.body;
      
      // Check if user already has an active chat
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        return res.status(400).json({ message: "Já tens uma conversa ativa" });
      }

      const matchedUser = await storage.findAvailableUser(userId, preferredGender);
      if (!matchedUser) {
        return res.status(404).json({ message: "Nenhum utilizador disponível encontrado" });
      }

      const chat = await storage.createRandomChat(userId, matchedUser.id);
      
      // Notify both users via WebSocket
      const userSocket = userSockets.get(userId);
      const matchSocket = userSockets.get(matchedUser.id);
      
      if (userSocket) {
        userSocket.send(JSON.stringify({
          type: "match_found",
          chat,
          partner: matchedUser
        }));
      }
      
      if (matchSocket) {
        const currentUser = await storage.getUser(userId);
        matchSocket.send(JSON.stringify({
          type: "match_found",
          chat,
          partner: currentUser
        }));
      }

      res.json({ chat, partner: matchedUser });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/chat/skip", async (req, res) => {
    try {
      const { userId, partnerId } = req.body;
      
      // Add to skipped users
      await storage.addSkippedUser(userId, partnerId);
      
      // End current chat
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        await storage.endRandomChat(activeChat.id);
        
        // Notify partner
        const partnerSocket = userSockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.send(JSON.stringify({
            type: "partner_skipped"
          }));
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/chat/end", async (req, res) => {
    try {
      const { userId } = req.body;
      
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        await storage.endRandomChat(activeChat.id);
        
        // Notify partner
        const partnerId = activeChat.user1Id === userId ? activeChat.user2Id : activeChat.user1Id;
        const partnerSocket = userSockets.get(partnerId);
        if (partnerSocket) {
          partnerSocket.send(JSON.stringify({
            type: "chat_ended"
          }));
        }
      }

      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Image upload simulation
  app.post("/api/upload/image", async (req, res) => {
    try {
      // In a real implementation, this would handle file uploads to cloud storage
      const mockImageUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      res.json({ imageUrl: mockImageUrl });
    } catch (error) {
      res.status(500).json({ message: "Erro ao carregar imagem" });
    }
  });

  // Friends routes
  app.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.get("/api/friends/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/friends/:friendshipId/accept", async (req, res) => {
    try {
      const friendshipId = parseInt(req.params.friendshipId);
      await storage.updateFriendshipStatus(friendshipId, "accepted");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/friends/:friendshipId/decline", async (req, res) => {
    try {
      const friendshipId = parseInt(req.params.friendshipId);
      await storage.updateFriendshipStatus(friendshipId, "declined");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  app.post("/api/friends/request", async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      
      // Check if friendship already exists
      const existingFriendship = await storage.getFriendship(userId, friendId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Pedido de amizade já existe" });
      }
      
      const friendship = await storage.createFriendRequest({
        userId,
        friendId
      });
      
      res.json(friendship);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Update user online status
  app.post("/api/users/:id/online", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isOnline } = req.body;
      
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Profile picture upload to Supabase Storage
  app.post("/api/users/profile-picture", upload.single('profilePicture'), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum ficheiro enviado" });
      }

      const file = req.file;
      const fileExt = file.originalname.split('.').pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;

      // Upload file to Supabase Storage using admin client
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Configuração de storage não disponível" });
      }

      const { data, error } = await supabaseAdmin.storage
        .from(PROFILE_PICTURES_BUCKET)
        .upload(filePath, file.buffer, {
          contentType: file.mimetype,
          upsert: false
        });

      if (error) {
        console.error('Supabase upload error:', error);
        return res.status(500).json({ message: "Erro ao carregar imagem para o storage" });
      }

      // Get public URL
      const { data: { publicUrl } } = supabaseAdmin.storage
        .from(PROFILE_PICTURES_BUCKET)
        .getPublicUrl(filePath);

      res.json({ imageUrl: publicUrl, success: true });
    } catch (error) {
      console.error('Upload error:', error);
      res.status(500).json({ message: "Erro ao carregar imagem" });
    }
  });

  // Update user profile picture in database
  app.put("/api/users/:id/profile-picture", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { profilePicture } = req.body;
      
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      
      await storage.updateUserProfilePicture(userId, profilePicture);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get private messages between two users
  app.get("/api/private-messages/:userId/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      
      const messages = await storage.getPrivateMessages(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Send private message
  app.post("/api/private-messages", async (req, res) => {
    try {
      const message = await storage.createPrivateMessage(req.body);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  // Get user by ID
  app.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      
      if (!user) {
        return res.status(404).json({ message: "Utilizador não encontrado" });
      }
      
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });

  const httpServer = createServer(app);

  // WebSocket setup
  const wss = new WebSocketServer({ 
    server: httpServer,
    path: '/ws',
    perMessageDeflate: false,
    clientTracking: true
  });

  wss.on("connection", (ws, req) => {
    console.log('New WebSocket connection established');
    
    ws.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        
        switch (data.type) {
          case "authenticate":
            userSockets.set(data.userId, ws);
            await storage.updateUserOnlineStatus(data.userId, true);
            ws.send(JSON.stringify({ type: "authenticated", userId: data.userId }));
            break;
            
          case "random_message":
            // Handle random chat messages
            const activeChat = await storage.getUserActiveChat(data.senderId);
            if (activeChat) {
              const partnerId = activeChat.user1Id === data.senderId ? activeChat.user2Id : activeChat.user1Id;
              const partnerSocket = userSockets.get(partnerId);
              
              if (partnerSocket && partnerSocket.readyState === 1) {
                partnerSocket.send(JSON.stringify({
                  type: "random_message",
                  message: data.message,
                  senderId: data.senderId,
                  timestamp: new Date()
                }));
              }
            }
            break;
            
          case "typing":
            // Handle typing indicators
            const typingChat = await storage.getUserActiveChat(data.userId);
            if (typingChat) {
              const partnerId = typingChat.user1Id === data.userId ? typingChat.user2Id : typingChat.user1Id;
              const partnerSocket = userSockets.get(partnerId);
              
              if (partnerSocket && partnerSocket.readyState === 1) {
                partnerSocket.send(JSON.stringify({
                  type: "typing",
                  isTyping: data.isTyping
                }));
              }
            }
            break;
        }
      } catch (error) {
        console.error("WebSocket message error:", error);
      }
    });

    ws.on("error", (error) => {
      console.error("WebSocket error:", error);
    });

    ws.on("close", (code, reason) => {
      console.log(`WebSocket closed with code ${code}, reason: ${reason}`);
      // Remove user from active connections
      const entries = Array.from(userSockets.entries());
      for (const [userId, socket] of entries) {
        if (socket === ws) {
          userSockets.delete(userId);
          storage.updateUserOnlineStatus(userId, false);
          break;
        }
      }
    });

    // Send ping to keep connection alive
    const pingInterval = setInterval(() => {
      if (ws.readyState === 1) {
        ws.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 30000);
  });

  return httpServer;
}

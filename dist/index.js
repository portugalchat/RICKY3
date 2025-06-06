var __defProp = Object.defineProperty;
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// server/index.ts
import express2 from "express";

// server/routes.ts
import { createServer } from "http";
import { WebSocketServer } from "ws";
import multer from "multer";

// shared/schema.ts
var schema_exports = {};
__export(schema_exports, {
  friendships: () => friendships,
  insertFriendshipSchema: () => insertFriendshipSchema,
  insertPrivateMessageSchema: () => insertPrivateMessageSchema,
  insertUserSchema: () => insertUserSchema,
  loginSchema: () => loginSchema,
  privateMessages: () => privateMessages,
  randomChats: () => randomChats,
  skippedUsers: () => skippedUsers,
  users: () => users
});
import { pgTable, text, serial, integer, boolean, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";
var users = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  name: text("name").notNull(),
  age: integer("age").notNull(),
  gender: text("gender").notNull(),
  // 'male', 'female', 'other'
  preferredGender: text("preferred_gender").notNull(),
  // 'male', 'female', 'both'
  profilePicture: text("profile_picture"),
  isOnline: boolean("is_online").default(false),
  lastSeen: timestamp("last_seen"),
  createdAt: timestamp("created_at").defaultNow()
});
var friendships = pgTable("friendships", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  friendId: integer("friend_id").notNull(),
  status: text("status").notNull().default("pending"),
  // 'pending', 'accepted', 'rejected'
  createdAt: timestamp("created_at").defaultNow()
});
var privateMessages = pgTable("private_messages", {
  id: serial("id").primaryKey(),
  senderId: integer("sender_id").notNull(),
  receiverId: integer("receiver_id").notNull(),
  content: text("content").notNull(),
  messageType: text("message_type").notNull().default("text"),
  // 'text', 'image'
  imageUrl: text("image_url"),
  createdAt: timestamp("created_at").defaultNow()
});
var randomChats = pgTable("random_chats", {
  id: serial("id").primaryKey(),
  user1Id: integer("user1_id").notNull(),
  user2Id: integer("user2_id").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  endedAt: timestamp("ended_at")
});
var skippedUsers = pgTable("skipped_users", {
  id: serial("id").primaryKey(),
  userId: integer("user_id").notNull(),
  skippedUserId: integer("skipped_user_id").notNull(),
  createdAt: timestamp("created_at").defaultNow()
});
var insertUserSchema = createInsertSchema(users).pick({
  email: true,
  username: true,
  password: true,
  name: true,
  age: true,
  gender: true,
  preferredGender: true
}).extend({
  email: z.string().email("Email inv\xE1lido"),
  username: z.string().min(3, "Username deve ter pelo menos 3 caracteres"),
  password: z.string().min(6, "Palavra-passe deve ter pelo menos 6 caracteres"),
  name: z.string().min(2, "Nome deve ter pelo menos 2 caracteres"),
  age: z.number().min(18, "Deves ter pelo menos 18 anos").max(99, "Idade deve ser v\xE1lida"),
  gender: z.string().min(1, "G\xE9nero \xE9 obrigat\xF3rio"),
  preferredGender: z.string().min(1, "Prefer\xEAncia de g\xE9nero \xE9 obrigat\xF3ria")
});
var insertFriendshipSchema = createInsertSchema(friendships).pick({
  userId: true,
  friendId: true,
  status: true
});
var insertPrivateMessageSchema = createInsertSchema(privateMessages).pick({
  senderId: true,
  receiverId: true,
  content: true,
  messageType: true,
  imageUrl: true
});
var loginSchema = z.object({
  email: z.string().email("Email inv\xE1lido"),
  password: z.string().min(1, "Palavra-passe obrigat\xF3ria")
});

// server/db.ts
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
neonConfig.webSocketConstructor = ws;
var databaseUrl = process.env.SUPABASE_DATABASE_URL || process.env.DATABASE_URL;
if (!databaseUrl) {
  throw new Error(
    "SUPABASE_DATABASE_URL or DATABASE_URL must be set. Did you forget to provision a database?"
  );
}
var pool = new Pool({ connectionString: databaseUrl });
var db = drizzle({ client: pool, schema: schema_exports });

// server/storage.ts
import { eq, and, inArray, or } from "drizzle-orm";
var DatabaseStorage = class {
  async getUser(id) {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || void 0;
  }
  async getUserByEmail(email) {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || void 0;
  }
  async getUserByUsername(username) {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || void 0;
  }
  async createUser(insertUser) {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }
  async updateUserOnlineStatus(id, isOnline) {
    await db.update(users).set({
      isOnline,
      lastSeen: /* @__PURE__ */ new Date()
    }).where(eq(users.id, id));
  }
  async updateUserProfilePicture(id, profilePicture) {
    await db.update(users).set({ profilePicture }).where(eq(users.id, id));
  }
  async createFriendRequest(insertFriendship) {
    const [friendship] = await db.insert(friendships).values(insertFriendship).returning();
    return friendship;
  }
  async getFriendship(userId, friendId) {
    const [friendship] = await db.select().from(friendships).where(
      or(
        and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
        and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
      )
    );
    return friendship || void 0;
  }
  async updateFriendshipStatus(id, status) {
    await db.update(friendships).set({ status }).where(eq(friendships.id, id));
  }
  async getUserFriends(userId) {
    const acceptedFriendships = await db.select().from(friendships).where(
      and(
        eq(friendships.status, "accepted"),
        or(
          eq(friendships.userId, userId),
          eq(friendships.friendId, userId)
        )
      )
    );
    const friendIds = acceptedFriendships.map(
      (f) => f.userId === userId ? f.friendId : f.userId
    );
    if (friendIds.length === 0) return [];
    return await db.select().from(users).where(inArray(users.id, friendIds));
  }
  async getPendingFriendRequests(userId) {
    return await db.select({
      id: friendships.id,
      userId: friendships.userId,
      friendId: friendships.friendId,
      status: friendships.status,
      createdAt: friendships.createdAt,
      senderName: users.name,
      senderUsername: users.username,
      senderAge: users.age,
      senderGender: users.gender,
      senderProfilePicture: users.profilePicture
    }).from(friendships).innerJoin(users, eq(friendships.userId, users.id)).where(
      and(
        eq(friendships.status, "pending"),
        eq(friendships.friendId, userId)
      )
    );
  }
  async createPrivateMessage(insertMessage) {
    const [message] = await db.insert(privateMessages).values({
      senderId: insertMessage.senderId,
      receiverId: insertMessage.receiverId,
      content: insertMessage.content,
      messageType: insertMessage.messageType || "text",
      imageUrl: insertMessage.imageUrl || null
    }).returning();
    return message;
  }
  async getPrivateMessages(userId, friendId) {
    return await db.select().from(privateMessages).where(
      or(
        and(eq(privateMessages.senderId, userId), eq(privateMessages.receiverId, friendId)),
        and(eq(privateMessages.senderId, friendId), eq(privateMessages.receiverId, userId))
      )
    ).orderBy(privateMessages.createdAt);
  }
  async findAvailableUser(userId, preferredGender) {
    const skippedUserIds = await this.getSkippedUsers(userId);
    const activeChats = await db.select().from(randomChats).where(eq(randomChats.isActive, true));
    const activeChatUserIds = activeChats.flatMap((chat) => [chat.user1Id, chat.user2Id]);
    const onlineUsers = await db.select().from(users).where(eq(users.isOnline, true));
    const availableUsers = onlineUsers.filter(
      (user) => user.id !== userId && !skippedUserIds.includes(user.id) && !activeChatUserIds.includes(user.id) && (preferredGender === "both" || user.gender === preferredGender)
    );
    return availableUsers[Math.floor(Math.random() * availableUsers.length)];
  }
  async createRandomChat(user1Id, user2Id) {
    const [chat] = await db.insert(randomChats).values({
      user1Id,
      user2Id,
      isActive: true
    }).returning();
    return chat;
  }
  async endRandomChat(chatId) {
    await db.update(randomChats).set({
      isActive: false,
      endedAt: /* @__PURE__ */ new Date()
    }).where(eq(randomChats.id, chatId));
  }
  async getUserActiveChat(userId) {
    const [chat] = await db.select().from(randomChats).where(
      and(
        eq(randomChats.isActive, true),
        or(
          eq(randomChats.user1Id, userId),
          eq(randomChats.user2Id, userId)
        )
      )
    );
    return chat || void 0;
  }
  async addSkippedUser(userId, skippedUserId) {
    await db.insert(skippedUsers).values({
      userId,
      skippedUserId
    });
  }
  async getSkippedUsers(userId) {
    const skipped = await db.select().from(skippedUsers).where(eq(skippedUsers.userId, userId));
    return skipped.map((s) => s.skippedUserId);
  }
};
var storage = new DatabaseStorage();

// server/supabase.ts
import { createClient } from "@supabase/supabase-js";
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
  throw new Error("SUPABASE_URL and SUPABASE_ANON_KEY must be set");
}
var supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);
var supabaseAdmin = process.env.SUPABASE_SERVICE_ROLE_KEY ? createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    }
  }
) : null;
var PROFILE_PICTURES_BUCKET = "profile-pictures";

// server/setup-storage.ts
async function setupSupabaseStorage() {
  if (!supabaseAdmin) {
    console.log("Supabase admin client not available. Please create the storage bucket manually in your Supabase dashboard.");
    return;
  }
  try {
    const { data: buckets, error: listError } = await supabaseAdmin.storage.listBuckets();
    if (listError) {
      console.error("Error listing buckets:", listError);
      return;
    }
    const bucketExists = buckets.some((bucket) => bucket.name === PROFILE_PICTURES_BUCKET);
    if (!bucketExists) {
      const { data, error } = await supabaseAdmin.storage.createBucket(PROFILE_PICTURES_BUCKET, {
        public: true,
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"],
        fileSizeLimit: 5242880
        // 5MB
      });
      if (error) {
        console.error("Error creating bucket:", error);
      } else {
        console.log(`Bucket '${PROFILE_PICTURES_BUCKET}' created successfully`);
      }
    } else {
      console.log(`Bucket '${PROFILE_PICTURES_BUCKET}' already exists`);
    }
  } catch (error) {
    console.error("Error setting up Supabase storage:", error);
  }
}

// server/routes.ts
import { z as z2 } from "zod";
var userSockets = /* @__PURE__ */ new Map();
var upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024
    // 5MB limit
  },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith("image/")) {
      cb(null, true);
    } else {
      cb(new Error("Only image files are allowed"));
    }
  }
});
async function registerRoutes(app2) {
  await setupSupabaseStorage();
  app2.get("/api/health", async (req, res) => {
    try {
      const user = await storage.getUser(1);
      let redisStatus = "not configured";
      if (process.env.REDIS_URL) {
        redisStatus = "configured";
      }
      res.json({
        status: "healthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        database: "connected",
        redis: redisStatus,
        version: "1.0.0"
      });
    } catch (error) {
      res.status(500).json({
        status: "unhealthy",
        timestamp: (/* @__PURE__ */ new Date()).toISOString(),
        error: "Database connection failed"
      });
    }
  });
  app2.post("/api/auth/register", async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      const existingUser = await storage.getUserByEmail(userData.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email j\xE1 est\xE1 em uso" });
      }
      const existingUsername = await storage.getUserByUsername(userData.username);
      if (existingUsername) {
        return res.status(400).json({ message: "Username j\xE1 est\xE1 em uso" });
      }
      const user = await storage.createUser(userData);
      await storage.updateUserOnlineStatus(user.id, true);
      const { password, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Dados inv\xE1lidos", errors: error.errors });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/auth/login", async (req, res) => {
    try {
      const { email, password } = loginSchema.parse(req.body);
      const user = await storage.getUserByEmail(email);
      if (!user || user.password !== password) {
        return res.status(401).json({ message: "Credenciais inv\xE1lidas" });
      }
      await storage.updateUserOnlineStatus(user.id, true);
      const { password: _, ...userWithoutPassword } = user;
      res.json({ user: userWithoutPassword });
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Dados inv\xE1lidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/auth/logout", async (req, res) => {
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
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilizador n\xE3o encontrado" });
      }
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/friends/request", async (req, res) => {
    try {
      const friendshipData = insertFriendshipSchema.parse(req.body);
      const existingFriendship = await storage.getFriendship(friendshipData.userId, friendshipData.friendId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Pedido de amizade j\xE1 existe" });
      }
      const friendship = await storage.createFriendRequest(friendshipData);
      res.json(friendship);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Dados inv\xE1lidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/friends/respond", async (req, res) => {
    try {
      const { friendshipId, status } = req.body;
      if (!["accepted", "rejected"].includes(status)) {
        return res.status(400).json({ message: "Status inv\xE1lido" });
      }
      await storage.updateFriendshipStatus(friendshipId, status);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/friends/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/messages/private", async (req, res) => {
    try {
      const messageData = insertPrivateMessageSchema.parse(req.body);
      const message = await storage.createPrivateMessage(messageData);
      const receiverSocket = userSockets.get(messageData.receiverId);
      if (receiverSocket) {
        receiverSocket.send(JSON.stringify({
          type: "private_message",
          message
        }));
      }
      res.json(message);
    } catch (error) {
      if (error instanceof z2.ZodError) {
        return res.status(400).json({ message: "Dados inv\xE1lidos" });
      }
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/messages/private/:userId/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      const messages = await storage.getPrivateMessages(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/chat/find-match", async (req, res) => {
    try {
      const { userId, preferredGender } = req.body;
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        return res.status(400).json({ message: "J\xE1 tens uma conversa ativa" });
      }
      const matchedUser = await storage.findAvailableUser(userId, preferredGender);
      if (!matchedUser) {
        return res.status(404).json({ message: "Nenhum utilizador dispon\xEDvel encontrado" });
      }
      const chat = await storage.createRandomChat(userId, matchedUser.id);
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
  app2.post("/api/chat/skip", async (req, res) => {
    try {
      const { userId, partnerId } = req.body;
      await storage.addSkippedUser(userId, partnerId);
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        await storage.endRandomChat(activeChat.id);
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
  app2.post("/api/chat/end", async (req, res) => {
    try {
      const { userId } = req.body;
      const activeChat = await storage.getUserActiveChat(userId);
      if (activeChat) {
        await storage.endRandomChat(activeChat.id);
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
  app2.post("/api/upload/image", async (req, res) => {
    try {
      const mockImageUrl = `https://picsum.photos/400/300?random=${Date.now()}`;
      res.json({ imageUrl: mockImageUrl });
    } catch (error) {
      res.status(500).json({ message: "Erro ao carregar imagem" });
    }
  });
  app2.get("/api/friends/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friends = await storage.getUserFriends(userId);
      res.json(friends);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/friends/requests/:userId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const requests = await storage.getPendingFriendRequests(userId);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/friends/:friendshipId/accept", async (req, res) => {
    try {
      const friendshipId = parseInt(req.params.friendshipId);
      await storage.updateFriendshipStatus(friendshipId, "accepted");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/friends/:friendshipId/decline", async (req, res) => {
    try {
      const friendshipId = parseInt(req.params.friendshipId);
      await storage.updateFriendshipStatus(friendshipId, "declined");
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/friends/request", async (req, res) => {
    try {
      const { userId, friendId } = req.body;
      const existingFriendship = await storage.getFriendship(userId, friendId);
      if (existingFriendship) {
        return res.status(400).json({ message: "Pedido de amizade j\xE1 existe" });
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
  app2.post("/api/users/:id/online", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { isOnline } = req.body;
      await storage.updateUserOnlineStatus(userId, isOnline);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/users/profile-picture", upload.single("profilePicture"), async (req, res) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "Nenhum ficheiro enviado" });
      }
      const file = req.file;
      const fileExt = file.originalname.split(".").pop();
      const fileName = `${Date.now()}-${Math.random().toString(36).substring(2)}.${fileExt}`;
      const filePath = `profile-pictures/${fileName}`;
      if (!supabaseAdmin) {
        return res.status(500).json({ message: "Configura\xE7\xE3o de storage n\xE3o dispon\xEDvel" });
      }
      const { data, error } = await supabaseAdmin.storage.from(PROFILE_PICTURES_BUCKET).upload(filePath, file.buffer, {
        contentType: file.mimetype,
        upsert: false
      });
      if (error) {
        console.error("Supabase upload error:", error);
        return res.status(500).json({ message: "Erro ao carregar imagem para o storage" });
      }
      const { data: { publicUrl } } = supabaseAdmin.storage.from(PROFILE_PICTURES_BUCKET).getPublicUrl(filePath);
      res.json({ imageUrl: publicUrl, success: true });
    } catch (error) {
      console.error("Upload error:", error);
      res.status(500).json({ message: "Erro ao carregar imagem" });
    }
  });
  app2.put("/api/users/:id/profile-picture", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const { profilePicture } = req.body;
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilizador n\xE3o encontrado" });
      }
      await storage.updateUserProfilePicture(userId, profilePicture);
      res.json({ success: true });
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/private-messages/:userId/:friendId", async (req, res) => {
    try {
      const userId = parseInt(req.params.userId);
      const friendId = parseInt(req.params.friendId);
      const messages = await storage.getPrivateMessages(userId, friendId);
      res.json(messages);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.post("/api/private-messages", async (req, res) => {
    try {
      const message = await storage.createPrivateMessage(req.body);
      res.json(message);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  app2.get("/api/users/:id", async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const user = await storage.getUser(userId);
      if (!user) {
        return res.status(404).json({ message: "Utilizador n\xE3o encontrado" });
      }
      res.json(user);
    } catch (error) {
      res.status(500).json({ message: "Erro interno do servidor" });
    }
  });
  const httpServer = createServer(app2);
  const wss = new WebSocketServer({
    server: httpServer,
    path: "/ws",
    perMessageDeflate: false,
    clientTracking: true
  });
  wss.on("connection", (ws2, req) => {
    console.log("New WebSocket connection established");
    ws2.on("message", async (message) => {
      try {
        const data = JSON.parse(message.toString());
        switch (data.type) {
          case "authenticate":
            userSockets.set(data.userId, ws2);
            await storage.updateUserOnlineStatus(data.userId, true);
            ws2.send(JSON.stringify({ type: "authenticated", userId: data.userId }));
            break;
          case "random_message":
            const activeChat = await storage.getUserActiveChat(data.senderId);
            if (activeChat) {
              const partnerId = activeChat.user1Id === data.senderId ? activeChat.user2Id : activeChat.user1Id;
              const partnerSocket = userSockets.get(partnerId);
              if (partnerSocket && partnerSocket.readyState === 1) {
                partnerSocket.send(JSON.stringify({
                  type: "random_message",
                  message: data.message,
                  senderId: data.senderId,
                  timestamp: /* @__PURE__ */ new Date()
                }));
              }
            }
            break;
          case "typing":
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
    ws2.on("error", (error) => {
      console.error("WebSocket error:", error);
    });
    ws2.on("close", (code, reason) => {
      console.log(`WebSocket closed with code ${code}, reason: ${reason}`);
      const entries = Array.from(userSockets.entries());
      for (const [userId, socket] of entries) {
        if (socket === ws2) {
          userSockets.delete(userId);
          storage.updateUserOnlineStatus(userId, false);
          break;
        }
      }
    });
    const pingInterval = setInterval(() => {
      if (ws2.readyState === 1) {
        ws2.ping();
      } else {
        clearInterval(pingInterval);
      }
    }, 3e4);
  });
  return httpServer;
}

// server/vite.ts
import express from "express";
import fs from "fs";
import path2 from "path";
import { createServer as createViteServer, createLogger } from "vite";

// vite.config.ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import path from "path";
import runtimeErrorOverlay from "@replit/vite-plugin-runtime-error-modal";
var vite_config_default = defineConfig({
  plugins: [
    react(),
    runtimeErrorOverlay(),
    ...process.env.NODE_ENV !== "production" && process.env.REPL_ID !== void 0 ? [
      await import("@replit/vite-plugin-cartographer").then(
        (m) => m.cartographer()
      )
    ] : []
  ],
  resolve: {
    alias: {
      "@": path.resolve(import.meta.dirname, "client", "src"),
      "@shared": path.resolve(import.meta.dirname, "shared"),
      "@assets": path.resolve(import.meta.dirname, "attached_assets")
    }
  },
  root: path.resolve(import.meta.dirname, "client"),
  build: {
    outDir: path.resolve(import.meta.dirname, "dist/public"),
    emptyOutDir: true
  },
  server: {
    fs: {
      strict: true,
      deny: ["**/.*"]
    }
  }
});

// server/vite.ts
import { nanoid } from "nanoid";
var viteLogger = createLogger();
function log(message, source = "express") {
  const formattedTime = (/* @__PURE__ */ new Date()).toLocaleTimeString("en-US", {
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
    hour12: true
  });
  console.log(`${formattedTime} [${source}] ${message}`);
}
async function setupVite(app2, server) {
  const serverOptions = {
    middlewareMode: true,
    hmr: { server },
    allowedHosts: true
  };
  const vite = await createViteServer({
    ...vite_config_default,
    configFile: false,
    customLogger: {
      ...viteLogger,
      error: (msg, options) => {
        viteLogger.error(msg, options);
        process.exit(1);
      }
    },
    server: serverOptions,
    appType: "custom"
  });
  app2.use(vite.middlewares);
  app2.use("*", async (req, res, next) => {
    const url = req.originalUrl;
    try {
      const clientTemplate = path2.resolve(
        import.meta.dirname,
        "..",
        "client",
        "index.html"
      );
      let template = await fs.promises.readFile(clientTemplate, "utf-8");
      template = template.replace(
        `src="/src/main.tsx"`,
        `src="/src/main.tsx?v=${nanoid()}"`
      );
      const page = await vite.transformIndexHtml(url, template);
      res.status(200).set({ "Content-Type": "text/html" }).end(page);
    } catch (e) {
      vite.ssrFixStacktrace(e);
      next(e);
    }
  });
}
function serveStatic(app2) {
  const distPath = path2.resolve(import.meta.dirname, "public");
  if (!fs.existsSync(distPath)) {
    throw new Error(
      `Could not find the build directory: ${distPath}, make sure to build the client first`
    );
  }
  app2.use(express.static(distPath));
  app2.use("*", (_req, res) => {
    res.sendFile(path2.resolve(distPath, "index.html"));
  });
}

// server/index.ts
var app = express2();
app.use(express2.json());
app.use(express2.urlencoded({ extended: false }));
app.use((req, res, next) => {
  const start = Date.now();
  const path3 = req.path;
  let capturedJsonResponse = void 0;
  const originalResJson = res.json;
  res.json = function(bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };
  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path3.startsWith("/api")) {
      let logLine = `${req.method} ${path3} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }
      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "\u2026";
      }
      log(logLine);
    }
  });
  next();
});
(async () => {
  const server = await registerRoutes(app);
  app.use((err, _req, res, _next) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
    throw err;
  });
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }
  const port = 5e3;
  server.listen({
    port,
    host: "0.0.0.0",
    reusePort: true
  }, () => {
    log(`serving on port ${port}`);
  });
})();

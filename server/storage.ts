import { 
  users, 
  friendships, 
  privateMessages, 
  randomChats, 
  skippedUsers,
  type User, 
  type InsertUser, 
  type Friendship, 
  type InsertFriendship,
  type PrivateMessage,
  type InsertPrivateMessage,
  type RandomChat
} from "@shared/schema";
import { db } from "./db";
import { eq, and, desc, inArray, or } from "drizzle-orm";

export interface IStorage {
  // User methods
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void>;
  updateUserProfilePicture(id: number, profilePicture: string): Promise<void>;
  
  // Friendship methods
  createFriendRequest(friendship: InsertFriendship): Promise<Friendship>;
  getFriendship(userId: number, friendId: number): Promise<Friendship | undefined>;
  updateFriendshipStatus(id: number, status: string): Promise<void>;
  getUserFriends(userId: number): Promise<User[]>;
  getPendingFriendRequests(userId: number): Promise<Friendship[]>;
  
  // Private message methods
  createPrivateMessage(message: InsertPrivateMessage): Promise<PrivateMessage>;
  getPrivateMessages(userId: number, friendId: number): Promise<PrivateMessage[]>;
  
  // Random chat methods
  findAvailableUser(userId: number, preferredGender: string): Promise<User | undefined>;
  createRandomChat(user1Id: number, user2Id: number): Promise<RandomChat>;
  endRandomChat(chatId: number): Promise<void>;
  getUserActiveChat(userId: number): Promise<RandomChat | undefined>;
  
  // Skip functionality
  addSkippedUser(userId: number, skippedUserId: number): Promise<void>;
  getSkippedUsers(userId: number): Promise<number[]>;
}

export class DatabaseStorage implements IStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUserOnlineStatus(id: number, isOnline: boolean): Promise<void> {
    await db
      .update(users)
      .set({ 
        isOnline, 
        lastSeen: new Date() 
      })
      .where(eq(users.id, id));
  }

  async updateUserProfilePicture(id: number, profilePicture: string): Promise<void> {
    await db
      .update(users)
      .set({ profilePicture })
      .where(eq(users.id, id));
  }

  async createFriendRequest(insertFriendship: InsertFriendship): Promise<Friendship> {
    const [friendship] = await db
      .insert(friendships)
      .values(insertFriendship)
      .returning();
    return friendship;
  }

  async getFriendship(userId: number, friendId: number): Promise<Friendship | undefined> {
    const [friendship] = await db
      .select()
      .from(friendships)
      .where(
        or(
          and(eq(friendships.userId, userId), eq(friendships.friendId, friendId)),
          and(eq(friendships.userId, friendId), eq(friendships.friendId, userId))
        )
      );
    return friendship || undefined;
  }

  async updateFriendshipStatus(id: number, status: string): Promise<void> {
    await db
      .update(friendships)
      .set({ status })
      .where(eq(friendships.id, id));
  }

  async getUserFriends(userId: number): Promise<User[]> {
    const acceptedFriendships = await db
      .select()
      .from(friendships)
      .where(
        and(
          eq(friendships.status, "accepted"),
          or(
            eq(friendships.userId, userId),
            eq(friendships.friendId, userId)
          )
        )
      );

    const friendIds = acceptedFriendships.map(f => 
      f.userId === userId ? f.friendId : f.userId
    );
    
    if (friendIds.length === 0) return [];

    return await db
      .select()
      .from(users)
      .where(inArray(users.id, friendIds));
  }

  async getPendingFriendRequests(userId: number): Promise<Friendship[]> {
    return await db
      .select({
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
      })
      .from(friendships)
      .innerJoin(users, eq(friendships.userId, users.id))
      .where(
        and(
          eq(friendships.status, "pending"),
          eq(friendships.friendId, userId)
        )
      );
  }

  async createPrivateMessage(insertMessage: InsertPrivateMessage): Promise<PrivateMessage> {
    const [message] = await db
      .insert(privateMessages)
      .values({
        senderId: insertMessage.senderId,
        receiverId: insertMessage.receiverId,
        content: insertMessage.content,
        messageType: insertMessage.messageType || "text",
        imageUrl: insertMessage.imageUrl || null,
      })
      .returning();
    return message;
  }

  async getPrivateMessages(userId: number, friendId: number): Promise<PrivateMessage[]> {
    return await db
      .select()
      .from(privateMessages)
      .where(
        or(
          and(eq(privateMessages.senderId, userId), eq(privateMessages.receiverId, friendId)),
          and(eq(privateMessages.senderId, friendId), eq(privateMessages.receiverId, userId))
        )
      )
      .orderBy(privateMessages.createdAt);
  }

  async findAvailableUser(userId: number, preferredGender: string): Promise<User | undefined> {
    const skippedUserIds = await this.getSkippedUsers(userId);
    
    // Get active chat user IDs to exclude
    const activeChats = await db
      .select()
      .from(randomChats)
      .where(eq(randomChats.isActive, true));
    
    const activeChatUserIds = activeChats.flatMap(chat => [chat.user1Id, chat.user2Id]);
    
    // Get all online users
    const onlineUsers = await db
      .select()
      .from(users)
      .where(eq(users.isOnline, true));

    // Filter based on criteria
    const availableUsers = onlineUsers.filter(user => 
      user.id !== userId && 
      !skippedUserIds.includes(user.id!) &&
      !activeChatUserIds.includes(user.id!) &&
      (preferredGender === "both" || user.gender === preferredGender)
    );

    return availableUsers[Math.floor(Math.random() * availableUsers.length)];
  }

  async createRandomChat(user1Id: number, user2Id: number): Promise<RandomChat> {
    const [chat] = await db
      .insert(randomChats)
      .values({
        user1Id,
        user2Id,
        isActive: true
      })
      .returning();
    return chat;
  }

  async endRandomChat(chatId: number): Promise<void> {
    await db
      .update(randomChats)
      .set({ 
        isActive: false,
        endedAt: new Date()
      })
      .where(eq(randomChats.id, chatId));
  }

  async getUserActiveChat(userId: number): Promise<RandomChat | undefined> {
    const [chat] = await db
      .select()
      .from(randomChats)
      .where(
        and(
          eq(randomChats.isActive, true),
          or(
            eq(randomChats.user1Id, userId),
            eq(randomChats.user2Id, userId)
          )
        )
      );
    return chat || undefined;
  }

  async addSkippedUser(userId: number, skippedUserId: number): Promise<void> {
    await db
      .insert(skippedUsers)
      .values({
        userId,
        skippedUserId
      });
  }

  async getSkippedUsers(userId: number): Promise<number[]> {
    const skipped = await db
      .select()
      .from(skippedUsers)
      .where(eq(skippedUsers.userId, userId));
    
    return skipped.map(s => s.skippedUserId);
  }
}

export const storage = new DatabaseStorage();
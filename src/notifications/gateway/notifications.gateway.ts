// src/notifications/notifications.gateway.ts
import { WebSocketGateway, WebSocketServer, OnGatewayConnection, OnGatewayDisconnect } from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { JwtService } from '@nestjs/jwt';
import { UsersService } from 'src/users/services/users.service';
@WebSocketGateway({
  cors: {
    origin: 'http://localhost:5173', 
    credentials: true
  }, path: '/ws', 
   

})
export class NotificationsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;
  private userSocketMap = new Map<string, string>();

  constructor(
    private jwtService: JwtService,
    private usersService: UsersService,
  ) {}

  async handleConnection(socket: Socket) {
    const token = socket.handshake.auth.token;
    if (!token) { 
      console.warn('❌ No token provided');
      socket.disconnect();
      return;
    }
  
    try {
      const payload = this.jwtService.verify(token, {
        secret: process.env.JWT_SECRET,
      });
            const user = await this.usersService.findById(payload.userId);
      if (!user) {
        console.warn('❌ Invalid user');
        socket.disconnect();
      }
  
      console.log('✅ Socket connected for user:', payload.userId);
      this.userSocketMap.set(payload.userId, socket.id);
    } catch (error) {
      console.error('❌ Token verification failed:', error);
      socket.disconnect();
    }
  }
  

  handleDisconnect(socket: Socket) {
    const userId = [...this.userSocketMap.entries()]
      .find(([_, socketId]) => socketId === socket.id)?.[0];
    if (userId) this.userSocketMap.delete(userId);
  }

  sendNotification(userId: string, payload: { type: string; message: string; data?: any }) {
    const socketId = this.userSocketMap.get(userId);
    if (socketId) this.server.to(socketId).emit('notification', payload);
  }
}
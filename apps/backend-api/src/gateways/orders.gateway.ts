import { WebSocketGateway, WebSocketServer, SubscribeMessage, MessageBody } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway({ cors: { origin: '*' } })
export class OrdersGateway {
  @WebSocketServer() server: Server;

  emitNewOrder(order: any) { this.server.emit('new_order', order); }
  emitOrderUpdate(order: any) { this.server.emit('order_updated', order); }
  emitKitchenTicket(ticket: any) { this.server.emit('kitchen_ticket', ticket); }

  @SubscribeMessage('kitchen_ready')
  handleKitchenReady(@MessageBody() data: { orderId: string; itemId: string }) {
    this.server.emit('item_ready', data);
  }
}

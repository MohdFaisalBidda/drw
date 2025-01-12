import jwt, { JwtPayload } from 'jsonwebtoken';
import { WebSocketServer } from 'ws';
import { JWT_SECRET } from '@repo/backend-common/config';

const wss = new WebSocketServer({ port: 8080 });

function checkUser(token: string): string | null {
  const decoded = jwt.verify(token, JWT_SECRET);

  if (!decoded || !(decoded as JwtPayload).userId) {
    return null;
  }

  return decoded as string;

}

wss.on('connection', function connection(ws, req) {
  ws.on('error', console.error);

  const url = req.url;

  if (!url) {
    return
  }

  const queryParams = new URLSearchParams(url.split('?')[1]);
  const token = queryParams.get('token') || "";
  const authenticatedUserId = checkUser(token);

  ws.on('message', function message(data) {
    console.log('received: %s', data);
  });

  ws.send('something');
});
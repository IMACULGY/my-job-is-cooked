import WebSocket from 'ws';
const port = process.env.PORT || 8080;
const wss = new WebSocket.Server({ port });

let clients = {};
let clientId = 0;

const names = ['Waddles', 'Chilly', 'Flippers', 'Icy', 'Frostbite', 'Snowball', 'Pengu', 'Pingu', 'CaptainCold', 'Glacier'];

function randomName() {
  const name = names[Math.floor(Math.random() * names.length)];
  const number = Math.floor(Math.random() * 100);
  return `${name}${number}`;
}

function broadcastState() {
  const players = {};
  for (const id in clients) {
    players[id] = clients[id].state;
  }
  const message = JSON.stringify({ type: 'state', players });
  for (const client of wss.clients) {
    if (client.readyState === WebSocket.OPEN) {
      client.send(message);
    }
  }
}

wss.on('connection', (ws) => {
  const id = (++clientId).toString();
  clients[id] = { ws, state: { x: 0.5, y: 0.5, isDancing: false, message: '', name: randomName() } };

  ws.send(JSON.stringify({ type: 'init', id }));

  ws.on('message', (message) => {
    const data = JSON.parse(message);
    const player = clients[id].state;

    switch (data.type) {
      case 'move':
        player.x = data.x;
        player.y = data.y;
        player.isDancing = false;
        break;
      case 'chat':
        player.message = data.message;
        setTimeout(() => {
          player.message = '';
          broadcastState();
        }, 3000);
        break;
      case 'dance':
        player.isDancing = true;
        break;
      case 'banned':
        ws.send(JSON.stringify({ type: 'banned', id }));
        break;
    }

    broadcastState();
  });

  ws.on('close', () => {
    delete clients[id];
    broadcastState();
  });
});

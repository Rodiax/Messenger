const WebSocket = require('ws');
const colors = require('colors');

const clients = {};

const wss = new WebSocket.Server({ port: 4080 });

const sendMessage = (message, ws, name) => {
    wss.clients.forEach(client => {         
        if (client != ws) {
            client.send(JSON.stringify({
                name,
                message
            }));
        }
    });
};

const shareSettings = (settings) => {
    wss.clients.forEach(client => {  
        client.send(JSON.stringify({
            settings: true,
            connectedUsers: Object.keys(clients).map(client => clients[client].name),
            ...settings
        }));
    });
};

wss.on('connection', (ws, req) => {
    const ip = req.client.remoteAddress.match(/(\d{0,3}\.\d{0,3}\.\d{0,3}\.\d{0,3})$/g)[0];

    clients[ip] = {
        name: ip
    };

    const username = clients[ip].name;

    ws.onmessage = response => sendMessage(response.data, ws, username);
    ws.onclose = () => {
        console.log(`Client ${ip} disconnected from channel`.red);

        sendMessage(`User ${username} has left the room.`, ws, username)

        delete clients[ip];

        shareSettings({});
    }

    shareSettings({ clientName: username });

    console.log(`Client ${username} (${ip}) connected to channel`.cyan);
});

console.log("App started!".green);
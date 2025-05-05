
const express = require('express');
const fs = require('fs');
const http = require('http');
const WebSocket = require('ws');
const axios = require('axios');

const app = express();
const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

let countdownHours = 24;
let holders = new Set();
const TOKEN_ADDRESS = 'REPLACE_WITH_YOUR_TOKEN_ADDRESS';
const HELIUS_API_KEY = 'REPLACE_WITH_YOUR_HELIUS_API_KEY';

const updateClients = () => {
  const timeString = countdownHours.toString().padStart(2, '0') + ':00:00';
  wss.clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(timeString);
    }
  });
};

const fetchHolders = async () => {
  try {
    const res = await axios.get(
      `https://api.helius.xyz/v1/token-metadata?api-key=${HELIUS_API_KEY}&tokenAddress=${TOKEN_ADDRESS}`
    );
    if (res.data && res.data.owners) {
      const newHolders = new Set(res.data.owners.map(owner => owner.owner));
      const increase = [...newHolders].filter(x => !holders.has(x)).length;
      const decrease = [...holders].filter(x => !newHolders.has(x)).length;
      countdownHours = Math.max(0, Math.min(24, countdownHours + increase - decrease));
      holders = newHolders;
      updateClients();
    }
  } catch (e) {
    console.error('Error fetching holders:', e.message);
  }
};

setInterval(fetchHolders, 10000); // every 10s

app.use(express.static('public'));

wss.on('connection', ws => {
  const timeString = countdownHours.toString().padStart(2, '0') + ':00:00';
  ws.send(timeString);
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});

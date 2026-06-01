
const net = require('net');

const client = new net.Socket();
client.setTimeout(5000);

console.log('Tentando conectar a 69.62.103.45:5432...');

client.connect(5432, '69.62.103.45', function() {
    console.log('CONECTADO com sucesso!');
    client.destroy();
});

client.on('timeout', () => {
    console.log('ERRO: Timeout na conexão (Firewall pode estar bloqueando).');
    client.destroy();
});

client.on('error', (err) => {
    console.log('ERRO na conexão:', err.message);
    client.destroy();
});

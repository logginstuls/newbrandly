// Importamos los módulos necesarios
const express = require('express');
const fetch = require('node-fetch'); // Necesitarás 'node-fetch' v2
const app = express();

app.use(express.json());

// *** IMPORTANTE: Configuración para servir tu HTML ***
// Render necesita saber dónde está tu index.html.
// Crea una carpeta 'public' y pon tu 'index.html' dentro.
// Luego, usa esta línea para servirlo:
app.use(express.static('public'));

// Si prefieres dejar el index.html en la raíz, Render
// a veces necesita que le indiques cómo servirlo.
// Esta ruta de API es la importante.

app.post('/api/notify', async (req, res) => {
    
    // 1. Obtenemos los secretos de las Variables de Entorno de Render
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
        console.error("Error: BOT_TOKEN o CHAT_ID no están configurados.");
        return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    // *** CAMBIO 4: Recibimos la estructura de datos de 'ipwho.is' ***
    // (Ya no es 'query' ni 'regionName')
    const { ip, country, city, region } = req.body;

    // 3. Limpiamos los datos
    const ip_visitante = ip || 'Desconocida';
    const pais = country || 'Desconocido';
    const ciudad = city || 'Desconocida';
    const barrio_region = region || ''; // 'region' es el "Barrio o ciudad"

    // 4. Formateamos el mensaje exacto que pediste
    const message = `--- Nueva Visita ---\n` +
                    `IP: ${ip_visitante}\n` +
                    `País: ${pais}\n` +
                    `Barrio O ciudad: ${ciudad} (${barrio_region})\n\n` +
                    `el barto`;

    // 5. Enviamos el mensaje a Telegram
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });
        
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error("Error al enviar a Telegram:", error);
        res.status(5T0).json({ error: 'Falló el envío a Telegram' });
    }
});

// Iniciamos el servidor en el puerto que Render nos asigne
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

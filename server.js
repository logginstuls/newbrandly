// Importamos los módulos necesarios
const express = require('express');
const fetch = require('node-fetch'); // Necesitarás 'node-fetch' v2 para CommonJS
const app = express();

// Middleware para que Express entienda JSON
app.use(express.json());

// Middleware para servir tu index.html desde la raíz
// Asegúrate de que tu index.html esté en una carpeta 'public'
// O si está en la raíz, ajústalo. Para Render, es mejor una carpeta 'public'.
// Vamos a simplificar: si 'index.html' está en la raíz, Render lo servirá como estático.
// Nos enfocaremos en la API.

// Ruta de la API que llamará el frontend
app.post('/api/notify', async (req, res) => {
    
    // 1. Obtenemos los secretos de las Variables de Entorno de Render
    // ¡NUNCA escribas tus tokens aquí!
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    if (!botToken || !chatId) {
        console.error("Error: BOT_TOKEN o CHAT_ID no están configurados en el entorno.");
        return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    // 2. Obtenemos los datos que envió el frontend
    const { query, country, city, regionName } = req.body;

    // 3. Limpiamos los datos
    const ip = query || 'Desconocida';
    const pais = country || 'Desconocido';
    const ciudad = city || 'Desconocida';
    const region = regionName || ''; // 'regionName' es el "Barrio o ciudad" de ip-api

    // 4. Formateamos el mensaje exacto que pediste
    // (Sin el número de visita, como acordamos)
    const message = `--- Nueva Visita ---\n` +
                    `IP: ${ip}\n` +
                    `País: ${pais}\n` +
                    `Barrio O ciudad: ${ciudad} (${region})\n\n` +
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
        
        // 6. Respondemos al frontend que todo salió bien
        res.status(200).json({ status: 'success' });

    } catch (error) {
        console.error("Error al enviar a Telegram:", error);
        res.status(500).json({ error: 'Falló el envío a Telegram' });
    }
});

// Iniciamos el servidor en el puerto que Render nos asigne
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});
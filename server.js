// Importamos los módulos necesarios
const express = require('express');
const fetch = require('node-fetch'); // Necesitarás 'node-fetch' v2
const app = express();

app.use(express.json());

// Servimos los archivos estáticos (tu index.html)
// Asegúrate de que tu 'index.html' esté en una carpeta 'public'
app.use(express.static('public'));

// Ruta de la API que llamará el frontend
app.post('/api/notify', async (req, res) => {
    
    // 1. Obtenemos los secretos de las Variables de Entorno de Render
    const botToken = process.env.BOT_TOKEN;
    const chatId = process.env.CHAT_ID;

    // Log de diagnóstico
    console.log("Recibida petición en /api/notify");

    if (!botToken || !chatId) {
        console.error("Error Crítico: BOT_TOKEN o CHAT_ID no están configurados en el entorno de Render.");
        return res.status(500).json({ error: 'Configuración del servidor incompleta' });
    }

    // 2. Recibimos la estructura de datos de 'ipwho.is'
    const { ip, country, city, region } = req.body;

    // 3. Limpiamos los datos
    const ip_visitante = ip || 'Desconocida';
    const pais = country || 'Desconocido';
    const ciudad = city || 'Desconocida';
    // Nota: 'region' es el barrio/estado, lo quitamos del mensaje
    // pero lo dejamos aquí por si lo quieres usar luego.
    const barrio_region = region || ''; 

    // *** 4. ¡CAMBIO DE FORMATO! (Tu nueva petición) ***
    // Usamos ` (backticks) para un mensaje de varias líneas.
    const message = `NUEVO INGRESO
IP: ${ip_visitante}
PAIS: ${pais}
CIUDAD: ${ciudad}`;

    // 5. Enviamos el mensaje a Telegram
    const url = `https://api.telegram.org/bot${botToken}/sendMessage`;

    try {
        const telegramResponse = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                chat_id: chatId,
                text: message,
            }),
        });
        
        // Leemos la respuesta de Telegram
        const responseJson = await telegramResponse.json();

        if (!responseJson.ok) {
            // Si Telegram dice que algo salió mal
            console.error("Error de la API de Telegram:", responseJson.description);
            res.status(500).json({ error: responseJson.description });
        } else {
            console.log("Notificación enviada a Telegram con éxito.");
            res.status(200).json({ status: 'success' });
        }

    } catch (error) {
        // Error de red
        console.error("Error de red al intentar enviar a Telegram:", error.message);
        res.status(500).json({ error: 'Falló la conexión con Telegram' });
    }
});

// Iniciamos el servidor en el puerto que Render nos asigne
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Servidor escuchando en el puerto ${PORT}`);
});

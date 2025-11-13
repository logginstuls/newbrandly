// --- Dependencias ---
const express = require('express');
const fetch = require('node-fetch'); // Versión 2.x para compatibilidad
const app = express();

app.use(express.json());

// Servir archivos estáticos (index.html dentro de /public)
app.use(express.static('public'));

// --- Ruta principal de notificación ---
app.post('/api/notify', async (req, res) => {
  console.log("📩 Nueva petición recibida en /api/notify");

  const botToken = process.env.BOT_TOKEN;
  const chatId = process.env.CHAT_ID;

  if (!botToken || !chatId) {
    console.error("❌ BOT_TOKEN o CHAT_ID no configurados en Render");
    return res.status(500).json({ error: 'Configuración del servidor incompleta' });
  }

  // Datos recibidos del frontend
  const { ip, country, city, region } = req.body || {};
  const ip_visitante = ip || 'Desconocida';
  const pais = country || 'Desconocido';
  const ciudad = city || 'Desconocida';
  const zona = region || '';

  // --- NUEVO: Obtener fecha y hora local ---
  let fechaHoraLocal = '';
  try {
    const tzRes = await fetch(`https://worldtimeapi.org/api/ip/${ip_visitante}.json`);
    if (tzRes.ok) {
      const tzData = await tzRes.json();
      fechaHoraLocal = tzData.datetime
        ? new Date(tzData.datetime).toLocaleString('es-CO', { timeZone: tzData.timezone })
        : new Date().toLocaleString('es-CO');
    } else {
      fechaHoraLocal = new Date().toLocaleString('es-CO');
    }
  } catch {
    fechaHoraLocal = new Date().toLocaleString('es-CO');
  }

  // --- Mensaje completo ---
  const message = `
🔔 *NUEVO INGRESO DETECTADO*
🕒 Fecha/Hora: ${fechaHoraLocal}
🌐 IP: ${ip_visitante}
🏳️ País: ${pais}
🏙️ Ciudad: ${ciudad}${zona ? ` (${zona})` : ''}`.trim();

  const telegramUrl = `https://api.telegram.org/bot${botToken}/sendMessage`;

  try {
    const telegramResponse = await fetch(telegramUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      }),
    });

    const responseJson = await telegramResponse.json();

    if (!responseJson.ok) {
      console.error("⚠️ Error de Telegram:", responseJson.description);
      return res.status(500).json({ error: responseJson.description });
    }

    console.log("✅ Notificación enviada correctamente a Telegram.");
    res.status(200).json({ status: 'success' });

  } catch (error) {
    console.error("🚫 Error al enviar a Telegram:", error.message);
    res.status(500).json({ error: 'Error al conectar con Telegram' });
  }
});

// --- Iniciar servidor ---
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`🚀 Servidor escuchando en el puerto ${PORT}`);
});

const express = require('express');
const app = express();
const path = require('path');
const N8N = require('./n8n-config');

function leerBodyWebhook(req, res, next) {
    const chunks = [];
    req.on('data', (chunk) => chunks.push(chunk));
    req.on('end', () => {
        const raw = Buffer.concat(chunks).toString('utf8').trim();
        if (!raw) {
            req.body = {};
            return next();
        }
        try {
            req.body = JSON.parse(raw);
        } catch {
            req.body = { texto: raw };
        }
        console.log('Body crudo de n8n:', raw.slice(0, 200));
        next();
    });
    req.on('error', next);
}

// JSON solo para rutas que no son webhook de n8n
app.use((req, res, next) => {
    const esWebhookN8n = req.method === 'POST' && (req.path === '/' || req.path === '/webhook-n8n');
    if (esWebhookN8n) return next();
    express.json()(req, res, next);
});
let clientesConectados = [];

function extraerTexto(body) {
    if (typeof body === 'string') {
        const t = body.trim();
        return t === '{}' ? '' : body;
    }
    if (!body || typeof body !== 'object') return String(body ?? '');
    if (Object.keys(body).length === 0) return '';

    if (body.body && typeof body.body === 'object') {
        return extraerTexto(body.body);
    }
    if (typeof body.body === 'string' && !body.body.trim().startsWith('<')) {
        return body.body;
    }

    const texto = (
        body.mensaje_final ??
        body.texto ??
        body.output ??
        body.reply ??
        body.mensaje ??
        body.message ??
        body.text ??
        body.respuesta ??
        ''
    );

    return typeof texto === 'string' ? texto.replace(/^=+/, '') : String(texto);
}

function enviarAClientesSSE(payload) {
    const mensaje = typeof payload === 'string' ? { texto: payload } : payload;

    clientesConectados.forEach(cliente => {
        cliente.write(`data: ${JSON.stringify(mensaje)}\n\n`);
    });
}

// 1. Endpoint SSE: index.html se conecta aquí para recibir respuestas de MATEO
app.get('/escuchar-mateo', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders?.();

    clientesConectados.push(res);
    res.write(': conectado\n\n');

    req.on('close', () => {
        clientesConectados = clientesConectados.filter(cliente => cliente !== res);
    });
});

function manejarWebhookN8n(req, res) {
    const texto = extraerTexto(req.body);

    if (!texto) {
        console.log('⚠️ n8n envió body vacío:', JSON.stringify(req.body));
        return res.status(400).send({
            status: 'Body vacío',
            ayuda: 'En n8n usa Expression en el body: ={{ { texto: $json.mensaje_final } }}',
        });
    }

    const mensajeDeMateo = { texto };
    console.log('Mensaje recibido de n8n:', texto.slice(0, 80) + '...');
    console.log('Clientes SSE conectados:', clientesConectados.length);
    enviarAClientesSSE(mensajeDeMateo);

    res.status(200).send({ status: 'Recibido', clientes: clientesConectados.length });
}

// 2. Endpoints que n8n llama vía ngrok → reenvía al chat (index.html) por SSE
app.post('/webhook-n8n', leerBodyWebhook, manejarWebhookN8n);
app.post('/', leerBodyWebhook, manejarWebhookN8n);

// Comprueba que ngrok llega al servidor (abre esta URL en el navegador)
app.get('/ping', (req, res) => {
    res.json({
        ok: true,
        mensaje: 'Servidor activo. n8n debe hacer POST a /webhook-n8n',
        clientesSSE: clientesConectados.length,
    });
});

// Proxy para MATEO PRUEBA JSON.html (evita CORS; usa MODO de n8n-config.js)
app.post('/enviar-solicitud', async (req, res) => {
    const url = N8N.getUrl('solicitudcompra');
    console.log(`→ solicitudcompra [${N8N.MODO}]: ${url}`);

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 60000);

    try {
        const response = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(req.body),
            signal: controller.signal,
        });
        const text = await response.text();
        console.log(`← n8n respondió ${response.status}`);
        res.status(response.status).send(text);
    } catch (err) {
        if (err.name === 'AbortError') {
            console.error('Timeout esperando respuesta de n8n');
            return res.status(504).json({ error: 'n8n no respondió en 60 segundos' });
        }
        console.error('Error reenviando a n8n:', err.message);
        res.status(502).json({ error: err.message });
    } finally {
        clearTimeout(timeout);
    }
});

// Sirve archivos estáticos (index.html, etc.) — debe ir después de las rutas API
app.use(express.static(__dirname));

const PORT = 3000;
app.listen(PORT, () => {
    console.log(`Servidor local corriendo en http://localhost:${PORT}`);
    console.log(`Modo n8n: ${N8N.MODO} → ${N8N.getUrl('solicitudcompra')}`);
    console.log(`Para exponerlo usa: ngrok http ${PORT}`);
});
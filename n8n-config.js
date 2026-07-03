/**
 * Configuración de n8n desde variables de entorno.
 * Local: copia .env.example → .env
 * Vercel: Project → Settings → Environment Variables
 *
 * N8N_MODO:
 *   test       → /webhook-test/...  (Listen for test event en n8n)
 *   produccion → /webhook/...       (workflow activo en n8n)
 */
function crearN8N(env = process.env) {
    const n8n = {
        BASE_URL: (env.N8N_BASE_URL || 'https://polariatech.app.n8n.cloud').replace(/\/$/, ''),
        MODO: env.N8N_MODO || 'produccion',
        WEBHOOKS: {
            mateocompras: env.N8N_WEBHOOK_MATEOCOMPRAS || 'mateocompras',
            solicitudcompra: env.N8N_WEBHOOK_SOLICITUDCOMPRA || 'solicitudcompra',
        },
    };

    n8n.getUrl = function (nombre) {
        const slug = this.WEBHOOKS[nombre];
        if (!slug) throw new Error(`Webhook desconocido: ${nombre}`);
        const prefijo = this.MODO === 'test' ? 'webhook-test' : 'webhook';
        return `${this.BASE_URL}/${prefijo}/${slug}`;
    };

    return n8n;
}

function toClientScript(n8n) {
    const { BASE_URL, MODO, WEBHOOKS } = n8n;
    return [
        `const N8N = ${JSON.stringify({ BASE_URL, MODO, WEBHOOKS })};`,
        'N8N.getUrl = function (nombre) {',
        '    const slug = this.WEBHOOKS[nombre];',
        "    if (!slug) throw new Error('Webhook desconocido: ' + nombre);",
        "    const prefijo = this.MODO === 'test' ? 'webhook-test' : 'webhook';",
        "    return this.BASE_URL + '/' + prefijo + '/' + slug;",
        '};',
        '',
    ].join('\n');
}

const N8N = crearN8N();

module.exports = N8N;
module.exports.crearN8N = crearN8N;
module.exports.toClientScript = toClientScript;

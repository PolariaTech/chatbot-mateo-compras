/**
 * URLs de n8n en un solo lugar.
 * Cambia MODO, reinicia node server.js y recarga el navegador (Ctrl+F5).
 * test       → /webhook-test/...  (Listen for test event en n8n)
 * produccion → /webhook/...       (workflow activo en n8n)
 */
const N8N = {
    BASE_URL: 'https://polariatech.app.n8n.cloud',
    MODO: 'test',

    WEBHOOKS: {
        mateocompras: 'mateocompras',
        solicitudcompra: 'solicitudcompra',
    },

    getUrl(nombre) {
        const slug = this.WEBHOOKS[nombre];
        if (!slug) throw new Error(`Webhook desconocido: ${nombre}`);
        const prefijo = this.MODO === 'test' ? 'webhook-test' : 'webhook';
        return `${this.BASE_URL}/${prefijo}/${slug}`;
    },
};

if (typeof module !== 'undefined' && module.exports) {
    module.exports = N8N;
}

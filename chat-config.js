// Solo teléfonos que tu flujo mateocompras en n8n reconoce.
// Pat-lafrieda (+573017447947) es del simulador solicitudcompra, no del chat.
const PROVEEDORES_DEFAULT = [
    { telefono: '+573508905382', nombre: 'Proveedor demo' },
    { telefono: '+573017447947', nombre: 'Proveedor prueba' },
];

function normalizarProveedor(proveedor) {
    return {
        telefono: proveedor.telefono,
        nombre: proveedor.nombre || proveedor.razon_social || proveedor.telefono,
        id_proveedor: proveedor.id_proveedor || null,
    };
}

function parseProveedores(raw) {
    if (!raw) return PROVEEDORES_DEFAULT.map(normalizarProveedor);

    try {
        const lista = JSON.parse(raw);
        if (!Array.isArray(lista) || lista.length === 0) {
            throw new Error('debe ser un array con al menos un proveedor');
        }
        return lista.map(normalizarProveedor);
    } catch (err) {
        console.warn('CHAT_PROVEEDORES inválido, usando valores por defecto:', err.message);
        return PROVEEDORES_DEFAULT.map(normalizarProveedor);
    }
}

function crearChatConfig(env = process.env) {
    return {
        phoneNumberId: env.WHATSAPP_PHONE_NUMBER_ID || '1104260132766227',
        proveedores: parseProveedores(env.CHAT_PROVEEDORES),
    };
}

function toClientScript(config) {
    return `const CHAT = ${JSON.stringify(config)};\n`;
}

const CHAT = crearChatConfig();

module.exports = CHAT;
module.exports.crearChatConfig = crearChatConfig;
module.exports.toClientScript = toClientScript;

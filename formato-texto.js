function escapeHtml(texto) {
  return texto
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function formatearInline(linea) {
  return linea
    .replace(/\*\*([^*]+)\*\*/g, '<strong class="font-semibold">$1</strong>')
    .replace(/__([^_]+)__/g, '<strong class="font-semibold">$1</strong>')
    .replace(/\*([^*\n]+)\*/g, '<em>$1</em>')
    .replace(/_([^_\n]+)_/g, '<em>$1</em>')
    .replace(/~~([^~]+)~~/g, '<s>$1</s>')
    .replace(
      /`([^`]+)`/g,
      '<code class="bg-black/25 px-1 py-0.5 rounded font-mono text-[0.9em]">$1</code>'
    )
    .replace(
      /\[([^\]]+)\]\(([^)]+)\)/g,
      '<a href="$2" target="_blank" rel="noopener noreferrer" class="underline hover:opacity-80">$1</a>'
    );
}

function formatearMarkdown(texto) {
  if (!texto) return '';

  const lineas = escapeHtml(texto).split('\n');
  const bloques = [];
  let enLista = false;
  let tipoLista = null;

  const cerrarLista = () => {
    if (enLista) {
      bloques.push(tipoLista === 'ol' ? '</ol>' : '</ul>');
      enLista = false;
      tipoLista = null;
    }
  };

  for (const linea of lineas) {
    const encabezado = linea.match(/^(#{1,3})\s+(.+)$/);
    const viñeta = linea.match(/^\s*[-*]\s+(.+)$/);
    const numerada = linea.match(/^\s*\d+\.\s+(.+)$/);

    if (encabezado) {
      cerrarLista();
      const nivel = encabezado[1].length;
      const clases =
        nivel === 1
          ? 'text-lg font-bold mt-2 mb-1'
          : nivel === 2
            ? 'text-base font-semibold mt-2 mb-0.5'
            : 'text-sm font-semibold mt-1';
      bloques.push(
        `<p class="${clases}">${formatearInline(encabezado[2])}</p>`
      );
    } else if (viñeta) {
      if (!enLista || tipoLista !== 'ul') {
        cerrarLista();
        bloques.push('<ul class="list-disc list-inside my-1 space-y-0.5">');
        enLista = true;
        tipoLista = 'ul';
      }
      bloques.push(`<li>${formatearInline(viñeta[1])}</li>`);
    } else if (numerada) {
      if (!enLista || tipoLista !== 'ol') {
        cerrarLista();
        bloques.push('<ol class="list-decimal list-inside my-1 space-y-0.5">');
        enLista = true;
        tipoLista = 'ol';
      }
      bloques.push(`<li>${formatearInline(numerada[1])}</li>`);
    } else if (linea.trim() === '') {
      cerrarLista();
      bloques.push('<br>');
    } else {
      cerrarLista();
      bloques.push(`<p class="my-0.5">${formatearInline(linea)}</p>`);
    }
  }

  cerrarLista();
  return bloques.join('');
}

// Liora Studio · tendencias verificadas, conceptos originales y textos de publicación (lógica pura).

export const HOOK_TYPES = ['mirada a cámara + primera nota', 'pregunta en texto', 'resultado final primero (flash-forward)', 'primer plano de herramienta', 'transición con objeto', 'otro'];
export const MUSIC_STYLES = ['balada pop', 'pop oscuro / cinematográfico', 'R&B', 'acústica', 'electrónica', 'ópera / lírico', 'otro'];

// Una métrica solo cuenta si está marcada como verificada, con fecha y valor numérico.
export function verifiedMetrics(t) {
  const m = t.metrics;
  if (!m || !m.verified || !m.verifiedAt) return null;
  const n = k => (Number.isFinite(m[k]) && m[k] >= 0 ? m[k] : null);
  return { views: n('views'), likes: n('likes'), comments: n('comments'), shares: n('shares'), saves: n('saves'), verifiedAt: m.verifiedAt, source: m.source || '' };
}

const median = xs => { const s = xs.filter(Number.isFinite).sort((a, b) => a - b); return s.length ? s[Math.floor(s.length / 2)] : null; };

export function trendPatterns(trends) {
  const verified = trends.filter(t => verifiedMetrics(t));
  const structural = trends.filter(t => Number.isFinite(t.duration));
  const count = key => {
    const c = {};
    for (const t of trends) if (t[key]) c[t[key]] = (c[t[key]] || 0) + 1;
    return Object.entries(c).sort((a, b) => b[1] - a[1]);
  };
  const engagement = verified.map(t => {
    const m = verifiedMetrics(t);
    if (!m.views) return null;
    return ((m.likes || 0) + (m.comments || 0) + (m.shares || 0) + (m.saves || 0)) / m.views;
  }).filter(x => x != null);
  return {
    total: trends.length,
    verifiedCount: verified.length,
    medianDuration: median(structural.map(t => t.duration)),
    medianRevealRatio: median(structural.filter(t => Number.isFinite(t.revealAt) && t.duration).map(t => t.revealAt / t.duration)),
    medianCuts: median(trends.map(t => t.cuts)),
    hooks: count('hook'),
    music: count('music'),
    medianEngagement: median(engagement)
  };
}

const THEMES = [
  { title: 'La Reina del Eclipse', character: 'reina de fantasía oscura', palette: 'azul noche, plata, negro satinado' },
  { title: 'Sirena de Cristal', character: 'sirena de escamas iridiscentes', palette: 'turquesa, nácar, lila' },
  { title: 'Hechicera de la Aurora', character: 'hechicera boreal', palette: 'verde aurora, violeta, oro pálido' },
  { title: 'Diosa del Sol Fundido', character: 'diosa solar', palette: 'cobre, oro, ámbar' },
  { title: 'Espíritu del Bosque', character: 'espíritu de musgo y rocío', palette: 'verde musgo, ocre, rocío brillante' },
  { title: 'Androide de Cromo Líquido', character: 'androide elegante', palette: 'cromo, grafito, azul eléctrico' },
  { title: 'Máscara Veneciana', character: 'dama de un baile de máscaras', palette: 'burdeos, oro viejo, marfil' },
  { title: 'Ninfa de Hielo', character: 'ninfa invernal', palette: 'blanco escarcha, azul hielo, plata' }
];

export function originalConcept(trends, used = [], pick = Math.random) {
  const p = trendPatterns(trends);
  const free = THEMES.filter(t => !used.includes(t.title));
  const theme = (free.length ? free : THEMES)[Math.floor(pick() * (free.length || THEMES.length))];
  const basis = p.total ? `Basado en ${p.total} referencias registradas (${p.verifiedCount} con métricas verificadas).` : 'Sin referencias registradas: valores por defecto del guion, no derivados de datos.';
  const duration = p.medianDuration ? Math.min(45, Math.max(20, Math.round(p.medianDuration))) : 42;
  const revealAt = p.medianRevealRatio ? Math.round(duration * p.medianRevealRatio) : duration - 5;
  return {
    title: theme.title,
    concept: `Liora canta una canción original mientras se transforma paso a paso en ${theme.character}. Paleta: ${theme.palette}. Cada producto se aplica físicamente y se ve progresar.`,
    targetSeconds: duration, revealAt,
    hook: p.hooks[0]?.[0] || HOOK_TYPES[0],
    music: p.music[0]?.[0] || MUSIC_STYLES[1],
    basis
  };
}

export const DEFAULT_TAGS = {
  instagram: ['#makeuptransformation', '#makeupartist', '#fantasymakeup', '#singing', '#virtualinfluencer'],
  tiktok: ['#makeuptransformation', '#fantasymakeup', '#makeuptok', '#singing', '#aiartist', '#virtualinfluencer']
};

export function caption(project, platform, tags) {
  const disclosure = platform === 'instagram'
    ? 'Liora Vale es una creadora virtual generada con IA. 🎨🎤'
    : 'Liora Vale es una creadora virtual (contenido generado con IA). 🎨🎤';
  const lines = [
    `${project.title} ✨`,
    `De cara lavada a ${project.character || 'personaje'} en un solo tema, paso a paso.`,
    disclosure,
    (tags || DEFAULT_TAGS[platform]).join(' ')
  ];
  return lines.join('\n\n');
}

export const PLATFORM_RULES = {
  instagram: [
    'Activar la etiqueta «Información de IA» al publicar.',
    'Instagram limita el número de hashtags por publicación (máx. 5 desde dic-2025; comprobar en la app).',
    'Subir el archivo de la versión Instagram, nunca uno descargado de TikTok.',
    'Elegir la portada 9:16 y comprobar el recorte 3:4 de la cuadrícula.'
  ],
  tiktok: [
    'Activar «Contenido generado por IA» en la configuración de la publicación.',
    'Subir el archivo de la versión TikTok, nunca uno descargado de Instagram (sin marca de agua cruzada).',
    'Seleccionar la portada desde el fotograma recomendado.',
    'Si se usa sonido de la biblioteca de TikTok, la licencia es solo para TikTok.'
  ]
};

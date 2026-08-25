// Domus Salud - configuración rápida
// Reemplaza estos datos por los contactos reales antes de publicar.
const DOMUS_CONFIG = {
  whatsappNumber: '56950257518',
  contactEmail: 'contacto@domus-salud.cl'
};

// Versión de recursos para evitar que celulares o navegadores mantengan fotos antiguas en caché.
const DOMUS_ASSET_VERSION = '2026-08-24-equipo-fotos-corregidas-v1';

const $ = (selector, context = document) => context.querySelector(selector);
const $$ = (selector, context = document) => Array.from(context.querySelectorAll(selector));

// Menú móvil
const navToggle = $('.nav-toggle');
const menu = $('#mainMenu');
if (navToggle && menu) {
  navToggle.addEventListener('click', () => {
    const isOpen = menu.classList.toggle('open');
    navToggle.setAttribute('aria-expanded', String(isOpen));
  });

  $$('#mainMenu a').forEach((link) => {
    link.addEventListener('click', () => {
      menu.classList.remove('open');
      navToggle.setAttribute('aria-expanded', 'false');
    });
  });
}

// Slider hero con 8 servicios
const slider = $('[data-slider]');
if (slider) {
  const slides = $$('.hero-slide', slider);
  const dotsContainer = $('[data-dots]');
  const counter = $('[data-counter]');
  const prev = $('[data-prev]');
  const next = $('[data-next]');
  let current = 0;
  let timer = null;

  const setSlide = (index) => {
    slides[current]?.classList.remove('active');
    const dots = $$('.dot', dotsContainer);
    dots[current]?.classList.remove('active');

    current = (index + slides.length) % slides.length;

    slides[current]?.classList.add('active');
    dots[current]?.classList.add('active');
    if (counter) counter.textContent = `${current + 1} / ${slides.length}`;
  };

  const restartTimer = () => {
    window.clearInterval(timer);
    timer = window.setInterval(() => setSlide(current + 1), 6500);
  };

  slides.forEach((_, index) => {
    const dot = document.createElement('button');
    dot.type = 'button';
    dot.className = `dot${index === 0 ? ' active' : ''}`;
    dot.setAttribute('aria-label', `Ir a la diapositiva ${index + 1}`);
    dot.addEventListener('click', () => {
      setSlide(index);
      restartTimer();
    });
    dotsContainer?.appendChild(dot);
  });

  prev?.addEventListener('click', () => {
    setSlide(current - 1);
    restartTimer();
  });

  next?.addEventListener('click', () => {
    setSlide(current + 1);
    restartTimer();
  });

  // Pausa si la pestaña está inactiva
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) window.clearInterval(timer);
    else restartTimer();
  });

  restartTimer();
}

// Animaciones al aparecer
const revealItems = $$('.reveal');
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add('is-visible');
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.16 });

  revealItems.forEach((item) => observer.observe(item));
} else {
  revealItems.forEach((item) => item.classList.add('is-visible'));
}


// Regiones y comunas de Chile para campos buscables
const CHILE_LOCATION_DATA = {
  "Arica y Parinacota": [
    "Arica",
    "Camarones",
    "Putre",
    "General Lagos"
  ],
  "Tarapacá": [
    "Iquique",
    "Alto Hospicio",
    "Pozo Almonte",
    "Camiña",
    "Colchane",
    "Huara",
    "Pica"
  ],
  "Antofagasta": [
    "Antofagasta",
    "Mejillones",
    "Sierra Gorda",
    "Taltal",
    "Calama",
    "Ollagüe",
    "San Pedro de Atacama",
    "Tocopilla",
    "María Elena"
  ],
  "Atacama": [
    "Chañaral",
    "Diego de Almagro",
    "Copiapó",
    "Caldera",
    "Tierra Amarilla",
    "Vallenar",
    "Alto del Carmen",
    "Freirina",
    "Huasco"
  ],
  "Coquimbo": [
    "La Serena",
    "Coquimbo",
    "Andacollo",
    "La Higuera",
    "Paiguano",
    "Vicuña",
    "Illapel",
    "Canela",
    "Los Vilos",
    "Salamanca",
    "Ovalle",
    "Combarbalá",
    "Monte Patria",
    "Punitaqui",
    "Río Hurtado"
  ],
  "Valparaíso": [
    "Valparaíso",
    "Casablanca",
    "Concón",
    "Juan Fernández",
    "Puchuncaví",
    "Quintero",
    "Viña del Mar",
    "Isla de Pascua",
    "Los Andes",
    "Calle Larga",
    "Rinconada",
    "San Esteban",
    "La Ligua",
    "Cabildo",
    "Papudo",
    "Petorca",
    "Zapallar",
    "Quillota",
    "La Calera",
    "Hijuelas",
    "La Cruz",
    "Nogales",
    "San Antonio",
    "Algarrobo",
    "Cartagena",
    "El Quisco",
    "El Tabo",
    "Santo Domingo",
    "San Felipe",
    "Catemu",
    "Llaillay",
    "Panquehue",
    "Putaendo",
    "Santa María",
    "Quilpué",
    "Limache",
    "Olmué",
    "Villa Alemana"
  ],
  "Metropolitana de Santiago": [
    "Santiago",
    "Cerrillos",
    "Cerro Navia",
    "Conchalí",
    "El Bosque",
    "Estación Central",
    "Huechuraba",
    "Independencia",
    "La Cisterna",
    "La Florida",
    "La Granja",
    "La Pintana",
    "La Reina",
    "Las Condes",
    "Lo Barnechea",
    "Lo Espejo",
    "Lo Prado",
    "Macul",
    "Maipú",
    "Ñuñoa",
    "Pedro Aguirre Cerda",
    "Peñalolén",
    "Providencia",
    "Pudahuel",
    "Quilicura",
    "Quinta Normal",
    "Recoleta",
    "Renca",
    "San Joaquín",
    "San Miguel",
    "San Ramón",
    "Vitacura",
    "Puente Alto",
    "Pirque",
    "San José de Maipo",
    "Colina",
    "Lampa",
    "Tiltil",
    "San Bernardo",
    "Buin",
    "Calera de Tango",
    "Paine",
    "Melipilla",
    "Alhué",
    "Curacaví",
    "María Pinto",
    "San Pedro",
    "Talagante",
    "El Monte",
    "Isla de Maipo",
    "Padre Hurtado",
    "Peñaflor"
  ],
  "Libertador General Bernardo O’Higgins": [
    "Rancagua",
    "Codegua",
    "Coinco",
    "Coltauco",
    "Doñihue",
    "Graneros",
    "Las Cabras",
    "Machalí",
    "Malloa",
    "Mostazal",
    "Olivar",
    "Peumo",
    "Pichidegua",
    "Quinta de Tilcoco",
    "Rengo",
    "Requínoa",
    "San Vicente",
    "Pichilemu",
    "La Estrella",
    "Litueche",
    "Marchihue",
    "Navidad",
    "Paredones",
    "San Fernando",
    "Chépica",
    "Chimbarongo",
    "Lolol",
    "Nancagua",
    "Palmilla",
    "Peralillo",
    "Placilla",
    "Pumanque",
    "Santa Cruz"
  ],
  "Maule": [
    "Talca",
    "Constitución",
    "Curepto",
    "Empedrado",
    "Maule",
    "Pelarco",
    "Pencahue",
    "Río Claro",
    "San Clemente",
    "San Rafael",
    "Cauquenes",
    "Chanco",
    "Pelluhue",
    "Curicó",
    "Hualañé",
    "Licantén",
    "Molina",
    "Rauco",
    "Romeral",
    "Sagrada Familia",
    "Teno",
    "Vichuquén",
    "Linares",
    "Colbún",
    "Longaví",
    "Parral",
    "Retiro",
    "San Javier",
    "Villa Alegre",
    "Yerbas Buenas"
  ],
  "Ñuble": [
    "Chillán",
    "Bulnes",
    "Cobquecura",
    "Coelemu",
    "Coihueco",
    "Chillán Viejo",
    "El Carmen",
    "Ninhue",
    "Ñiquén",
    "Pemuco",
    "Pinto",
    "Portezuelo",
    "Quillón",
    "Quirihue",
    "Ránquil",
    "San Carlos",
    "San Fabián",
    "San Ignacio",
    "San Nicolás",
    "Treguaco",
    "Yungay"
  ],
  "Biobío": [
    "Concepción",
    "Coronel",
    "Chiguayante",
    "Florida",
    "Hualqui",
    "Lota",
    "Penco",
    "San Pedro de la Paz",
    "Santa Juana",
    "Talcahuano",
    "Tomé",
    "Hualpén",
    "Lebu",
    "Arauco",
    "Cañete",
    "Contulmo",
    "Curanilahue",
    "Los Álamos",
    "Tirúa",
    "Los Ángeles",
    "Antuco",
    "Cabrero",
    "Laja",
    "Mulchén",
    "Nacimiento",
    "Negrete",
    "Quilaco",
    "Quilleco",
    "San Rosendo",
    "Santa Bárbara",
    "Tucapel",
    "Yumbel",
    "Alto Biobío"
  ],
  "La Araucanía": [
    "Temuco",
    "Carahue",
    "Cunco",
    "Curarrehue",
    "Freire",
    "Galvarino",
    "Gorbea",
    "Lautaro",
    "Loncoche",
    "Melipeuco",
    "Nueva Imperial",
    "Padre Las Casas",
    "Perquenco",
    "Pitrufquén",
    "Pucón",
    "Saavedra",
    "Teodoro Schmidt",
    "Toltén",
    "Vilcún",
    "Villarrica",
    "Cholchol",
    "Angol",
    "Collipulli",
    "Curacautín",
    "Ercilla",
    "Lonquimay",
    "Los Sauces",
    "Lumaco",
    "Purén",
    "Renaico",
    "Traiguén",
    "Victoria"
  ],
  "Los Ríos": [
    "Valdivia",
    "Corral",
    "Lanco",
    "Los Lagos",
    "Máfil",
    "Mariquina",
    "Paillaco",
    "Panguipulli",
    "La Unión",
    "Futrono",
    "Lago Ranco",
    "Río Bueno"
  ],
  "Los Lagos": [
    "Puerto Montt",
    "Calbuco",
    "Cochamó",
    "Fresia",
    "Frutillar",
    "Los Muermos",
    "Llanquihue",
    "Maullín",
    "Puerto Varas",
    "Castro",
    "Ancud",
    "Chonchi",
    "Curaco de Vélez",
    "Dalcahue",
    "Puqueldón",
    "Queilén",
    "Quellón",
    "Quemchi",
    "Quinchao",
    "Osorno",
    "Puerto Octay",
    "Purranque",
    "Puyehue",
    "Río Negro",
    "San Juan de la Costa",
    "San Pablo",
    "Chaitén",
    "Futaleufú",
    "Hualaihué",
    "Palena"
  ],
  "Aysén del General Carlos Ibáñez del Campo": [
    "Coyhaique",
    "Lago Verde",
    "Aysén",
    "Cisnes",
    "Guaitecas",
    "Cochrane",
    "O'Higgins",
    "Tortel",
    "Chile Chico",
    "Río Ibáñez"
  ],
  "Magallanes y de la Antártica Chilena": [
    "Punta Arenas",
    "Laguna Blanca",
    "Río Verde",
    "San Gregorio",
    "Cabo de Hornos",
    "Antártica",
    "Porvenir",
    "Primavera",
    "Timaukel",
    "Natales",
    "Torres del Paine"
  ]
};

const normalizeText = (text = '') => text
  .toString()
  .normalize('NFD')
  .replace(/[\u0300-\u036f]/g, '')
  .toLowerCase()
  .trim();

const createSearchableSelect = ({ input, optionsEl, toggle, getOptions, onSelect, emptyText }) => {
  if (!input || !optionsEl) return null;

  const close = () => {
    optionsEl.classList.remove('open');
    input.setAttribute('aria-expanded', 'false');
  };

  const open = () => {
    if (input.disabled) return;
    optionsEl.classList.add('open');
    input.setAttribute('aria-expanded', 'true');
  };

  const render = (query = '') => {
    const source = getOptions();
    const normalizedQuery = normalizeText(query);
    const matches = source.filter((option) => normalizeText(option).includes(normalizedQuery));
    optionsEl.innerHTML = '';

    if (!matches.length) {
      const empty = document.createElement('div');
      empty.className = 'combo-empty';
      empty.textContent = emptyText;
      optionsEl.appendChild(empty);
      return;
    }

    matches.forEach((option) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'combo-option';
      button.setAttribute('role', 'option');
      button.textContent = option;
      button.addEventListener('click', () => {
        input.value = option;
        input.setCustomValidity('');
        onSelect?.(option);
        close();
      });
      optionsEl.appendChild(button);
    });
  };

  input.addEventListener('focus', () => {
    render(input.value);
    open();
  });

  input.addEventListener('input', () => {
    input.setCustomValidity('');
    render(input.value);
    open();
  });

  input.addEventListener('blur', () => {
    window.setTimeout(() => {
      const exactMatch = getOptions().find((option) => normalizeText(option) === normalizeText(input.value));
      if (input.value && exactMatch) {
        input.value = exactMatch;
        input.setCustomValidity('');
        onSelect?.(exactMatch, { fromBlur: true });
      }
      close();
    }, 150);
  });

  input.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') close();
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      render(input.value);
      open();
      optionsEl.querySelector('.combo-option')?.focus();
    }
  });

  optionsEl.addEventListener('keydown', (event) => {
    const options = $$('.combo-option', optionsEl);
    const currentIndex = options.indexOf(document.activeElement);
    if (event.key === 'Escape') {
      close();
      input.focus();
    }
    if (event.key === 'ArrowDown') {
      event.preventDefault();
      options[(currentIndex + 1) % options.length]?.focus();
    }
    if (event.key === 'ArrowUp') {
      event.preventDefault();
      options[(currentIndex - 1 + options.length) % options.length]?.focus();
    }
  });

  toggle?.addEventListener('click', () => {
    if (optionsEl.classList.contains('open')) close();
    else {
      render(input.value);
      open();
      input.focus();
    }
  });

  return { render, open, close };
};

const regionInput = $('[data-region-input]');
const regionOptions = $('[data-region-options]');
const communeInput = $('[data-commune-input]');
const communeOptions = $('[data-commune-options]');
const regionToggle = document.querySelector('[data-region-input]')?.closest('[data-combo-root]')?.querySelector('[data-combo-toggle]');
const communeToggle = document.querySelector('[data-commune-input]')?.closest('[data-combo-root]')?.querySelector('[data-combo-toggle]');
let selectedRegion = '';

const enableCommuneField = (region) => {
  selectedRegion = region;
  if (!communeInput) return;
  communeInput.disabled = false;
  communeInput.placeholder = 'Busca y selecciona una comuna';
  communeInput.value = '';
  communeInput.setCustomValidity('');
  if (communeToggle) communeToggle.disabled = false;
};

createSearchableSelect({
  input: regionInput,
  optionsEl: regionOptions,
  toggle: regionToggle,
  getOptions: () => Object.keys(CHILE_LOCATION_DATA),
  emptyText: 'No encontramos esa región.',
  onSelect: (region) => enableCommuneField(region)
});

createSearchableSelect({
  input: communeInput,
  optionsEl: communeOptions,
  toggle: communeToggle,
  getOptions: () => CHILE_LOCATION_DATA[selectedRegion] || [],
  emptyText: 'No encontramos comunas para esa búsqueda.',
  onSelect: () => communeInput?.setCustomValidity('')
});

regionInput?.addEventListener('input', () => {
  const exactRegion = Object.keys(CHILE_LOCATION_DATA).find((region) => normalizeText(region) === normalizeText(regionInput.value));
  if (!exactRegion && communeInput) {
    selectedRegion = '';
    communeInput.value = '';
    communeInput.disabled = true;
    communeInput.placeholder = 'Primero selecciona una región';
    if (communeToggle) communeToggle.disabled = true;
  }
});

// Cierra los desplegables al hacer clic fuera
window.addEventListener('click', (event) => {
  if (!event.target.closest?.('[data-combo-root]')) {
    regionOptions?.classList.remove('open');
    communeOptions?.classList.remove('open');
    regionInput?.setAttribute('aria-expanded', 'false');
    communeInput?.setAttribute('aria-expanded', 'false');
  }
});

// Formulario: prepara un mensaje para WhatsApp
const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();

    const exactRegion = Object.keys(CHILE_LOCATION_DATA).find((region) => normalizeText(region) === normalizeText(regionInput?.value));
    const exactCommune = exactRegion
      ? CHILE_LOCATION_DATA[exactRegion].find((commune) => normalizeText(commune) === normalizeText(communeInput?.value))
      : null;

    if (!exactRegion) {
      regionInput?.setCustomValidity('Selecciona una región válida del listado.');
      contactForm.reportValidity();
      regionInput?.focus();
      return;
    }

    if (!exactCommune) {
      communeInput?.setCustomValidity('Selecciona una comuna válida según la región elegida.');
      contactForm.reportValidity();
      communeInput?.focus();
      return;
    }

    regionInput.value = exactRegion;
    communeInput.value = exactCommune;
    regionInput.setCustomValidity('');
    communeInput.setCustomValidity('');

    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    const message = [
      'Hola Domus Salud, quisiera solicitar una evaluación.',
      '',
      `Nombre: ${data.name || 'No indicado'}`,
      `Teléfono: ${data.phone || 'No indicado'}`,
      `Correo: ${data.email || 'No indicado'}`,
      `Servicio requerido: ${data.service || 'No indicado'}`,
      `Región: ${data.region || 'No indicada'}`,
      `Comuna: ${data.commune || 'No indicada'}`,
      '',
      `Detalle: ${data.message || 'No indicado'}`
    ].join('\n');

    recordDomusSubmission?.(data);

    const whatsappUrl = `https://wa.me/${DOMUS_CONFIG.whatsappNumber}?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank', 'noopener,noreferrer');
  });
}

// Botón volver arriba
const toTop = $('[data-to-top]');
if (toTop) {
  window.addEventListener('scroll', () => {
    toTop.classList.toggle('show', window.scrollY > 700);
  }, { passive: true });

  toTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });
}

// =========================
// Modo administrador y datos locales
// =========================
const DOMUS_STORAGE_KEYS = {
  admins: 'domus_admin_users_v1',
  session: 'domus_admin_session_v1',
  stats: 'domus_stats_v1',
  leads: 'domus_contact_leads_v1',
  testimonials: 'domus_testimonials_v1',
  slides: 'domus_slide_images_v1',
  team: 'domus_team_profiles_v1'
};

const DEFAULT_ADMIN_USERS = [
  { id: 'admin-rmunoz', name: 'Reina Muñoz', username: 'Rmunoz', password: 'Reinamunoz1' },
  { id: 'admin-cmeza', name: 'Catalina Meza', username: 'Cmeza', password: 'Catalinameza1' },
  { id: 'admin-ccontreras', name: 'Consuelo Contreras', username: 'Ccontreras', password: 'Consuelocontreras1' },
  { id: 'admin-dgonzalez', name: 'Diego González', username: 'Dgonzalez', password: 'Diegogonzalez1' }
];

const SLIDE_INFO = [
  { title: 'Cuidado de personas mayores', defaultSrc: 'assets/images/servicio-a.jpg' },
  { title: 'Atención clínica especializada', defaultSrc: 'assets/images/servicio-b.jpg' },
  { title: 'Asistencia para discapacidades', defaultSrc: 'assets/images/servicio-c.jpg' },
  { title: 'Kinesiología y masoterapia', defaultSrc: 'assets/images/servicio-d.png' },
  { title: 'Integración y vida social', defaultSrc: 'assets/images/servicio-e.jpg' },
  { title: 'Curaciones simples y avanzadas', defaultSrc: 'assets/images/servicio-f.jpg' },
  { title: 'Servicios de salud mental', defaultSrc: 'assets/images/servicio-g.jpg' },
  { title: 'Otros servicios', defaultSrc: 'assets/images/servicio-h.jpg' }
];

const DEFAULT_TEAM_PROFILES = [
  {
    id: 'reina-munoz',
    name: 'Reina Muñoz Bustos',
    role: 'Enfermera clínica',
    description: 'Cuidado clínico, seguridad de pacientes y mejora continua en la atención domiciliaria.',
    defaultPhoto: 'assets/team/reina-munoz.jpg',
    alt: 'Reina Muñoz Bustos, enfermera clínica de Domus Salud'
  },
  {
    id: 'diego-gonzalez',
    name: 'Diego González Lorca',
    role: 'Ing. Prevención de Riesgos y Masoterapeuta Profesional',
    description: 'Gestión preventiva, entornos seguros y apoyo en programas de bienestar domiciliario.',
    defaultPhoto: 'assets/team/diego-gonzalez.jpg',
    alt: 'Diego González Lorca, ingeniero en prevención de riesgos y masoterapeuta profesional de Domus Salud'
  },
  {
    id: 'catalina-meza',
    name: 'Catalina Meza Ducaud',
    role: 'Tecnóloga médica',
    description: 'Gestión técnica, coordinación sanitaria y enfoque profesional para servicios de salud.',
    defaultPhoto: 'assets/team/catalina-meza.jpg',
    alt: 'Catalina Meza Ducaud, tecnóloga médica de Domus Salud'
  },
  {
    id: 'consuelo-contreras',
    name: 'Consuelo Contreras Rebolledo',
    role: 'Enfermera clínica',
    description: 'Continuidad del cuidado, atención clínica y resguardo de protocolos de seguridad del paciente.',
    defaultPhoto: 'assets/team/consuelo-contreras.jpg',
    alt: 'Consuelo Contreras Rebolledo, enfermera clínica de Domus Salud'
  }
];

const REMOVED_SLIDE = '__removed__';
const SLIDE_PLACEHOLDER = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(`
  <svg xmlns="http://www.w3.org/2000/svg" width="1200" height="800" viewBox="0 0 1200 800">
    <defs>
      <linearGradient id="g" x1="0" x2="1" y1="0" y2="1">
        <stop offset="0" stop-color="#F4FAF5"/>
        <stop offset="1" stop-color="#E8F3FF"/>
      </linearGradient>
    </defs>
    <rect width="1200" height="800" fill="url(#g)"/>
    <circle cx="600" cy="330" r="88" fill="#003A78" opacity="0.13"/>
    <path d="M520 360h160v28H520zM586 294h28v160h-28z" fill="#46A92D"/>
    <text x="600" y="520" text-anchor="middle" font-family="Arial, sans-serif" font-size="42" font-weight="700" fill="#003A78">Imagen eliminada</text>
    <text x="600" y="574" text-anchor="middle" font-family="Arial, sans-serif" font-size="28" fill="#667085">Puedes cargar una nueva imagen desde administrador</text>
  </svg>
`)}`;

function safeParse(json, fallback) {
  try {
    return JSON.parse(json) ?? fallback;
  } catch (_) {
    return fallback;
  }
}

function storageGet(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? safeParse(raw, fallback) : fallback;
  } catch (_) {
    return fallback;
  }
}

function storageSet(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
    return true;
  } catch (error) {
    console.warn('No se pudo guardar en el navegador:', error);
    return false;
  }
}

function makeId(prefix = 'item') {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getAdminUsers() {
  const users = storageGet(DOMUS_STORAGE_KEYS.admins, null);
  if (!Array.isArray(users) || !users.length) {
    storageSet(DOMUS_STORAGE_KEYS.admins, DEFAULT_ADMIN_USERS);
    return [...DEFAULT_ADMIN_USERS];
  }
  return users;
}

function saveAdminUsers(users) {
  storageSet(DOMUS_STORAGE_KEYS.admins, users);
}

function getStats() {
  return { visits: 0, clicks: 0, submissions: 0, clickEvents: [], ...storageGet(DOMUS_STORAGE_KEYS.stats, {}) };
}

function saveStats(stats) {
  storageSet(DOMUS_STORAGE_KEYS.stats, stats);
}

function recordDomusVisit() {
  try {
    if (window.sessionStorage.getItem('domus_visit_recorded')) return;
    window.sessionStorage.setItem('domus_visit_recorded', '1');
  } catch (_) {
    // Si sessionStorage no está disponible, de todas formas registra el ingreso.
  }
  const stats = getStats();
  stats.visits = Number(stats.visits || 0) + 1;
  saveStats(stats);
}

function recordDomusClick(label = 'Clic') {
  const stats = getStats();
  stats.clicks = Number(stats.clicks || 0) + 1;
  stats.clickEvents = [
    { label, date: new Date().toISOString() },
    ...(Array.isArray(stats.clickEvents) ? stats.clickEvents : [])
  ].slice(0, 60);
  saveStats(stats);
  renderAdminDashboard();
}

function getLeads() {
  return storageGet(DOMUS_STORAGE_KEYS.leads, []);
}

function saveLeads(leads) {
  storageSet(DOMUS_STORAGE_KEYS.leads, leads);
}

function recordDomusSubmission(data = {}) {
  const stats = getStats();
  stats.submissions = Number(stats.submissions || 0) + 1;
  saveStats(stats);

  const leads = getLeads();
  leads.unshift({
    id: makeId('lead'),
    createdAt: new Date().toISOString(),
    name: data.name || 'No indicado',
    phone: data.phone || 'No indicado',
    email: data.email || 'No indicado',
    service: data.service || 'No indicado',
    region: data.region || 'No indicada',
    commune: data.commune || 'No indicada',
    message: data.message || 'No indicado'
  });
  saveLeads(leads.slice(0, 80));
  renderAdminDashboard();
}

function formatDateTime(value) {
  try {
    return new Intl.DateTimeFormat('es-CL', {
      dateStyle: 'short',
      timeStyle: 'short'
    }).format(new Date(value));
  } catch (_) {
    return 'Fecha no disponible';
  }
}

function escapeHTML(value = '') {
  return value
    .toString()
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

recordDomusVisit();

document.addEventListener('click', (event) => {
  const tracked = event.target.closest?.('[data-track-click]');
  if (tracked) recordDomusClick(tracked.dataset.trackClick || tracked.textContent.trim());
});

function getTestimonials() {
  return storageGet(DOMUS_STORAGE_KEYS.testimonials, []);
}

function saveTestimonials(testimonials) {
  storageSet(DOMUS_STORAGE_KEYS.testimonials, testimonials);
}

function renderPublicTestimonials() {
  const container = $('[data-public-testimonials]');
  if (!container) return;
  const approved = getTestimonials().filter((item) => item.approved);

  if (!approved.length) {
    container.innerHTML = `
      <article class="testimonial-card testimonial-empty">
        <p>Pronto compartiremos experiencias de pacientes y familias que han confiado en Domus Salud.</p>
        <strong>Domus Salud</strong>
      </article>
    `;
    return;
  }

  container.innerHTML = approved.map((item) => `
    <article class="testimonial-card">
      <span class="testimonial-service">${escapeHTML(item.service || 'Servicio Domus Salud')}</span>
      <p>“${escapeHTML(item.message || '')}”</p>
      <strong>${escapeHTML(item.author || 'Familia Domus Salud')}</strong>
    </article>
  `).join('');
}


function getDefaultTeamProfiles() {
  return DEFAULT_TEAM_PROFILES.map((profile) => ({ ...profile }));
}

function getTeamProfiles() {
  const stored = storageGet(DOMUS_STORAGE_KEYS.team, null);
  if (!Array.isArray(stored) || !stored.length) {
    const defaults = getDefaultTeamProfiles();
    storageSet(DOMUS_STORAGE_KEYS.team, defaults);
    return defaults;
  }

  // Conserva el orden y asegura que siempre existan los cuatro perfiles base.
  // Los datos editables se respetan, pero la ruta de fotografía original siempre queda
  // sincronizada con los archivos actuales del proyecto y no con versiones antiguas guardadas.
  const merged = DEFAULT_TEAM_PROFILES.map((baseProfile) => {
    const saved = stored.find((item) => item.id === baseProfile.id) || {};
    return {
      ...baseProfile,
      ...saved,
      id: baseProfile.id,
      defaultPhoto: baseProfile.defaultPhoto
    };
  });
  return merged;
}

function saveTeamProfiles(profiles) {
  storageSet(DOMUS_STORAGE_KEYS.team, profiles);
}

function versionedAsset(src) {
  if (!src || !src.startsWith('assets/')) return src;
  const separator = src.includes('?') ? '&' : '?';
  return `${src}${separator}v=${DOMUS_ASSET_VERSION}`;
}

function getTeamPhotoSrc(profile) {
  if (profile.photo) return profile.photo;
  return versionedAsset(profile.defaultPhoto || 'assets/logo-domus-salud.png');
}

function renderPublicTeam() {
  const container = $('[data-public-team-list]');
  if (!container) return;
  const profiles = getTeamProfiles();
  container.innerHTML = profiles.map((profile, index) => `
    <article class="team-card is-visible ${index === 1 ? 'delay-1' : index >= 2 ? 'delay-2' : ''}">
      <figure class="team-photo">
        <img src="${escapeHTML(getTeamPhotoSrc(profile))}" alt="${escapeHTML(profile.alt || `${profile.name}, equipo Domus Salud`)}" />
      </figure>
      <h3>${escapeHTML(profile.name)}</h3>
      <p class="role">${escapeHTML(profile.role)}</p>
      <p>${escapeHTML(profile.description)}</p>
    </article>
  `).join('');
}

function getSlideOverrides() {
  return storageGet(DOMUS_STORAGE_KEYS.slides, {});
}

function saveSlideOverrides(overrides) {
  storageSet(DOMUS_STORAGE_KEYS.slides, overrides);
}

function getSlideSrc(index) {
  const overrides = getSlideOverrides();
  if (overrides[index] === REMOVED_SLIDE) return SLIDE_PLACEHOLDER;
  return overrides[index] || SLIDE_INFO[index]?.defaultSrc || SLIDE_PLACEHOLDER;
}

function applySlideImages() {
  $$('[data-slide-image]').forEach((img) => {
    const index = Number(img.dataset.slideImage);
    img.src = getSlideSrc(index);
  });
}

async function compressImage(file, maxWidth = 1600, quality = 0.84) {
  const dataUrl = await new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });

  const img = await new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = reject;
    image.src = dataUrl;
  });

  const scale = Math.min(1, maxWidth / img.width);
  const canvas = document.createElement('canvas');
  canvas.width = Math.round(img.width * scale);
  canvas.height = Math.round(img.height * scale);
  const ctx = canvas.getContext('2d');
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
  return canvas.toDataURL('image/jpeg', quality);
}

function getCurrentAdmin() {
  const session = storageGet(DOMUS_STORAGE_KEYS.session, null);
  if (!session?.id) return null;
  return getAdminUsers().find((user) => user.id === session.id) || null;
}

function setCurrentAdmin(user) {
  if (user) storageSet(DOMUS_STORAGE_KEYS.session, { id: user.id, loggedAt: new Date().toISOString() });
  else window.localStorage.removeItem(DOMUS_STORAGE_KEYS.session);
}

const adminShell = $('[data-admin-shell]');
const adminLogin = $('[data-admin-login]');
const adminApp = $('[data-admin-app]');
const adminLoginForm = $('#adminLoginForm');
const adminUserForm = $('#adminUserForm');
const testimonialForm = $('#testimonialForm');

function openAdmin() {
  if (!adminShell) return;
  adminShell.hidden = false;
  document.body.classList.add('admin-open');
  renderAdminState();
}

function closeAdmin() {
  if (!adminShell) return;
  adminShell.hidden = true;
  document.body.classList.remove('admin-open');
}

function renderAdminState() {
  const current = getCurrentAdmin();
  if (current) {
    adminLogin.hidden = true;
    adminApp.hidden = false;
    $('[data-admin-current-user]').textContent = `${current.name} (${current.username})`;
    renderAdminDashboard();
    renderAdminUsers();
    renderTeamAdmin();
    renderTestimonialsAdmin();
    renderSlidesAdmin();
  } else {
    adminLogin.hidden = false;
    adminApp.hidden = true;
  }
}

function renderAdminDashboard() {
  if (!adminShell || adminShell.hidden) return;
  const stats = getStats();
  const statMap = {
    visits: stats.visits || 0,
    clicks: stats.clicks || 0,
    submissions: stats.submissions || 0
  };
  Object.entries(statMap).forEach(([key, value]) => {
    const el = $(`[data-stat="${key}"]`);
    if (el) el.textContent = Number(value).toLocaleString('es-CL');
  });

  const list = $('[data-leads-list]');
  if (!list) return;
  const leads = getLeads();
  if (!leads.length) {
    list.innerHTML = '<div class="admin-row"><p>Aún no hay solicitudes registradas en este navegador.</p></div>';
    return;
  }
  list.innerHTML = leads.map((lead) => `
    <article class="admin-row">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(lead.name)}</strong>
          <small>${formatDateTime(lead.createdAt)}</small>
        </div>
        <span class="status-pill approved">Solicitud</span>
      </div>
      <p><strong>Servicio:</strong> ${escapeHTML(lead.service)}</p>
      <p><strong>Ubicación:</strong> ${escapeHTML(lead.commune)}, ${escapeHTML(lead.region)}</p>
      <p><strong>Teléfono:</strong> ${escapeHTML(lead.phone)} · <strong>Correo:</strong> ${escapeHTML(lead.email)}</p>
      <p><strong>Mensaje:</strong> ${escapeHTML(lead.message)}</p>
    </article>
  `).join('');
}

function renderAdminUsers() {
  const list = $('[data-admin-users-list]');
  if (!list) return;
  const users = getAdminUsers();
  list.innerHTML = users.map((user) => `
    <article class="admin-row" data-admin-user-id="${escapeHTML(user.id)}">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(user.name)}</strong>
          <small>Usuario: ${escapeHTML(user.username)}</small>
        </div>
        <span class="status-pill approved">Admin</span>
      </div>
      <p><strong>Clave:</strong> ${escapeHTML(user.password)}</p>
      <div class="admin-row-actions">
        <button class="mini-btn" type="button" data-edit-admin="${escapeHTML(user.id)}">Editar</button>
        <button class="mini-btn danger" type="button" data-delete-admin="${escapeHTML(user.id)}">Eliminar</button>
      </div>
    </article>
  `).join('');
}

function resetAdminUserForm() {
  adminUserForm?.reset();
  if (adminUserForm?.elements.id) adminUserForm.elements.id.value = '';
  const message = $('[data-admin-user-message]');
  if (message) message.textContent = '';
}

function renderTestimonialsAdmin() {
  const list = $('[data-testimonials-list]');
  const summary = $('[data-testimonial-summary]');
  if (!list) return;
  const testimonials = getTestimonials();
  const approved = testimonials.filter((item) => item.approved).length;
  if (summary) summary.textContent = `${approved} publicados · ${testimonials.length - approved} pendientes`;

  if (!testimonials.length) {
    list.innerHTML = '<div class="admin-row"><p>Aún no hay testimonios ingresados.</p></div>';
    renderPublicTestimonials();
    return;
  }

  list.innerHTML = testimonials.map((item) => `
    <article class="admin-row" data-testimonial-id="${escapeHTML(item.id)}">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(item.author)}</strong>
          <small>${escapeHTML(item.service)} · ${formatDateTime(item.updatedAt || item.createdAt)}</small>
        </div>
        <span class="status-pill ${item.approved ? 'approved' : 'pending'}">${item.approved ? 'Publicado' : 'Pendiente'}</span>
      </div>
      <p>${escapeHTML(item.message)}</p>
      <div class="admin-row-actions">
        <button class="mini-btn ${item.approved ? '' : 'success'}" type="button" data-toggle-testimonial="${escapeHTML(item.id)}">${item.approved ? 'Despublicar' : 'Aprobar'}</button>
        <button class="mini-btn" type="button" data-edit-testimonial="${escapeHTML(item.id)}">Editar</button>
        <button class="mini-btn danger" type="button" data-delete-testimonial="${escapeHTML(item.id)}">Eliminar</button>
      </div>
    </article>
  `).join('');
  renderPublicTestimonials();
}

function resetTestimonialForm() {
  testimonialForm?.reset();
  if (testimonialForm?.elements.id) testimonialForm.elements.id.value = '';
  const message = $('[data-testimonial-message]');
  if (message) message.textContent = '';
}


function renderTeamAdmin() {
  const list = $('[data-team-admin-list]');
  if (!list) return;
  const profiles = getTeamProfiles();
  list.innerHTML = profiles.map((profile) => `
    <article class="team-admin-card" data-team-admin-card="${escapeHTML(profile.id)}">
      <img src="${escapeHTML(getTeamPhotoSrc(profile))}" alt="Fotografía actual de ${escapeHTML(profile.name)}" />
      <div>
        <h4>${escapeHTML(profile.name)}</h4>
        <label>
          <span>Nombre visible</span>
          <input type="text" value="${escapeHTML(profile.name)}" data-team-field="name" />
        </label>
        <label>
          <span>Cargo / especialidad</span>
          <input type="text" value="${escapeHTML(profile.role)}" data-team-field="role" />
        </label>
        <label>
          <span>Descripción</span>
          <textarea data-team-field="description">${escapeHTML(profile.description)}</textarea>
        </label>
        <input class="slide-file" id="teamPhoto-${escapeHTML(profile.id)}" type="file" accept="image/*" data-team-photo-file="${escapeHTML(profile.id)}" />
        <div class="admin-row-actions">
          <label class="file-label" for="teamPhoto-${escapeHTML(profile.id)}">Cambiar fotografía</label>
          <button class="mini-btn" type="button" data-save-team="${escapeHTML(profile.id)}">Guardar cambios</button>
          <button class="mini-btn" type="button" data-reset-team-photo="${escapeHTML(profile.id)}">Restaurar foto</button>
          <button class="mini-btn danger" type="button" data-reset-team-profile="${escapeHTML(profile.id)}">Restaurar perfil</button>
        </div>
      </div>
    </article>
  `).join('');
}

function renderSlidesAdmin() {
  const list = $('[data-slides-admin-list]');
  if (!list) return;
  const overrides = getSlideOverrides();
  list.innerHTML = SLIDE_INFO.map((slide, index) => {
    const customized = overrides[index] && overrides[index] !== REMOVED_SLIDE;
    const removed = overrides[index] === REMOVED_SLIDE;
    return `
      <article class="slide-admin-card" data-slide-admin="${index}">
        <img src="${getSlideSrc(index)}" alt="Imagen actual de ${escapeHTML(slide.title)}" />
        <div>
          <h4>${index + 1}. ${escapeHTML(slide.title)}</h4>
          <p>${removed ? 'Imagen eliminada desde administrador.' : customized ? 'Imagen personalizada cargada.' : 'Imagen original del proyecto.'}</p>
          <input class="slide-file" id="slideFile${index}" type="file" accept="image/*" data-slide-file="${index}" />
          <div class="admin-row-actions">
            <label class="file-label" for="slideFile${index}">Cambiar imagen</label>
            <button class="mini-btn danger" type="button" data-remove-slide="${index}">Eliminar</button>
            <button class="mini-btn" type="button" data-reset-slide="${index}">Restaurar</button>
          </div>
        </div>
      </article>
    `;
  }).join('');
}

function switchAdminTab(tabName) {
  $$('[data-admin-tab]').forEach((tab) => tab.classList.toggle('active', tab.dataset.adminTab === tabName));
  $$('[data-admin-view]').forEach((view) => view.classList.toggle('active', view.dataset.adminView === tabName));
}

$$('[data-admin-open]').forEach((button) => button.addEventListener('click', openAdmin));
$$('[data-admin-close]').forEach((button) => button.addEventListener('click', closeAdmin));
$('[data-admin-logout]')?.addEventListener('click', () => {
  setCurrentAdmin(null);
  renderAdminState();
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && adminShell && !adminShell.hidden) closeAdmin();
});

$$('[data-admin-tab]').forEach((tab) => {
  tab.addEventListener('click', () => switchAdminTab(tab.dataset.adminTab));
});

adminLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(adminLoginForm);
  const username = (formData.get('username') || '').toString().trim();
  const password = (formData.get('password') || '').toString();
  const user = getAdminUsers().find((candidate) => normalizeText(candidate.username) === normalizeText(username) && candidate.password === password);
  const message = $('[data-admin-login-message]');

  if (!user) {
    if (message) {
      message.textContent = 'Usuario o clave incorrecta.';
      message.classList.add('error');
    }
    return;
  }

  if (message) {
    message.textContent = '';
    message.classList.remove('error');
  }
  setCurrentAdmin(user);
  adminLoginForm.reset();
  renderAdminState();
});

adminUserForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(adminUserForm);
  const id = (formData.get('id') || '').toString();
  const name = (formData.get('name') || '').toString().trim();
  const username = (formData.get('username') || '').toString().trim();
  const password = (formData.get('password') || '').toString().trim();
  const message = $('[data-admin-user-message]');
  let users = getAdminUsers();

  if (!name || !username || !password) return;

  const duplicate = users.find((user) => normalizeText(user.username) === normalizeText(username) && user.id !== id);
  if (duplicate) {
    if (message) {
      message.textContent = 'Ya existe un administrador con ese usuario.';
      message.classList.add('error');
    }
    return;
  }

  if (id) {
    users = users.map((user) => user.id === id ? { ...user, name, username, password } : user);
  } else {
    users.push({ id: makeId('admin'), name, username, password });
  }

  saveAdminUsers(users);
  resetAdminUserForm();
  renderAdminUsers();
  renderAdminState();
  if (message) {
    message.textContent = 'Perfil guardado correctamente.';
    message.classList.remove('error');
  }
});

$('[data-reset-admin-form]')?.addEventListener('click', resetAdminUserForm);
$('[data-admin-users-list]')?.addEventListener('click', (event) => {
  const editId = event.target.closest?.('[data-edit-admin]')?.dataset.editAdmin;
  const deleteId = event.target.closest?.('[data-delete-admin]')?.dataset.deleteAdmin;
  const users = getAdminUsers();

  if (editId) {
    const user = users.find((item) => item.id === editId);
    if (!user || !adminUserForm) return;
    adminUserForm.elements.id.value = user.id;
    adminUserForm.elements.name.value = user.name;
    adminUserForm.elements.username.value = user.username;
    adminUserForm.elements.password.value = user.password;
    adminUserForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (deleteId) {
    if (users.length <= 1) {
      alert('Debe existir al menos un administrador activo.');
      return;
    }
    const user = users.find((item) => item.id === deleteId);
    if (!user) return;
    if (!confirm(`¿Eliminar el administrador ${user.name}?`)) return;
    saveAdminUsers(users.filter((item) => item.id !== deleteId));
    const current = getCurrentAdmin();
    if (current?.id === deleteId) setCurrentAdmin(null);
    renderAdminState();
  }
});

testimonialForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(testimonialForm);
  const id = (formData.get('id') || '').toString();
  const author = (formData.get('author') || '').toString().trim();
  const service = (formData.get('service') || '').toString().trim();
  const messageText = (formData.get('message') || '').toString().trim();
  const approved = formData.get('approved') === 'on';
  const message = $('[data-testimonial-message]');
  let testimonials = getTestimonials();

  if (!author || !service || !messageText) return;

  if (id) {
    testimonials = testimonials.map((item) => item.id === id
      ? { ...item, author, service, message: messageText, approved, updatedAt: new Date().toISOString() }
      : item
    );
  } else {
    testimonials.unshift({
      id: makeId('testimonial'),
      author,
      service,
      message: messageText,
      approved,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    });
  }

  saveTestimonials(testimonials);
  resetTestimonialForm();
  renderTestimonialsAdmin();
  if (message) message.textContent = approved ? 'Testimonio guardado y publicado.' : 'Testimonio guardado como pendiente de aprobación.';
});

$('[data-reset-testimonial-form]')?.addEventListener('click', resetTestimonialForm);
$('[data-testimonials-list]')?.addEventListener('click', (event) => {
  const toggleId = event.target.closest?.('[data-toggle-testimonial]')?.dataset.toggleTestimonial;
  const editId = event.target.closest?.('[data-edit-testimonial]')?.dataset.editTestimonial;
  const deleteId = event.target.closest?.('[data-delete-testimonial]')?.dataset.deleteTestimonial;
  let testimonials = getTestimonials();

  if (toggleId) {
    testimonials = testimonials.map((item) => item.id === toggleId ? { ...item, approved: !item.approved, updatedAt: new Date().toISOString() } : item);
    saveTestimonials(testimonials);
    renderTestimonialsAdmin();
  }

  if (editId) {
    const item = testimonials.find((testimonial) => testimonial.id === editId);
    if (!item || !testimonialForm) return;
    testimonialForm.elements.id.value = item.id;
    testimonialForm.elements.author.value = item.author;
    testimonialForm.elements.service.value = item.service;
    testimonialForm.elements.message.value = item.message;
    testimonialForm.elements.approved.checked = Boolean(item.approved);
    testimonialForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (deleteId) {
    if (!confirm('¿Eliminar este testimonio?')) return;
    saveTestimonials(testimonials.filter((item) => item.id !== deleteId));
    renderTestimonialsAdmin();
  }
});

$('[data-clear-leads]')?.addEventListener('click', () => {
  if (!confirm('¿Limpiar el historial local de solicitudes?')) return;
  saveLeads([]);
  renderAdminDashboard();
});


$('[data-team-admin-list]')?.addEventListener('change', async (event) => {
  const input = event.target.closest?.('[data-team-photo-file]');
  if (!input || !input.files?.[0]) return;
  const id = input.dataset.teamPhotoFile;
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen válido.');
    input.value = '';
    return;
  }

  try {
    const imageData = await compressImage(file, 700, 0.88);
    const profiles = getTeamProfiles().map((profile) => profile.id === id ? { ...profile, photo: imageData } : profile);
    if (!storageSet(DOMUS_STORAGE_KEYS.team, profiles)) {
      alert('No se pudo guardar la fotografía. Intenta con una imagen más liviana.');
      return;
    }
    renderPublicTeam();
    renderTeamAdmin();
  } catch (error) {
    console.error(error);
    alert('No se pudo procesar la fotografía seleccionada.');
  } finally {
    input.value = '';
  }
});

$('[data-team-admin-list]')?.addEventListener('click', (event) => {
  const saveButton = event.target.closest?.('[data-save-team]');
  const resetPhotoButton = event.target.closest?.('[data-reset-team-photo]');
  const resetProfileButton = event.target.closest?.('[data-reset-team-profile]');

  if (saveButton) {
    const id = saveButton.dataset.saveTeam;
    const card = saveButton.closest('[data-team-admin-card]');
    if (!card) return;
    const name = card.querySelector('[data-team-field="name"]')?.value.trim();
    const role = card.querySelector('[data-team-field="role"]')?.value.trim();
    const description = card.querySelector('[data-team-field="description"]')?.value.trim();
    if (!name || !role || !description) {
      alert('Completa nombre, cargo y descripción antes de guardar.');
      return;
    }
    const profiles = getTeamProfiles().map((profile) => profile.id === id ? { ...profile, name, role, description, alt: `${name}, equipo Domus Salud` } : profile);
    saveTeamProfiles(profiles);
    renderPublicTeam();
    renderTeamAdmin();
  }

  if (resetPhotoButton) {
    const id = resetPhotoButton.dataset.resetTeamPhoto;
    const profiles = getTeamProfiles().map((profile) => {
      if (profile.id !== id) return profile;
      const { photo, ...rest } = profile;
      return rest;
    });
    saveTeamProfiles(profiles);
    renderPublicTeam();
    renderTeamAdmin();
  }

  if (resetProfileButton) {
    const id = resetProfileButton.dataset.resetTeamProfile;
    const defaultProfile = DEFAULT_TEAM_PROFILES.find((profile) => profile.id === id);
    if (!defaultProfile) return;
    if (!confirm(`¿Restaurar el perfil de ${defaultProfile.name}?`)) return;
    const profiles = getTeamProfiles().map((profile) => profile.id === id ? { ...defaultProfile } : profile);
    saveTeamProfiles(profiles);
    renderPublicTeam();
    renderTeamAdmin();
  }
});

$('[data-reset-all-team]')?.addEventListener('click', () => {
  if (!confirm('¿Restaurar las fotografías y descripciones originales del equipo directivo?')) return;
  saveTeamProfiles(getDefaultTeamProfiles());
  renderPublicTeam();
  renderTeamAdmin();
});

$('[data-slides-admin-list]')?.addEventListener('change', async (event) => {
  const input = event.target.closest?.('[data-slide-file]');
  if (!input || !input.files?.[0]) return;
  const index = Number(input.dataset.slideFile);
  const file = input.files[0];
  if (!file.type.startsWith('image/')) {
    alert('Selecciona un archivo de imagen válido.');
    input.value = '';
    return;
  }

  try {
    const imageData = await compressImage(file);
    const overrides = getSlideOverrides();
    overrides[index] = imageData;
    if (!saveSlideOverrides(overrides)) {
      alert('No se pudo guardar la imagen. Intenta con una imagen más liviana.');
      return;
    }
    applySlideImages();
    renderSlidesAdmin();
  } catch (error) {
    console.error(error);
    alert('No se pudo procesar la imagen seleccionada.');
  } finally {
    input.value = '';
  }
});

$('[data-slides-admin-list]')?.addEventListener('click', (event) => {
  const removeButton = event.target.closest?.('[data-remove-slide]');
  const resetButton = event.target.closest?.('[data-reset-slide]');
  const overrides = getSlideOverrides();

  if (removeButton) {
    const index = Number(removeButton.dataset.removeSlide);
    overrides[index] = REMOVED_SLIDE;
    saveSlideOverrides(overrides);
    applySlideImages();
    renderSlidesAdmin();
  }

  if (resetButton) {
    const index = Number(resetButton.dataset.resetSlide);
    delete overrides[index];
    saveSlideOverrides(overrides);
    applySlideImages();
    renderSlidesAdmin();
  }
});

$('[data-reset-all-slides]')?.addEventListener('click', () => {
  if (!confirm('¿Restaurar las 8 imágenes originales de las slides?')) return;
  saveSlideOverrides({});
  applySlideImages();
  renderSlidesAdmin();
});

window.addEventListener('storage', (event) => {
  if (event.key === DOMUS_STORAGE_KEYS.team) {
    renderPublicTeam();
    renderTeamAdmin();
  }
  if (event.key === DOMUS_STORAGE_KEYS.slides) {
    applySlideImages();
    renderSlidesAdmin();
  }
});

applySlideImages();
renderPublicTeam();
renderPublicTestimonials();

// Domus Salud - configuración rápida
// Reemplaza estos datos por los contactos reales antes de publicar.
const DOMUS_CONFIG = {
  whatsappNumber: '56950257518',
  contactEmail: 'contacto@domusalud.cl'
};

// Conexión opcional a Supabase.
// Si js/supabase-config.js está configurado, los contactos y métricas se guardarán en Supabase.
// Si no está configurado, la web seguirá funcionando con respaldo local en el navegador.
const DOMUS_DB = window.domusSupabase || null;
const hasSupabase = () => Boolean(DOMUS_DB && typeof DOMUS_DB.from === 'function');

// Versión de recursos para evitar que celulares o navegadores mantengan fotos antiguas en caché.
const DOMUS_ASSET_VERSION = '2026-09-02-fichas-clinicas-v1';

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

async function sendContactEmail(data = {}) {
  try {
    const response = await fetch('/api/send-contact-email', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: data.name || 'No indicado',
        phone: data.phone || 'No indicado',
        email: data.email || 'No indicado',
        service: data.service || 'No indicado',
        region: data.region || 'No indicada',
        commune: data.commune || 'No indicada',
        message: data.message || 'No indicado'
      })
    });

    if (!response.ok) {
      const details = await response.json().catch(() => ({}));
      console.warn('No se pudo enviar el correo automático:', details);
      return false;
    }

    return true;
  } catch (error) {
    console.warn('No se pudo conectar con el servicio de correo automático:', error);
    return false;
  }
}

// Formulario: guarda en Supabase y envía la solicitud por correo
const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', async (event) => {
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

    const submitButton = contactForm.querySelector('button[type="submit"]');
    const status = $('[data-contact-status]');

    if (submitButton) submitButton.disabled = true;
    if (status) {
      status.textContent = 'Enviando solicitud...';
      status.classList.remove('error', 'success');
    }

    const saved = await recordDomusSubmission?.(data);
    if (saved === false) {
      if (status) {
        status.textContent = 'No se pudo registrar la solicitud. Revisa la conexión e intenta nuevamente.';
        status.classList.add('error');
      }
      if (submitButton) submitButton.disabled = false;
      return;
    }

    const emailed = await sendContactEmail(data);

    if (emailed) {
      if (status) {
        status.textContent = 'Solicitud enviada correctamente a contacto@domusalud.cl.';
        status.classList.add('success');
      }
      contactForm.reset();
      if (regionInput) regionInput.value = '';
      if (communeInput) {
        communeInput.value = '';
        communeInput.disabled = true;
        communeInput.placeholder = 'Primero selecciona una región';
      }
      if (communeToggle) communeToggle.disabled = true;
    } else {
      if (status) {
        status.textContent = 'La solicitud quedó registrada, pero el envío automático por correo requiere revisar la configuración SMTP en Vercel.';
        status.classList.add('error');
      }
    }

    if (submitButton) submitButton.disabled = false;
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
  slides: 'domus_slide_images_v3',
  team: 'domus_team_profiles_v3',
  professionalSession: 'domus_professional_session_v2',
  serviceProfessionals: 'domus_service_professionals_v1',
  patients: 'domus_patients_v2',
  evolutions: 'domus_evolutions_v1'
};

const DEFAULT_ADMIN_USERS = [
  { id: 'admin-rmunoz', name: 'Reina Muñoz', username: 'Rmunoz', password: 'Reinamunoz1' },
  { id: 'admin-cmeza', name: 'Catalina Meza', username: 'Cmeza', password: 'Catalinameza1' },
  { id: 'admin-ccontreras', name: 'Consuelo Contreras', username: 'Ccontreras', password: 'Consuelocontreras1' },
  { id: 'admin-dgonzalez', name: 'Diego González', username: 'Dgonzalez', password: 'Diegogonzalez1' }
];

const DEFAULT_DOMUS_TEAM_ACCESS_USERS = [
  { id: 'team-rmunoz', type: 'team', teamId: 'reina-munoz', username: 'Rmunoz', password: 'Reinamunoz1' },
  { id: 'team-cmeza', type: 'team', teamId: 'catalina-meza', username: 'Cmeza', password: 'Catalinameza1' },
  { id: 'team-ccontreras', type: 'team', teamId: 'consuelo-contreras', username: 'Ccontreras', password: 'Consuelocontreras1' },
  { id: 'team-dgonzalez', type: 'team', teamId: 'diego-gonzalez', username: 'Dgonzalez', password: 'Diegogonzalez1' }
];

const DEFAULT_SERVICE_PROFESSIONALS = [
  {
    id: 'sp-rmunoz',
    type: 'service',
    firstName: 'Reina',
    lastName: 'Muñoz Bustos',
    rut: '',
    birthDate: '',
    profession: 'Enfermera clínica',
    entryDate: '',
    endDate: '',
    observations: 'Profesional interna de Domus Salud.',
    username: 'Rmunoz',
    password: 'Reinamunoz1',
    supervisorTeamId: 'reina-munoz',
    teamAccess: ['reina-munoz'],
    active: true
  },
  {
    id: 'sp-cmeza',
    type: 'service',
    firstName: 'Catalina',
    lastName: 'Meza Ducaud',
    rut: '',
    birthDate: '',
    profession: 'Tecnóloga médica',
    entryDate: '',
    endDate: '',
    observations: 'Profesional interna de Domus Salud.',
    username: 'Cmeza',
    password: 'Catalinameza1',
    supervisorTeamId: 'catalina-meza',
    teamAccess: ['catalina-meza'],
    active: true
  },
  {
    id: 'sp-ccontreras',
    type: 'service',
    firstName: 'Consuelo',
    lastName: 'Contreras Rebolledo',
    rut: '',
    birthDate: '',
    profession: 'Enfermera clínica',
    entryDate: '',
    endDate: '',
    observations: 'Profesional interna de Domus Salud.',
    username: 'Ccontreras',
    password: 'Consuelocontreras1',
    supervisorTeamId: 'consuelo-contreras',
    teamAccess: ['consuelo-contreras'],
    active: true
  },
  {
    id: 'sp-dgonzalez',
    type: 'service',
    firstName: 'Diego',
    lastName: 'González Lorca',
    rut: '',
    birthDate: '',
    profession: 'Ing. Prevención de Riesgos y Masoterapeuta Profesional',
    entryDate: '',
    endDate: '',
    observations: 'Profesional interno de Domus Salud.',
    username: 'Dgonzalez',
    password: 'Diegogonzalez1',
    supervisorTeamId: 'diego-gonzalez',
    teamAccess: ['diego-gonzalez'],
    active: true
  }
];

const SLIDE_INFO = [
  { title: 'Cuidado de personas mayores', defaultSrc: 'assets/images/servicio-a.jpg' },
  { title: 'Atención clínica especializada', defaultSrc: 'assets/images/servicio-b.jpg' },
  { title: 'Asistencia para discapacidades', defaultSrc: 'assets/images/servicio-c.jpg' },
  { title: 'Kinesiología y masoterapia', defaultSrc: 'assets/images/servicio-d.jpg' },
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

async function recordDomusVisit() {
  try {
    if (window.sessionStorage.getItem('domus_visit_recorded')) return;
    window.sessionStorage.setItem('domus_visit_recorded', '1');
  } catch (_) {
    // Si sessionStorage no está disponible, de todas formas registra el ingreso.
  }

  if (hasSupabase()) {
    const { error } = await DOMUS_DB.from('metric_events').insert({
      kind: 'visit',
      label: 'Ingreso a la página',
      page: window.location.pathname || '/',
      user_agent: navigator.userAgent || ''
    });
    if (error) console.warn('No se pudo registrar visita en Supabase:', error.message);
  }

  const stats = getStats();
  stats.visits = Number(stats.visits || 0) + 1;
  saveStats(stats);
}

async function recordDomusClick(label = 'Clic') {
  if (hasSupabase()) {
    const { error } = await DOMUS_DB.from('metric_events').insert({
      kind: 'click',
      label,
      page: window.location.pathname || '/',
      user_agent: navigator.userAgent || ''
    });
    if (error) console.warn('No se pudo registrar clic en Supabase:', error.message);
  }

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

async function recordDomusSubmission(data = {}) {
  if (hasSupabase()) {
    const { error } = await DOMUS_DB.from('contact_requests').insert({
      name: data.name || 'No indicado',
      phone: data.phone || 'No indicado',
      email: data.email || 'No indicado',
      service: data.service || 'No indicado',
      region: data.region || 'No indicada',
      commune: data.commune || 'No indicada',
      message: data.message || 'No indicado'
    });

    if (error) {
      console.error('Error al registrar solicitud en Supabase:', error);
      return false;
    }

    await DOMUS_DB.from('metric_events').insert({
      kind: 'submission',
      label: 'Solicitud enviada por correo',
      page: window.location.pathname || '/',
      user_agent: navigator.userAgent || ''
    });
  }

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
  return true;
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
const patientForm = $('#patientForm');
const serviceProfessionalForm = $('#serviceProfessionalForm');
const professionalShell = $('[data-professional-shell]');
const professionalLogin = $('[data-professional-login]');
const professionalApp = $('[data-professional-app]');
const professionalLoginForm = $('#professionalLoginForm');
const evolutionForm = $('#evolutionForm');
let selectedProfessionalPatientId = null;
let selectedAdminPatientId = null;

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


function getDefaultServiceProfessionals() {
  return DEFAULT_SERVICE_PROFESSIONALS.map((item) => ({
    ...item,
    supervisorTeamId: item.supervisorTeamId || item.teamAccess?.[0] || '',
    teamAccess: [...(item.teamAccess || [])]
  }));
}

function getServiceProfessionals() {
  const saved = storageGet(DOMUS_STORAGE_KEYS.serviceProfessionals, null);
  if (!Array.isArray(saved) || !saved.length) {
    const defaults = getDefaultServiceProfessionals();
    storageSet(DOMUS_STORAGE_KEYS.serviceProfessionals, defaults);
    return defaults;
  }
  return saved.map((item) => {
    const supervisorTeamId = item.supervisorTeamId || item.teamAccess?.[0] || '';
    return { active: true, teamAccess: supervisorTeamId ? [supervisorTeamId] : [], ...item, supervisorTeamId };
  });
}

function saveServiceProfessionals(professionals) {
  storageSet(DOMUS_STORAGE_KEYS.serviceProfessionals, professionals);
}

function professionalFullName(professional) {
  return `${professional.firstName || ''} ${professional.lastName || ''}`.trim() || professional.name || professional.username || 'Profesional';
}

function getDomusTeamAccessUsers() {
  const profiles = getTeamProfiles();
  return DEFAULT_DOMUS_TEAM_ACCESS_USERS.map((user) => {
    const profile = profiles.find((item) => item.id === user.teamId) || {};
    return {
      ...user,
      name: profile.name || user.username,
      role: profile.role || 'Equipo Domus Salud',
      profession: profile.role || 'Equipo Domus Salud',
      active: true,
      photo: profile.photo || profile.defaultPhoto || 'assets/logo-domus-salud.png'
    };
  });
}

function getProfessionals() {
  return [
    ...getServiceProfessionals().map((professional) => ({
      ...professional,
      type: 'service',
      name: professionalFullName(professional),
      role: professional.profession || 'Profesional habilitado'
    })),
    ...getDomusTeamAccessUsers()
  ];
}

function getServiceProfessionalById(id) {
  return getServiceProfessionals().find((item) => item.id === id) || null;
}

function getProfessionalById(id) {
  return getProfessionals().find((item) => item.id === id) || null;
}

function getDomusTeamNameById(teamId) {
  return getTeamProfiles().find((item) => item.id === teamId)?.name || teamId || 'Equipo Domus';
}

function getProfessionalSupervisorId(professional = {}) {
  return professional.supervisorTeamId || professional.teamAccess?.[0] || '';
}

function getProfessionalSupervisorName(professional = {}) {
  const supervisorId = getProfessionalSupervisorId(professional);
  return supervisorId ? getDomusTeamNameById(supervisorId) : 'Sin supervisor asignado';
}

function normalizeSearchValue(value = '') {
  return normalizeText(value).replace(/[^a-z0-9]/g, '');
}

function getPatients() {
  return storageGet(DOMUS_STORAGE_KEYS.patients, []);
}

function savePatients(patients) {
  storageSet(DOMUS_STORAGE_KEYS.patients, patients);
}

function getPatientById(id) {
  return getPatients().find((patient) => patient.id === id) || null;
}

function getEvolutions() {
  return storageGet(DOMUS_STORAGE_KEYS.evolutions, []);
}

function saveEvolutions(evolutions) {
  storageSet(DOMUS_STORAGE_KEYS.evolutions, evolutions);
}

function getPatientEvolutions(patientId) {
  return getEvolutions()
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => new Date(b.visitDate || b.createdAt) - new Date(a.visitDate || a.createdAt));
}

function localDatetimeValue(date = new Date()) {
  const offset = date.getTimezoneOffset() * 60000;
  return new Date(date.getTime() - offset).toISOString().slice(0, 16);
}

const ATTENTION_TYPE_CONFIG = {
  'Procedimientos de enfermería': {
    title: 'Formato para procedimientos de enfermería',
    help: 'Registra procedimiento específico, respuesta del paciente, educación entregada e indicaciones.',
    evolutionLabel: 'Evolución / respuesta del paciente',
    proceduresLabel: 'Procedimiento realizado'
  },
  'Procedimientos de TENS': {
    title: 'Formato para procedimientos de TENS',
    help: 'Registra el procedimiento técnico, tolerancia del paciente, insumos utilizados e indicaciones.',
    evolutionLabel: 'Evolución / tolerancia del paciente',
    proceduresLabel: 'Procedimiento realizado'
  },
  'Visita a paciente': {
    title: 'Formulario de visitas a paciente',
    help: 'Selecciona el tipo de visita y luego completa el formulario de nuevo paciente o seguimiento.',
    evolutionLabel: 'Detalle de la visita',
    proceduresLabel: 'Tipo de visita'
  }
};

const PROCEDURE_VISIT_TYPES = ['Procedimientos de enfermería', 'Procedimientos de TENS'];
const PATIENT_VISIT_TYPE = 'Visita a paciente';

const PROCEDURE_SPECIFIC_OPTIONS = [
  { label: 'Adm. de medicamentos intramuscular - EU y TENS', roles: ['EU', 'TENS'] },
  { label: 'Adm. de medicamentos endovenosos BOLO - EU', roles: ['EU'] },
  { label: 'Adm. de medicamentos endovenosos INFUSIÓN - EU', roles: ['EU'] },
  { label: 'Adm. de medicamentos subcutaneos - EU y TENS', roles: ['EU', 'TENS'] },
  { label: 'Adm. de vacunas - EU y TENS', roles: ['EU', 'TENS'] },
  { label: 'Instalación de vía venosa periferica - EU', roles: ['EU'] },
  { label: 'Curación de dispositivos invasivos - EU', roles: ['EU'] },
  { label: 'Curación de heridas simples (Categoria 1 y 2) - EU y TENS', roles: ['EU', 'TENS'] },
  { label: 'Curación de heridas avanzadas (inicial - categoria 3) - EU', roles: ['EU'] },
  { label: 'Retiro de puntos / corchetes - EU y TENS', roles: ['EU', 'TENS'] },
  { label: 'Instalación de sonda urinaria permanente - EU', roles: ['EU'] },
  { label: 'Cateterismo vesical intermitente - EU', roles: ['EU'] },
  { label: 'Instalación sonda nasogastrica - EU', roles: ['EU'] },
  { label: 'Hidratación posterior a uso de alcohol - EU', roles: ['EU'] }
];

const PATIENT_VISIT_OPTIONS = [
  'Visita médico general',
  'Visita Médico especialista',
  'Visita Kine Respiratoria',
  'Visita Kine Motora',
  'Visita Fonoaudiología',
  'Visita Terapia Ocupacional',
  'Visita Educación de Salud',
  'Visita TENS',
  'Visita Enfermería',
  'Visita Cuidador',
  'Visita de acompañamiento adulto mayor'
];

function isProcedureVisitType(type) {
  return PROCEDURE_VISIT_TYPES.includes(type);
}

function isPatientVisitType(type) {
  return type === PATIENT_VISIT_TYPE;
}

function procedureRoleFromVisitType(type) {
  if (type === 'Procedimientos de TENS') return 'TENS';
  if (type === 'Procedimientos de enfermería') return 'EU';
  return '';
}

function getSpecificProcedureOptionsForType(type) {
  const role = procedureRoleFromVisitType(type);
  if (!role) return [];
  return PROCEDURE_SPECIFIC_OPTIONS.filter((item) => item.roles.includes(role)).map((item) => item.label);
}

function fillSpecificProcedureOptions(type, selectedValue = '') {
  const select = evolutionForm?.elements.specificProcedure;
  const label = $('[data-specific-procedure-label]');
  const help = $('[data-specific-procedure-help]');
  if (!select) return;

  let placeholder = 'Selecciona una opción';
  let options = [];

  if (isProcedureVisitType(type)) {
    placeholder = 'Selecciona procedimiento específico';
    options = getSpecificProcedureOptionsForType(type);
    if (label) label.textContent = 'Procedimiento específico';
    if (help) help.textContent = 'La lista se ajusta según Procedimientos de enfermería o Procedimientos de TENS.';
  } else if (isPatientVisitType(type)) {
    placeholder = 'Selecciona tipo de visita';
    options = PATIENT_VISIT_OPTIONS;
    if (label) label.textContent = 'Tipo de visita';
    if (help) help.textContent = 'Selecciona el tipo de visita que realizará el profesional.';
  } else {
    if (label) label.textContent = 'Procedimiento específico';
    if (help) help.textContent = 'La lista se ajusta según el tipo de atención seleccionado.';
  }

  select.innerHTML = `<option value="">${placeholder}</option>` + options.map((option) => `
    <option value="${escapeHTML(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHTML(option)}</option>
  `).join('');
}

function wordCount(value = '') {
  return value.toString().trim().split(/\s+/).filter(Boolean).length;
}

function validateWordLimitFields(form) {
  const limitedFields = $$('[data-word-limit]', form);
  for (const field of limitedFields) {
    const limit = Number(field.dataset.wordLimit || 0);
    if (limit && wordCount(field.value) > limit) {
      const label = field.closest('label')?.querySelector('span')?.textContent || 'Campo';
      alert(`${label} supera el máximo de ${limit} palabras.`);
      field.focus();
      return false;
    }
  }
  return true;
}

function updateProcedureConditionalFields() {
  if (!evolutionForm) return;
  const allergiesValue = evolutionForm.elements.allergies?.value || '';
  const allergiesWrapper = $('[data-allergies-detail-wrapper]');
  if (allergiesWrapper) allergiesWrapper.hidden = allergiesValue !== 'Sí';
  if (allergiesValue !== 'Sí' && evolutionForm.elements.allergiesDetail) evolutionForm.elements.allergiesDetail.value = '';

  const medicalOrderValue = evolutionForm.elements.medicalOrder?.value || '';
  const medicalOrderWrapper = $('[data-medical-order-detail-wrapper]');
  if (medicalOrderWrapper) medicalOrderWrapper.hidden = medicalOrderValue !== 'Sí';
  if (medicalOrderValue !== 'Sí' && evolutionForm.elements.medicalOrderIndications) evolutionForm.elements.medicalOrderIndications.value = '';
}

function clearInputsInside(selector) {
  const wrapper = $(selector);
  if (!wrapper) return;
  $$('input, textarea, select', wrapper).forEach((input) => {
    if (input.type === 'radio' || input.type === 'checkbox') input.checked = false;
    else input.value = '';
  });
}

function updateConditionalDetail(radioName, detailSelector) {
  const value = evolutionForm?.elements[radioName]?.value || '';
  const wrapper = $(detailSelector);
  if (!wrapper) return;
  wrapper.hidden = value !== 'Sí';
  if (value !== 'Sí') {
    $$('input, textarea, select', wrapper).forEach((input) => { input.value = ''; });
  }
}

function setSignatureDefaultsForCurrentProfessional(prefix = '') {
  if (!evolutionForm) return;
  const current = getCurrentProfessional();
  if (!current) return;
  const nameField = evolutionForm.elements[`${prefix}SignatureName`] || evolutionForm.elements.signatureName;
  const rutField = evolutionForm.elements[`${prefix}SignatureRut`] || evolutionForm.elements.signatureRut;
  if (nameField && !nameField.value) nameField.value = professionalFullName(current);
  if (rutField && !rutField.value) rutField.value = current.rut || '';
}

function setProcedureDefaultsForCurrentProfessional() {
  setSignatureDefaultsForCurrentProfessional('');
}

function fillSelectedPatientAutofillFields() {
  if (!evolutionForm) return;
  const patient = getPatientById(selectedProfessionalPatientId) || {};
  $$('[data-auto-patient-name]', evolutionForm).forEach((input) => { input.value = patient.name || ''; });
  $$('[data-auto-patient-rut]', evolutionForm).forEach((input) => { input.value = patient.rut || ''; });
}

function updateVisitPatientFormUI() {
  if (!evolutionForm) return;
  const isVisit = isPatientVisitType(evolutionForm.elements.visitType?.value || '');
  const visitSection = $('[data-visit-patient-format]');
  if (!visitSection || !isVisit) return;

  let mode = evolutionForm.elements.visitFormMode?.value || '';
  if (!mode) {
    const firstMode = evolutionForm.querySelector('[data-visit-form-mode][value="Nuevo paciente"]');
    if (firstMode) firstMode.checked = true;
    mode = 'Nuevo paciente';
  }

  const newPanel = $('[data-new-patient-visit-format]');
  const followPanel = $('[data-followup-patient-visit-format]');
  if (newPanel) newPanel.hidden = mode !== 'Nuevo paciente';
  if (followPanel) followPanel.hidden = mode !== 'Seguimiento de paciente';

  if (mode !== 'Nuevo paciente') clearInputsInside('[data-new-patient-visit-format]');
  if (mode !== 'Seguimiento de paciente') clearInputsInside('[data-followup-patient-visit-format]');

  updateConditionalDetail('newTobacco', '[data-new-tobacco-detail]');
  updateConditionalDetail('newAlcohol', '[data-new-alcohol-detail]');
  updateConditionalDetail('newDrugs', '[data-new-drugs-detail]');
  updateConditionalDetail('newAllergies', '[data-new-allergies-detail]');
  fillSelectedPatientAutofillFields();
  setSignatureDefaultsForCurrentProfessional('visit');
}

function checkedValues(form, name) {
  return $$(`[name="${name}"]`, form).filter((input) => input.checked).map((input) => input.value).join(', ');
}

function formValue(formData, name) {
  return (formData.get(name) || '').toString().trim();
}

function collectVisitPatientData(formData) {
  if (!evolutionForm) return {};
  return {
    visitFormMode: formValue(formData, 'visitFormMode'),
    newPatientNameAuto: formValue(formData, 'newPatientNameAuto'),
    newPatientRutAuto: formValue(formData, 'newPatientRutAuto'),
    newDiagnosis: formValue(formData, 'newDiagnosis'),
    newAdmissionReason: formValue(formData, 'newAdmissionReason'),
    newAge: formValue(formData, 'newAge'),
    newLastEpicrisis: formValue(formData, 'newLastEpicrisis'),
    newTobacco: formValue(formData, 'newTobacco'),
    newTobaccoAmount: formValue(formData, 'newTobaccoAmount'),
    newAlcohol: formValue(formData, 'newAlcohol'),
    newAlcoholFrequency: formValue(formData, 'newAlcoholFrequency'),
    newDrugs: formValue(formData, 'newDrugs'),
    newDrugsFrequency: formValue(formData, 'newDrugsFrequency'),
    newAllergies: formValue(formData, 'newAllergies'),
    newAllergiesDetail: formValue(formData, 'newAllergiesDetail'),
    newHTA: formValue(formData, 'newHTA'), newHTAObs: formValue(formData, 'newHTAObs'),
    newDiabetes: formValue(formData, 'newDiabetes'), newDiabetesObs: formValue(formData, 'newDiabetesObs'),
    newInsulinResistance: formValue(formData, 'newInsulinResistance'), newInsulinResistanceObs: formValue(formData, 'newInsulinResistanceObs'),
    newACV: formValue(formData, 'newACV'), newACVObs: formValue(formData, 'newACVObs'),
    newICC: formValue(formData, 'newICC'), newICCObs: formValue(formData, 'newICCObs'),
    newCoronary: formValue(formData, 'newCoronary'), newCoronaryObs: formValue(formData, 'newCoronaryObs'),
    newArrhythmia: formValue(formData, 'newArrhythmia'), newArrhythmiaObs: formValue(formData, 'newArrhythmiaObs'),
    newLCFA: formValue(formData, 'newLCFA'), newLCFAObs: formValue(formData, 'newLCFAObs'),
    newOtherMorbid: formValue(formData, 'newOtherMorbid'), newOtherMorbidObs: formValue(formData, 'newOtherMorbidObs'),
    newPa: formValue(formData, 'newPa'), newFr: formValue(formData, 'newFr'), newTemp: formValue(formData, 'newTemp'), newPam: formValue(formData, 'newPam'),
    newSat: formValue(formData, 'newSat'), newDolor: formValue(formData, 'newDolor'), newFc: formValue(formData, 'newFc'), newFio2: formValue(formData, 'newFio2'),
    newConsciousness: formValue(formData, 'newConsciousness'), newConsciousnessObs: formValue(formData, 'newConsciousnessObs'),
    newPupils: checkedValues(evolutionForm, 'newPupils'), newPupilsObs: formValue(formData, 'newPupilsObs'),
    newMotorActivity: formValue(formData, 'newMotorActivity'), newMotorActivityObs: formValue(formData, 'newMotorActivityObs'),
    newSkinMucosa: checkedValues(evolutionForm, 'newSkinMucosa'), newPerfusionSeconds: formValue(formData, 'newPerfusionSeconds'), newSkinMucosaObs: formValue(formData, 'newSkinMucosaObs'),
    newUPP: formValue(formData, 'newUPP'), newUPPLocation: formValue(formData, 'newUPPLocation'), newUPPDegree: formValue(formData, 'newUPPDegree'), newUPPObs: formValue(formData, 'newUPPObs'),
    newRespiration: checkedValues(evolutionForm, 'newRespiration'), newRespirationFio2: formValue(formData, 'newRespirationFio2'), newEupneic: formValue(formData, 'newEupneic'), newRespirationObs: formValue(formData, 'newRespirationObs'),
    newBronchialSecretion: formValue(formData, 'newBronchialSecretion'),
    newAbdomen: checkedValues(evolutionForm, 'newAbdomen'), newAbdomenObs: formValue(formData, 'newAbdomenObs'),
    newTubes: formValue(formData, 'newTubes'), newTubeType: formValue(formData, 'newTubeType'), newTubeLocation: formValue(formData, 'newTubeLocation'), newTubeDrain: formValue(formData, 'newTubeDrain'),
    newCatheter: formValue(formData, 'newCatheter'), newCatheterLocation: formValue(formData, 'newCatheterLocation'), newCatheterState: formValue(formData, 'newCatheterState'), newCatheterObs: formValue(formData, 'newCatheterObs'),
    newExtremitiesMobility: formValue(formData, 'newExtremitiesMobility'), newExtremitiesAlterations: formValue(formData, 'newExtremitiesAlterations'),
    newUrineType: formValue(formData, 'newUrineType'), newUrineTube: formValue(formData, 'newUrineTube'), newUrineColor: formValue(formData, 'newUrineColor'), newUrineDebit: formValue(formData, 'newUrineDebit'),
    newStoolsAmount: formValue(formData, 'newStoolsAmount'), newStoolsQuality: formValue(formData, 'newStoolsQuality'), newSphincterControl: formValue(formData, 'newSphincterControl'), newStoolsObs: formValue(formData, 'newStoolsObs'),
    newDentalProsthesis: formValue(formData, 'newDentalProsthesis'), newDentalProsthesisObs: formValue(formData, 'newDentalProsthesisObs'),
    newHearingProsthesis: formValue(formData, 'newHearingProsthesis'), newHearingProsthesisObs: formValue(formData, 'newHearingProsthesisObs'),
    newUsesGlasses: formValue(formData, 'newUsesGlasses'), newUsesGlassesObs: formValue(formData, 'newUsesGlassesObs'),
    newOtherPhysical: formValue(formData, 'newOtherPhysical'),
    newFallRisk: formValue(formData, 'newFallRisk'), newFallRiskCriticity: formValue(formData, 'newFallRiskCriticity'), newFallRiskObs: formValue(formData, 'newFallRiskObs'),
    newLPPRisk: formValue(formData, 'newLPPRisk'), newLPPRiskObs: formValue(formData, 'newLPPRiskObs'),
    newMedicalIndicationsPlan: formValue(formData, 'newMedicalIndicationsPlan'),
    followPatientNameAuto: formValue(formData, 'followPatientNameAuto'),
    followPatientRutAuto: formValue(formData, 'followPatientRutAuto'),
    followAdmissionType: formValue(formData, 'followAdmissionType'),
    followAge: formValue(formData, 'followAge'),
    followPa: formValue(formData, 'followPa'), followFr: formValue(formData, 'followFr'), followTemp: formValue(formData, 'followTemp'), followPam: formValue(formData, 'followPam'),
    followSat: formValue(formData, 'followSat'), followDolor: formValue(formData, 'followDolor'), followFc: formValue(formData, 'followFc'), followFio2: formValue(formData, 'followFio2'),
    followConsciousness: formValue(formData, 'followConsciousness'), followConsciousnessObs: formValue(formData, 'followConsciousnessObs'),
    followMotorActivity: formValue(formData, 'followMotorActivity'), followMotorActivityObs: formValue(formData, 'followMotorActivityObs'),
    followSkinMucosa: checkedValues(evolutionForm, 'followSkinMucosa'), followPerfusionSeconds: formValue(formData, 'followPerfusionSeconds'), followSkinMucosaObs: formValue(formData, 'followSkinMucosaObs'),
    followUPP: formValue(formData, 'followUPP'), followUPPLocation: formValue(formData, 'followUPPLocation'), followUPPDegree: formValue(formData, 'followUPPDegree'), followUPPObs: formValue(formData, 'followUPPObs'),
    followAbdomen: checkedValues(evolutionForm, 'followAbdomen'), followAbdomenObs: formValue(formData, 'followAbdomenObs'),
    followUrineType: formValue(formData, 'followUrineType'), followUrineTube: formValue(formData, 'followUrineTube'), followUrineColor: formValue(formData, 'followUrineColor'), followUrineDebit: formValue(formData, 'followUrineDebit'),
    followStoolsAmount: formValue(formData, 'followStoolsAmount'), followStoolsQuality: formValue(formData, 'followStoolsQuality'), followSphincterControl: formValue(formData, 'followSphincterControl'), followStoolsObs: formValue(formData, 'followStoolsObs'),
    followInvasiveDevices: formValue(formData, 'followInvasiveDevices'), followInvasiveDeviceType: formValue(formData, 'followInvasiveDeviceType'), followInvasiveDeviceLocation: formValue(formData, 'followInvasiveDeviceLocation'),
    followOtherPhysical: formValue(formData, 'followOtherPhysical'),
    followVisitDetail: formValue(formData, 'followVisitDetail'),
    followMedicalIndicationsPlan: formValue(formData, 'followMedicalIndicationsPlan'),
    visitSignatureName: formValue(formData, 'visitSignatureName'),
    visitSignatureRut: formValue(formData, 'visitSignatureRut'),
    visitSignatureType: formValue(formData, 'visitSignatureType')
  };
}

function getProcedureSummary(item = {}) {
  if (!isProcedureVisitType(item.visitType)) return '';
  return [
    item.diagnosis ? `<p><strong>Diagnóstico principal:</strong> ${escapeHTML(item.diagnosis)}</p>` : '',
    item.patientAge ? `<p><strong>Edad:</strong> ${escapeHTML(item.patientAge)} años</p>` : '',
    item.visitReason ? `<p><strong>Motivo de visita:</strong> ${escapeHTML(item.visitReason)}</p>` : '',
    item.allergies ? `<p><strong>Alergias:</strong> ${escapeHTML(item.allergies)}${item.allergiesDetail ? ` · ${escapeHTML(item.allergiesDetail)}` : ''}</p>` : '',
    item.medicalOrder ? `<p><strong>Orden médica / Epicrisis:</strong> ${escapeHTML(item.medicalOrder)}</p>` : '',
    item.specificProcedure ? `<p><strong>Procedimiento específico:</strong> ${escapeHTML(item.specificProcedure)}</p>` : '',
    item.visitProcedureDetail ? `<p><strong>Detalle:</strong> ${escapeHTML(item.visitProcedureDetail)}</p>` : '',
    item.nursingCarePlan ? `<p><strong>Plan:</strong> ${escapeHTML(item.nursingCarePlan)}</p>` : ''
  ].filter(Boolean).join('');
}

function getVisitPatientSummary(item = {}) {
  if (!isPatientVisitType(item.visitType)) return '';
  const mode = item.visitFormMode || 'Formulario de visita';
  if (mode === 'Nuevo paciente') {
    return [
      item.specificProcedure ? `<p><strong>Tipo de visita:</strong> ${escapeHTML(item.specificProcedure)}</p>` : '',
      `<p><strong>Formulario:</strong> Nuevo paciente</p>`,
      item.newDiagnosis ? `<p><strong>Diagnóstico principal:</strong> ${escapeHTML(item.newDiagnosis)}</p>` : '',
      item.newAdmissionReason ? `<p><strong>Motivo de ingreso:</strong> ${escapeHTML(item.newAdmissionReason)}</p>` : '',
      item.newMedicalIndicationsPlan ? `<p><strong>Plan:</strong> ${escapeHTML(item.newMedicalIndicationsPlan)}</p>` : ''
    ].filter(Boolean).join('');
  }
  return [
    item.specificProcedure ? `<p><strong>Tipo de visita:</strong> ${escapeHTML(item.specificProcedure)}</p>` : '',
    `<p><strong>Formulario:</strong> Seguimiento de paciente</p>`,
    item.followAdmissionType ? `<p><strong>Motivo:</strong> ${escapeHTML(item.followAdmissionType)}</p>` : '',
    item.followVisitDetail ? `<p><strong>Detalle de visita:</strong> ${escapeHTML(item.followVisitDetail)}</p>` : '',
    item.followMedicalIndicationsPlan ? `<p><strong>Plan:</strong> ${escapeHTML(item.followMedicalIndicationsPlan)}</p>` : ''
  ].filter(Boolean).join('');
}

function getEvolutionSummaryHtml(item = {}) {
  if (isProcedureVisitType(item.visitType)) return getProcedureSummary(item);
  if (isPatientVisitType(item.visitType)) return getVisitPatientSummary(item);
  return `
    <p><strong>Objetivo:</strong> ${escapeHTML(item.objective || 'No registrado')}</p>
    ${item.specificProcedure ? `<p><strong>Detalle:</strong> ${escapeHTML(item.specificProcedure)}</p>` : ''}
    <p><strong>Evolución:</strong> ${escapeHTML(item.evolution || 'No registrada')}</p>
    <p><strong>Indicaciones:</strong> ${escapeHTML(item.indications || 'No registradas')}</p>
  `;
}

function updateAttentionTypeUI() {
  if (!evolutionForm) return;
  const type = evolutionForm.elements.visitType?.value || '';
  const config = ATTENTION_TYPE_CONFIG[type] || null;
  const specificWrapper = $('[data-specific-procedure-wrapper]');
  const procedureFormat = $('[data-procedure-care-format]');
  const visitPatientFormat = $('[data-visit-patient-format]');
  const genericFormat = $('[data-attention-format-section]');
  const vitalSection = $('[data-vital-section]');
  const needsSpecificProcedure = isProcedureVisitType(type) || isPatientVisitType(type);
  const isProcedure = isProcedureVisitType(type);
  const isVisit = isPatientVisitType(type);

  if (specificWrapper) specificWrapper.hidden = !needsSpecificProcedure;
  if (needsSpecificProcedure) {
    fillSpecificProcedureOptions(type, evolutionForm.elements.specificProcedure?.value || '');
  } else if (evolutionForm.elements.specificProcedure) {
    evolutionForm.elements.specificProcedure.value = '';
  }

  if (procedureFormat) procedureFormat.hidden = !isProcedure;
  if (visitPatientFormat) visitPatientFormat.hidden = !isVisit;
  if (genericFormat) genericFormat.hidden = isProcedure || isVisit;
  if (vitalSection) vitalSection.hidden = isVisit;

  if (!isVisit) clearInputsInside('[data-visit-patient-format]');
  if (isProcedure) setProcedureDefaultsForCurrentProfessional();
  if (isVisit) updateVisitPatientFormUI();

  const title = $('[data-attention-format-title]');
  const help = $('[data-attention-format-help]');
  const evolutionLabel = $('[data-evolution-label]');
  const proceduresLabel = $('[data-procedures-label]');
  if (title) title.textContent = config?.title || 'Formato de atención seleccionada';
  if (help) help.textContent = config?.help || 'Selecciona el tipo de atención para ajustar el registro clínico.';
  if (evolutionLabel) evolutionLabel.textContent = config?.evolutionLabel || 'Evolución clínica';
  if (proceduresLabel) proceduresLabel.textContent = config?.proceduresLabel || 'Procedimientos realizados';
  updateProcedureConditionalFields();
}

function fillProfessionalSelect(select, selectedId = '') {
  if (!select) return;
  const professionals = getServiceProfessionals().filter((professional) => professional.active !== false);
  select.innerHTML = '<option value="">Selecciona profesional habilitado</option>' + professionals.map((professional) => `
    <option value="${escapeHTML(professional.id)}" ${professional.id === selectedId ? 'selected' : ''}>
      ${escapeHTML(professionalFullName(professional))} · ${escapeHTML(professional.profession || 'Profesional')}
    </option>
  `).join('');
}

function resetPatientForm() {
  patientForm?.reset();
  if (patientForm?.elements.id) patientForm.elements.id.value = '';
  fillProfessionalSelect(patientForm?.querySelector('[data-patient-professional-select]'));
  const message = $('[data-patient-message]');
  if (message) message.textContent = '';
}

function renderPatientsAdmin() {
  const list = $('[data-patients-list]');
  fillProfessionalSelect(patientForm?.querySelector('[data-patient-professional-select]'), patientForm?.elements.professionalId?.value || '');
  if (!list) return;

  const query = normalizeSearchValue($('[data-admin-patient-search]')?.value || '');
  const patients = getPatients().filter((patient) => {
    if (!query) return true;
    return normalizeSearchValue(`${patient.name || ''} ${patient.rut || ''}`).includes(query);
  });

  if (!patients.length) {
    list.innerHTML = '<div class="admin-row"><p>No hay pacientes que coincidan con la búsqueda o aún no existen pacientes registrados.</p></div>';
    renderAdminClinicalRecords();
    return;
  }

  list.innerHTML = patients.map((patient) => {
    const professional = getServiceProfessionalById(patient.professionalId) || getProfessionalById(patient.professionalId);
    const supervisorName = getProfessionalSupervisorName(professional || {});
    const evolutions = getPatientEvolutions(patient.id);
    return `
      <article class="admin-row ${patient.id === selectedAdminPatientId ? 'selected' : ''}" data-patient-id="${escapeHTML(patient.id)}">
        <div class="admin-row-header">
          <div>
            <strong>${escapeHTML(patient.name)}</strong>
            <small>${escapeHTML(patient.service || 'Servicio no indicado')} · ${escapeHTML(patient.status || 'Activo')}</small>
          </div>
          <span class="status-pill ${patient.status === 'Activo' ? 'approved' : 'pending'}">${escapeHTML(patient.status || 'Activo')}</span>
        </div>
        <p><strong>RUT/ID:</strong> ${escapeHTML(patient.rut || 'No indicado')}</p>
        <p><strong>Contacto:</strong> ${escapeHTML(patient.phone || 'No indicado')}</p>
        <p><strong>Profesional prestador:</strong> ${escapeHTML(professionalFullName(professional || {}) || 'Sin asignar')}</p>
        <p><strong>Administrador supervisor:</strong> ${escapeHTML(supervisorName)}</p>
        <p><strong>Evoluciones:</strong> ${evolutions.length}</p>
        ${patient.notes ? `<p><strong>Antecedentes:</strong> ${escapeHTML(patient.notes)}</p>` : ''}
        <div class="admin-row-actions">
          <button class="mini-btn" type="button" data-edit-patient="${escapeHTML(patient.id)}">Editar</button>
          <button class="mini-btn success" type="button" data-view-patient-record="${escapeHTML(patient.id)}">Ver ficha clínica</button>
          <button class="mini-btn dark" type="button" data-admin-patient-pdf="${escapeHTML(patient.id)}">PDF historial</button>
          <button class="mini-btn danger" type="button" data-delete-patient="${escapeHTML(patient.id)}">Eliminar</button>
        </div>
      </article>
    `;
  }).join('');

  if (selectedAdminPatientId && !getPatientById(selectedAdminPatientId)) selectedAdminPatientId = null;
  renderAdminClinicalRecords();
}

function renderAdminClinicalRecords(patientId = selectedAdminPatientId) {
  const box = $('[data-admin-clinical-records]');
  const pdfButton = $('[data-admin-selected-patient-pdf]');
  if (!box) return;
  const patient = patientId ? getPatientById(patientId) : null;
  if (!patient) {
    box.innerHTML = '<p>Selecciona un paciente desde el listado superior para visualizar su ficha clínica.</p>';
    if (pdfButton) pdfButton.hidden = true;
    return;
  }
  selectedAdminPatientId = patient.id;
  if (pdfButton) {
    pdfButton.hidden = false;
    pdfButton.dataset.adminSelectedPatientPdf = patient.id;
  }
  const professional = getServiceProfessionalById(patient.professionalId) || getProfessionalById(patient.professionalId) || {};
  const evolutions = getPatientEvolutions(patient.id);
  const evolutionHtml = evolutions.length ? evolutions.map((item) => `
    <article class="clinical-record-item">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(item.visitType || 'Evolución clínica')}</strong>
          <small>${formatDateTime(item.visitDate || item.createdAt)}</small>
        </div>
        <button class="mini-btn dark" type="button" data-download-evolution-pdf="${escapeHTML(item.id)}">PDF</button>
      </div>
      ${getEvolutionSummaryHtml(item)}
    </article>
  `).join('') : '<p>Este paciente aún no tiene evoluciones registradas.</p>';

  box.innerHTML = `
    <div class="clinical-summary-grid">
      <article><span>Paciente</span><strong>${escapeHTML(patient.name)}</strong></article>
      <article><span>RUT/ID</span><strong>${escapeHTML(patient.rut || 'No indicado')}</strong></article>
      <article><span>Servicio principal</span><strong>${escapeHTML(patient.service || 'No indicado')}</strong></article>
      <article><span>Estado</span><strong>${escapeHTML(patient.status || 'Activo')}</strong></article>
      <article><span>Profesional prestador</span><strong>${escapeHTML(professionalFullName(professional))}</strong></article>
      <article><span>Administrador supervisor</span><strong>${escapeHTML(getProfessionalSupervisorName(professional))}</strong></article>
    </div>
    <div class="clinical-notes"><strong>Antecedentes / necesidad principal</strong><p>${escapeHTML(patient.notes || 'No registrado')}</p></div>
    <div class="clinical-documents"><h4>Documentos asignados</h4><p>Aún no hay documentos adjuntos. Queda preparada la sección para futuras cargas por profesional.</p></div>
    <div class="clinical-evolutions"><h4>Avance y evoluciones</h4>${evolutionHtml}</div>
  `;
  $$('[data-patient-id]').forEach((row) => row.classList.toggle('selected', row.dataset.patientId === selectedAdminPatientId));
}

function getCurrentProfessional() {
  const session = storageGet(DOMUS_STORAGE_KEYS.professionalSession, null);
  if (!session?.id) return null;
  return getProfessionals().find((professional) => professional.id === session.id) || null;
}

function setCurrentProfessional(professional) {
  if (professional) storageSet(DOMUS_STORAGE_KEYS.professionalSession, { id: professional.id, loggedAt: new Date().toISOString() });
  else window.localStorage.removeItem(DOMUS_STORAGE_KEYS.professionalSession);
}

function openProfessional() {
  if (!professionalShell) return;
  professionalShell.hidden = false;
  document.body.classList.add('professional-open');
  renderProfessionalState();
}

function closeProfessional() {
  if (!professionalShell) return;
  professionalShell.hidden = true;
  document.body.classList.remove('professional-open');
}

function renderProfessionalState() {
  const current = getCurrentProfessional();
  if (current) {
    professionalLogin.hidden = true;
    professionalApp.hidden = false;
    $('[data-professional-current-user]').textContent = `${current.name} (${current.username})`;
    const supervisor = $('[data-professional-supervisor]');
    if (supervisor) {
      supervisor.textContent = current.type === 'service'
        ? getProfessionalSupervisorName(current)
        : `${current.name} (equipo Domus)`;
    }
    renderProfessionalPatients();
  } else {
    professionalLogin.hidden = false;
    professionalApp.hidden = true;
  }
}

function canProfessionalAccessPatient(current, patient) {
  if (!current || !patient) return false;
  if (current.type === 'service') return patient.professionalId === current.id;
  if (current.type === 'team' && current.teamId) {
    const serviceProfessional = getServiceProfessionalById(patient.professionalId);
    return getProfessionalSupervisorId(serviceProfessional || {}) === current.teamId;
  }
  return false;
}

function renderProfessionalPatients() {
  const list = $('[data-professional-patients]');
  const detail = $('[data-professional-detail]');
  const empty = $('[data-professional-empty]');
  const current = getCurrentProfessional();
  if (!list || !current) return;

  const query = normalizeSearchValue($('[data-professional-patient-search]')?.value || '');
  const patients = getPatients()
    .filter((patient) => canProfessionalAccessPatient(current, patient))
    .filter((patient) => !query || normalizeSearchValue(`${patient.name || ''} ${patient.rut || ''}`).includes(query));

  if (!patients.length) {
    list.innerHTML = '<div class="admin-row"><p>No hay pacientes asignados que coincidan con la búsqueda.</p></div>';
    if (detail) detail.hidden = true;
    if (empty) empty.hidden = false;
    selectedProfessionalPatientId = null;
    return;
  }

  list.innerHTML = patients.map((patient) => `
    <button class="professional-patient-card ${patient.id === selectedProfessionalPatientId ? 'active' : ''}" type="button" data-select-professional-patient="${escapeHTML(patient.id)}">
      <strong>${escapeHTML(patient.name)}</strong>
      <span>${escapeHTML(patient.service || 'Servicio no indicado')}</span>
      <small>${escapeHTML(patient.status || 'Activo')} · ${escapeHTML(patient.rut || 'Sin RUT/ID')} · ${getPatientEvolutions(patient.id).length} evolución(es)</small>
    </button>
  `).join('');

  if (!selectedProfessionalPatientId || !patients.some((patient) => patient.id === selectedProfessionalPatientId)) {
    selectProfessionalPatient(patients[0].id);
  } else {
    renderSelectedPatientDetail();
  }
}

function selectProfessionalPatient(patientId) {
  selectedProfessionalPatientId = patientId;
  renderSelectedPatientDetail();
  renderProfessionalPatientsListState();
}

function renderProfessionalPatientsListState() {
  $$('[data-select-professional-patient]').forEach((button) => {
    button.classList.toggle('active', button.dataset.selectProfessionalPatient === selectedProfessionalPatientId);
  });
}

function renderSelectedPatientDetail() {
  const patient = getPatientById(selectedProfessionalPatientId);
  const detail = $('[data-professional-detail]');
  const empty = $('[data-professional-empty]');
  if (!patient || !detail || !evolutionForm) return;
  detail.hidden = false;
  if (empty) empty.hidden = true;

  $('[data-selected-patient-name]').textContent = patient.name;
  $('[data-selected-patient-info]').textContent = `${patient.service || 'Servicio no indicado'} · ${patient.status || 'Activo'} · ${patient.rut || 'Sin RUT/ID'}`;
  evolutionForm.elements.patientId.value = patient.id;
  if (!evolutionForm.elements.visitDate.value) evolutionForm.elements.visitDate.value = localDatetimeValue();
  fillSelectedPatientAutofillFields();
  updateAttentionTypeUI();
  renderEvolutionHistory(patient.id);
}

function resetEvolutionForm() {
  if (!evolutionForm) return;
  const patientId = evolutionForm.elements.patientId.value || selectedProfessionalPatientId || '';
  evolutionForm.reset();
  evolutionForm.elements.patientId.value = patientId;
  evolutionForm.elements.visitDate.value = localDatetimeValue();
  fillSelectedPatientAutofillFields();
  const message = $('[data-evolution-message]');
  if (message) message.textContent = '';
  updateAttentionTypeUI();
}

function renderEvolutionHistory(patientId) {
  const list = $('[data-evolution-list]');
  const summary = $('[data-evolution-summary]');
  if (!list) return;
  const evolutions = getPatientEvolutions(patientId);
  if (summary) summary.textContent = `${evolutions.length} registro(s)`;

  if (!evolutions.length) {
    list.innerHTML = '<div class="admin-row"><p>Aún no hay evoluciones registradas para este paciente.</p></div>';
    return;
  }

  list.innerHTML = evolutions.map((item) => `
    <article class="admin-row" data-evolution-id="${escapeHTML(item.id)}">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(item.visitType || 'Evolución clínica')}</strong>
          <small>${formatDateTime(item.visitDate || item.createdAt)}</small>
        </div>
        <span class="status-pill approved">Registrada</span>
      </div>
      ${getEvolutionSummaryHtml(item)}
      <div class="admin-row-actions">
        <button class="mini-btn dark" type="button" data-download-evolution-pdf="${escapeHTML(item.id)}">Descargar PDF</button>
        <button class="mini-btn danger" type="button" data-delete-evolution="${escapeHTML(item.id)}">Eliminar</button>
      </div>
    </article>
  `).join('');
}

function printableText(value) {
  return escapeHTML(value || 'No registrado').replaceAll('\n', '<br>');
}

function printWindow(title, bodyHtml) {
  const html = `
    <!doctype html>
    <html lang="es-CL">
    <head>
      <meta charset="utf-8" />
      <title>${escapeHTML(title)}</title>
      <style>
        body{font-family:Arial,sans-serif;color:#172334;margin:32px;line-height:1.5}
        header{display:flex;justify-content:space-between;gap:24px;border-bottom:3px solid #003A78;padding-bottom:18px;margin-bottom:24px}
        h1{color:#003A78;margin:0;font-size:24px} h2{color:#003A78;margin-top:28px;font-size:18px}
        .muted{color:#667085}.box{border:1px solid #D9E5E5;border-radius:12px;padding:14px;margin:12px 0;background:#FAFCFC}
        .grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field strong{display:block;color:#002653;font-size:12px;text-transform:uppercase;letter-spacing:.06em}
        .footer{margin-top:32px;border-top:1px solid #D9E5E5;padding-top:12px;color:#667085;font-size:12px}
        .print-actions{position:sticky;top:0;background:#fff;border-bottom:1px solid #D9E5E5;padding:10px 0;margin-bottom:18px;display:flex;gap:10px;justify-content:flex-end}
        .print-actions button{border:0;border-radius:999px;background:#003A78;color:#fff;padding:10px 16px;font-weight:700;cursor:pointer}
        .signature-print{margin-top:36px;min-height:120px}.signature-line{border-top:1.5px solid #172334;margin:42px 0 8px;max-width:320px}
        @media print{body{margin:18mm}.print-actions{display:none}.no-print{display:none}}
      </style>
    </head>
    <body>
      <div class="print-actions"><button onclick="window.print()">Imprimir o guardar PDF</button></div>
      ${bodyHtml}
    </body>
    </html>
  `;
  const win = window.open('', '_blank', 'noopener,noreferrer');
  if (win) {
    win.document.open();
    win.document.write(html);
    win.document.close();
    win.focus();
    return;
  }
  const blob = new Blob([html], { type: 'text/html;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${title.replace(/[^a-z0-9áéíóúñü -]/gi, '').trim() || 'domus-salud'}.html`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 60000);
  alert('Tu navegador bloqueó la vista previa. Se descargó un archivo imprimible que puedes abrir y guardar como PDF.');
}

function pdfField(label, value) {
  return `<div class="field"><strong>${escapeHTML(label)}</strong>${printableText(value)}</div>`;
}

function pdfBox(title, value) {
  return `<h2>${escapeHTML(title)}</h2><div class="box">${printableText(value)}</div>`;
}

function procedureReportSection(evolution, professional) {
  return `
    <h2>Antecedentes generales</h2>
    <section class="box grid">
      ${pdfField('Diagnóstico principal', evolution.diagnosis)}
      ${pdfField('Edad del paciente', evolution.patientAge ? `${evolution.patientAge} años` : '')}
      ${pdfField('Alergias', `${evolution.allergies || ''}${evolution.allergies === 'Sí' && evolution.allergiesDetail ? ` · ${evolution.allergiesDetail}` : ''}`)}
      ${pdfField('Motivo de la visita', evolution.visitReason)}
    </section>
    <h2>Datos clínicos</h2>
    <section class="box grid">
      ${pdfField('Presenta orden médica / Epicrisis', evolution.medicalOrder)}
      ${pdfField('Procedimiento específico', evolution.specificProcedure)}
    </section>
    ${evolution.medicalOrder === 'Sí' ? pdfBox('Indicaciones de la orden médica / epicrisis', evolution.medicalOrderIndications) : ''}
    ${pdfBox('Detalle de visita y/o procedimiento', evolution.visitProcedureDetail)}
    ${pdfBox('Indicación médica / Plan de enfermería', evolution.nursingCarePlan)}
    ${signatureReportSection(evolution.signatureName || professionalFullName(professional), evolution.signatureRut || professional.rut, evolution.signatureType)}
  `;
}

function signatureReportSection(name, rut, type) {
  return `
    <section class="box signature-print">
      <strong>Firma profesional</strong>
      <div class="signature-line"></div>
      <p>${printableText(name)}</p>
      <p>RUT: ${printableText(rut)}</p>
      <p>Tipo de firma: ${printableText(type || 'Firma electrónica o manual')}</p>
    </section>
  `;
}

function newPatientVisitReportSection(evolution) {
  return `
    <h2>Formulario de nuevo paciente</h2>
    <h2>1. Antecedentes del paciente</h2>
    <section class="box grid">
      ${pdfField('Nombre del paciente', evolution.newPatientNameAuto)}
      ${pdfField('RUT del paciente', evolution.newPatientRutAuto)}
      ${pdfField('Diagnóstico principal', evolution.newDiagnosis)}
      ${pdfField('Motivo de ingreso', evolution.newAdmissionReason)}
      ${pdfField('Edad', evolution.newAge ? `${evolution.newAge} años` : '')}
      ${pdfField('Última epicrisis médica', evolution.newLastEpicrisis)}
      ${pdfField('Tabaco', `${evolution.newTobacco || ''}${evolution.newTobaccoAmount ? ` · ${evolution.newTobaccoAmount}` : ''}`)}
      ${pdfField('Alcohol', `${evolution.newAlcohol || ''}${evolution.newAlcoholFrequency ? ` · ${evolution.newAlcoholFrequency}` : ''}`)}
      ${pdfField('Drogas', `${evolution.newDrugs || ''}${evolution.newDrugsFrequency ? ` · ${evolution.newDrugsFrequency}` : ''}`)}
      ${pdfField('Alergias', `${evolution.newAllergies || ''}${evolution.newAllergiesDetail ? ` · ${evolution.newAllergiesDetail}` : ''}`)}
    </section>
    <h2>2. Antecedentes mórbidos / Tratamiento</h2>
    <section class="box grid">
      ${pdfField('HTA', `${evolution.newHTA || ''}${evolution.newHTAObs ? ` · ${evolution.newHTAObs}` : ''}`)}
      ${pdfField('Diabetes', `${evolution.newDiabetes || ''}${evolution.newDiabetesObs ? ` · ${evolution.newDiabetesObs}` : ''}`)}
      ${pdfField('Resistencia a la insulina', `${evolution.newInsulinResistance || ''}${evolution.newInsulinResistanceObs ? ` · ${evolution.newInsulinResistanceObs}` : ''}`)}
      ${pdfField('ACV / TIA / HIC', `${evolution.newACV || ''}${evolution.newACVObs ? ` · ${evolution.newACVObs}` : ''}`)}
      ${pdfField('CV - ICC', `${evolution.newICC || ''}${evolution.newICCObs ? ` · ${evolution.newICCObs}` : ''}`)}
      ${pdfField('CV - Cardiopatía coronaria', `${evolution.newCoronary || ''}${evolution.newCoronaryObs ? ` · ${evolution.newCoronaryObs}` : ''}`)}
      ${pdfField('CV - Arritmia', `${evolution.newArrhythmia || ''}${evolution.newArrhythmiaObs ? ` · ${evolution.newArrhythmiaObs}` : ''}`)}
      ${pdfField('LCFA', `${evolution.newLCFA || ''}${evolution.newLCFAObs ? ` · ${evolution.newLCFAObs}` : ''}`)}
      ${pdfField('Otros', `${evolution.newOtherMorbid || ''}${evolution.newOtherMorbidObs ? ` · ${evolution.newOtherMorbidObs}` : ''}`)}
    </section>
    <h2>3. Examen físico · Control de signos vitales</h2>
    <section class="box grid">
      ${pdfField('PA', evolution.newPa)}${pdfField('FR', evolution.newFr)}${pdfField('T°', evolution.newTemp)}${pdfField('PAM', evolution.newPam)}
      ${pdfField('SAT', evolution.newSat)}${pdfField('Dolor', evolution.newDolor)}${pdfField('FC', evolution.newFc)}${pdfField('FiO₂', evolution.newFio2)}
    </section>
    <h2>Examen físico segmentario</h2>
    <section class="box grid">
      ${pdfField('Conciencia', `${evolution.newConsciousness || ''}${evolution.newConsciousnessObs ? ` · ${evolution.newConsciousnessObs}` : ''}`)}
      ${pdfField('Pupilas', `${evolution.newPupils || ''}${evolution.newPupilsObs ? ` · ${evolution.newPupilsObs}` : ''}`)}
      ${pdfField('Act. Motora', `${evolution.newMotorActivity || ''}${evolution.newMotorActivityObs ? ` · ${evolution.newMotorActivityObs}` : ''}`)}
      ${pdfField('Piel y mucosas', `${evolution.newSkinMucosa || ''}${evolution.newPerfusionSeconds ? ` · Perfusión: ${evolution.newPerfusionSeconds} segundos` : ''}${evolution.newSkinMucosaObs ? ` · ${evolution.newSkinMucosaObs}` : ''}`)}
      ${pdfField('UPP', `${evolution.newUPP || ''}${evolution.newUPPLocation ? ` · Ubicación: ${evolution.newUPPLocation}` : ''}${evolution.newUPPDegree ? ` · Grado: ${evolution.newUPPDegree}` : ''}${evolution.newUPPObs ? ` · ${evolution.newUPPObs}` : ''}`)}
      ${pdfField('Respiración', `${evolution.newRespiration || ''}${evolution.newRespirationFio2 ? ` · FiO₂: ${evolution.newRespirationFio2}` : ''}${evolution.newEupneic ? ` · Eupneica: ${evolution.newEupneic}` : ''}${evolution.newRespirationObs ? ` · ${evolution.newRespirationObs}` : ''}`)}
      ${pdfField('Secreción bronquial', evolution.newBronchialSecretion)}
      ${pdfField('Abdomen', `${evolution.newAbdomen || ''}${evolution.newAbdomenObs ? ` · ${evolution.newAbdomenObs}` : ''}`)}
      ${pdfField('Sondas', `${evolution.newTubes || ''}${evolution.newTubeType ? ` · Tipo: ${evolution.newTubeType}` : ''}${evolution.newTubeLocation ? ` · Ubicación: ${evolution.newTubeLocation}` : ''}${evolution.newTubeDrain ? ` · Dren: ${evolution.newTubeDrain}` : ''}`)}
      ${pdfField('PICC - VVP - Catéter', `${evolution.newCatheter || ''}${evolution.newCatheterLocation ? ` · Ubicación: ${evolution.newCatheterLocation}` : ''}${evolution.newCatheterState ? ` · Estado: ${evolution.newCatheterState}` : ''}${evolution.newCatheterObs ? ` · ${evolution.newCatheterObs}` : ''}`)}
      ${pdfField('Extremidades', `${evolution.newExtremitiesMobility ? `Movilidad: ${evolution.newExtremitiesMobility}` : ''}${evolution.newExtremitiesAlterations ? ` · Alteraciones: ${evolution.newExtremitiesAlterations}` : ''}`)}
      ${pdfField('Orina / diuresis', `${evolution.newUrineType || ''}${evolution.newUrineTube ? ` · Sonda: ${evolution.newUrineTube}` : ''}${evolution.newUrineColor ? ` · Color: ${evolution.newUrineColor}` : ''}${evolution.newUrineDebit ? ` · Débito: ${evolution.newUrineDebit}` : ''}`)}
      ${pdfField('Deposiciones', `${evolution.newStoolsAmount || ''}${evolution.newStoolsQuality ? ` · Calidad: ${evolution.newStoolsQuality}` : ''}${evolution.newSphincterControl ? ` · Control esfínter: ${evolution.newSphincterControl}` : ''}${evolution.newStoolsObs ? ` · ${evolution.newStoolsObs}` : ''}`)}
      ${pdfField('Prótesis dental', `${evolution.newDentalProsthesis || ''}${evolution.newDentalProsthesisObs ? ` · ${evolution.newDentalProsthesisObs}` : ''}`)}
      ${pdfField('Prótesis auricular', `${evolution.newHearingProsthesis || ''}${evolution.newHearingProsthesisObs ? ` · ${evolution.newHearingProsthesisObs}` : ''}`)}
      ${pdfField('Usa lentes', `${evolution.newUsesGlasses || ''}${evolution.newUsesGlassesObs ? ` · ${evolution.newUsesGlassesObs}` : ''}`)}
      ${pdfField('Otros', evolution.newOtherPhysical)}
      ${pdfField('Riesgo de caídas', `${evolution.newFallRisk || ''}${evolution.newFallRiskCriticity ? ` · Criticidad: ${evolution.newFallRiskCriticity}` : ''}${evolution.newFallRiskObs ? ` · ${evolution.newFallRiskObs}` : ''}`)}
      ${pdfField('Riesgo de LPP', `${evolution.newLPPRisk || ''}${evolution.newLPPRiskObs ? ` · ${evolution.newLPPRiskObs}` : ''}`)}
    </section>
    ${pdfBox('4. Indicaciones médicas / Plan de enfermería', evolution.newMedicalIndicationsPlan)}
  `;
}

function followupVisitReportSection(evolution) {
  return `
    <h2>Formulario de seguimiento de paciente</h2>
    <h2>1. Antecedentes del paciente</h2>
    <section class="box grid">
      ${pdfField('Nombre del paciente', evolution.followPatientNameAuto)}
      ${pdfField('RUT del paciente', evolution.followPatientRutAuto)}
      ${pdfField('Motivo de ingreso', evolution.followAdmissionType)}
      ${pdfField('Edad', evolution.followAge ? `${evolution.followAge} años` : '')}
    </section>
    <h2>2. Examen físico · Control de signos vitales</h2>
    <section class="box grid">
      ${pdfField('PA', evolution.followPa)}${pdfField('FR', evolution.followFr)}${pdfField('T°', evolution.followTemp)}${pdfField('PAM', evolution.followPam)}
      ${pdfField('SAT', evolution.followSat)}${pdfField('Dolor', evolution.followDolor)}${pdfField('FC', evolution.followFc)}${pdfField('FiO₂', evolution.followFio2)}
    </section>
    <h2>Examen físico segmentario</h2>
    <section class="box grid">
      ${pdfField('Conciencia', `${evolution.followConsciousness || ''}${evolution.followConsciousnessObs ? ` · ${evolution.followConsciousnessObs}` : ''}`)}
      ${pdfField('Act. Motora', `${evolution.followMotorActivity || ''}${evolution.followMotorActivityObs ? ` · ${evolution.followMotorActivityObs}` : ''}`)}
      ${pdfField('Piel y mucosas', `${evolution.followSkinMucosa || ''}${evolution.followPerfusionSeconds ? ` · Perfusión: ${evolution.followPerfusionSeconds} segundos` : ''}${evolution.followSkinMucosaObs ? ` · ${evolution.followSkinMucosaObs}` : ''}`)}
      ${pdfField('UPP', `${evolution.followUPP || ''}${evolution.followUPPLocation ? ` · Ubicación: ${evolution.followUPPLocation}` : ''}${evolution.followUPPDegree ? ` · Grado: ${evolution.followUPPDegree}` : ''}${evolution.followUPPObs ? ` · ${evolution.followUPPObs}` : ''}`)}
      ${pdfField('Abdomen', `${evolution.followAbdomen || ''}${evolution.followAbdomenObs ? ` · ${evolution.followAbdomenObs}` : ''}`)}
      ${pdfField('Orina / diuresis', `${evolution.followUrineType || ''}${evolution.followUrineTube ? ` · Sonda: ${evolution.followUrineTube}` : ''}${evolution.followUrineColor ? ` · Color: ${evolution.followUrineColor}` : ''}${evolution.followUrineDebit ? ` · Débito: ${evolution.followUrineDebit}` : ''}`)}
      ${pdfField('Deposiciones', `${evolution.followStoolsAmount || ''}${evolution.followStoolsQuality ? ` · Calidad: ${evolution.followStoolsQuality}` : ''}${evolution.followSphincterControl ? ` · Control esfínter: ${evolution.followSphincterControl}` : ''}${evolution.followStoolsObs ? ` · ${evolution.followStoolsObs}` : ''}`)}
      ${pdfField('Dispositivos invasivos', `${evolution.followInvasiveDevices || ''}${evolution.followInvasiveDeviceType ? ` · Tipo: ${evolution.followInvasiveDeviceType}` : ''}${evolution.followInvasiveDeviceLocation ? ` · Ubicación: ${evolution.followInvasiveDeviceLocation}` : ''}`)}
      ${pdfField('Otros', evolution.followOtherPhysical)}
    </section>
    ${pdfBox('3. Detalle de la visita', evolution.followVisitDetail)}
    ${pdfBox('4. Indicaciones médicas / Plan de enfermería', evolution.followMedicalIndicationsPlan)}
  `;
}

function visitPatientReportSection(evolution, professional) {
  const body = evolution.visitFormMode === 'Seguimiento de paciente'
    ? followupVisitReportSection(evolution)
    : newPatientVisitReportSection(evolution);
  return `
    <h2>Datos de la visita</h2>
    <section class="box grid">
      ${pdfField('Tipo de visita', evolution.specificProcedure)}
      ${pdfField('Formulario', evolution.visitFormMode)}
    </section>
    ${body}
    ${signatureReportSection(evolution.visitSignatureName || professionalFullName(professional), evolution.visitSignatureRut || professional.rut, evolution.visitSignatureType)}
  `;
}

function evolutionReportHtml(evolution) {
  const patient = getPatientById(evolution.patientId) || {};
  const professional = getProfessionalById(evolution.professionalId) || {};
  const reportContent = isProcedureVisitType(evolution.visitType)
    ? procedureReportSection(evolution, professional)
    : isPatientVisitType(evolution.visitType)
      ? visitPatientReportSection(evolution, professional)
      : `
        ${pdfBox('Motivo u objetivo', evolution.objective)}
        ${pdfBox('Evolución clínica', evolution.evolution)}
        ${pdfBox('Procedimientos realizados', evolution.procedures)}
        ${pdfBox('Indicaciones y recomendaciones', evolution.indications)}
        ${pdfBox('Próximo control / observaciones', evolution.nextSteps)}
      `;

  return `
    <header>
      <div>
        <h1>Domus Salud · Evolución clínica</h1>
        <p class="muted">Cuidado clínico en tu hogar</p>
      </div>
      <div class="muted">Fecha de emisión: ${formatDateTime(new Date().toISOString())}</div>
    </header>
    <section class="box grid">
      ${pdfField('Paciente', patient.name)}
      ${pdfField('RUT/ID', patient.rut)}
      ${pdfField('Servicio', patient.service)}
      ${pdfField('Profesional', professionalFullName(professional))}
      ${pdfField('RUT profesional', professional.rut)}
      ${pdfField('Administrador supervisor', getProfessionalSupervisorName(professional))}
      ${pdfField('Fecha visita', formatDateTime(evolution.visitDate || evolution.createdAt))}
      ${pdfField('Tipo de atención', evolution.visitType)}
    </section>
    ${!isPatientVisitType(evolution.visitType) ? `
      <section class="box grid">
        ${pdfField('Presión arterial', evolution.bloodPressure)}
        ${pdfField('Frecuencia cardíaca', evolution.heartRate)}
        ${pdfField('SatO₂', evolution.oxygen)}
        ${pdfField('Dolor / EVA', evolution.pain)}
      </section>
    ` : ''}
    ${reportContent}
    <div class="footer">Documento generado desde el panel profesional de Domus Salud. Este registro debe ser resguardado conforme a los procedimientos internos y normativa aplicable.</div>
  `;
}

function downloadEvolutionPdf(evolutionId) {
  const evolution = getEvolutions().find((item) => item.id === evolutionId);
  if (!evolution) return;
  printWindow('Evolución clínica Domus Salud', evolutionReportHtml(evolution));
}

function downloadPatientHistoryPdf(patientId) {
  const patient = getPatientById(patientId);
  if (!patient) return;
  const professional = getProfessionalById(patient.professionalId) || {};
  const evolutions = getPatientEvolutions(patientId);
  const items = evolutions.length
    ? evolutions.map((evolution) => `<h2>${formatDateTime(evolution.visitDate || evolution.createdAt)} · ${printableText(evolution.visitType)}</h2>${evolutionReportHtml(evolution)}`).join('<div style="page-break-after:always"></div>')
    : '<div class="box">No existen evoluciones registradas para este paciente.</div>';
  printWindow(`Historial clínico ${patient.name}`, `
    <header>
      <div><h1>Domus Salud · Historial de paciente</h1><p class="muted">${printableText(patient.name)} · ${printableText(patient.service)}</p></div>
      <div class="muted">Profesional asignado: ${printableText(professionalFullName(professional))}<br>Administrador supervisor: ${printableText(getProfessionalSupervisorName(professional))}</div>
    </header>
    <section class="box"><strong>Antecedentes:</strong><br>${printableText(patient.notes)}</section>
    ${items}
  `);
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
    renderPatientsAdmin();
    renderAdminClinicalRecords();
    renderServiceProfessionalsAdmin();
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

function renderTeamAccessOptions(selectedId = '') {
  const box = $('[data-team-access-options]');
  if (!box) return;
  const selected = Array.isArray(selectedId) ? selectedId[0] : selectedId;
  box.innerHTML = '<option value="">Selecciona administrador supervisor</option>' + getTeamProfiles().map((member) => `
    <option value="${escapeHTML(member.id)}" ${member.id === selected ? 'selected' : ''}>${escapeHTML(member.name)}</option>
  `).join('');
}

function resetServiceProfessionalForm() {
  serviceProfessionalForm?.reset();
  if (serviceProfessionalForm?.elements.id) serviceProfessionalForm.elements.id.value = '';
  const today = new Date().toISOString().slice(0, 10);
  if (serviceProfessionalForm?.elements.entryDate) serviceProfessionalForm.elements.entryDate.value = today;
  renderTeamAccessOptions('');
  const message = $('[data-service-professional-message]');
  if (message) {
    message.textContent = '';
    message.classList.remove('error');
  }
}

function renderServiceProfessionalsAdmin() {
  renderTeamAccessOptions('');
  const list = $('[data-service-professionals-list]');
  if (!list) return;
  const professionals = getServiceProfessionals();
  if (!professionals.length) {
    list.innerHTML = '<div class="admin-row"><p>Aún no hay profesionales habilitados.</p></div>';
    return;
  }
  list.innerHTML = professionals.map((professional) => {
    const supervisorName = getProfessionalSupervisorName(professional);
    const linkedPatients = getPatients().filter((patient) => patient.professionalId === professional.id).length;
    return `
      <article class="admin-row" data-service-professional-id="${escapeHTML(professional.id)}">
        <div class="admin-row-header">
          <div>
            <strong>${escapeHTML(professionalFullName(professional))}</strong>
            <small>${escapeHTML(professional.profession || 'Profesión no indicada')}</small>
          </div>
          <span class="status-pill ${professional.active !== false ? 'approved' : 'inactive'}">${professional.active !== false ? 'Activo' : 'Inactivo'}</span>
        </div>
        <div class="professional-meta">
          <span><strong>RUT:</strong> ${escapeHTML(professional.rut || 'No indicado')}</span>
          <span><strong>Fecha nacimiento:</strong> ${escapeHTML(professional.birthDate || 'No indicada')}</span>
          <span><strong>Ingreso:</strong> ${escapeHTML(professional.entryDate || 'No indicado')} ${professional.endDate ? `· Término: ${escapeHTML(professional.endDate)}` : ''}</span>
          <span><strong>Usuario:</strong> ${escapeHTML(professional.username || '')} · <strong>Clave:</strong> ${escapeHTML(professional.password || '')}</span>
          <span><strong>Administrador supervisor:</strong> ${escapeHTML(supervisorName)}</span>
          <span><strong>Pacientes asignados:</strong> ${linkedPatients}</span>
        </div>
        ${professional.observations ? `<p><strong>Observaciones:</strong> ${escapeHTML(professional.observations)}</p>` : ''}
        <div class="admin-row-actions">
          <button class="mini-btn" type="button" data-edit-service-professional="${escapeHTML(professional.id)}">Editar</button>
          <button class="mini-btn danger" type="button" data-delete-service-professional="${escapeHTML(professional.id)}">Eliminar</button>
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



$('[data-reset-service-professional-form]')?.addEventListener('click', resetServiceProfessionalForm);

serviceProfessionalForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(serviceProfessionalForm);
  const id = (formData.get('id') || '').toString();
  const supervisorTeamId = (formData.get('supervisorTeamId') || '').toString().trim();
  const professional = {
    id: id || makeId('sp'),
    type: 'service',
    firstName: (formData.get('firstName') || '').toString().trim(),
    lastName: (formData.get('lastName') || '').toString().trim(),
    rut: (formData.get('rut') || '').toString().trim(),
    birthDate: (formData.get('birthDate') || '').toString(),
    profession: (formData.get('profession') || '').toString().trim(),
    entryDate: (formData.get('entryDate') || '').toString(),
    endDate: (formData.get('endDate') || '').toString(),
    observations: (formData.get('observations') || '').toString().trim(),
    username: (formData.get('username') || '').toString().trim(),
    password: (formData.get('password') || '').toString().trim(),
    active: (formData.get('active') || 'true') === 'true',
    supervisorTeamId,
    teamAccess: supervisorTeamId ? [supervisorTeamId] : [],
    updatedAt: new Date().toISOString()
  };
  const message = $('[data-service-professional-message]');
  if (!professional.firstName || !professional.lastName || !professional.rut || !professional.birthDate || !professional.profession || !professional.entryDate || !professional.username || !professional.password) return;
  if (!professional.supervisorTeamId) {
    if (message) {
      message.textContent = 'Debes seleccionar un administrador supervisor para este profesional y sus pacientes.';
      message.classList.add('error');
    }
    return;
  }
  let professionals = getServiceProfessionals();
  const duplicate = professionals.find((item) => normalizeText(item.username) === normalizeText(professional.username) && item.id !== id);
  if (duplicate) {
    if (message) {
      message.textContent = 'Ya existe un profesional habilitado con ese usuario.';
      message.classList.add('error');
    }
    return;
  }
  if (id) {
    professionals = professionals.map((item) => item.id === id ? { ...item, ...professional } : item);
  } else {
    professional.createdAt = new Date().toISOString();
    professionals.unshift(professional);
  }
  saveServiceProfessionals(professionals);
  resetServiceProfessionalForm();
  renderServiceProfessionalsAdmin();
  renderPatientsAdmin();
  renderProfessionalPatients();
  if (message) {
    message.textContent = 'Profesional habilitado guardado correctamente.';
    message.classList.remove('error');
  }
});

$('[data-service-professionals-list]')?.addEventListener('click', (event) => {
  const editId = event.target.closest?.('[data-edit-service-professional]')?.dataset.editServiceProfessional;
  const deleteId = event.target.closest?.('[data-delete-service-professional]')?.dataset.deleteServiceProfessional;
  let professionals = getServiceProfessionals();

  if (editId) {
    const professional = professionals.find((item) => item.id === editId);
    if (!professional || !serviceProfessionalForm) return;
    serviceProfessionalForm.elements.id.value = professional.id;
    serviceProfessionalForm.elements.firstName.value = professional.firstName || '';
    serviceProfessionalForm.elements.lastName.value = professional.lastName || '';
    serviceProfessionalForm.elements.rut.value = professional.rut || '';
    serviceProfessionalForm.elements.birthDate.value = professional.birthDate || '';
    serviceProfessionalForm.elements.profession.value = professional.profession || '';
    serviceProfessionalForm.elements.entryDate.value = professional.entryDate || '';
    serviceProfessionalForm.elements.endDate.value = professional.endDate || '';
    serviceProfessionalForm.elements.observations.value = professional.observations || '';
    serviceProfessionalForm.elements.username.value = professional.username || '';
    serviceProfessionalForm.elements.password.value = professional.password || '';
    serviceProfessionalForm.elements.active.value = String(professional.active !== false);
    renderTeamAccessOptions(professional.supervisorTeamId || professional.teamAccess?.[0] || '');
    serviceProfessionalForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (deleteId) {
    const professional = professionals.find((item) => item.id === deleteId);
    if (!professional) return;
    const linkedPatients = getPatients().filter((patient) => patient.professionalId === deleteId).length;
    if (linkedPatients) {
      alert('Este profesional tiene pacientes asignados. Reasigna o elimina esos pacientes antes de eliminar la habilitación.');
      return;
    }
    if (!confirm(`¿Eliminar la habilitación de ${professionalFullName(professional)}?`)) return;
    saveServiceProfessionals(professionals.filter((item) => item.id !== deleteId));
    renderServiceProfessionalsAdmin();
    renderPatientsAdmin();
  }
});

$('[data-admin-patient-search]')?.addEventListener('input', () => {
  renderPatientsAdmin();
});

$('[data-professional-patient-search]')?.addEventListener('input', () => {
  renderProfessionalPatients();
});

$('[data-admin-selected-patient-pdf]')?.addEventListener('click', (event) => {
  const id = event.currentTarget.dataset.adminSelectedPatientPdf || selectedAdminPatientId;
  if (id) downloadPatientHistoryPdf(id);
});

$('[data-admin-clinical-records]')?.addEventListener('click', (event) => {
  const pdfId = event.target.closest?.('[data-download-evolution-pdf]')?.dataset.downloadEvolutionPdf;
  if (pdfId) downloadEvolutionPdf(pdfId);
});

$('[data-visit-type-select]')?.addEventListener('change', () => {
  updateAttentionTypeUI();
});

$$('[data-allergies-radio], [data-medical-order-radio]').forEach((radio) => {
  radio.addEventListener('change', updateProcedureConditionalFields);
});

$$('[data-visit-form-mode], [data-visit-conditional]').forEach((input) => {
  input.addEventListener('change', updateVisitPatientFormUI);
});

$('[data-reset-patient-form]')?.addEventListener('click', resetPatientForm);

patientForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(patientForm);
  const id = (formData.get('id') || '').toString();
  const patient = {
    id: id || makeId('patient'),
    name: (formData.get('patientName') || '').toString().trim(),
    rut: (formData.get('rut') || '').toString().trim(),
    phone: (formData.get('phone') || '').toString().trim(),
    service: (formData.get('service') || '').toString().trim(),
    professionalId: (formData.get('professionalId') || '').toString().trim(),
    status: (formData.get('status') || 'Activo').toString(),
    notes: (formData.get('notes') || '').toString().trim(),
    updatedAt: new Date().toISOString()
  };
  const message = $('[data-patient-message]');
  if (!patient.name || !patient.service || !patient.professionalId) return;
  let patients = getPatients();
  if (id) {
    patients = patients.map((item) => item.id === id ? { ...item, ...patient } : item);
  } else {
    patient.createdAt = new Date().toISOString();
    patients.unshift(patient);
  }
  savePatients(patients);
  resetPatientForm();
  renderPatientsAdmin();
  renderProfessionalPatients();
  if (message) message.textContent = 'Paciente guardado y asignado correctamente.';
});

$('[data-patients-list]')?.addEventListener('click', (event) => {
  const editId = event.target.closest?.('[data-edit-patient]')?.dataset.editPatient;
  const deleteId = event.target.closest?.('[data-delete-patient]')?.dataset.deletePatient;
  const pdfId = event.target.closest?.('[data-admin-patient-pdf]')?.dataset.adminPatientPdf;
  const recordId = event.target.closest?.('[data-view-patient-record]')?.dataset.viewPatientRecord;

  if (editId) {
    const patient = getPatientById(editId);
    if (!patient || !patientForm) return;
    patientForm.elements.id.value = patient.id;
    patientForm.elements.patientName.value = patient.name || '';
    patientForm.elements.rut.value = patient.rut || '';
    patientForm.elements.phone.value = patient.phone || '';
    patientForm.elements.service.value = patient.service || '';
    fillProfessionalSelect(patientForm.querySelector('[data-patient-professional-select]'), patient.professionalId || '');
    patientForm.elements.professionalId.value = patient.professionalId || '';
    patientForm.elements.status.value = patient.status || 'Activo';
    patientForm.elements.notes.value = patient.notes || '';
    patientForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (deleteId) {
    const patient = getPatientById(deleteId);
    if (!patient) return;
    if (!confirm(`¿Eliminar a ${patient.name} y sus evoluciones registradas?`)) return;
    savePatients(getPatients().filter((item) => item.id !== deleteId));
    saveEvolutions(getEvolutions().filter((item) => item.patientId !== deleteId));
    renderPatientsAdmin();
    renderProfessionalPatients();
  }

  if (recordId) renderAdminClinicalRecords(recordId);
  if (pdfId) downloadPatientHistoryPdf(pdfId);
});

$$('[data-professional-open]').forEach((button) => button.addEventListener('click', openProfessional));
$$('[data-professional-close]').forEach((button) => button.addEventListener('click', closeProfessional));
$('[data-professional-logout]')?.addEventListener('click', () => {
  setCurrentProfessional(null);
  selectedProfessionalPatientId = null;
  renderProfessionalState();
});

professionalLoginForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(professionalLoginForm);
  const username = (formData.get('username') || '').toString().trim();
  const password = (formData.get('password') || '').toString();
  const professional = getProfessionals().find((candidate) => candidate.active !== false && normalizeText(candidate.username) === normalizeText(username) && candidate.password === password);
  const message = $('[data-professional-login-message]');

  if (!professional) {
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
  setCurrentProfessional(professional);
  professionalLoginForm.reset();
  renderProfessionalState();
});

$('[data-professional-patients]')?.addEventListener('click', (event) => {
  const patientId = event.target.closest?.('[data-select-professional-patient]')?.dataset.selectProfessionalPatient;
  if (patientId) selectProfessionalPatient(patientId);
});

$('[data-reset-evolution-form]')?.addEventListener('click', resetEvolutionForm);

evolutionForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const current = getCurrentProfessional();
  if (!current) return;
  const formData = new FormData(evolutionForm);
  const patientId = (formData.get('patientId') || '').toString();
  const patient = getPatientById(patientId);
  if (!patient) return;
  const evolution = {
    id: makeId('evolution'),
    patientId,
    professionalId: current.id,
    visitDate: (formData.get('visitDate') || '').toString(),
    visitType: (formData.get('visitType') || '').toString(),
    specificProcedure: (formData.get('specificProcedure') || '').toString().trim(),
    bloodPressure: (formData.get('bloodPressure') || '').toString().trim(),
    heartRate: (formData.get('heartRate') || '').toString().trim(),
    oxygen: (formData.get('oxygen') || '').toString().trim(),
    pain: (formData.get('pain') || '').toString().trim(),
    diagnosis: (formData.get('diagnosis') || '').toString().trim(),
    patientAge: (formData.get('patientAge') || '').toString().trim(),
    visitReason: (formData.get('visitReason') || '').toString().trim(),
    allergies: (formData.get('allergies') || '').toString().trim(),
    allergiesDetail: (formData.get('allergiesDetail') || '').toString().trim(),
    medicalOrder: (formData.get('medicalOrder') || '').toString().trim(),
    medicalOrderIndications: (formData.get('medicalOrderIndications') || '').toString().trim(),
    visitProcedureDetail: (formData.get('visitProcedureDetail') || '').toString().trim(),
    nursingCarePlan: (formData.get('nursingCarePlan') || '').toString().trim(),
    signatureName: (formData.get('signatureName') || '').toString().trim(),
    signatureRut: (formData.get('signatureRut') || '').toString().trim(),
    signatureType: (formData.get('signatureType') || '').toString().trim(),
    objective: (formData.get('objective') || '').toString().trim(),
    evolution: (formData.get('evolution') || '').toString().trim(),
    procedures: (formData.get('procedures') || '').toString().trim(),
    indications: (formData.get('indications') || '').toString().trim(),
    nextSteps: (formData.get('nextSteps') || '').toString().trim(),
    ...collectVisitPatientData(formData),
    createdAt: new Date().toISOString()
  };
  if (!evolution.visitDate || !evolution.visitType) return;
  if (!validateWordLimitFields(evolutionForm)) return;

  if (isProcedureVisitType(evolution.visitType)) {
    if (!evolution.specificProcedure) {
      alert('Debes seleccionar el procedimiento específico.');
      return;
    }
    if (!evolution.diagnosis || !evolution.visitReason || !evolution.patientAge || !evolution.allergies || !evolution.medicalOrder || !evolution.visitProcedureDetail || !evolution.nursingCarePlan || !evolution.signatureName || !evolution.signatureRut) {
      alert('Completa todos los campos principales del formato de procedimiento antes de guardar.');
      return;
    }
    if (evolution.allergies === 'Sí' && !evolution.allergiesDetail) {
      alert('Indica cuáles son las alergias del paciente.');
      return;
    }
    if (evolution.medicalOrder === 'Sí' && !evolution.medicalOrderIndications) {
      alert('Señala las indicaciones de la orden médica / epicrisis.');
      return;
    }
    evolution.objective = evolution.visitReason;
    evolution.evolution = evolution.visitProcedureDetail;
    evolution.procedures = evolution.specificProcedure;
    evolution.indications = evolution.nursingCarePlan;
  } else if (isPatientVisitType(evolution.visitType)) {
    if (!evolution.specificProcedure) {
      alert('Debes seleccionar el tipo de visita.');
      return;
    }
    if (!evolution.visitFormMode) {
      alert('Debes marcar si corresponde a nuevo paciente o seguimiento de paciente.');
      return;
    }
    if (evolution.visitFormMode === 'Nuevo paciente') {
      if (!evolution.newDiagnosis || !evolution.newAdmissionReason || !evolution.newAge) {
        alert('Completa diagnóstico principal, motivo de ingreso y edad del nuevo paciente antes de guardar.');
        return;
      }
      if (evolution.newAllergies === 'Sí' && !evolution.newAllergiesDetail) {
        alert('Indica cuáles son las alergias del paciente.');
        return;
      }
      evolution.objective = evolution.newAdmissionReason;
      evolution.evolution = evolution.newDiagnosis;
      evolution.procedures = evolution.specificProcedure;
      evolution.indications = evolution.newMedicalIndicationsPlan;
    } else {
      if (!evolution.followAdmissionType || !evolution.followVisitDetail) {
        alert('Completa motivo de ingreso y detalle de la visita de seguimiento antes de guardar.');
        return;
      }
      evolution.objective = evolution.followAdmissionType;
      evolution.evolution = evolution.followVisitDetail;
      evolution.procedures = evolution.specificProcedure;
      evolution.indications = evolution.followMedicalIndicationsPlan;
    }
  } else if (!evolution.objective || !evolution.evolution) {
    alert('Completa el motivo y la evolución clínica antes de guardar.');
    return;
  }
  saveEvolutions([evolution, ...getEvolutions()]);
  const message = $('[data-evolution-message]');
  resetEvolutionForm();
  renderEvolutionHistory(patientId);
  renderProfessionalPatients();
  renderPatientsAdmin();
  if (message) message.textContent = 'Evolución guardada correctamente.';
});

$('[data-evolution-list]')?.addEventListener('click', (event) => {
  const pdfId = event.target.closest?.('[data-download-evolution-pdf]')?.dataset.downloadEvolutionPdf;
  const deleteId = event.target.closest?.('[data-delete-evolution]')?.dataset.deleteEvolution;
  if (pdfId) downloadEvolutionPdf(pdfId);
  if (deleteId) {
    if (!confirm('¿Eliminar esta evolución clínica?')) return;
    const deleted = getEvolutions().find((item) => item.id === deleteId);
    saveEvolutions(getEvolutions().filter((item) => item.id !== deleteId));
    if (deleted) renderEvolutionHistory(deleted.patientId);
    renderProfessionalPatients();
    renderPatientsAdmin();
  }
});

$('[data-download-patient-pdf]')?.addEventListener('click', () => {
  if (selectedProfessionalPatientId) downloadPatientHistoryPdf(selectedProfessionalPatientId);
});

document.addEventListener('keydown', (event) => {
  if (event.key === 'Escape' && professionalShell && !professionalShell.hidden) closeProfessional();
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
  if (event.key === DOMUS_STORAGE_KEYS.patients || event.key === DOMUS_STORAGE_KEYS.evolutions) {
    renderPatientsAdmin();
    renderProfessionalPatients();
  }
});

applySlideImages();
renderTeamAccessOptions('');
updateAttentionTypeUI();
renderServiceProfessionalsAdmin();
renderPublicTeam();
renderPublicTestimonials();

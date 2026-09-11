// Domus Salud - configuración rápida
// Reemplaza estos datos por los contactos reales antes de publicar.
const DOMUS_CONFIG = {
  whatsappNumber: '56950257518',
  contactEmail: 'contacto@domusalud.cl'
};

// Conexión a Supabase.
// Desde esta versión, los datos operativos de pacientes, profesionales, evoluciones,
// testimonios, equipo, slides y métricas se centralizan en Supabase.
// localStorage ya no se usa como base de datos; solo sessionStorage para la sesión temporal.
const DOMUS_DB = window.domusSupabase || null;
const hasSupabase = () => Boolean(DOMUS_DB && typeof DOMUS_DB.from === 'function');

function disabledButton(button, disabled = true, label = null) {
  if (!button) return;
  if (!button.dataset.originalText) button.dataset.originalText = button.textContent || '';
  button.disabled = Boolean(disabled);
  button.setAttribute('aria-busy', disabled ? 'true' : 'false');
  if (disabled) button.textContent = label || 'Procesando...';
  else button.textContent = button.dataset.originalText || button.textContent || 'Enviar';
}

// Versión de recursos para evitar que celulares o navegadores mantengan fotos antiguas en caché.
const DOMUS_ASSET_VERSION = '2026-09-11-ficha-persistente-v1';

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
// Modo administrador y datos centralizados
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
  evolutions: 'domus_evolutions_v1',
  patientIntakeTemplate: 'domus_patient_intake_template_v1',
  patientIntakeResponses: 'domus_patient_intake_responses_v1'
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


const DEFAULT_PATIENT_INTAKE_TEMPLATE = {
  intro: 'Completa todos los campos antes del inicio del servicio para que el equipo de Domus Salud pueda preparar mejor la atención. Si algún dato no aplica, escribe “No aplica”.',
  questions: []
};

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

// =====================================================
// Estado centralizado en Supabase
// =====================================================
const DOMUS_STATE_TABLE = 'domus_app_state';
const DOMUS_SESSION_KEYS = new Set([
  DOMUS_STORAGE_KEYS.session,
  DOMUS_STORAGE_KEYS.professionalSession
]);

const DOMUS_CORE_STATE_KEYS = [
  DOMUS_STORAGE_KEYS.admins,
  DOMUS_STORAGE_KEYS.stats,
  DOMUS_STORAGE_KEYS.leads,
  DOMUS_STORAGE_KEYS.testimonials,
  DOMUS_STORAGE_KEYS.slides,
  DOMUS_STORAGE_KEYS.team,
  DOMUS_STORAGE_KEYS.serviceProfessionals,
  DOMUS_STORAGE_KEYS.patients,
  DOMUS_STORAGE_KEYS.evolutions,
  DOMUS_STORAGE_KEYS.patientIntakeTemplate,
  DOMUS_STORAGE_KEYS.patientIntakeResponses
];

const DOMUS_STATE_CACHE = {};
let domusCentralStateLoaded = false;
let domusCentralStateLoading = null;

function getDefaultStorageValue(key, fallback = null) {
  switch (key) {
    case DOMUS_STORAGE_KEYS.admins:
      return DEFAULT_ADMIN_USERS.map((item) => ({ ...item }));
    case DOMUS_STORAGE_KEYS.stats:
      return { visits: 0, clicks: 0, submissions: 0, clickEvents: [] };
    case DOMUS_STORAGE_KEYS.leads:
    case DOMUS_STORAGE_KEYS.testimonials:
    case DOMUS_STORAGE_KEYS.patients:
    case DOMUS_STORAGE_KEYS.evolutions:
    case DOMUS_STORAGE_KEYS.patientIntakeResponses:
      return [];
    case DOMUS_STORAGE_KEYS.slides:
      return {};
    case DOMUS_STORAGE_KEYS.team:
      return DEFAULT_TEAM_PROFILES.map((item) => ({ ...item }));
    case DOMUS_STORAGE_KEYS.serviceProfessionals:
      return DEFAULT_SERVICE_PROFESSIONALS.map((item) => ({ ...item, teamAccess: [...(item.teamAccess || [])] }));
    case DOMUS_STORAGE_KEYS.patientIntakeTemplate:
      return { ...DEFAULT_PATIENT_INTAKE_TEMPLATE, questions: [] };
    default:
      return fallback;
  }
}

function cloneStateValue(value) {
  try {
    return structuredClone(value);
  } catch (_) {
    return JSON.parse(JSON.stringify(value));
  }
}

function ensureCacheKey(key, fallback = null) {
  if (!(key in DOMUS_STATE_CACHE)) {
    DOMUS_STATE_CACHE[key] = cloneStateValue(getDefaultStorageValue(key, fallback));
  }
  return DOMUS_STATE_CACHE[key];
}

function storageGet(key, fallback) {
  if (DOMUS_SESSION_KEYS.has(key)) {
    try {
      const raw = window.sessionStorage.getItem(key);
      return raw ? safeParse(raw, fallback) : fallback;
    } catch (_) {
      return fallback;
    }
  }

  const value = ensureCacheKey(key, fallback);
  return value ?? fallback;
}

async function syncStateKeyToSupabase(key, value) {
  if (!hasSupabase() || DOMUS_SESSION_KEYS.has(key) || !DOMUS_CORE_STATE_KEYS.includes(key)) return false;

  const { error } = await DOMUS_DB.from(DOMUS_STATE_TABLE).upsert({
    key,
    payload: value,
    updated_at: new Date().toISOString()
  }, { onConflict: 'key' });

  if (error) {
    console.error(`No se pudo sincronizar ${key} en Supabase:`, error.message || error);
    return false;
  }
  return true;
}

async function persistCachedStateKey(key) {
  if (DOMUS_SESSION_KEYS.has(key) || !DOMUS_CORE_STATE_KEYS.includes(key)) return true;
  const value = ensureCacheKey(key, getDefaultStorageValue(key, null));
  return syncStateKeyToSupabase(key, value);
}

function storageSet(key, value) {
  if (DOMUS_SESSION_KEYS.has(key)) {
    try {
      window.sessionStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch (error) {
      console.warn('No se pudo guardar la sesión temporal:', error);
      return false;
    }
  }

  DOMUS_STATE_CACHE[key] = cloneStateValue(value);
  syncStateKeyToSupabase(key, DOMUS_STATE_CACHE[key]);
  return true;
}

async function loadDomusCentralState() {
  if (domusCentralStateLoading) return domusCentralStateLoading;

  domusCentralStateLoading = (async () => {
    DOMUS_CORE_STATE_KEYS.forEach((key) => ensureCacheKey(key, null));

    if (!hasSupabase()) {
      domusCentralStateLoaded = true;
      console.error('Supabase no está disponible. Los datos clínicos no se sincronizarán hasta corregir js/supabase-config.js.');
      return false;
    }

    const { data, error } = await DOMUS_DB.from(DOMUS_STATE_TABLE)
      .select('key,payload')
      .in('key', DOMUS_CORE_STATE_KEYS);

    if (error) {
      console.error('No se pudo cargar el estado central desde Supabase:', error.message || error);
      domusCentralStateLoaded = true;
      return false;
    }

    const rowsByKey = new Map((data || []).map((row) => [row.key, row.payload]));
    const missingRows = [];

    DOMUS_CORE_STATE_KEYS.forEach((key) => {
      if (rowsByKey.has(key)) {
        DOMUS_STATE_CACHE[key] = rowsByKey.get(key) ?? getDefaultStorageValue(key, null);
      } else {
        const defaultValue = getDefaultStorageValue(key, null);
        DOMUS_STATE_CACHE[key] = cloneStateValue(defaultValue);
        missingRows.push({ key, payload: defaultValue, updated_at: new Date().toISOString() });
      }
    });

    if (missingRows.length) {
      const { error: seedError } = await DOMUS_DB.from(DOMUS_STATE_TABLE).upsert(missingRows, { onConflict: 'key' });
      if (seedError) console.warn('No se pudieron crear algunos registros base en Supabase:', seedError.message || seedError);
    }

    domusCentralStateLoaded = true;
    return true;
  })();

  return domusCentralStateLoading;
}

async function refreshDomusCentralState() {
  domusCentralStateLoading = null;
  return loadDomusCentralState();
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

// =====================================================
// Analítica real en Supabase
// =====================================================
const DOMUS_ANALYTICS_TABLE = 'analytics_events';
const DOMUS_ANALYTICS_SESSION_KEY = 'domus_public_analytics_session_v1';
const DOMUS_ANALYTICS_VISITOR_KEY = 'domus_public_analytics_visitor_v1';
const DOMUS_INTERNAL_VISITOR_KEY = 'domus_internal_user_v1';
let analyticsDashboardRequest = 0;
let publicVisitTimer = null;

function getOrCreateBrowserId(key, prefix) {
  try {
    const storage = key === DOMUS_ANALYTICS_SESSION_KEY ? window.sessionStorage : window.localStorage;
    let value = storage.getItem(key);
    if (!value) {
      value = makeId(prefix);
      storage.setItem(key, value);
    }
    return value;
  } catch (_) {
    return makeId(prefix);
  }
}

function getAnalyticsSessionId() {
  return getOrCreateBrowserId(DOMUS_ANALYTICS_SESSION_KEY, 'session');
}

function getAnalyticsVisitorId() {
  return getOrCreateBrowserId(DOMUS_ANALYTICS_VISITOR_KEY, 'visitor');
}

function markInternalVisitor(type = 'admin') {
  try {
    window.localStorage.setItem(DOMUS_INTERNAL_VISITOR_KEY, JSON.stringify({ type, markedAt: new Date().toISOString() }));
  } catch (_) {
    // No es crítico si el navegador bloquea localStorage.
  }
}

function hasInternalVisitorMarker() {
  try {
    return Boolean(window.localStorage.getItem(DOMUS_INTERNAL_VISITOR_KEY));
  } catch (_) {
    return false;
  }
}

function isPatientIntakeMode() {
  try {
    return new URLSearchParams(window.location.search).get('formulario') === 'paciente';
  } catch (_) {
    return false;
  }
}

function shouldTrackPublicAnalytics() {
  return !isPatientIntakeMode() && !getCurrentAdmin() && !getCurrentProfessional() && !hasInternalVisitorMarker();
}

function getDeviceType() {
  const width = window.innerWidth || 1200;
  if (width < 768) return 'mobile';
  if (width < 1024) return 'tablet';
  return 'desktop';
}

function getAnalyticsPagePath() {
  return window.location.pathname || '/';
}

function baseAnalyticsPayload(audience = 'public') {
  const admin = getCurrentAdmin();
  const professional = getCurrentProfessional();
  return {
    audience,
    page_path: getAnalyticsPagePath(),
    referrer: document.referrer ? document.referrer.slice(0, 450) : null,
    device_type: getDeviceType(),
    session_id: getAnalyticsSessionId(),
    visitor_id: audience === 'public' || audience === 'patient' ? getAnalyticsVisitorId() : null,
    admin_user_id: audience === 'admin' && admin ? admin.id : null,
    admin_username: audience === 'admin' && admin ? admin.username : null,
    professional_id: audience === 'professional' && professional ? professional.id : null,
    professional_username: audience === 'professional' && professional ? professional.username : null
  };
}

async function recordAnalyticsEvent({ audience = 'public', eventType = 'click', eventLabel = 'Evento', eventTarget = '', section = '', metadata = {} } = {}) {
  if (!hasSupabase()) return false;
  if (audience === 'public' && !shouldTrackPublicAnalytics()) return false;

  const payload = {
    ...baseAnalyticsPayload(audience),
    event_type: eventType,
    event_label: String(eventLabel || eventType).slice(0, 180),
    event_target: String(eventTarget || '').slice(0, 180),
    section: String(section || '').slice(0, 120),
    metadata: metadata && typeof metadata === 'object' ? metadata : {}
  };

  const { error } = await DOMUS_DB.from(DOMUS_ANALYTICS_TABLE).insert(payload);
  if (error) {
    console.warn('No se pudo registrar analítica en Supabase:', error.message || error);
    return false;
  }
  return true;
}

async function recordDomusVisit() {
  if (!shouldTrackPublicAnalytics()) return;
  try {
    if (window.sessionStorage.getItem('domus_public_visit_recorded')) return;
    window.sessionStorage.setItem('domus_public_visit_recorded', '1');
  } catch (_) {
    // Si sessionStorage no está disponible, de todas formas registra el ingreso.
  }

  const ok = await recordAnalyticsEvent({
    audience: 'public',
    eventType: 'page_view',
    eventLabel: 'Ingreso a página pública',
    eventTarget: 'home',
    section: 'landing',
    metadata: { title: document.title || 'Domus Salud' }
  });

  if (ok) {
    const stats = getStats();
    stats.visits = Number(stats.visits || 0) + 1;
    saveStats(stats);
  }
}

function scheduleDomusVisit() {
  window.clearTimeout(publicVisitTimer);
  publicVisitTimer = window.setTimeout(() => {
    recordDomusVisit();
  }, 1800);
}

async function recordDomusClick(label = 'Clic', element = null) {
  const normalizedLabel = label || 'Clic';
  const target = element?.getAttribute?.('href') || element?.dataset?.trackTarget || element?.tagName || '';
  const section = element?.closest?.('section')?.id || element?.closest?.('[data-admin-view]')?.dataset?.adminView || '';

  const ok = await recordAnalyticsEvent({
    audience: 'public',
    eventType: 'click',
    eventLabel: normalizedLabel,
    eventTarget: target,
    section,
    metadata: {
      text: (element?.textContent || '').trim().slice(0, 140),
      isWhatsapp: normalizeText(normalizedLabel).includes('whatsapp') || String(target).includes('wa.me')
    }
  });

  if (ok) {
    const stats = getStats();
    stats.clicks = Number(stats.clicks || 0) + 1;
    stats.clickEvents = [
      { label: normalizedLabel, date: new Date().toISOString() },
      ...(Array.isArray(stats.clickEvents) ? stats.clickEvents : [])
    ].slice(0, 60);
    saveStats(stats);
    renderAdminDashboard();
  }
}

async function recordAdminLoginAnalytics(user) {
  markInternalVisitor('admin');
  await recordAnalyticsEvent({
    audience: 'admin',
    eventType: 'admin_login',
    eventLabel: `Ingreso administrador: ${user?.name || user?.username || 'Administrador'}`,
    eventTarget: user?.username || '',
    section: 'admin',
    metadata: { adminName: user?.name || '', username: user?.username || '' }
  });
}

async function recordProfessionalLoginAnalytics(professional) {
  markInternalVisitor('professional');
  await recordAnalyticsEvent({
    audience: 'professional',
    eventType: 'professional_login',
    eventLabel: `Ingreso profesional: ${professionalFullName(professional)}`,
    eventTarget: professional?.username || '',
    section: 'professional',
    metadata: { profession: professional?.profession || '' }
  });
}

async function recordPatientFormOpenAnalytics() {
  await recordAnalyticsEvent({
    audience: 'patient',
    eventType: 'patient_form_open',
    eventLabel: 'Formulario previo abierto por paciente',
    eventTarget: 'patient_intake_form',
    section: 'patient_intake',
    metadata: { containsClinicalData: false }
  });
}

async function recordPatientFormSubmitAnalytics() {
  await recordAnalyticsEvent({
    audience: 'patient',
    eventType: 'patient_form_submit',
    eventLabel: 'Formulario previo enviado por paciente',
    eventTarget: 'patient_intake_form',
    section: 'patient_intake',
    metadata: { containsClinicalData: false }
  });
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

    await recordAnalyticsEvent({
      audience: 'public',
      eventType: 'contact_submit',
      eventLabel: 'Solicitud de evaluación enviada',
      eventTarget: 'contact_form',
      section: 'contacto',
      metadata: {
        service: data.service || 'No indicado',
        region: data.region || 'No indicada',
        commune: data.commune || 'No indicada'
      }
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

function uniqueValues(items, field) {
  return new Set(items.map((item) => item?.[field]).filter(Boolean));
}

function daysAgoIso(days = 30) {
  const date = new Date();
  date.setDate(date.getDate() - days);
  return date.toISOString();
}

async function fetchAnalyticsEvents(days = 30) {
  if (!hasSupabase()) return [];
  const { data, error } = await DOMUS_DB.from(DOMUS_ANALYTICS_TABLE)
    .select('audience,event_type,event_label,event_target,section,session_id,visitor_id,admin_username,professional_username,device_type,page_path,created_at')
    .gte('created_at', daysAgoIso(days))
    .order('created_at', { ascending: false })
    .limit(2500);
  if (error) {
    console.warn('No se pudieron cargar métricas reales:', error.message || error);
    return [];
  }
  return Array.isArray(data) ? data : [];
}

function countEvents(events, type) {
  return events.filter((event) => event.event_type === type).length;
}

function countMatchingEvents(events, predicate) {
  return events.filter(predicate).length;
}

function topAnalyticsLabels(events, limit = 6) {
  const counter = new Map();
  events.forEach((event) => {
    const label = event.event_label || event.event_type || 'Evento sin nombre';
    counter.set(label, (counter.get(label) || 0) + 1);
  });
  return [...counter.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([label, count]) => ({ label, count }));
}

function renderSimpleAnalyticsList(selector, items, emptyText) {
  const container = $(selector);
  if (!container) return;
  if (!items.length) {
    container.innerHTML = `<div class="admin-row"><p>${escapeHTML(emptyText)}</p></div>`;
    return;
  }
  container.innerHTML = items.join('');
}

async function renderAnalyticsDashboard() {
  const requestId = ++analyticsDashboardRequest;
  const status = $('[data-analytics-summary-message]');
  if (status) status.textContent = 'Cargando métricas reales desde Supabase...';

  const events = await fetchAnalyticsEvents(30);
  if (requestId !== analyticsDashboardRequest) return;

  const publicEvents = events.filter((event) => event.audience === 'public' || event.audience === 'patient');
  const adminEvents = events.filter((event) => event.audience === 'admin');
  const clickEvents = publicEvents.filter((event) => event.event_type === 'click');
  const adminUsers = getAdminUsers();
  const adminLogins = adminEvents.filter((event) => event.event_type === 'admin_login');
  const whatsappClicks = countMatchingEvents(clickEvents, (event) =>
    normalizeText(event.event_label || '').includes('whatsapp') || normalizeText(event.event_target || '').includes('whatsapp')
  );

  const statMap = {
    visits: countEvents(publicEvents, 'page_view'),
    sessions: uniqueValues(publicEvents, 'session_id').size,
    clicks: clickEvents.length,
    submissions: countEvents(publicEvents, 'contact_submit'),
    whatsapp: whatsappClicks,
    patientForms: countEvents(publicEvents, 'patient_form_submit')
  };

  Object.entries(statMap).forEach(([key, value]) => {
    const el = $(`[data-stat="${key}"]`);
    if (el) el.textContent = Number(value || 0).toLocaleString('es-CL');
  });

  const adminMap = {
    configured: adminUsers.length,
    adminLogins: adminLogins.length,
    activeAdmins: uniqueValues(adminLogins, 'admin_username').size
  };

  Object.entries(adminMap).forEach(([key, value]) => {
    const el = $(`[data-admin-metric="${key}"]`);
    if (el) el.textContent = Number(value || 0).toLocaleString('es-CL');
  });

  const topClicks = topAnalyticsLabels(clickEvents, 8).map((item) => `
    <article class="admin-row analytics-row compact">
      <div class="admin-row-header">
        <div><strong>${escapeHTML(item.label)}</strong><small>Clics registrados últimos 30 días</small></div>
        <span class="status-pill approved">${Number(item.count).toLocaleString('es-CL')}</span>
      </div>
    </article>
  `);
  renderSimpleAnalyticsList('[data-top-clicks-list]', topClicks, 'Aún no hay clics públicos registrados.');

  const latestPublicEvents = publicEvents.slice(0, 8).map((event) => `
    <article class="admin-row analytics-row compact">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(event.event_label || event.event_type)}</strong>
          <small>${formatDateTime(event.created_at)} · ${escapeHTML(event.device_type || 'dispositivo no indicado')}</small>
        </div>
        <span class="status-pill">${escapeHTML(event.audience === 'patient' ? 'Paciente' : 'Público')}</span>
      </div>
    </article>
  `);
  renderSimpleAnalyticsList('[data-public-events-list]', latestPublicEvents, 'Aún no hay eventos públicos registrados.');

  const adminActivity = adminLogins.slice(0, 5).map((event) => `
    <article class="admin-row analytics-row compact">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(event.admin_username || 'Administrador')}</strong>
          <small>${formatDateTime(event.created_at)}</small>
        </div>
        <span class="status-pill approved">Ingreso</span>
      </div>
    </article>
  `);
  renderSimpleAnalyticsList('[data-admin-activity-list]', adminActivity, 'Aún no hay ingresos de administradores registrados.');

  if (status) {
    status.textContent = `Métricas reales de los últimos 30 días. No se almacenan RUT, diagnósticos ni datos clínicos en esta tabla.`;
  }
}

// La visita se registra después de cargar el estado centralizado.

document.addEventListener('click', (event) => {
  const tracked = event.target.closest?.('[data-track-click]');
  if (tracked) recordDomusClick(tracked.dataset.trackClick || tracked.textContent.trim(), tracked);
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
  else window.sessionStorage.removeItem(DOMUS_STORAGE_KEYS.session);
}

const adminShell = $('[data-admin-shell]');
const adminLogin = $('[data-admin-login]');
const adminApp = $('[data-admin-app]');
const adminLoginForm = $('#adminLoginForm');
const adminUserForm = $('#adminUserForm');
const testimonialForm = $('#testimonialForm');
const patientForm = $('#patientForm');
const patientIntakeTemplateForm = $('#patientIntakeTemplateForm');
const patientIntakeForm = $('#patientIntakeForm');
const patientIntakeShell = $('[data-patient-intake-shell]');
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
  markInternalVisitor('admin');
  adminShell.hidden = false;
  document.body.classList.add('admin-open');
  renderAdminState();
}

function closeAdmin() {
  if (!adminShell) return;
  adminShell.hidden = true;
  adminShell.classList.remove('is-authenticated');
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


function getPatientIntakeTemplate() {
  const saved = storageGet(DOMUS_STORAGE_KEYS.patientIntakeTemplate, null);
  return {
    intro: saved?.intro || DEFAULT_PATIENT_INTAKE_TEMPLATE.intro,
    questions: []
  };
}
function savePatientIntakeTemplate(template = {}) {
  const normalized = {
    intro: (template.intro || DEFAULT_PATIENT_INTAKE_TEMPLATE.intro).trim(),
    questions: []
  };
  storageSet(DOMUS_STORAGE_KEYS.patientIntakeTemplate, normalized);
  if (hasSupabase()) {
    DOMUS_DB.from('patient_intake_templates').upsert({
      id: 'default',
      intro: normalized.intro,
      questions: [],
      active: true,
      updated_at: new Date().toISOString()
    }).then(({ error }) => {
      if (error) console.warn('No se pudo actualizar plantilla en Supabase:', error.message);
    });
  }
  return normalized;
}
async function loadPatientIntakeTemplateFromSupabase() {
  if (!hasSupabase()) return getPatientIntakeTemplate();
  const { data, error } = await DOMUS_DB.from('patient_intake_templates')
    .select('intro')
    .eq('id', 'default')
    .eq('active', true)
    .maybeSingle();
  if (!error && data) {
    const template = savePatientIntakeTemplate({
      intro: data.intro || DEFAULT_PATIENT_INTAKE_TEMPLATE.intro,
      questions: []
    });
    return template;
  }
  return getPatientIntakeTemplate();
}
function getPatientIntakeResponses() {
  return storageGet(DOMUS_STORAGE_KEYS.patientIntakeResponses, []);
}

function savePatientIntakeResponses(responses) {
  storageSet(DOMUS_STORAGE_KEYS.patientIntakeResponses, responses);
}

function getPatientIntakeResponsesByPatient(patientId) {
  return getPatientIntakeResponses()
    .filter((item) => item.patientId === patientId)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function mergePatientIntakeResponses(items = []) {
  const current = getPatientIntakeResponses();
  const byId = new Map(current.map((item) => [item.id || `${item.patientId}-${item.createdAt}`, item]));
  items.forEach((item) => byId.set(item.id || `${item.patientId}-${item.createdAt}`, item));
  const merged = Array.from(byId.values()).sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
  savePatientIntakeResponses(merged.slice(0, 500));
  return merged;
}

function mapPatientIntakeRows(rows = []) {
  return (rows || []).map((row) => ({
    id: row.id,
    patientId: row.patient_local_id,
    token: row.token,
    patientName: row.patient_name,
    patientRut: row.patient_rut,
    createdAt: row.created_at,
    data: row.response_data || {}
  }));
}

async function fetchPatientIntakeResponses(patientId) {
  const local = getPatientIntakeResponsesByPatient(patientId);
  if (!hasSupabase()) return local;

  const patient = getPatientById(patientId) || {};
  let rows = [];

  if (patient.intakeToken) {
    const { data, error } = await DOMUS_DB.rpc('get_patient_intake_responses_for_patient', {
      patient_local_id_arg: patientId,
      token_arg: patient.intakeToken
    });
    if (!error) rows = data || [];
    else console.warn('No se pudo leer formulario previo mediante RPC:', error.message);
  }

  if (!rows.length) {
    const { data, error } = await DOMUS_DB.from('patient_intake_responses')
      .select('*')
      .eq('patient_local_id', patientId)
      .order('created_at', { ascending: false });
    if (error) {
      console.warn('No se pudieron leer formularios previos desde Supabase:', error.message);
      return local;
    }
    rows = data || [];
  }

  mergePatientIntakeResponses(mapPatientIntakeRows(rows));
  return getPatientIntakeResponsesByPatient(patientId);
}

async function savePatientIntakeResponse(response) {
  mergePatientIntakeResponses([response]);
  window.lastPatientIntakeSaveError = null;
  if (!hasSupabase()) {
    window.lastPatientIntakeSaveError = 'La conexión con Supabase no está disponible.';
    return false;
  }
  const { error } = await DOMUS_DB.from('patient_intake_responses').insert({
    patient_local_id: response.patientId,
    token: response.token || '',
    patient_name: response.patientName || response.data?.patientName || '',
    patient_rut: response.patientRut || response.data?.rut || '',
    response_data: response.data || {},
    reviewed: false,
    created_at: response.createdAt || new Date().toISOString(),
    updated_at: response.createdAt || new Date().toISOString()
  });
  if (error) {
    console.error('Error al registrar formulario del paciente en Supabase:', error);
    window.lastPatientIntakeSaveError = error.message || 'Error desconocido de Supabase.';
    return false;
  }
  updatePatientClinicalRecordFromIntake(response.patientId, response.data || {}, { id: response.id, createdAt: response.createdAt });
  return true;
}

function ensurePatientIntakeToken(patientId) {
  let patient = getPatientById(patientId);
  if (!patient) return null;
  if (patient.intakeToken) return patient;
  const intakeToken = makeId('intake').replace('intake-', '');
  const updated = { ...patient, intakeToken, updatedAt: new Date().toISOString() };
  savePatients(getPatients().map((item) => item.id === patientId ? updated : item));
  return updated;
}

function getPatientIntakeLink(patient) {
  const url = new URL(window.location.href);
  url.hash = '';
  url.search = '';
  url.searchParams.set('formulario', 'paciente');
  url.searchParams.set('paciente', patient.id);
  url.searchParams.set('token', patient.intakeToken || patient.id);
  return url.toString();
}

function normalizePhoneForWhatsApp(phone = '') {
  let digits = phone.replace(/\D/g, '');
  if (!digits) return '';
  if (digits.startsWith('00')) digits = digits.slice(2);
  if (digits.startsWith('0')) digits = digits.slice(1);
  if (digits.length === 9 && digits.startsWith('9')) digits = `56${digits}`;
  if (digits.length === 8) digits = `569${digits}`;
  return digits;
}

function renderPatientIntakeTemplateAdmin() {
  const preview = $('[data-intake-template-preview]');
  if (preview) preview.innerHTML = patientIntakeTemplatePreviewHtml(getPatientIntakeTemplate());
}
function renderIntakeExtraQuestions() {
  const container = $('[data-intake-extra-questions]');
  if (container) container.innerHTML = '';
}
function patientIntakeTemplatePreviewHtml(template = getPatientIntakeTemplate()) {
  return `
    <div class="intake-template-preview-title">
      <div>
        <h4>Vista del formulario que recibirá el paciente</h4>
        <p>Esta vista refleja la estructura fija que se abre desde el enlace enviado por correo o WhatsApp.</p>
      </div>
      <span class="status-pill approved">Formulario activo</span>
    </div>
    <div class="intake-preview-card admin-form">
      <section class="clinical-form-section">
        <div class="clinical-section-title">
          <h4>1. Identificación del paciente</h4>
          <p>Completa o confirma tus datos básicos.</p>
        </div>
        <div class="form-row">
          <label><span>Nombre completo</span><input disabled placeholder="Nombre y apellido" /></label>
          <label><span>RUT / Identificador</span><input disabled placeholder="12.345.678-9" /></label>
        </div>
        <div class="form-row">
          <label><span>Edad</span><input disabled placeholder="Edad" /></label>
          <label><span>Teléfono de contacto</span><input disabled placeholder="+56 9 XXXX XXXX" /></label>
        </div>
        <label><span>Correo electrónico</span><input disabled placeholder="correo@ejemplo.cl" /></label>
      </section>

      <section class="clinical-form-section">
        <div class="clinical-section-title">
          <h4>2. Antecedentes básicos de salud</h4>
          <p>Esta información se incorporará a la ficha del paciente.</p>
        </div>
        <label><span>Diagnóstico principal o condición de salud relevante</span><textarea disabled placeholder="Describe el diagnóstico o condición principal"></textarea></label>
        <label><span>Motivo por el cual solicita o inicia el servicio</span><textarea disabled placeholder="Describe brevemente la necesidad de atención"></textarea></label>
        <label><span>Medicamentos actuales</span><textarea disabled placeholder="Indica medicamentos, dosis y horarios si los conoce"></textarea></label>
        <div class="radio-question">
          <span>¿Tiene alergias conocidas?</span>
          <div class="radio-options"><label><input disabled type="radio" /> Sí</label><label><input disabled type="radio" /> No</label></div>
        </div>
        <label><span>¿Cuáles?</span><input disabled placeholder="Medicamentos, alimentos, látex u otros" /></label>
        <label><span>Enfermedades o antecedentes importantes</span><textarea disabled placeholder="Ej: hipertensión, diabetes, ACV, cardiopatías, cirugías, hospitalizaciones"></textarea></label>
        <label><span>Movilidad y nivel de dependencia</span><textarea disabled placeholder="Ej: camina solo, usa bastón, silla de ruedas, requiere asistencia"></textarea></label>
        <label><span>Red de apoyo o cuidador principal</span><textarea disabled placeholder="Indica nombre, vínculo y teléfono si corresponde"></textarea></label>
      </section>

      <section class="clinical-form-section">
        <div class="clinical-section-title">
          <h4>3. Antecedentes mórbidos / Tratamiento</h4>
          <p>Esta información quedará en la ficha clínica general del paciente.</p>
        </div>
        <div class="morbid-grid">${morbidTreatmentHtml({}, { disabled: true })}</div>
      </section>

      <section class="clinical-form-section">
        <div class="clinical-section-title">
          <h4>4. Hábitos y observaciones</h4>
          <p>Completa solo lo que corresponda.</p>
        </div>
        <div class="morbid-grid">
          <div class="morbid-item"><div class="radio-question"><span>Tabaco</span><div class="radio-options"><label><input disabled type="radio" /> Sí</label><label><input disabled type="radio" /> No</label></div></div><input disabled placeholder="Cantidad al día" /></div>
          <div class="morbid-item"><div class="radio-question"><span>Alcohol</span><div class="radio-options"><label><input disabled type="radio" /> Sí</label><label><input disabled type="radio" /> No</label></div></div><input disabled placeholder="Frecuencia" /></div>
          <div class="morbid-item"><div class="radio-question"><span>Drogas</span><div class="radio-options"><label><input disabled type="radio" /> Sí</label><label><input disabled type="radio" /> No</label></div></div><input disabled placeholder="Frecuencia" /></div>
        </div>
        <label><span>Observaciones relevantes para la atención domiciliaria</span><textarea disabled placeholder="Riesgos en domicilio, preferencias, horarios, antecedentes familiares u otros"></textarea></label>
      </section>

      <section class="clinical-form-section consent-section">
        <label class="checkbox-line"><input disabled type="checkbox" /><span>Confirmo que la información entregada es correcta y autorizo su uso para preparar la atención domiciliaria de Domus Salud.</span></label>
      </section>
    </div>
  `;
}
function updatePatientIntakeAllergiesField() {
  const wrapper = $('[data-intake-allergies-detail]');
  if (!wrapper || !patientIntakeForm) return;
  const hasAllergies = patientIntakeForm.elements.hasAllergies?.value === 'Sí';
  const detail = patientIntakeForm.elements.allergiesDetail;
  wrapper.hidden = !hasAllergies;
  if (detail) {
    detail.required = hasAllergies;
    if (!hasAllergies) detail.value = '';
  }
  updatePatientIntakeCompletionState();
}


function isPatientIntakeComplete() {
  if (!patientIntakeForm) return false;
  updatePatientIntakeAllergiesFieldWithoutLoop();
  return patientIntakeForm.checkValidity();
}

function updatePatientIntakeAllergiesFieldWithoutLoop() {
  const wrapper = $('[data-intake-allergies-detail]');
  if (!wrapper || !patientIntakeForm) return;
  const hasAllergies = patientIntakeForm.elements.hasAllergies?.value === 'Sí';
  const detail = patientIntakeForm.elements.allergiesDetail;
  wrapper.hidden = !hasAllergies;
  if (detail) {
    detail.required = hasAllergies;
    if (!hasAllergies) detail.value = '';
  }
}

function updatePatientIntakeCompletionState() {
  if (!patientIntakeForm) return;
  updatePatientIntakeAllergiesFieldWithoutLoop();
  const returnLink = $('[data-intake-return]');
  const isComplete = patientIntakeForm.checkValidity();
  if (returnLink) {
    returnLink.classList.toggle('disabled', !isComplete && !patientIntakeForm.dataset.submitted);
    returnLink.setAttribute('aria-disabled', String(!isComplete && !patientIntakeForm.dataset.submitted));
  }
}

async function openPatientIntakeFromUrl() {
  if (!patientIntakeShell || !patientIntakeForm) return;
  const params = new URLSearchParams(window.location.search);
  if (params.get('formulario') !== 'paciente') return;

  const patientId = params.get('paciente') || '';
  const token = params.get('token') || '';
  const template = await loadPatientIntakeTemplateFromSupabase();
  renderIntakeExtraQuestions();
  const intro = $('[data-patient-intake-intro]');
  if (intro) intro.textContent = template.intro || DEFAULT_PATIENT_INTAKE_TEMPLATE.intro;

  patientIntakeForm.elements.patientId.value = patientId;
  patientIntakeForm.elements.token.value = token;
  const patient = getPatientById(patientId) || {};
  patientIntakeForm.elements.patientName.value = patient.name || '';
  patientIntakeForm.elements.rut.value = patient.rut || '';
  patientIntakeForm.elements.phone.value = patient.phone || '';
  patientIntakeForm.elements.email.value = patient.email || '';

  document.body.classList.add('patient-intake-open');
  patientIntakeShell.hidden = false;
  updatePatientIntakeAllergiesFieldWithoutLoop();
  updatePatientIntakeCompletionState();
  $('#main')?.setAttribute('hidden', '');
  $('.site-header')?.setAttribute('hidden', '');
  $('.footer')?.setAttribute('hidden', '');
  recordPatientFormOpenAnalytics();
}

function collectPatientIntakeData() {
  if (!patientIntakeForm) return {};
  const formData = new FormData(patientIntakeForm);
  return {
    patientName: formValue(formData, 'patientName'),
    rut: formValue(formData, 'rut'),
    age: formValue(formData, 'age'),
    phone: formValue(formData, 'phone'),
    email: formValue(formData, 'email'),
    mainDiagnosis: formValue(formData, 'mainDiagnosis'),
    serviceReason: formValue(formData, 'serviceReason'),
    currentMedications: formValue(formData, 'currentMedications'),
    hasAllergies: formValue(formData, 'hasAllergies'),
    allergiesDetail: formValue(formData, 'allergiesDetail'),
    morbidHistory: formValue(formData, 'morbidHistory'),
    mobilityDependency: formValue(formData, 'mobilityDependency'),
    supportNetwork: formValue(formData, 'supportNetwork'),
    tobacco: formValue(formData, 'tobacco'),
    tobaccoDetail: formValue(formData, 'tobaccoDetail'),
    alcohol: formValue(formData, 'alcohol'),
    alcoholDetail: formValue(formData, 'alcoholDetail'),
    drugs: formValue(formData, 'drugs'),
    drugsDetail: formValue(formData, 'drugsDetail'),
    generalObservations: formValue(formData, 'generalObservations'),
    morbidTreatment: morbidTreatmentValuesFromForm(patientIntakeForm),
    extraQuestions: []
  };
}

function patientIntakeResponseHtml(response = {}) {
  const data = response.data || {};
  return `
    <article class="clinical-record-item patient-intake-response-item">
      <div class="admin-row-header">
        <div>
          <strong>Formulario previo del paciente</strong>
          <small>${formatDateTime(response.createdAt || new Date().toISOString())}</small>
        </div>
        <span class="status-pill approved">Recibido</span>
      </div>
      <div class="clinical-summary-grid">
        <article><span>Nombre</span><strong>${escapeHTML(data.patientName || response.patientName || 'No indicado')}</strong></article>
        <article><span>RUT/ID</span><strong>${escapeHTML(data.rut || response.patientRut || 'No indicado')}</strong></article>
        <article><span>Edad</span><strong>${escapeHTML(data.age || 'No indicada')}</strong></article>
        <article><span>Correo</span><strong>${escapeHTML(data.email || 'No indicado')}</strong></article>
        <article><span>Teléfono</span><strong>${escapeHTML(data.phone || 'No indicado')}</strong></article>
        <article><span>Alergias</span><strong>${escapeHTML(data.hasAllergies || 'No indicado')}</strong></article>
      </div>
      <div class="clinical-notes"><strong>Diagnóstico / condición principal</strong><p>${escapeHTML(data.mainDiagnosis || 'No registrado')}</p></div>
      <div class="clinical-notes"><strong>Motivo de ingreso o solicitud</strong><p>${escapeHTML(data.serviceReason || 'No registrado')}</p></div>
      <div class="clinical-notes"><strong>Medicamentos actuales</strong><p>${escapeHTML(data.currentMedications || 'No registrado')}</p></div>
      ${data.hasAllergies === 'Sí' ? `<div class="clinical-notes"><strong>Detalle de alergias</strong><p>${escapeHTML(data.allergiesDetail || 'No registrado')}</p></div>` : ''}
      <div class="clinical-notes"><strong>Antecedentes mórbidos</strong><p>${escapeHTML(data.morbidHistory || 'No registrado')}</p></div>
      ${morbidTreatmentDisplayHtml(data.morbidTreatment || data)}
      <div class="clinical-notes"><strong>Movilidad y dependencia</strong><p>${escapeHTML(data.mobilityDependency || 'No registrado')}</p></div>
      <div class="clinical-notes"><strong>Red de apoyo</strong><p>${escapeHTML(data.supportNetwork || 'No registrado')}</p></div>
      <div class="clinical-summary-grid">
        <article><span>Tabaco</span><strong>${escapeHTML(data.tobacco || 'No indicado')} ${data.tobaccoDetail ? `· ${escapeHTML(data.tobaccoDetail)}` : ''}</strong></article>
        <article><span>Alcohol</span><strong>${escapeHTML(data.alcohol || 'No indicado')} ${data.alcoholDetail ? `· ${escapeHTML(data.alcoholDetail)}` : ''}</strong></article>
        <article><span>Drogas</span><strong>${escapeHTML(data.drugs || 'No indicado')} ${data.drugsDetail ? `· ${escapeHTML(data.drugsDetail)}` : ''}</strong></article>
      </div>
      <div class="clinical-notes"><strong>Observaciones generales</strong><p>${escapeHTML(data.generalObservations || 'No registrado')}</p></div>
    </article>
  `;
}

async function renderPatientIntakeResponses(patientId) {
  const container = $('[data-patient-intake-responses]');
  if (!container) return;
  container.innerHTML = '<p>Cargando formularios previos del paciente...</p>';
  const responses = await fetchPatientIntakeResponses(patientId);
  const latest = responses?.[0];
  if (latest?.data) {
    updatePatientClinicalRecordFromIntake(patientId, latest.data, { id: latest.id, createdAt: latest.createdAt });
    const generalBox = $('[data-clinical-general-readonly]');
    if (generalBox && selectedAdminPatientId === patientId) {
      generalBox.innerHTML = clinicalGeneralDataDisplayHtml(getPatientClinicalGeneralData(patientId));
    }
  }
  container.innerHTML = responses.length
    ? responses.map(patientIntakeResponseHtml).join('')
    : '<p>El paciente aún no ha enviado el formulario previo.</p>';
}

function markPatientIntakeChannelSent(patientId, channel) {
  const now = new Date().toISOString();
  let updatedPatient = null;
  const patients = getPatients().map((patient) => {
    if (patient.id !== patientId) return patient;
    updatedPatient = {
      ...patient,
      intakeEmailSentAt: channel === 'email' ? now : patient.intakeEmailSentAt,
      intakeWhatsappSentAt: channel === 'whatsapp' ? now : patient.intakeWhatsappSentAt,
      updatedAt: now
    };
    return updatedPatient;
  });
  savePatients(patients);
  return updatedPatient || getPatientById(patientId);
}

function sentTicketHtml(label, value) {
  if (!value) return '';
  return `<span class="sent-ticket">✓ ${escapeHTML(label)} enviado</span>`;
}

function renderPatientIntakeSendStatus(patient = null) {
  const status = $('[data-intake-send-status]');
  if (!status) return;
  if (!patient) {
    status.innerHTML = '';
    return;
  }
  const emailTicket = sentTicketHtml('Correo', patient.intakeEmailSentAt);
  const whatsappTicket = sentTicketHtml('WhatsApp', patient.intakeWhatsappSentAt);
  status.innerHTML = emailTicket || whatsappTicket
    ? `<div class="sent-ticket-line">${emailTicket}${whatsappTicket}</div>`
    : '<span class="field-help">Aún no se ha enviado el formulario previo.</span>';
}

function setPatientFormSendButtonsEnabled(enabled) {
  $$('[data-send-intake-from-form-channel]').forEach((button) => {
    button.disabled = !enabled;
  });
}

function patientIntakeChannelButtonsHtml(patient) {
  const id = escapeHTML(patient.id);
  const emailSent = Boolean(patient.intakeEmailSentAt);
  const whatsappSent = Boolean(patient.intakeWhatsappSentAt);
  return `
    <div class="send-channel-group" aria-label="Enviar formulario previo">
      <button class="icon-action whatsapp ${whatsappSent ? 'sent' : ''}" type="button" data-send-intake-patient="${id}" data-send-intake-channel="whatsapp" title="Enviar por WhatsApp">
        <span class="channel-icon" aria-hidden="true">☎</span><span>WhatsApp</span>${whatsappSent ? '<b aria-hidden="true">✓</b>' : ''}
      </button>
      <button class="icon-action email ${emailSent ? 'sent' : ''}" type="button" data-send-intake-patient="${id}" data-send-intake-channel="email" title="Enviar por correo">
        <span class="channel-icon" aria-hidden="true">✉</span><span>Correo</span>${emailSent ? '<b aria-hidden="true">✓</b>' : ''}
      </button>
    </div>
    ${(emailSent || whatsappSent) ? `<div class="sent-ticket-line compact">${sentTicketHtml('WhatsApp', patient.intakeWhatsappSentAt)}${sentTicketHtml('Correo', patient.intakeEmailSentAt)}</div>` : ''}
  `;
}

async function sendPatientIntakeFormToPatient(patientId, channel = 'whatsapp') {
  let patient = ensurePatientIntakeToken(patientId);
  const message = $('[data-patient-message]');
  if (!patient) {
    if (message) message.textContent = 'Selecciona o guarda un paciente antes de enviar el formulario.';
    return false;
  }

  const link = getPatientIntakeLink(patient);
  const text = `Hola ${patient.name || ''}, Domus Salud te solicita completar este formulario de antecedentes básicos antes del inicio del servicio: ${link}`.trim();
  let ok = false;

  if (channel === 'email') {
    if (!patient.email) {
      if (message) message.textContent = 'El paciente no tiene correo registrado. Agrega un correo y guarda el paciente antes de enviar.';
      return false;
    }
    try {
      if (message) message.textContent = 'Enviando formulario por correo...';
      const response = await fetch('/api/send-patient-intake-email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          to: patient.email,
          patientName: patient.name,
          link
        })
      });
      const result = await response.json().catch(() => ({}));
      ok = response.ok && result.ok;
      if (!ok) {
        console.warn('No se pudo enviar formulario por correo:', result);
        if (message) message.textContent = `No se pudo enviar por correo. ${result.message || 'Revisa SMTP en Vercel.'}`;
        return false;
      }
      patient = markPatientIntakeChannelSent(patient.id, 'email');
      if (message) message.textContent = '✓ Formulario enviado por correo al paciente.';
    } catch (error) {
      console.warn('Error al enviar formulario por correo:', error);
      if (message) message.textContent = 'No se pudo enviar por correo. Revisa la conexión o la configuración SMTP.';
      return false;
    }
  }

  if (channel === 'whatsapp') {
    const whatsappNumber = normalizePhoneForWhatsApp(patient.phone || '');
    if (!whatsappNumber) {
      if (message) message.textContent = `El paciente no tiene teléfono válido. Copia este enlace: ${link}`;
      return false;
    }
    const opened = window.open(`https://wa.me/${whatsappNumber}?text=${encodeURIComponent(text)}`, '_blank', 'noopener,noreferrer');
    ok = Boolean(opened) || true;
    patient = markPatientIntakeChannelSent(patient.id, 'whatsapp');
    if (message) message.textContent = '✓ Se abrió WhatsApp con el enlace del formulario para el paciente.';
  }

  renderPatientsAdmin();
  if (patientForm?.elements.id?.value === patient.id) {
    setPatientFormSendButtonsEnabled(true);
    renderPatientIntakeSendStatus(patient);
  }
  return ok;
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

function splitLocalDatetimeValue(value = localDatetimeValue()) {
  const safeValue = value || localDatetimeValue();
  const [datePart, timePart = ''] = safeValue.split('T');
  return {
    date: datePart || localDatetimeValue().slice(0, 10),
    time: (timePart || localDatetimeValue().slice(11, 16)).slice(0, 5)
  };
}

function setVisitDateTimeFields(value = localDatetimeValue()) {
  if (!evolutionForm) return;
  const parts = splitLocalDatetimeValue(value);
  if (evolutionForm.elements.visitDate) evolutionForm.elements.visitDate.value = `${parts.date}T${parts.time}`;
  if (evolutionForm.elements.visitDateOnly) evolutionForm.elements.visitDateOnly.value = parts.date;
  if (evolutionForm.elements.visitTimeOnly) evolutionForm.elements.visitTimeOnly.value = parts.time;
}

function buildVisitDateTimeFromParts(formData) {
  const dateOnly = formValue(formData, 'visitDateOnly');
  const timeOnly = formValue(formData, 'visitTimeOnly');
  if (dateOnly && timeOnly) return `${dateOnly}T${timeOnly}`;
  return formValue(formData, 'visitDate');
}

function syncHiddenVisitDateTime() {
  if (!evolutionForm) return;
  const data = new FormData(evolutionForm);
  const built = buildVisitDateTimeFromParts(data);
  if (evolutionForm.elements.visitDate && built) evolutionForm.elements.visitDate.value = built;
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
    help: 'Selecciona el tipo de visita y luego completa un nuevo episodio o seguimiento de episodio anterior.',
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

const PATIENT_VISIT_OPTIONS_WITH_FORMS = [
  'Visita médico general',
  'Visita Médico especialista',
  'Visita Kine Respiratoria',
  'Visita Kine Motora',
  'Visita TENS',
  'Visita Enfermería',
  'Visita Cuidador'
];

const PATIENT_VISIT_OPTIONS_WITHOUT_FORMS = [
  'Visita Fonoaudiología',
  'Visita Terapia Ocupacional',
  'Visita Educación de Salud',
  'Visita de acompañamiento adulto mayor'
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

function hasPatientVisitForm(visitOption = '') {
  return PATIENT_VISIT_OPTIONS_WITH_FORMS.includes(visitOption);
}

function isPatientVisitOptionPending(visitOption = '') {
  return PATIENT_VISIT_OPTIONS_WITHOUT_FORMS.includes(visitOption);
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

function getRequestedVisitOptionsForAttention(type) {
  if (isProcedureVisitType(type)) return getSpecificProcedureOptionsForType(type);
  if (isPatientVisitType(type)) return PATIENT_VISIT_OPTIONS;
  return [];
}

function buildRequestedServiceLabel(attentionType = '', requestedVisitType = '') {
  const parts = [attentionType, requestedVisitType].map((item) => (item || '').toString().trim()).filter(Boolean);
  return parts.join(' · ');
}

function parseRequestedServiceLabel(service = '') {
  const [attentionType = '', requestedVisitType = ''] = (service || '').split(' · ').map((item) => item.trim());
  return { attentionType, requestedVisitType };
}

function getPatientAttentionType(patient = {}) {
  return patient.attentionType || patient.requestedAttentionType || parseRequestedServiceLabel(patient.service).attentionType || '';
}

function getPatientRequestedVisitType(patient = {}) {
  return patient.requestedVisitType || patient.visitTypeRequested || patient.specificProcedureRequested || parseRequestedServiceLabel(patient.service).requestedVisitType || '';
}

function getPatientServiceLabel(patient = {}) {
  return buildRequestedServiceLabel(getPatientAttentionType(patient), getPatientRequestedVisitType(patient)) || patient.service || 'Servicio no indicado';
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

function setFieldValueIfEmpty(name, value, force = false) {
  if (!evolutionForm || value === undefined || value === null) return;
  const field = evolutionForm.elements[name];
  if (!field) return;
  const normalized = value.toString().trim();
  if (!normalized) return;
  if (typeof RadioNodeList !== 'undefined' && field instanceof RadioNodeList) return;
  if (!('value' in field)) return;
  if (force || !field.value) field.value = normalized;
}

function setRadioValueIfEmpty(name, value, force = false) {
  if (!evolutionForm || !value) return;
  const radios = Array.from(evolutionForm.querySelectorAll(`input[type="radio"][name="${name}"]`));
  if (!radios.length) return;
  const hasChecked = radios.some((radio) => radio.checked);
  if (!force && hasChecked) return;
  const normalized = value.toString().trim().toLowerCase();
  const match = radios.find((radio) => radio.value.toString().trim().toLowerCase() === normalized);
  if (match) match.checked = true;
}


const MORBID_TREATMENT_FIELDS = [
  { key: 'hta', obsKey: 'htaObs', legacyKey: 'newHTA', legacyObsKey: 'newHTAObs', label: 'HTA' },
  { key: 'diabetes', obsKey: 'diabetesObs', legacyKey: 'newDiabetes', legacyObsKey: 'newDiabetesObs', label: 'Diabetes' },
  { key: 'insulinResistance', obsKey: 'insulinResistanceObs', legacyKey: 'newInsulinResistance', legacyObsKey: 'newInsulinResistanceObs', label: 'Resistencia a la insulina' },
  { key: 'acv', obsKey: 'acvObs', legacyKey: 'newACV', legacyObsKey: 'newACVObs', label: 'ACV / TIA / HIC' },
  { key: 'icc', obsKey: 'iccObs', legacyKey: 'newICC', legacyObsKey: 'newICCObs', label: 'CV - ICC' },
  { key: 'coronary', obsKey: 'coronaryObs', legacyKey: 'newCoronary', legacyObsKey: 'newCoronaryObs', label: 'CV - Cardiopatía coronaria' },
  { key: 'arrhythmia', obsKey: 'arrhythmiaObs', legacyKey: 'newArrhythmia', legacyObsKey: 'newArrhythmiaObs', label: 'CV - Arritmia' },
  { key: 'lcfa', obsKey: 'lcfaObs', legacyKey: 'newLCFA', legacyObsKey: 'newLCFAObs', label: 'LCFA' },
  { key: 'otherMorbid', obsKey: 'otherMorbidObs', legacyKey: 'newOtherMorbid', legacyObsKey: 'newOtherMorbidObs', label: 'Otros' }
];

function getNestedMorbidSource(data = {}) {
  return data.morbidTreatment && typeof data.morbidTreatment === 'object' ? data.morbidTreatment : data;
}

function normalizeMorbidTreatmentData(data = {}) {
  const source = getNestedMorbidSource(data);
  return MORBID_TREATMENT_FIELDS.reduce((acc, field) => {
    acc[field.key] = source[field.key] || data[field.key] || data[field.legacyKey] || '';
    acc[field.obsKey] = source[field.obsKey] || data[field.obsKey] || data[field.legacyObsKey] || '';
    return acc;
  }, {});
}

function morbidTreatmentValuesFromForm(form) {
  if (!form) return normalizeMorbidTreatmentData({});
  const formData = new FormData(form);
  return MORBID_TREATMENT_FIELDS.reduce((acc, field) => {
    acc[field.key] = formValue(formData, field.key);
    acc[field.obsKey] = formValue(formData, field.obsKey);
    return acc;
  }, {});
}

function morbidTreatmentHtml(data = {}, { disabled = false, required = false } = {}) {
  const values = normalizeMorbidTreatmentData(data);
  const disabledAttr = disabled ? 'disabled' : '';
  const requiredAttr = required ? 'required' : '';
  return MORBID_TREATMENT_FIELDS.map((field) => {
    const yesChecked = values[field.key] === 'Sí' ? 'checked' : '';
    const noChecked = values[field.key] === 'No' ? 'checked' : '';
    return `
      <div class="morbid-item">
        <div class="radio-question">
          <span>${escapeHTML(field.label)}</span>
          <div class="radio-options">
            <label><input type="radio" name="${field.key}" value="Sí" ${yesChecked} ${disabledAttr} ${requiredAttr} /> Sí</label>
            <label><input type="radio" name="${field.key}" value="No" ${noChecked} ${disabledAttr} ${requiredAttr} /> No</label>
          </div>
        </div>
        <label><span>Observaciones</span><input name="${field.obsKey}" type="text" value="${escapeHTML(values[field.obsKey] || '')}" placeholder="Observaciones o No aplica" ${disabledAttr} ${requiredAttr} /></label>
      </div>
    `;
  }).join('');
}

function morbidTreatmentDisplayHtml(data = {}) {
  const values = normalizeMorbidTreatmentData(data);
  return `
    <div class="clinical-subsection-title compact-morbid-title">Antecedentes mórbidos / Tratamiento</div>
    <div class="clinical-summary-grid morbid-treatment-summary">
      ${MORBID_TREATMENT_FIELDS.map((field) => `
        <article>
          <span>${escapeHTML(field.label)}</span>
          <strong>${escapeHTML(values[field.key] || 'No indicado')}${values[field.obsKey] ? ` · ${escapeHTML(values[field.obsKey])}` : ''}</strong>
        </article>
      `).join('')}
    </div>
  `;
}

const CLINICAL_GENERAL_LABELS = {
  patientName: 'Nombre del paciente', rut: 'RUT / Identificador', age: 'Edad', phone: 'Teléfono', email: 'Correo',
  mainDiagnosis: 'Diagnóstico principal', serviceReason: 'Motivo de ingreso o solicitud', currentMedications: 'Medicamentos actuales',
  hasAllergies: 'Alergias', allergiesDetail: 'Detalle de alergias', morbidHistory: 'Enfermedades o antecedentes importantes',
  mobilityDependency: 'Movilidad y dependencia', supportNetwork: 'Red de apoyo/cuidador principal',
  tobacco: 'Tabaco', tobaccoDetail: 'Detalle tabaco', alcohol: 'Alcohol', alcoholDetail: 'Detalle alcohol',
  drugs: 'Drogas', drugsDetail: 'Detalle drogas', generalObservations: 'Observaciones generales'
};
MORBID_TREATMENT_FIELDS.forEach((field) => {
  CLINICAL_GENERAL_LABELS[field.key] = field.label;
  CLINICAL_GENERAL_LABELS[field.obsKey] = `${field.label} · Observaciones`;
});

function flattenClinicalGeneralData(data = {}) {
  const normalized = normalizeClinicalGeneralData(data, {});
  const flat = {
    patientName: normalized.patientName || '', rut: normalized.rut || '', age: normalized.age || '', phone: normalized.phone || '', email: normalized.email || '',
    mainDiagnosis: normalized.mainDiagnosis || '', serviceReason: normalized.serviceReason || '', currentMedications: normalized.currentMedications || '',
    hasAllergies: normalized.hasAllergies || '', allergiesDetail: normalized.allergiesDetail || '', morbidHistory: normalized.morbidHistory || '',
    mobilityDependency: normalized.mobilityDependency || '', supportNetwork: normalized.supportNetwork || '',
    tobacco: normalized.tobacco || '', tobaccoDetail: normalized.tobaccoDetail || '', alcohol: normalized.alcohol || '', alcoholDetail: normalized.alcoholDetail || '',
    drugs: normalized.drugs || '', drugsDetail: normalized.drugsDetail || '', generalObservations: normalized.generalObservations || ''
  };
  const morbid = normalizeMorbidTreatmentData(normalized.morbidTreatment || {});
  MORBID_TREATMENT_FIELDS.forEach((field) => {
    flat[field.key] = morbid[field.key] || '';
    flat[field.obsKey] = morbid[field.obsKey] || '';
  });
  return flat;
}

function getClinicalGeneralDataChanges(beforeData = {}, afterData = {}) {
  const before = flattenClinicalGeneralData(beforeData || {});
  const after = flattenClinicalGeneralData(afterData || {});
  return Object.keys(after).reduce((changes, key) => {
    const prev = String(before[key] || '').trim();
    const next = String(after[key] || '').trim();
    if (prev !== next) {
      changes.push({ field: key, label: CLINICAL_GENERAL_LABELS[key] || key, before: prev || 'Sin registro', after: next || 'Sin registro' });
    }
    return changes;
  }, []);
}

function clinicalRecordChangesHtml(changes = []) {
  if (!Array.isArray(changes) || !changes.length) return '';
  return `
    <div class="clinical-update-log">
      <strong>Actualización de ficha clínica en este episodio</strong>
      <ul>
        ${changes.slice(0, 12).map((item) => `<li><b>${escapeHTML(item.label)}:</b> ${escapeHTML(item.before)} → ${escapeHTML(item.after)}</li>`).join('')}
        ${changes.length > 12 ? `<li>+ ${changes.length - 12} cambio(s) adicional(es).</li>` : ''}
      </ul>
    </div>
  `;
}

function clinicalRecordChangesPdfHtml(changes = []) {
  if (!Array.isArray(changes) || !changes.length) return '';
  return `
    <h2>Actualización de ficha clínica registrada en este episodio</h2>
    <section class="box grid">
      ${changes.map((item) => pdfField(item.label, `${item.before || 'Sin registro'} → ${item.after || 'Sin registro'}`)).join('')}
    </section>
  `;
}

function normalizeClinicalGeneralData(data = {}, patient = {}) {
  return {
    patientName: data.patientName || patient.name || '',
    rut: data.rut || patient.rut || '',
    age: data.age || '',
    phone: data.phone || patient.phone || '',
    email: data.email || patient.email || '',
    mainDiagnosis: data.mainDiagnosis || '',
    serviceReason: data.serviceReason || '',
    currentMedications: data.currentMedications || '',
    hasAllergies: data.hasAllergies || data.allergies || '',
    allergiesDetail: data.allergiesDetail || '',
    morbidHistory: data.morbidHistory || '',
    mobilityDependency: data.mobilityDependency || '',
    supportNetwork: data.supportNetwork || '',
    tobacco: data.tobacco || '',
    tobaccoDetail: data.tobaccoDetail || data.tobaccoAmount || '',
    alcohol: data.alcohol || '',
    alcoholDetail: data.alcoholDetail || data.alcoholFrequency || '',
    drugs: data.drugs || '',
    drugsDetail: data.drugsDetail || data.drugsFrequency || '',
    generalObservations: data.generalObservations || '',
    morbidTreatment: normalizeMorbidTreatmentData(data)
  };
}

function getPatientClinicalGeneralData(patientId) {
  const patient = getPatientById(patientId) || {};
  const generalData = patient.clinicalRecord?.generalData || null;
  if (generalData) return normalizeClinicalGeneralData(generalData, patient);
  return null;
}

function updatePatientClinicalRecordFromIntake(patientId, data = {}, responseMeta = {}) {
  if (!patientId || !data) return null;
  let updatedPatient = null;
  let changed = false;
  const patients = getPatients().map((patient) => {
    if (patient.id !== patientId) return patient;

    const existingRecord = patient.clinicalRecord || {};
    const existingGeneralData = existingRecord.generalData
      ? normalizeClinicalGeneralData(existingRecord.generalData, patient)
      : null;

    // Cuando el profesional/admin ya corrigió la ficha clínica general,
    // una lectura posterior del formulario de ingreso NO debe volver a pisar
    // esos datos. El formulario de ingreso solo crea la ficha si aún no existe.
    if (responseMeta.preserveExisting && existingGeneralData) {
      updatedPatient = patient;
      return patient;
    }

    const generalData = normalizeClinicalGeneralData(data, patient);
    updatedPatient = {
      ...patient,
      name: generalData.patientName || patient.name,
      rut: generalData.rut || patient.rut,
      phone: generalData.phone || patient.phone,
      email: generalData.email || patient.email,
      clinicalRecord: {
        ...existingRecord,
        generatedFromIntake: true,
        createdFromIntakeAt: existingRecord.createdFromIntakeAt || responseMeta.createdAt || new Date().toISOString(),
        updatedAt: responseMeta.createdAt || new Date().toISOString(),
        lastIntakeResponseId: responseMeta.id || existingRecord.lastIntakeResponseId || '',
        generalData
      },
      updatedAt: new Date().toISOString()
    };
    changed = true;
    return updatedPatient;
  });
  if (updatedPatient && changed) {
    savePatients(patients);
    renderProfessionalClinicalRecord(updatedPatient);
  }
  return updatedPatient;
}

function updatePatientClinicalRecordGeneral(patientId, data = {}) {
  if (!patientId) return null;
  let updatedPatient = null;
  const patients = getPatients().map((patient) => {
    if (patient.id !== patientId) return patient;
    const generalData = normalizeClinicalGeneralData(data, patient);
    updatedPatient = {
      ...patient,
      name: generalData.patientName || patient.name,
      rut: generalData.rut || patient.rut,
      phone: generalData.phone || patient.phone,
      email: generalData.email || patient.email,
      clinicalRecord: {
        ...(patient.clinicalRecord || {}),
        generatedFromIntake: Boolean(patient.clinicalRecord?.generatedFromIntake),
        updatedAt: new Date().toISOString(),
        generalData
      },
      updatedAt: new Date().toISOString()
    };
    return updatedPatient;
  });
  if (updatedPatient) savePatients(patients);
  return updatedPatient;
}

function getLatestPatientIntakeData(patientId) {
  if (!patientId) return null;
  // Para completar formularios profesionales siempre se usa primero la
  // ficha clínica general vigente, porque puede haber sido corregida en
  // episodios anteriores. El formulario de ingreso queda solo como respaldo
  // inicial cuando aún no existe ficha general.
  const clinicalGeneralData = getPatientClinicalGeneralData(patientId);
  if (clinicalGeneralData) return clinicalGeneralData;
  const response = getPatientIntakeResponsesByPatient(patientId)[0];
  return response?.data || null;
}

function clinicalRecordStatusHtml(patient = {}) {
  const hasRecord = Boolean(patient.clinicalRecord?.generalData);
  return hasRecord
    ? '<span class="status-pill approved">Ficha clínica creada</span>'
    : '<span class="status-pill pending">Pendiente formulario</span>';
}

function clinicalGeneralDataDisplayHtml(data = null) {
  if (!data) return '<div class="clinical-empty-state">Este paciente aún no tiene ficha clínica general. Se generará automáticamente cuando complete el formulario previo de ingreso.</div>';
  return `
    <div class="clinical-summary-grid">
      <article><span>Nombre</span><strong>${escapeHTML(data.patientName || 'No indicado')}</strong></article>
      <article><span>RUT/ID</span><strong>${escapeHTML(data.rut || 'No indicado')}</strong></article>
      <article><span>Edad</span><strong>${escapeHTML(data.age || 'No indicada')}</strong></article>
      <article><span>Teléfono</span><strong>${escapeHTML(data.phone || 'No indicado')}</strong></article>
      <article><span>Correo</span><strong>${escapeHTML(data.email || 'No indicado')}</strong></article>
      <article><span>Alergias</span><strong>${escapeHTML(data.hasAllergies || 'No indicado')}${data.allergiesDetail ? ` · ${escapeHTML(data.allergiesDetail)}` : ''}</strong></article>
    </div>
    <div class="clinical-notes"><strong>Diagnóstico / condición principal</strong><p>${escapeHTML(data.mainDiagnosis || 'No registrado')}</p></div>
    <div class="clinical-notes"><strong>Motivo de ingreso o solicitud</strong><p>${escapeHTML(data.serviceReason || 'No registrado')}</p></div>
    <div class="clinical-notes"><strong>Medicamentos actuales</strong><p>${escapeHTML(data.currentMedications || 'No registrado')}</p></div>
    <div class="clinical-notes"><strong>Antecedentes mórbidos</strong><p>${escapeHTML(data.morbidHistory || 'No registrado')}</p></div>
    ${morbidTreatmentDisplayHtml(data.morbidTreatment || data)}
    <div class="clinical-notes"><strong>Movilidad y dependencia</strong><p>${escapeHTML(data.mobilityDependency || 'No registrado')}</p></div>
    <div class="clinical-notes"><strong>Red de apoyo / cuidador principal</strong><p>${escapeHTML(data.supportNetwork || 'No registrado')}</p></div>
    <div class="clinical-summary-grid">
      <article><span>Tabaco</span><strong>${escapeHTML(data.tobacco || 'No indicado')}${data.tobaccoDetail ? ` · ${escapeHTML(data.tobaccoDetail)}` : ''}</strong></article>
      <article><span>Alcohol</span><strong>${escapeHTML(data.alcohol || 'No indicado')}${data.alcoholDetail ? ` · ${escapeHTML(data.alcoholDetail)}` : ''}</strong></article>
      <article><span>Drogas</span><strong>${escapeHTML(data.drugs || 'No indicado')}${data.drugsDetail ? ` · ${escapeHTML(data.drugsDetail)}` : ''}</strong></article>
    </div>
    <div class="clinical-notes"><strong>Observaciones generales</strong><p>${escapeHTML(data.generalObservations || 'No registrado')}</p></div>
  `;
}

function clinicalGeneralEditFormHtml(patient = {}) {
  const data = normalizeClinicalGeneralData(patient.clinicalRecord?.generalData || {}, patient);
  const radio = (name, value) => data[name] === value ? 'checked' : '';
  return `
    <form class="admin-form clinical-general-edit-form" data-clinical-general-form data-patient-id="${escapeHTML(patient.id)}">
      <div class="admin-box-title compact-title">
        <div>
          <h4>Editar datos generales de ficha clínica</h4>
          <p>Solo administradores pueden modificar esta información. El profesional la verá como antecedente no editable.</p>
        </div>
      </div>
      <div class="form-row">
        <label><span>Nombre del paciente</span><input name="patientName" type="text" value="${escapeHTML(data.patientName)}" required /></label>
        <label><span>RUT / Identificador</span><input name="rut" type="text" value="${escapeHTML(data.rut)}" /></label>
      </div>
      <div class="form-row">
        <label><span>Edad</span><input name="age" type="number" min="0" max="130" value="${escapeHTML(data.age)}" /></label>
        <label><span>Teléfono</span><input name="phone" type="text" value="${escapeHTML(data.phone)}" /></label>
      </div>
      <label><span>Correo</span><input name="email" type="email" value="${escapeHTML(data.email)}" /></label>
      <label><span>Diagnóstico principal o condición relevante</span><textarea name="mainDiagnosis">${escapeHTML(data.mainDiagnosis)}</textarea></label>
      <label><span>Motivo por el cual solicita o inicia el servicio</span><textarea name="serviceReason">${escapeHTML(data.serviceReason)}</textarea></label>
      <label><span>Medicamentos actuales</span><textarea name="currentMedications">${escapeHTML(data.currentMedications)}</textarea></label>
      <div class="radio-question">
        <span>¿Tiene alergias conocidas?</span>
        <div class="radio-options">
          <label><input type="radio" name="hasAllergies" value="Sí" ${radio('hasAllergies','Sí')} /> Sí</label>
          <label><input type="radio" name="hasAllergies" value="No" ${radio('hasAllergies','No')} /> No</label>
        </div>
      </div>
      <label><span>Detalle de alergias</span><input name="allergiesDetail" type="text" value="${escapeHTML(data.allergiesDetail)}" /></label>
      <label><span>Enfermedades o antecedentes importantes</span><textarea name="morbidHistory">${escapeHTML(data.morbidHistory)}</textarea></label>
      <div class="clinical-subsection-title compact-morbid-title">Antecedentes mórbidos / Tratamiento</div>
      <div class="clinical-grid-3">${morbidTreatmentHtml(data.morbidTreatment || data)}</div>
      <label><span>Movilidad y nivel de dependencia</span><textarea name="mobilityDependency">${escapeHTML(data.mobilityDependency)}</textarea></label>
      <label><span>Red de apoyo o cuidador principal</span><textarea name="supportNetwork">${escapeHTML(data.supportNetwork)}</textarea></label>
      <div class="clinical-grid-3">
        <div class="morbid-item"><div class="radio-question"><span>Tabaco</span><div class="radio-options"><label><input type="radio" name="tobacco" value="Sí" ${radio('tobacco','Sí')} /> Sí</label><label><input type="radio" name="tobacco" value="No" ${radio('tobacco','No')} /> No</label></div></div><label><span>Cantidad/detalle</span><input name="tobaccoDetail" type="text" value="${escapeHTML(data.tobaccoDetail)}" /></label></div>
        <div class="morbid-item"><div class="radio-question"><span>Alcohol</span><div class="radio-options"><label><input type="radio" name="alcohol" value="Sí" ${radio('alcohol','Sí')} /> Sí</label><label><input type="radio" name="alcohol" value="No" ${radio('alcohol','No')} /> No</label></div></div><label><span>Frecuencia/detalle</span><input name="alcoholDetail" type="text" value="${escapeHTML(data.alcoholDetail)}" /></label></div>
        <div class="morbid-item"><div class="radio-question"><span>Drogas</span><div class="radio-options"><label><input type="radio" name="drugs" value="Sí" ${radio('drugs','Sí')} /> Sí</label><label><input type="radio" name="drugs" value="No" ${radio('drugs','No')} /> No</label></div></div><label><span>Frecuencia/detalle</span><input name="drugsDetail" type="text" value="${escapeHTML(data.drugsDetail)}" /></label></div>
      </div>
      <label><span>Observaciones relevantes para la atención domiciliaria</span><textarea name="generalObservations">${escapeHTML(data.generalObservations)}</textarea></label>
      <div class="admin-actions"><button class="btn btn-primary" type="submit">Guardar datos generales</button></div>
      <p class="admin-message" data-clinical-general-message></p>
    </form>
  `;
}


function professionalClinicalGeneralEditFormHtml(patient = {}) {
  return clinicalGeneralEditFormHtml(patient)
    .replace('data-clinical-general-form', 'data-professional-clinical-general-form')
    .replace('data-clinical-general-message', 'data-professional-clinical-general-message')
    .replace('Editar datos generales de ficha clínica', 'Modificar celdas de ficha clínica')
    .replace('Solo administradores pueden modificar esta información. El profesional la verá como antecedente no editable.', 'Los cambios realizados por el profesional se guardarán al registrar el episodio y quedarán visibles en la ficha clínica general para futuras atenciones.')
    .replace('<div class="admin-actions"><button class="btn btn-primary" type="submit">Guardar datos generales</button></div>', '<p class="field-help professional-draft-help">Edita solo los datos que necesiten corrección. Para confirmar los cambios, guarda el episodio clínico.</p>');
}

function getProfessionalClinicalGeneralDraft(patient = getPatientById(selectedProfessionalPatientId)) {
  const wrapper = $('[data-professional-clinical-edit-wrapper]');
  const form = $('[data-professional-clinical-general-form]');
  if (!patient || !form || !wrapper || wrapper.hidden) return { active: false, changed: false, data: null, changes: [] };
  const currentData = normalizeClinicalGeneralData(patient.clinicalRecord?.generalData || {}, patient);
  const draftData = normalizeClinicalGeneralData(collectClinicalGeneralFormData(form), patient);
  const changes = getClinicalGeneralDataChanges(currentData, draftData);
  return { active: true, changed: changes.length > 0, data: draftData, changes };
}

function setProfessionalClinicalEditVisible(visible) {
  const wrapper = $('[data-professional-clinical-edit-wrapper]');
  const button = $('[data-enable-professional-clinical-edit]');
  const status = $('[data-professional-clinical-general-message]');
  if (!wrapper) return;
  wrapper.hidden = !visible;
  if (button) {
    button.classList.toggle('sent', visible);
    button.textContent = visible ? 'Ocultar modificación de ficha' : 'Modificar celdas de ficha';
  }
  if (status) {
    status.classList.toggle('success', visible);
    status.classList.remove('error');
    status.textContent = visible
      ? 'Modo edición activado. Los cambios se guardarán junto con el episodio clínico.'
      : '';
  }
}

function collectClinicalGeneralFormData(form) {
  const formData = new FormData(form);
  return {
    patientName: formValue(formData, 'patientName'),
    rut: formValue(formData, 'rut'),
    age: formValue(formData, 'age'),
    phone: formValue(formData, 'phone'),
    email: formValue(formData, 'email'),
    mainDiagnosis: formValue(formData, 'mainDiagnosis'),
    serviceReason: formValue(formData, 'serviceReason'),
    currentMedications: formValue(formData, 'currentMedications'),
    hasAllergies: formValue(formData, 'hasAllergies'),
    allergiesDetail: formValue(formData, 'allergiesDetail'),
    morbidHistory: formValue(formData, 'morbidHistory'),
    mobilityDependency: formValue(formData, 'mobilityDependency'),
    supportNetwork: formValue(formData, 'supportNetwork'),
    tobacco: formValue(formData, 'tobacco'),
    tobaccoDetail: formValue(formData, 'tobaccoDetail'),
    alcohol: formValue(formData, 'alcohol'),
    alcoholDetail: formValue(formData, 'alcoholDetail'),
    drugs: formValue(formData, 'drugs'),
    drugsDetail: formValue(formData, 'drugsDetail'),
    generalObservations: formValue(formData, 'generalObservations'),
    morbidTreatment: morbidTreatmentValuesFromForm(form)
  };
}

function clearEvolutionPatientDataFields() {
  if (!evolutionForm) return;
  const keepNames = new Set(['patientId', 'visitDate', 'visitDateOnly', 'visitTimeOnly']);
  $$('input, textarea, select', evolutionForm).forEach((input) => {
    if (!input.name || keepNames.has(input.name)) return;
    if (input.type === 'radio' || input.type === 'checkbox') input.checked = false;
    else input.value = '';
  });
}

function prepareEvolutionFormForPatient(patientId) {
  if (!evolutionForm) return;
  const patient = getPatientById(patientId) || {};
  evolutionForm.reset();
  if (evolutionForm.elements.patientId) evolutionForm.elements.patientId.value = patientId || '';
  setVisitDateTimeFields(localDatetimeValue());
  clearEvolutionPatientDataFields();
  setVisitDateTimeFields(localDatetimeValue());
  const requestedAttention = getPatientAttentionType(patient);
  const requestedVisit = getPatientRequestedVisitType(patient);
  if (requestedAttention && evolutionForm.elements.visitType) {
    evolutionForm.elements.visitType.value = requestedAttention;
    fillSpecificProcedureOptions(requestedAttention, requestedVisit);
    if (requestedVisit && evolutionForm.elements.specificProcedure) evolutionForm.elements.specificProcedure.value = requestedVisit;
  }
  const message = $('[data-evolution-message]');
  if (message) {
    message.textContent = '';
    message.classList.remove('error', 'success');
  }
}

function buildPatientIntakeSummaryForMorbidSection(data = {}) {
  const parts = [];
  if (data.currentMedications) parts.push(`Medicamentos actuales: ${data.currentMedications}`);
  if (data.morbidHistory) parts.push(`Enfermedades o antecedentes importantes: ${data.morbidHistory}`);
  if (data.mobilityDependency) parts.push(`Movilidad y dependencia: ${data.mobilityDependency}`);
  if (data.supportNetwork) parts.push(`Red de apoyo/cuidador principal: ${data.supportNetwork}`);
  if (data.generalObservations) parts.push(`Observaciones domiciliarias: ${data.generalObservations}`);
  return parts.join('\n');
}

function applyPatientIntakeDataToEvolutionForm(patientId, { force = false } = {}) {
  if (!evolutionForm || !patientId) return false;
  const data = getLatestPatientIntakeData(patientId);
  if (!data) return false;

  // Formato procedimiento enfermería/TENS
  setFieldValueIfEmpty('diagnosis', data.mainDiagnosis, force);
  setFieldValueIfEmpty('patientAge', data.age, force);
  setFieldValueIfEmpty('visitReason', data.serviceReason, force);
  setRadioValueIfEmpty('allergies', data.hasAllergies, force);
  setFieldValueIfEmpty('allergiesDetail', data.allergiesDetail, force);

  // Formulario Visita a paciente > Nuevo Episodio
  setFieldValueIfEmpty('newDiagnosis', data.mainDiagnosis, force);
  setFieldValueIfEmpty('newAge', data.age, force);
  setFieldValueIfEmpty('newAdmissionReason', data.serviceReason, force);
  setFieldValueIfEmpty('newLastEpicrisis', data.lastEpicrisis || data.latestEpicrisis || data.epicrisis, force);
  setRadioValueIfEmpty('newTobacco', data.tobacco, force);
  setFieldValueIfEmpty('newTobaccoAmount', data.tobaccoDetail, force);
  setRadioValueIfEmpty('newAlcohol', data.alcohol, force);
  setFieldValueIfEmpty('newAlcoholFrequency', data.alcoholDetail, force);
  setRadioValueIfEmpty('newDrugs', data.drugs, force);
  setFieldValueIfEmpty('newDrugsFrequency', data.drugsDetail, force);
  setRadioValueIfEmpty('newAllergies', data.hasAllergies, force);
  setFieldValueIfEmpty('newAllergiesDetail', data.allergiesDetail, force);

  // Antecedentes entregados por paciente que no tienen campo específico se dejan como observación mórbida general.
  const morbidSummary = buildPatientIntakeSummaryForMorbidSection(data);
  if (morbidSummary) {
    setRadioValueIfEmpty('newOtherMorbid', 'Sí', force);
    setFieldValueIfEmpty('newOtherMorbidObs', morbidSummary, force);
  }

  // Formulario de seguimiento: solo se traspasan datos base reutilizables.
  setFieldValueIfEmpty('followAge', data.age, force);

  updateProcedureConditionalFields();
  updateConditionalDetail('newTobacco', '[data-new-tobacco-detail]');
  updateConditionalDetail('newAlcohol', '[data-new-alcohol-detail]');
  updateConditionalDetail('newDrugs', '[data-new-drugs-detail]');
  updateConditionalDetail('newAllergies', '[data-new-allergies-detail]');

  const message = $('[data-evolution-message]');
  if (message && !message.textContent) {
    message.textContent = 'Antecedentes previos del paciente cargados automáticamente. Puedes ajustar la información antes de guardar la evolución.';
  }
  return true;
}

async function loadAndApplyPatientIntakeData(patientId) {
  if (!patientId) return;
  const currentSelection = selectedProfessionalPatientId;
  const responses = await fetchPatientIntakeResponses(patientId);
  const latest = responses?.[0];
  if (latest?.data) updatePatientClinicalRecordFromIntake(patientId, latest.data, { id: latest.id, createdAt: latest.createdAt, preserveExisting: true });
  if (selectedProfessionalPatientId !== currentSelection || selectedProfessionalPatientId !== patientId) return;
  renderProfessionalClinicalRecord(getPatientById(patientId));
  fillSelectedPatientAutofillFields();
}

function fillSelectedPatientAutofillFields() {
  if (!evolutionForm) return;
  const patient = getPatientById(selectedProfessionalPatientId) || {};
  $$('[data-auto-patient-name]', evolutionForm).forEach((input) => { input.value = patient.name || ''; });
  $$('[data-auto-patient-rut]', evolutionForm).forEach((input) => { input.value = patient.rut || ''; });
  applyPatientIntakeDataToEvolutionForm(patient.id);
}

function updateVisitPatientFormUI() {
  if (!evolutionForm) return;
  const isVisit = isPatientVisitType(evolutionForm.elements.visitType?.value || '');
  const visitSection = $('[data-visit-patient-format]');
  if (!visitSection || !isVisit) return;

  const selectedVisitType = evolutionForm.elements.specificProcedure?.value || '';
  const hasAvailableForm = hasPatientVisitForm(selectedVisitType);
  const isPendingForm = isPatientVisitOptionPending(selectedVisitType);
  const modeSelector = $('[data-visit-mode-selector]');
  const comingSoon = $('[data-visit-form-coming-soon]');
  const newPanel = $('[data-new-patient-visit-format]');
  const followPanel = $('[data-followup-patient-visit-format]');
  const signatureBox = $('[data-visit-signature-box]');

  if (modeSelector) modeSelector.hidden = !hasAvailableForm;
  if (signatureBox) signatureBox.hidden = !hasAvailableForm;
  if (comingSoon) {
    comingSoon.hidden = !isPendingForm;
    const visitLabel = comingSoon.querySelector('[data-pending-visit-type]');
    if (visitLabel) visitLabel.textContent = selectedVisitType || 'Tipo de visita';
  }

  if (!hasAvailableForm) {
    if (newPanel) newPanel.hidden = true;
    if (followPanel) followPanel.hidden = true;
    clearInputsInside('[data-new-patient-visit-format]');
    clearInputsInside('[data-followup-patient-visit-format]');
    if (evolutionForm.elements.visitFormMode) {
      const modes = Array.isArray(evolutionForm.elements.visitFormMode)
        ? evolutionForm.elements.visitFormMode
        : Array.from(evolutionForm.querySelectorAll('[name="visitFormMode"]'));
      Array.from(modes).forEach((input) => { input.checked = false; });
    }
    fillSelectedPatientAutofillFields();
    return;
  }

  let mode = evolutionForm.elements.visitFormMode?.value || '';
  if (!mode) {
    const firstMode = evolutionForm.querySelector('[data-visit-form-mode][value="Nuevo Episodio"]');
    if (firstMode) firstMode.checked = true;
    mode = 'Nuevo Episodio';
  }

  if (newPanel) newPanel.hidden = mode !== 'Nuevo Episodio';
  if (followPanel) followPanel.hidden = mode !== 'Seguimiento de Episodio anterior';

  if (mode !== 'Nuevo Episodio') clearInputsInside('[data-new-patient-visit-format]');
  if (mode !== 'Seguimiento de Episodio anterior') clearInputsInside('[data-followup-patient-visit-format]');
  if (mode === 'Seguimiento de Episodio anterior') renderEpisodeFollowupOptions(selectedProfessionalPatientId);

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
    parentEpisodeId: formValue(formData, 'parentEpisodeId'),
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
  let summary = '';
  const mode = item.visitFormMode || 'Formulario de visita';
  if (mode === 'Nuevo Episodio') {
    summary = [
      item.specificProcedure ? `<p><strong>Tipo de visita:</strong> ${escapeHTML(item.specificProcedure)}</p>` : '',
      item.episodeName ? `<p><strong>Nombre del episodio:</strong> ${escapeHTML(item.episodeName)}</p>` : '',
      `<p><strong>Formulario:</strong> Nuevo Episodio</p>`,
      item.newMedicalIndicationsPlan ? `<p><strong>Plan:</strong> ${escapeHTML(item.newMedicalIndicationsPlan)}</p>` : ''
    ].filter(Boolean).join('');
  } else {
    summary = [
      item.specificProcedure ? `<p><strong>Tipo de visita:</strong> ${escapeHTML(item.specificProcedure)}</p>` : '',
      item.episodeName ? `<p><strong>Episodio base:</strong> ${escapeHTML(item.episodeName)}</p>` : '',
      item.followupNumber ? `<p><strong>Correlativo:</strong> Seguimiento ${escapeHTML(item.followupNumber)}</p>` : '',
      `<p><strong>Formulario:</strong> Seguimiento de Episodio anterior</p>`,
      item.followAdmissionType ? `<p><strong>Motivo:</strong> ${escapeHTML(item.followAdmissionType)}</p>` : '',
      item.followVisitDetail ? `<p><strong>Detalle de visita:</strong> ${escapeHTML(item.followVisitDetail)}</p>` : '',
      item.followMedicalIndicationsPlan ? `<p><strong>Plan:</strong> ${escapeHTML(item.followMedicalIndicationsPlan)}</p>` : ''
    ].filter(Boolean).join('');
  }
  return `${summary}${item.clinicalRecordUpdated ? clinicalRecordChangesHtml(item.clinicalRecordChanges || []) : ''}`;
}

function getEvolutionSummaryHtml(item = {}) {
  if (isProcedureVisitType(item.visitType)) return `${getProcedureSummary(item)}${item.clinicalRecordUpdated ? clinicalRecordChangesHtml(item.clinicalRecordChanges || []) : ''}`;
  if (isPatientVisitType(item.visitType)) return getVisitPatientSummary(item);
  return `
    <p><strong>Objetivo:</strong> ${escapeHTML(item.objective || 'No registrado')}</p>
    ${item.specificProcedure ? `<p><strong>Detalle:</strong> ${escapeHTML(item.specificProcedure)}</p>` : ''}
    <p><strong>Evolución:</strong> ${escapeHTML(item.evolution || 'No registrada')}</p>
    <p><strong>Indicaciones:</strong> ${escapeHTML(item.indications || 'No registradas')}</p>
    ${item.clinicalRecordUpdated ? clinicalRecordChangesHtml(item.clinicalRecordChanges || []) : ''}
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
  const hasType = Boolean(type);
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
  if (genericFormat) genericFormat.hidden = !hasType || isProcedure || isVisit;
  if (vitalSection) vitalSection.hidden = !hasType || isVisit;

  if (!hasType) {
    clearInputsInside('[data-procedure-care-format]');
    clearInputsInside('[data-visit-patient-format]');
    clearInputsInside('[data-attention-format-section]');
  }
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

function fillAdminPatientRequestedVisitOptions(attentionType = '', selectedValue = '') {
  const select = patientForm?.querySelector('[data-admin-patient-visit-select]');
  if (!select) return;
  const options = getRequestedVisitOptionsForAttention(attentionType);
  const placeholder = attentionType ? 'Selecciona tipo de visita/procedimiento' : 'Primero selecciona tipo de atención';
  select.innerHTML = `<option value="">${placeholder}</option>` + options.map((option) => `
    <option value="${escapeHTML(option)}" ${option === selectedValue ? 'selected' : ''}>${escapeHTML(option)}</option>
  `).join('');
  select.disabled = !attentionType;
  if (selectedValue && options.includes(selectedValue)) select.value = selectedValue;
}

function setAdminPatientAttentionFields(patient = {}) {
  const attentionType = getPatientAttentionType(patient);
  const requestedVisitType = getPatientRequestedVisitType(patient);
  const attentionSelect = patientForm?.querySelector('[data-admin-patient-attention-select]');
  if (attentionSelect) attentionSelect.value = attentionType || '';
  fillAdminPatientRequestedVisitOptions(attentionType, requestedVisitType);
}

function resetPatientForm() {
  patientForm?.reset();
  if (patientForm?.elements.id) patientForm.elements.id.value = '';
  setAdminPatientAttentionFields({});
  fillProfessionalSelect(patientForm?.querySelector('[data-patient-professional-select]'));
  setPatientFormSendButtonsEnabled(false);
  renderPatientIntakeSendStatus(null);
  const message = $('[data-patient-message]');
  if (message) message.textContent = '';
}

function getPatientEpisodes(patientId) {
  return getPatientEvolutions(patientId)
    .filter((item) => isPatientVisitType(item.visitType) && item.visitFormMode === 'Nuevo Episodio')
    .sort((a, b) => new Date(a.visitDate || a.createdAt) - new Date(b.visitDate || b.createdAt));
}

function getEvolutionById(evolutionId) {
  return getEvolutions().find((item) => item.id === evolutionId) || null;
}

function getEpisodeFollowups(patientId, episodeId) {
  return getPatientEvolutions(patientId)
    .filter((item) => item.parentEpisodeId === episodeId || item.episodeId === episodeId && item.episodeKind === 'followup')
    .sort((a, b) => new Date(a.visitDate || a.createdAt) - new Date(b.visitDate || b.createdAt));
}

function buildEpisodeName(evolution = {}) {
  const attention = evolution.visitType || 'Atención';
  const visit = evolution.specificProcedure || 'Visita';
  const date = evolution.visitDate ? formatDateTime(evolution.visitDate) : formatDateTime(new Date().toISOString());
  return `${attention} · ${visit} · ${date}`;
}

function getNextFollowupNumber(patientId, episodeId) {
  return getEpisodeFollowups(patientId, episodeId).length + 1;
}

function episodeContextText(item = {}) {
  if (item.episodeKind === 'new') return item.episodeName || buildEpisodeName(item);
  if (item.episodeKind === 'followup') return `${item.episodeName || 'Episodio'} · Seguimiento ${item.followupNumber || ''}`.trim();
  return '';
}

function renderEpisodeFollowupOptions(patientId = selectedProfessionalPatientId) {
  const container = $('[data-episode-followup-options]');
  if (!container) return;
  const episodes = getPatientEpisodes(patientId);
  if (!episodes.length) {
    container.innerHTML = '<div class="clinical-empty-state small">Este paciente aún no tiene episodios anteriores. Primero registra un Nuevo Episodio.</div>';
    return;
  }
  const selected = evolutionForm?.elements.parentEpisodeId?.value || '';
  container.innerHTML = episodes.map((episode, index) => {
    const followups = getEpisodeFollowups(patientId, episode.id);
    return `
      <label class="episode-option ${selected === episode.id ? 'selected' : ''}">
        <input type="radio" name="parentEpisodeId" value="${escapeHTML(episode.id)}" ${selected === episode.id ? 'checked' : ''} data-parent-episode-radio />
        <span>
          <strong>Episodio ${index + 1}: ${escapeHTML(episode.episodeName || buildEpisodeName(episode))}</strong>
          <small>${followups.length} seguimiento(s) registrado(s). Próximo correlativo: Seguimiento ${followups.length + 1}</small>
        </span>
      </label>
    `;
  }).join('');
}

function renderProfessionalClinicalRecord(patient = getPatientById(selectedProfessionalPatientId)) {
  const box = $('[data-professional-clinical-record]');
  if (!box || !patient) return;
  const data = getPatientClinicalGeneralData(patient.id);
  const episodes = getPatientEpisodes(patient.id);
  box.innerHTML = `
    <section class="clinical-form-section clinical-record-readonly">
      <div class="clinical-section-title">
        <h4>Ficha clínica · Datos generales del paciente</h4>
        <p>Antecedentes generales provenientes del formulario de ingreso. El profesional puede corregir esta información antes de guardar un episodio; el cambio quedará trazado en el historial.</p>
      </div>
      ${clinicalGeneralDataDisplayHtml(data)}
      <div class="episode-mini-summary">
        <strong>Episodios registrados:</strong> ${episodes.length ? `${episodes.length} episodio(s)` : 'Sin episodios anteriores'}
      </div>
      <div class="admin-actions clinical-record-prof-actions">
        <button class="mini-btn dark" type="button" data-enable-professional-clinical-edit>Modificar celdas de ficha</button>
      </div>
      <div class="professional-clinical-edit-wrapper" data-professional-clinical-edit-wrapper hidden>
        ${professionalClinicalGeneralEditFormHtml(patient)}
      </div>
    </section>
  `;
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
    const episodes = getPatientEpisodes(patient.id);
    return `
      <article class="admin-row ${patient.id === selectedAdminPatientId ? 'selected' : ''}" data-patient-id="${escapeHTML(patient.id)}">
        <div class="admin-row-header">
          <div>
            <strong>${escapeHTML(patient.name)}</strong>
            <small>${escapeHTML(getPatientServiceLabel(patient))}</small>
          </div>
          ${clinicalRecordStatusHtml(patient)}
        </div>
        <p><strong>RUT/ID:</strong> ${escapeHTML(patient.rut || 'No indicado')}</p>
        <p><strong>Teléfono:</strong> ${escapeHTML(patient.phone || 'No indicado')}</p>
        <p><strong>Correo:</strong> ${escapeHTML(patient.email || 'No indicado')}</p>
        <p><strong>Profesional prestador:</strong> ${escapeHTML(professionalFullName(professional || {}) || 'Sin asignar')}</p>
        <p><strong>Administrador supervisor:</strong> ${escapeHTML(supervisorName)}</p>
        <p><strong>Episodios:</strong> ${episodes.length} · <strong>Atenciones/evoluciones:</strong> ${evolutions.length}</p>
        <div class="admin-row-actions">
          <button class="mini-btn" type="button" data-edit-patient="${escapeHTML(patient.id)}">Editar</button>
          ${patientIntakeChannelButtonsHtml(patient)}
          <button class="mini-btn dark" type="button" data-view-patient-record="${escapeHTML(patient.id)}">Ver ficha clínica</button>
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
  const episodes = getPatientEpisodes(patient.id);
  const clinicalData = getPatientClinicalGeneralData(patient.id);
  const evolutionHtml = evolutions.length ? evolutions.map((item) => `
    <article class="clinical-record-item ${item.episodeKind ? 'episode-linked' : ''}">
      <div class="admin-row-header">
        <div>
          <strong>${escapeHTML(item.episodeKind === 'followup' ? `Seguimiento ${item.followupNumber || ''}` : item.episodeName || item.visitType || 'Evolución clínica')}</strong>
          <small>${formatDateTime(item.visitDate || item.createdAt)}${episodeContextText(item) ? ` · ${escapeHTML(episodeContextText(item))}` : ''}</small>
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
      <article><span>Correo</span><strong>${escapeHTML(patient.email || 'No indicado')}</strong></article>
      <article><span>Servicio solicitado</span><strong>${escapeHTML(getPatientServiceLabel(patient))}</strong></article>
      <article><span>Profesional prestador</span><strong>${escapeHTML(professionalFullName(professional))}</strong></article>
      <article><span>Administrador supervisor</span><strong>${escapeHTML(getProfessionalSupervisorName(professional))}</strong></article>
    </div>
    <div class="clinical-documents">
      <h4>Ficha clínica · Datos generales</h4>
      <div data-clinical-general-readonly>${clinicalGeneralDataDisplayHtml(clinicalData)}</div>
      ${clinicalGeneralEditFormHtml(patient)}
    </div>
    <div class="clinical-documents"><h4>Formulario previo del paciente</h4><div data-patient-intake-responses><p>Cargando formularios previos...</p></div></div>
    <div class="clinical-evolutions"><h4>Episodios y atenciones</h4>
      <div class="episode-mini-summary"><strong>Episodios creados:</strong> ${episodes.length}</div>
      ${evolutionHtml}
    </div>
  `;
  $$('[data-patient-id]').forEach((row) => row.classList.toggle('selected', row.dataset.patientId === selectedAdminPatientId));
  renderPatientIntakeResponses(patient.id);
}

function getCurrentProfessional() {
  const session = storageGet(DOMUS_STORAGE_KEYS.professionalSession, null);
  if (!session?.id) return null;
  return getProfessionals().find((professional) => professional.id === session.id) || null;
}

function setCurrentProfessional(professional) {
  if (professional) storageSet(DOMUS_STORAGE_KEYS.professionalSession, { id: professional.id, loggedAt: new Date().toISOString() });
  else window.sessionStorage.removeItem(DOMUS_STORAGE_KEYS.professionalSession);
}

function openProfessional() {
  if (!professionalShell) return;
  markInternalVisitor('professional');
  professionalShell.hidden = false;
  document.body.classList.add('professional-open');
  renderProfessionalState();
}

function closeProfessional() {
  if (!professionalShell) return;
  professionalShell.hidden = true;
  professionalShell.classList.remove('is-authenticated');
  document.body.classList.remove('professional-open');
}

function renderProfessionalState() {
  const current = getCurrentProfessional();
  if (current) {
    professionalShell?.classList.add('is-authenticated');
    professionalLogin.hidden = true;
    professionalLogin.style.display = 'none';
    professionalApp.hidden = false;
    professionalApp.style.display = '';
    $('[data-professional-current-user]').textContent = `${current.name} (${current.username})`;
    professionalShell?.querySelector('.admin-panel')?.scrollTo({ top: 0, left: 0 });
    const supervisor = $('[data-professional-supervisor]');
    if (supervisor) {
      supervisor.textContent = current.type === 'service'
        ? getProfessionalSupervisorName(current)
        : `${current.name} (equipo Domus)`;
    }
    renderProfessionalPatients();
  } else {
    professionalShell?.classList.remove('is-authenticated');
    professionalLogin.hidden = false;
    professionalLogin.style.display = '';
    professionalApp.hidden = true;
    professionalApp.style.display = 'none';
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
      <span>${escapeHTML(getPatientServiceLabel(patient))}</span>
      <small>${escapeHTML(patient.rut || 'Sin RUT/ID')} · ${getPatientEpisodes(patient.id).length} episodio(s) · ${getPatientEvolutions(patient.id).length} atención(es)</small>
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
  $('[data-selected-patient-info]').textContent = `${getPatientServiceLabel(patient)} · ${patient.rut || 'Sin RUT/ID'}`;
  renderProfessionalClinicalRecord(patient);
  prepareEvolutionFormForPatient(patient.id);
  fillSelectedPatientAutofillFields();
  updateAttentionTypeUI();
  renderEvolutionHistory(patient.id);
  loadAndApplyPatientIntakeData(patient.id);
}

function resetEvolutionForm() {
  if (!evolutionForm) return;
  const patientId = evolutionForm.elements.patientId.value || selectedProfessionalPatientId || '';
  evolutionForm.reset();
  evolutionForm.elements.patientId.value = patientId;
  setVisitDateTimeFields(localDatetimeValue());
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

function printLogoUrl() {
  try {
    return new URL('assets/logo-domus-header.png', window.location.href).toString();
  } catch (_) {
    return 'assets/logo-domus-header.png';
  }
}

function printBrandHeader(title, subtitle = 'Cuidado clínico en tu hogar', metaHtml = '') {
  return `
    <header class="brand-header">
      <div class="brand-main">
        <img class="brand-logo" src="${printLogoUrl()}" alt="Domus Salud" />
        <div>
          <h1>${escapeHTML(title)}</h1>
          <p class="brand-subtitle">${escapeHTML(subtitle)}</p>
        </div>
      </div>
      ${metaHtml ? `<div class="brand-meta">${metaHtml}</div>` : ''}
    </header>
  `;
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
        @page{size:A4;margin:14mm}
        *{box-sizing:border-box}
        body{font-family:Arial,Helvetica,sans-serif;color:#172334;margin:0;line-height:1.5;background:#EEF7F2}
        .document-page{max-width:960px;margin:22px auto;background:#fff;border:1px solid #D9E5E5;border-radius:22px;padding:28px;box-shadow:0 18px 45px rgba(0,58,120,.10)}
        .brand-header{display:flex;justify-content:space-between;gap:24px;align-items:center;background:linear-gradient(135deg,#003A78,#005A9C);color:#fff;border-radius:20px;padding:20px 22px;margin:0 0 24px;border:0}
        .brand-main{display:flex;align-items:center;gap:18px}.brand-logo{width:92px;height:92px;object-fit:contain;background:#fff;border-radius:18px;padding:8px}.brand-header h1{color:#fff;margin:0;font-size:26px;line-height:1.1}.brand-subtitle{margin:6px 0 0;color:#EAF6EE;font-weight:700}.brand-meta{font-size:13px;text-align:right;color:#F4FAF5;min-width:190px}
        h1{color:#003A78;margin:0;font-size:24px} h2{color:#003A78;margin:28px 0 12px;font-size:17px;border-left:6px solid #46A92D;padding-left:10px;line-height:1.2}.muted{color:#667085}
        .box{border:1px solid #D9E5E5;border-radius:16px;padding:16px;margin:12px 0;background:#FAFCFC}.grid{display:grid;grid-template-columns:1fr 1fr;gap:12px}.field{background:#fff;border:1px solid #E4ECEC;border-radius:12px;padding:10px 12px;min-height:58px}.field strong{display:block;color:#002653;font-size:11px;text-transform:uppercase;letter-spacing:.07em;margin-bottom:4px}
        .footer{margin-top:32px;border-top:1px solid #D9E5E5;padding-top:12px;color:#667085;font-size:12px}.clinical-summary-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:10px;margin:10px 0}.clinical-summary-grid article{border:1px solid #D9E5E5;border-radius:14px;padding:12px;background:#FAFCFC}.clinical-summary-grid span{display:block;color:#667085;font-size:11px;font-weight:700;text-transform:uppercase}.clinical-summary-grid strong{display:block;color:#002653}.clinical-notes,.clinical-record-item{border:1px solid #D9E5E5;border-radius:16px;padding:14px;margin:12px 0;background:#FAFCFC}.clinical-documents{break-inside:avoid}.status-pill{display:none}
        .print-actions{position:sticky;top:0;background:#fff;border-bottom:1px solid #D9E5E5;padding:10px 18px;margin-bottom:0;display:flex;gap:10px;justify-content:flex-end;z-index:5}.print-actions button{border:0;border-radius:999px;background:#003A78;color:#fff;padding:10px 16px;font-weight:700;cursor:pointer}.print-actions button:hover{filter:brightness(.96)}
        .signature-print{margin-top:36px;min-height:120px}.signature-line{border-top:1.5px solid #172334;margin:42px 0 8px;max-width:320px}
        @media (max-width:720px){.document-page{margin:0;border:0;border-radius:0;padding:18px}.brand-header{display:grid;text-align:left}.brand-main{display:grid}.brand-meta{text-align:left}.grid,.clinical-summary-grid{grid-template-columns:1fr}}
        @media print{body{background:#fff}.document-page{box-shadow:none;border:0;margin:0;padding:0}.print-actions{display:none}.no-print{display:none}.brand-header{border-radius:0}.box,.field,.clinical-record-item{break-inside:avoid}}
      </style>
    </head>
    <body>
      <div class="print-actions"><button onclick="window.print()">Imprimir o guardar PDF</button></div>
      <main class="document-page">${bodyHtml}</main>
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
    <h2>Formulario de Nuevo Episodio</h2>
    <h2>1. Examen físico · Control de signos vitales</h2>
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
    ${pdfBox('2. Indicaciones médicas / Plan de enfermería', evolution.newMedicalIndicationsPlan)}
  `;
}

function followupVisitReportSection(evolution) {
  return `
    <h2>Formulario de Seguimiento de Episodio anterior</h2>
    <h2>1. Motivo del seguimiento</h2>
    <section class="box grid">
      ${pdfField('Motivo del seguimiento', evolution.followAdmissionType)}
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
  if (evolution.specificProcedure && !hasPatientVisitForm(evolution.specificProcedure)) {
    return `
      <h2>Datos de la visita</h2>
      <section class="box grid">
        ${pdfField('Tipo de visita', evolution.specificProcedure)}
        ${pdfField('Estado del formulario', 'Estamos trabajando en este formulario')}
      </section>
    `;
  }
  const body = evolution.visitFormMode === 'Seguimiento de Episodio anterior'
    ? followupVisitReportSection(evolution)
    : newPatientVisitReportSection(evolution);
  return `
    <h2>Datos de la visita</h2>
    <section class="box grid">
      ${pdfField('Tipo de visita', evolution.specificProcedure)}
      ${pdfField('Formulario', evolution.visitFormMode)}
      ${pdfField('Episodio', evolution.episodeName || '')}
      ${pdfField('Correlativo', evolution.sequenceLabel || '')}
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
    ${printBrandHeader('Evolución clínica', 'Domus Salud · Cuidado clínico en tu hogar', `Fecha de emisión:<br><strong>${formatDateTime(new Date().toISOString())}</strong>`)}
    <section class="box grid">
      ${pdfField('Paciente', patient.name)}
      ${pdfField('RUT/ID', patient.rut)}
      ${pdfField('Servicio', getPatientServiceLabel(patient))}
      ${pdfField('Profesional', professionalFullName(professional))}
      ${pdfField('RUT profesional', professional.rut)}
      ${pdfField('Administrador supervisor', getProfessionalSupervisorName(professional))}
      ${pdfField('Fecha visita', formatDateTime(evolution.visitDate || evolution.createdAt))}
      ${pdfField('Tipo de atención', evolution.visitType)}
      ${pdfField('Tipo de visita/procedimiento', evolution.specificProcedure)}
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
    ${evolution.clinicalRecordUpdated ? clinicalRecordChangesPdfHtml(evolution.clinicalRecordChanges || []) : ''}
    <div class="footer">Documento generado desde el panel profesional de Domus Salud. Este registro debe ser resguardado conforme a los procedimientos internos y normativa aplicable.</div>
  `;
}

function downloadEvolutionPdf(evolutionId) {
  const evolution = getEvolutions().find((item) => item.id === evolutionId);
  if (!evolution) return;
  printWindow('Evolución clínica Domus Salud', evolutionReportHtml(evolution));
}

async function downloadPatientHistoryPdf(patientId) {
  const patient = getPatientById(patientId);
  if (!patient) return;
  const professional = getServiceProfessionalById(patient.professionalId) || getProfessionalById(patient.professionalId) || {};
  const evolutions = getPatientEvolutions(patientId);
  const intakeResponses = await fetchPatientIntakeResponses(patientId);
  const intakeHtml = intakeResponses.length
    ? intakeResponses.map((response) => `<h2>Formulario previo del paciente · ${formatDateTime(response.createdAt)}</h2>${patientIntakeResponseHtml(response)}`).join('')
    : '<div class="box">No existe formulario previo enviado por el paciente.</div>';
  const items = evolutions.length
    ? evolutions.map((evolution) => `<h2>${formatDateTime(evolution.visitDate || evolution.createdAt)} · ${printableText(evolution.visitType)}</h2>${evolutionReportHtml(evolution)}`).join('<div style="page-break-after:always"></div>')
    : '<div class="box">No existen evoluciones registradas para este paciente.</div>';
  const clinicalData = getPatientClinicalGeneralData(patientId);
  printWindow(`Historial clínico ${patient.name}`, `
    ${printBrandHeader('Ficha clínica del paciente', `${patient.name || 'Paciente'} · ${getPatientServiceLabel(patient)}`, `Profesional asignado:<br><strong>${printableText(professionalFullName(professional))}</strong><br>Supervisor:<br><strong>${printableText(getProfessionalSupervisorName(professional))}</strong>`)}
    <h2>Datos generales de ficha clínica</h2>
    ${clinicalGeneralDataDisplayHtml(clinicalData)}
    <h2>Antecedentes previos completados por paciente</h2>
    ${intakeHtml}
    ${items}
  `);
}

function renderAdminState() {
  const current = getCurrentAdmin();
  if (current) {
    adminShell?.classList.add('is-authenticated');
    adminLogin.hidden = true;
    adminLogin.style.display = 'none';
    adminApp.hidden = false;
    adminApp.style.display = '';
    $('[data-admin-current-user]').textContent = `${current.name} (${current.username})`;
    adminShell?.querySelector('.admin-panel')?.scrollTo({ top: 0, left: 0 });
    renderAdminDashboard();
    renderAdminUsers();
    renderTeamAdmin();
    renderPatientsAdmin();
    renderAdminClinicalRecords();
    renderPatientIntakeTemplateAdmin();
    renderServiceProfessionalsAdmin();
    renderTestimonialsAdmin();
    renderSlidesAdmin();
  } else {
    adminShell?.classList.remove('is-authenticated');
    adminLogin.hidden = false;
    adminLogin.style.display = '';
    adminApp.hidden = true;
    adminApp.style.display = 'none';
  }
}

function renderAdminDashboard() {
  if (!adminShell || adminShell.hidden) return;
  const stats = getStats();
  const fallbackMap = {
    visits: stats.visits || 0,
    clicks: stats.clicks || 0,
    submissions: stats.submissions || 0,
    sessions: 0,
    whatsapp: 0,
    patientForms: 0
  };
  Object.entries(fallbackMap).forEach(([key, value]) => {
    const el = $(`[data-stat="${key}"]`);
    if (el && !Number(el.textContent.replace(/\D/g, ''))) el.textContent = Number(value).toLocaleString('es-CL');
  });

  renderAnalyticsDashboard();

  const list = $('[data-leads-list]');
  if (!list) return;
  const leads = getLeads();
  if (!leads.length) {
    list.innerHTML = '<div class="admin-row"><p>Aún no hay solicitudes registradas en Supabase.</p></div>';
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
  recordAdminLoginAnalytics(user).then(() => renderAdminDashboard());
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

$('[data-admin-clinical-records]')?.addEventListener('submit', (event) => {
  const form = event.target.closest?.('[data-clinical-general-form]');
  if (!form) return;
  event.preventDefault();
  const patientId = form.dataset.patientId || selectedAdminPatientId;
  const updated = updatePatientClinicalRecordGeneral(patientId, collectClinicalGeneralFormData(form));
  selectedAdminPatientId = patientId;
  renderPatientsAdmin();
  renderProfessionalPatients();
  const message = $('[data-clinical-general-message]');
  if (message) {
    message.classList.toggle('success', Boolean(updated));
    message.classList.toggle('error', !updated);
    message.textContent = updated ? 'Datos generales de ficha clínica guardados en Supabase.' : 'No se pudo actualizar la ficha clínica.';
  }
});

$('[data-visit-type-select]')?.addEventListener('change', () => {
  updateAttentionTypeUI();
});

$('[data-specific-procedure-select]')?.addEventListener('change', () => {
  updateVisitPatientFormUI();
});

$$('[data-allergies-radio], [data-medical-order-radio]').forEach((radio) => {
  radio.addEventListener('change', updateProcedureConditionalFields);
});

$$('[data-visit-form-mode], [data-visit-conditional]').forEach((input) => {
  input.addEventListener('change', updateVisitPatientFormUI);
});

patientForm?.querySelector('[data-admin-patient-attention-select]')?.addEventListener('change', (event) => {
  fillAdminPatientRequestedVisitOptions(event.target.value, '');
});

$('[data-reset-patient-form]')?.addEventListener('click', resetPatientForm);
$$('[data-send-intake-from-form-channel]').forEach((button) => {
  button.addEventListener('click', () => {
    const patientId = patientForm?.elements.id?.value || '';
    const channel = button.dataset.sendIntakeFromFormChannel || 'whatsapp';
    sendPatientIntakeFormToPatient(patientId, channel);
  });
});

patientForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(patientForm);
  const id = (formData.get('id') || '').toString();
  const existingPatient = getPatientById(id) || {};
  const attentionType = (formData.get('attentionType') || '').toString().trim();
  const requestedVisitType = (formData.get('requestedVisitType') || '').toString().trim();
  const patient = {
    id: id || makeId('patient'),
    name: (formData.get('patientName') || '').toString().trim(),
    rut: (formData.get('rut') || '').toString().trim(),
    phone: (formData.get('phone') || '').toString().trim(),
    email: (formData.get('email') || '').toString().trim(),
    attentionType,
    requestedVisitType,
    service: buildRequestedServiceLabel(attentionType, requestedVisitType),
    professionalId: (formData.get('professionalId') || '').toString().trim(),
    status: existingPatient.status || 'Activo',
    clinicalRecord: existingPatient.clinicalRecord || null,
    intakeToken: (existingPatient.intakeToken || makeId('intake').replace('intake-', '')),
    updatedAt: new Date().toISOString()
  };
  const message = $('[data-patient-message]');
  if (!patient.name || !patient.attentionType || !patient.requestedVisitType || !patient.professionalId) return;
  let patients = getPatients();
  if (id) {
    patients = patients.map((item) => item.id === id ? { ...item, ...patient } : item);
  } else {
    patient.createdAt = new Date().toISOString();
    patients.unshift(patient);
  }
  savePatients(patients);
  const savedPatient = getPatientById(patient.id) || patient;
  if (patientForm.elements.id) patientForm.elements.id.value = patient.id;
  setPatientFormSendButtonsEnabled(true);
  renderPatientIntakeSendStatus(savedPatient);
  renderPatientsAdmin();
  renderProfessionalPatients();
  if (message) message.textContent = 'Paciente guardado y asignado correctamente. Ya puedes enviar el formulario previo al paciente.';
});

$('[data-patients-list]')?.addEventListener('click', (event) => {
  const editId = event.target.closest?.('[data-edit-patient]')?.dataset.editPatient;
  const deleteId = event.target.closest?.('[data-delete-patient]')?.dataset.deletePatient;
  const pdfId = event.target.closest?.('[data-admin-patient-pdf]')?.dataset.adminPatientPdf;
  const recordId = event.target.closest?.('[data-view-patient-record]')?.dataset.viewPatientRecord;
  const sendIntakeButton = event.target.closest?.('[data-send-intake-patient][data-send-intake-channel]');
  const sendIntakeId = sendIntakeButton?.dataset.sendIntakePatient;

  if (sendIntakeId) {
    sendPatientIntakeFormToPatient(sendIntakeId, sendIntakeButton.dataset.sendIntakeChannel || 'whatsapp');
    return;
  }

  if (editId) {
    const patient = getPatientById(editId);
    if (!patient || !patientForm) return;
    patientForm.elements.id.value = patient.id;
    patientForm.elements.patientName.value = patient.name || '';
    patientForm.elements.rut.value = patient.rut || '';
    patientForm.elements.phone.value = patient.phone || '';
    if (patientForm.elements.email) patientForm.elements.email.value = patient.email || '';
    setAdminPatientAttentionFields(patient);
    fillProfessionalSelect(patientForm.querySelector('[data-patient-professional-select]'), patient.professionalId || '');
    patientForm.elements.professionalId.value = patient.professionalId || '';
    setPatientFormSendButtonsEnabled(true);
    renderPatientIntakeSendStatus(patient);
    patientForm.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }

  if (deleteId) {
    const patient = getPatientById(deleteId);
    if (!patient) return;
    if (!confirm(`¿Eliminar a ${patient.name} y sus evoluciones registradas?`)) return;
    savePatients(getPatients().filter((item) => item.id !== deleteId));
    saveEvolutions(getEvolutions().filter((item) => item.patientId !== deleteId));
    savePatientIntakeResponses(getPatientIntakeResponses().filter((item) => item.patientId !== deleteId));
    renderPatientsAdmin();
    renderProfessionalPatients();
  }

  if (recordId) {
    selectedAdminPatientId = recordId;
    renderAdminClinicalRecords(recordId);
  }
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
  recordProfessionalLoginAnalytics(professional);
  professionalLoginForm.reset();
  renderProfessionalState();
});


document.addEventListener('click', (event) => {
  if (event.target?.closest?.('[data-enable-professional-clinical-edit]')) {
    const wrapper = $('[data-professional-clinical-edit-wrapper]');
    setProfessionalClinicalEditVisible(Boolean(wrapper?.hidden));
  }
});

document.addEventListener('submit', (event) => {
  if (event.target?.matches?.('[data-professional-clinical-general-form]')) {
    event.preventDefault();
    const message = $('[data-professional-clinical-general-message]');
    if (message) {
      message.classList.remove('error');
      message.classList.add('success');
      message.textContent = 'Cambios preparados. Para aplicarlos definitivamente, guarda el episodio clínico.';
    }
  }
});

$('[data-professional-patients]')?.addEventListener('click', (event) => {
  const patientId = event.target.closest?.('[data-select-professional-patient]')?.dataset.selectProfessionalPatient;
  if (patientId) selectProfessionalPatient(patientId);
});

$('[data-reset-evolution-form]')?.addEventListener('click', resetEvolutionForm);

$$('[name="visitDateOnly"], [name="visitTimeOnly"]', evolutionForm || document).forEach((field) => {
  field.addEventListener('change', syncHiddenVisitDateTime);
});

evolutionForm?.addEventListener('change', (event) => {
  if (event.target?.matches?.('[data-parent-episode-radio]')) {
    renderEpisodeFollowupOptions(selectedProfessionalPatientId);
  }
});

evolutionForm?.addEventListener('submit', async (event) => {
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
    visitDate: buildVisitDateTimeFromParts(formData),
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

  const clinicalDraft = getProfessionalClinicalGeneralDraft(patient);
  const activeClinicalData = clinicalDraft.changed
    ? clinicalDraft.data
    : (getPatientClinicalGeneralData(patientId) || normalizeClinicalGeneralData({}, patient));

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
    if (!hasPatientVisitForm(evolution.specificProcedure)) {
      alert('Estamos trabajando en este formulario. Por ahora no es posible guardar este tipo de visita.');
      return;
    }
    if (!evolution.visitFormMode) {
      alert('Debes marcar si corresponde a Nuevo Episodio o Seguimiento de Episodio anterior.');
      return;
    }
    if (evolution.visitFormMode === 'Nuevo Episodio') {
      evolution.objective = activeClinicalData.serviceReason || evolution.specificProcedure || 'Nuevo episodio clínico';
      evolution.evolution = `Nuevo episodio clínico asociado a ${evolution.specificProcedure || 'visita a paciente'}.`;
      evolution.procedures = evolution.specificProcedure;
      evolution.indications = evolution.newMedicalIndicationsPlan;
      evolution.episodeKind = 'new';
      evolution.episodeId = evolution.id;
      evolution.episodeName = buildEpisodeName(evolution);
      evolution.sequenceLabel = 'Nuevo Episodio';
      evolution.sequenceNumber = 1;
    } else {
      if (!evolution.parentEpisodeId) {
        alert('Debes seleccionar el episodio anterior al que corresponde este seguimiento.');
        return;
      }
      const parentEpisode = getEvolutionById(evolution.parentEpisodeId);
      if (!parentEpisode) {
        alert('No se encontró el episodio anterior seleccionado. Actualiza la vista e intenta nuevamente.');
        return;
      }
      if (!evolution.followAdmissionType || !evolution.followVisitDetail) {
        alert('Completa motivo de ingreso y detalle de la visita de seguimiento antes de guardar.');
        return;
      }
      evolution.episodeKind = 'followup';
      evolution.episodeId = parentEpisode.episodeId || parentEpisode.id;
      evolution.episodeName = parentEpisode.episodeName || buildEpisodeName(parentEpisode);
      evolution.followupNumber = getNextFollowupNumber(patientId, evolution.parentEpisodeId);
      evolution.sequenceNumber = evolution.followupNumber + 1;
      evolution.sequenceLabel = `Seguimiento ${evolution.followupNumber}`;
      evolution.objective = evolution.followAdmissionType;
      evolution.evolution = evolution.followVisitDetail;
      evolution.procedures = evolution.specificProcedure;
      evolution.indications = evolution.followMedicalIndicationsPlan;
    }
  } else if (!evolution.objective || !evolution.evolution) {
    alert('Completa el motivo y la evolución clínica antes de guardar.');
    return;
  }
  let clinicalRecordPersisted = true;
  let evolutionPersisted = true;

  if (clinicalDraft.changed) {
    const updatedAt = new Date().toISOString();
    updatePatientClinicalRecordGeneral(patientId, clinicalDraft.data);
    clinicalRecordPersisted = await persistCachedStateKey(DOMUS_STORAGE_KEYS.patients);
    evolution.clinicalRecordUpdated = true;
    evolution.clinicalRecordUpdatedAt = updatedAt;
    evolution.clinicalRecordUpdatedBy = professionalFullName(current);
    evolution.clinicalRecordChanges = clinicalDraft.changes;
  }
  evolution.clinicalRecordSnapshot = getPatientClinicalGeneralData(patientId);

  saveEvolutions([evolution, ...getEvolutions()]);
  evolutionPersisted = await persistCachedStateKey(DOMUS_STORAGE_KEYS.evolutions);

  const message = $('[data-evolution-message]');
  renderProfessionalClinicalRecord(getPatientById(patientId));
  resetEvolutionForm();
  renderEvolutionHistory(patientId);
  renderProfessionalPatients();
  renderPatientsAdmin();
  if (message) {
    const persistenceWarning = (!clinicalRecordPersisted || !evolutionPersisted)
      ? ' Revisa la conexión con Supabase, porque no se pudo confirmar completamente la sincronización.'
      : '';
    message.classList.toggle('error', !clinicalRecordPersisted || !evolutionPersisted);
    message.classList.toggle('success', clinicalRecordPersisted && evolutionPersisted);
    message.textContent = evolution.clinicalRecordUpdated
      ? `Evolución guardada correctamente. La ficha clínica general fue actualizada para futuros episodios y el cambio quedó registrado en el historial.${persistenceWarning}`
      : `Evolución guardada correctamente.${persistenceWarning}`;
  }
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


patientIntakeTemplateForm?.addEventListener('submit', (event) => {
  event.preventDefault();
  const formData = new FormData(patientIntakeTemplateForm);
  const intro = formValue(formData, 'intro');
  const questions = formValue(formData, 'questions')
    .split('\n')
    .map((line) => line.trim())
    .filter(Boolean)
    .map((label, index) => ({ id: `custom${index + 1}`, label }));
  savePatientIntakeTemplate({ intro, questions });
  const message = $('[data-intake-template-message]');
  if (message) message.textContent = 'Plantilla guardada correctamente.';
  renderPatientIntakeTemplateAdmin();
});

$('[data-reset-intake-template]')?.addEventListener('click', () => {
  if (!confirm('¿Restaurar la plantilla base del formulario para pacientes?')) return;
  savePatientIntakeTemplate(DEFAULT_PATIENT_INTAKE_TEMPLATE);
  renderPatientIntakeTemplateAdmin();
  const message = $('[data-intake-template-message]');
  if (message) message.textContent = 'Plantilla base restaurada.';
});

$('[data-preview-intake-template]')?.addEventListener('click', () => {
  printWindow('Formulario previo para pacientes Domus Salud', `
    <header>
      <div><h1>Domus Salud · Formulario previo para pacientes</h1><p class="muted">Vista referencial del formulario que recibirá el paciente.</p></div>
    </header>
    <section class="box"><strong>1. Identificación del paciente</strong><br>Nombre completo · RUT / Identificador · Edad · Teléfono de contacto · Correo electrónico.</section>
    <section class="box"><strong>2. Antecedentes básicos de salud</strong><br>Diagnóstico principal · Motivo de solicitud o ingreso · Medicamentos actuales · Alergias y detalle · Enfermedades o antecedentes importantes · Movilidad y dependencia · Red de apoyo o cuidador principal.</section>
    <section class="box"><strong>3. Antecedentes mórbidos / Tratamiento</strong><br>HTA · Diabetes · Resistencia a la insulina · ACV/TIA/HIC · CV-ICC · Cardiopatía coronaria · Arritmia · LCFA · Otros.</section>
    <section class="box"><strong>4. Hábitos y observaciones</strong><br>Tabaco · Alcohol · Drogas · Observaciones relevantes para la atención domiciliaria.</section>
    <section class="box"><strong>Consentimiento</strong><br>Confirmo que la información entregada es correcta y autorizo su uso para preparar la atención domiciliaria de Domus Salud.</section>
  `);
});

$$('[data-intake-allergies-radio]').forEach((radio) => {
  radio.addEventListener('change', updatePatientIntakeAllergiesField);
});

patientIntakeForm?.addEventListener('input', updatePatientIntakeCompletionState);
patientIntakeForm?.addEventListener('change', updatePatientIntakeCompletionState);

$('[data-intake-return]')?.addEventListener('click', (event) => {
  if (patientIntakeForm?.dataset.submitted === 'true') return;
  updatePatientIntakeCompletionState();
  if (!isPatientIntakeComplete()) {
    event.preventDefault();
    const message = $('[data-patient-intake-message]');
    if (message) {
      message.classList.add('error');
      message.textContent = 'Completa todos los campos obligatorios antes de volver a la página principal.';
    }
    patientIntakeForm.reportValidity();
  }
});

window.addEventListener('beforeunload', (event) => {
  if (!patientIntakeShell || patientIntakeShell.hidden || patientIntakeForm?.dataset.submitted === 'true') return;
  if (!isPatientIntakeComplete()) {
    event.preventDefault();
    event.returnValue = '';
  }
});


function getPatientIntakeInvalidFields() {
  if (!patientIntakeForm) return [];
  updatePatientIntakeAllergiesFieldWithoutLoop();
  return Array.from(patientIntakeForm.querySelectorAll('input, textarea, select'))
    .filter((field) => !field.disabled && field.willValidate && !field.checkValidity());
}

function showPatientIntakeValidationMessage() {
  const message = $('[data-patient-intake-message]');
  const invalidFields = getPatientIntakeInvalidFields();
  if (!invalidFields.length) return true;
  if (message) {
    message.classList.add('error');
    message.classList.remove('success');
    message.textContent = `Faltan ${invalidFields.length} campo(s) obligatorio(s). Completa todos los antecedentes antes de enviar. Si un dato no aplica, escribe “No aplica”.`;
  }
  const firstInvalid = invalidFields[0];
  firstInvalid.closest('.clinical-form-section')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  setTimeout(() => {
    firstInvalid.focus({ preventScroll: true });
    patientIntakeForm.reportValidity();
  }, 250);
  return false;
}


let patientIntakeSubmitting = false;

async function handlePatientIntakeSubmit(event) {
  event?.preventDefault?.();
  if (!patientIntakeForm || patientIntakeSubmitting) return;
  updatePatientIntakeAllergiesFieldWithoutLoop();
  if (!showPatientIntakeValidationMessage()) {
    updatePatientIntakeCompletionState();
    return;
  }

  const message = $('[data-patient-intake-message]');
  const submitButton = $('[data-intake-submit]', patientIntakeForm) || patientIntakeForm.querySelector('button[type="submit"]');
  const formData = new FormData(patientIntakeForm);
  const response = {
    id: makeId('intake-response'),
    patientId: formValue(formData, 'patientId'),
    token: formValue(formData, 'token'),
    patientName: formValue(formData, 'patientName'),
    patientRut: formValue(formData, 'rut'),
    createdAt: new Date().toISOString(),
    data: collectPatientIntakeData()
  };

  patientIntakeSubmitting = true;
  if (message) {
    message.classList.remove('error');
    message.classList.remove('success');
    message.textContent = 'Enviando antecedentes, por favor espera...';
  }
  disabledButton(submitButton, true, 'Enviando...');

  let ok = false;
  try {
    ok = await savePatientIntakeResponse(response);
  } catch (error) {
    console.error('Error inesperado al enviar formulario del paciente:', error);
    window.lastPatientIntakeSaveError = error?.message || 'Error inesperado del navegador.';
    ok = false;
  }

  if (message) {
    message.classList.toggle('error', !ok);
    message.classList.toggle('success', ok);
    message.textContent = ok
      ? 'Formulario enviado correctamente. Gracias por completar tus antecedentes.'
      : `No pudimos registrar el formulario en Supabase. Detalle: ${window.lastPatientIntakeSaveError || 'sin detalle'}`;
  }

  patientIntakeSubmitting = false;
  disabledButton(submitButton, false);

  if (ok) {
    await recordPatientFormSubmitAnalytics();
    patientIntakeForm.dataset.submitted = 'true';
    const returnLink = $('[data-intake-return]');
    if (returnLink) {
      returnLink.classList.remove('disabled');
      returnLink.setAttribute('aria-disabled', 'false');
    }
    patientIntakeForm.querySelectorAll('input, textarea, select, button[type="submit"]').forEach((field) => {
      field.disabled = true;
    });
  }
}

$('[data-intake-submit]')?.addEventListener('click', handlePatientIntakeSubmit);
patientIntakeForm?.addEventListener('submit', handlePatientIntakeSubmit);

async function startDomusApp() {
  await loadDomusCentralState();
  await loadPatientIntakeTemplateFromSupabase();
  await openPatientIntakeFromUrl();
  scheduleDomusVisit();

  applySlideImages();
  renderTeamAccessOptions('');
  renderPatientIntakeTemplateAdmin();
  setAdminPatientAttentionFields({});
  updateAttentionTypeUI();
  renderServiceProfessionalsAdmin();
  renderPatientsAdmin();
  renderProfessionalPatients();
  renderPublicTeam();
  renderPublicTestimonials();
  renderAdminDashboard();
}

startDomusApp();

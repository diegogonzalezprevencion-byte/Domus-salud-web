// Domus Salud - configuración rápida
// Reemplaza estos datos por los contactos reales antes de publicar.
const DOMUS_CONFIG = {
  whatsappNumber: '56950257518',
  contactEmail: 'contacto@domus-salud.cl'
};

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

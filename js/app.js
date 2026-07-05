// Domus Salud - configuración rápida
// Reemplaza estos datos por los contactos reales antes de publicar.
const DOMUS_CONFIG = {
  whatsappNumber: '56900000000',
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

// Formulario: prepara un mensaje para WhatsApp
const contactForm = $('#contactForm');
if (contactForm) {
  contactForm.addEventListener('submit', (event) => {
    event.preventDefault();
    const formData = new FormData(contactForm);
    const data = Object.fromEntries(formData.entries());

    const message = [
      'Hola Domus Salud, quisiera solicitar una evaluación.',
      '',
      `Nombre: ${data.name || 'No indicado'}`,
      `Teléfono: ${data.phone || 'No indicado'}`,
      `Correo: ${data.email || 'No indicado'}`,
      `Servicio requerido: ${data.service || 'No indicado'}`,
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

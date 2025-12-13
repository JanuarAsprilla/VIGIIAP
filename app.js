/**
 * VIGIIAP - Visor y Gestor de Información Ambiental del IIAP
 * JavaScript Principal
 */

// =====================================================
// Inicialización
// =====================================================

document.addEventListener('DOMContentLoaded', function() {
    // Inicializar Lucide Icons
    lucide.createIcons();
    
    // Inicializar componentes
    initPreloader();
    initNavigation();
    initScrollEffects();
    initHeroMap();
    initGeovisorMap();
    initCounters();
    initParticles();
    initMapsGrid();
    initDocCategories();
    initLayerGroups();
    initSolicitudesForm();
    initModals();
});

// =====================================================
// Preloader
// =====================================================

function initPreloader() {
    const preloader = document.getElementById('preloader');
    
    window.addEventListener('load', function() {
        setTimeout(() => {
            preloader.classList.add('hidden');
            // Iniciar animaciones después del preloader
            document.body.classList.add('loaded');
        }, 2500);
    });
}

// =====================================================
// Navigation
// =====================================================

function initNavigation() {
    const navbar = document.getElementById('navbar');
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Toggle mobile menu
    navToggle.addEventListener('click', function() {
        navMenu.classList.toggle('active');
        navToggle.classList.toggle('active');
    });
    
    // Close menu on link click
    navLinks.forEach(link => {
        link.addEventListener('click', function() {
            navMenu.classList.remove('active');
            navToggle.classList.remove('active');
            
            // Update active state
            navLinks.forEach(l => l.classList.remove('active'));
            this.classList.add('active');
        });
    });
    
    // Scroll effect
    window.addEventListener('scroll', function() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    });
}

// =====================================================
// Scroll Effects
// =====================================================

function initScrollEffects() {
    const sections = document.querySelectorAll('section[id]');
    const navLinks = document.querySelectorAll('.nav-link');
    
    // Intersection Observer for sections
    const observerOptions = {
        root: null,
        rootMargin: '-20% 0px -80% 0px',
        threshold: 0
    };
    
    const sectionObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const sectionId = entry.target.getAttribute('id');
                navLinks.forEach(link => {
                    link.classList.remove('active');
                    if (link.getAttribute('href') === `#${sectionId}`) {
                        link.classList.add('active');
                    }
                });
            }
        });
    }, observerOptions);
    
    sections.forEach(section => {
        sectionObserver.observe(section);
    });
    
    // Animate elements on scroll
    const animateElements = document.querySelectorAll('.module-card, .tool-card, .doc-category');
    
    const elementObserver = new IntersectionObserver((entries) => {
        entries.forEach((entry, index) => {
            if (entry.isIntersecting) {
                setTimeout(() => {
                    entry.target.style.opacity = '1';
                    entry.target.style.transform = 'translateY(0)';
                }, index * 100);
            }
        });
    }, { threshold: 0.1 });
    
    animateElements.forEach(el => {
        el.style.opacity = '0';
        el.style.transform = 'translateY(30px)';
        el.style.transition = 'all 0.6s ease';
        elementObserver.observe(el);
    });
}

// =====================================================
// Hero Map (Leaflet)
// =====================================================

function initHeroMap() {
    const mapContainer = document.getElementById('heroMap');
    if (!mapContainer) return;
    
    // Crear mapa centrado en el Chocó Biogeográfico
    const map = L.map('heroMap', {
        zoomControl: false,
        scrollWheelZoom: false
    }).setView([5.5, -76.5], 6);
    
    // Añadir capa base
    L.tileLayer('https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    // Estilo para los polígonos
    const regionStyle = {
        color: '#1B4332',
        weight: 2,
        fillColor: '#40916C',
        fillOpacity: 0.3
    };
    
    // Crear polígono aproximado del Chocó Biogeográfico
    const chocoRegion = L.polygon([
        [8.5, -77.5],
        [8.2, -76.5],
        [7.5, -76.8],
        [6.5, -77.2],
        [5.5, -77.5],
        [4.5, -77.8],
        [3.5, -78.0],
        [2.0, -78.5],
        [1.5, -79.0],
        [1.8, -79.2],
        [2.5, -78.8],
        [3.5, -78.2],
        [4.5, -78.0],
        [5.5, -77.8],
        [6.5, -77.5],
        [7.5, -77.2],
        [8.5, -77.5]
    ], regionStyle).addTo(map);
    
    // Añadir marcadores de ciudades principales
    const cities = [
        { name: 'Quibdó', coords: [5.6918, -76.6583] },
        { name: 'Buenaventura', coords: [3.8801, -77.0311] },
        { name: 'Tumaco', coords: [1.8064, -78.8099] }
    ];
    
    const customIcon = L.divIcon({
        className: 'custom-marker',
        html: `<div style="
            width: 12px;
            height: 12px;
            background: #D4A373;
            border: 2px solid #fff;
            border-radius: 50%;
            box-shadow: 0 2px 5px rgba(0,0,0,0.3);
        "></div>`,
        iconSize: [12, 12]
    });
    
    cities.forEach(city => {
        L.marker(city.coords, { icon: customIcon })
            .bindTooltip(city.name, { permanent: false, direction: 'top' })
            .addTo(map);
    });
}

// =====================================================
// Geovisor Map
// =====================================================

function initGeovisorMap() {
    const mapContainer = document.getElementById('geovisorMap');
    if (!mapContainer) return;
    
    const map = L.map('geovisorMap', {
        zoomControl: false
    }).setView([5.5, -76.5], 7);
    
    // Capa base
    const baseLayer = L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
    }).addTo(map);
    
    // Controles personalizados
    document.getElementById('zoomIn').addEventListener('click', () => map.zoomIn());
    document.getElementById('zoomOut').addEventListener('click', () => map.zoomOut());
    document.getElementById('resetView').addEventListener('click', () => map.setView([5.5, -76.5], 7));
    document.getElementById('fullscreen').addEventListener('click', function() {
        const container = document.querySelector('.geovisor-container');
        if (container.requestFullscreen) {
            container.requestFullscreen();
        }
    });
    
    // Actualizar coordenadas al mover el mouse
    map.on('mousemove', function(e) {
        document.getElementById('latCoord').textContent = `Lat: ${e.latlng.lat.toFixed(4)}°N`;
        document.getElementById('lonCoord').textContent = `Lon: ${e.latlng.lng.toFixed(4)}°W`;
    });
    
    // Polígono del territorio
    L.polygon([
        [8.5, -77.5], [8.2, -76.5], [7.5, -76.8], [6.5, -77.2],
        [5.5, -77.5], [4.5, -77.8], [3.5, -78.0], [2.0, -78.5],
        [1.5, -79.0], [1.8, -79.2], [2.5, -78.8], [3.5, -78.2],
        [4.5, -78.0], [5.5, -77.8], [6.5, -77.5], [7.5, -77.2],
        [8.5, -77.5]
    ], {
        color: '#1B4332',
        weight: 2,
        fillColor: '#40916C',
        fillOpacity: 0.2
    }).addTo(map);
    
    // Simular resguardos indígenas
    const resguardos = [
        [[6.8, -77.0], [6.9, -76.8], [6.7, -76.7], [6.5, -76.9]],
        [[5.2, -76.8], [5.4, -76.6], [5.1, -76.5], [5.0, -76.7]],
        [[4.0, -77.5], [4.2, -77.3], [4.0, -77.2], [3.8, -77.4]]
    ];
    
    resguardos.forEach(coords => {
        L.polygon(coords, {
            color: '#F5A623',
            weight: 1,
            fillColor: '#F5A623',
            fillOpacity: 0.4
        }).addTo(map);
    });
    
    // Simular comunidades negras
    const comunidades = [
        [[7.2, -77.3], [7.4, -77.1], [7.2, -77.0], [7.0, -77.2]],
        [[6.0, -77.2], [6.2, -77.0], [6.0, -76.9], [5.8, -77.1]],
        [[3.2, -77.8], [3.4, -77.6], [3.2, -77.5], [3.0, -77.7]]
    ];
    
    comunidades.forEach(coords => {
        L.polygon(coords, {
            color: '#E67E22',
            weight: 1,
            fillColor: '#E67E22',
            fillOpacity: 0.4
        }).addTo(map);
    });
}

// =====================================================
// Animated Counters
// =====================================================

function initCounters() {
    const counters = document.querySelectorAll('.stat-value');
    
    const observerOptions = {
        threshold: 0.5
    };
    
    const counterObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                const target = entry.target;
                const countTo = parseInt(target.dataset.count);
                const suffix = target.dataset.suffix || '';
                const format = target.dataset.format === 'true';
                
                animateCounter(target, countTo, suffix, format);
                counterObserver.unobserve(target);
            }
        });
    }, observerOptions);
    
    counters.forEach(counter => {
        counterObserver.observe(counter);
    });
}

function animateCounter(element, target, suffix, format) {
    const duration = 2000;
    const start = 0;
    const startTime = performance.now();
    
    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);
        
        // Easing function
        const easeOutQuart = 1 - Math.pow(1 - progress, 4);
        const current = Math.floor(start + (target - start) * easeOutQuart);
        
        if (format) {
            element.textContent = current.toLocaleString('es-CO') + suffix;
        } else {
            element.textContent = current + suffix;
        }
        
        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }
    
    requestAnimationFrame(update);
}

// =====================================================
// Background Particles
// =====================================================

function initParticles() {
    const container = document.getElementById('particles');
    if (!container) return;
    
    const particleCount = 50;
    
    for (let i = 0; i < particleCount; i++) {
        createParticle(container);
    }
}

function createParticle(container) {
    const particle = document.createElement('div');
    const size = Math.random() * 6 + 2;
    const posX = Math.random() * 100;
    const posY = Math.random() * 100;
    const delay = Math.random() * 5;
    const duration = Math.random() * 10 + 10;
    
    particle.style.cssText = `
        position: absolute;
        width: ${size}px;
        height: ${size}px;
        background: rgba(149, 213, 178, ${Math.random() * 0.3 + 0.1});
        border-radius: 50%;
        left: ${posX}%;
        top: ${posY}%;
        animation: float ${duration}s ease-in-out ${delay}s infinite;
    `;
    
    container.appendChild(particle);
}

// Add float animation
const style = document.createElement('style');
style.textContent = `
    @keyframes float {
        0%, 100% {
            transform: translateY(0) translateX(0);
            opacity: 0.5;
        }
        50% {
            transform: translateY(-30px) translateX(20px);
            opacity: 1;
        }
    }
`;
document.head.appendChild(style);

// =====================================================
// Maps Grid
// =====================================================

function initMapsGrid() {
    const mapsGrid = document.getElementById('mapsGrid');
    if (!mapsGrid) return;
    
    const maps = [
        { title: 'Mapa de Ecosistemas del Chocó', category: 'biodiversidad', year: 2024, format: 'PDF' },
        { title: 'Hidrografía del Pacífico Colombiano', category: 'hidrografia', year: 2024, format: 'SHP' },
        { title: 'Resguardos Indígenas - Chocó', category: 'resguardos', year: 2023, format: 'PDF' },
        { title: 'Cobertura Vegetal 2024', category: 'cobertura', year: 2024, format: 'GeoJSON' },
        { title: 'Comunidades Afrodescendientes', category: 'comunidades', year: 2024, format: 'PDF' },
        { title: 'Cuencas Hidrográficas', category: 'hidrografia', year: 2023, format: 'SHP' },
        { title: 'Zonificación Ambiental', category: 'biodiversidad', year: 2024, format: 'PDF' },
        { title: 'Uso del Suelo - Valle del Cauca', category: 'suelos', year: 2023, format: 'JPG' }
    ];
    
    maps.forEach((map, index) => {
        const card = createMapCard(map, index);
        mapsGrid.appendChild(card);
    });
    
    // Reinicializar iconos
    lucide.createIcons();
    
    // View toggle
    const viewBtns = document.querySelectorAll('.view-btn');
    viewBtns.forEach(btn => {
        btn.addEventListener('click', function() {
            viewBtns.forEach(b => b.classList.remove('active'));
            this.classList.add('active');
            
            const view = this.dataset.view;
            if (view === 'list') {
                mapsGrid.style.gridTemplateColumns = '1fr';
            } else {
                mapsGrid.style.gridTemplateColumns = 'repeat(auto-fill, minmax(280px, 1fr))';
            }
        });
    });
}

function createMapCard(map, index) {
    const card = document.createElement('div');
    card.className = 'map-card';
    card.style.animationDelay = `${index * 0.1}s`;
    
    const colors = ['#1B4332', '#2D6A4F', '#40916C', '#52B788', '#74C69D'];
    const bgColor = colors[index % colors.length];
    
    card.innerHTML = `
        <div class="map-card-image" style="background: linear-gradient(135deg, ${bgColor}, ${bgColor}dd);">
            <div class="map-placeholder" style="
                display: flex;
                align-items: center;
                justify-content: center;
                height: 100%;
                color: rgba(255,255,255,0.3);
            ">
                <i data-lucide="map" style="width: 60px; height: 60px;"></i>
            </div>
            <div class="map-card-overlay">
                <div class="map-card-actions">
                    <button class="map-card-btn" title="Vista previa" onclick="openMapModal('${map.title}', '${map.category}', '${map.year}')">
                        <i data-lucide="eye"></i>
                    </button>
                    <button class="map-card-btn" title="Descargar">
                        <i data-lucide="download"></i>
                    </button>
                    <button class="map-card-btn" title="Compartir">
                        <i data-lucide="share-2"></i>
                    </button>
                </div>
            </div>
        </div>
        <div class="map-card-content">
            <span class="map-card-category">${map.category}</span>
            <h4 class="map-card-title">${map.title}</h4>
            <div class="map-card-meta">
                <span>${map.year}</span>
                <span>${map.format}</span>
            </div>
        </div>
    `;
    
    return card;
}

// =====================================================
// Document Categories
// =====================================================

function initDocCategories() {
    const categories = document.querySelectorAll('.doc-category');
    
    categories.forEach(category => {
        const header = category.querySelector('.category-header');
        
        header.addEventListener('click', function() {
            // Close others
            categories.forEach(c => {
                if (c !== category) {
                    c.classList.remove('open');
                }
            });
            
            // Toggle current
            category.classList.toggle('open');
        });
    });
    
    // Open first by default
    if (categories.length > 0) {
        categories[0].classList.add('open');
    }
}

// =====================================================
// Layer Groups (Geovisor)
// =====================================================

function initLayerGroups() {
    const groups = document.querySelectorAll('.layer-group');
    
    groups.forEach(group => {
        const header = group.querySelector('.layer-group-header');
        
        header.addEventListener('click', function() {
            group.classList.toggle('open');
        });
    });
    
    // Open first two by default
    groups.forEach((group, index) => {
        if (index < 2) {
            group.classList.add('open');
        }
    });
}

// =====================================================
// Solicitudes Form
// =====================================================

function initSolicitudesForm() {
    const form = document.getElementById('solicitudForm');
    const fileUpload = document.getElementById('fileUpload');
    const fileInput = document.getElementById('fileInput');
    
    if (!form) return;
    
    // File upload
    fileUpload.addEventListener('click', () => fileInput.click());
    
    fileUpload.addEventListener('dragover', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = 'var(--color-primary)';
        fileUpload.style.background = 'rgba(27, 67, 50, 0.05)';
    });
    
    fileUpload.addEventListener('dragleave', () => {
        fileUpload.style.borderColor = '';
        fileUpload.style.background = '';
    });
    
    fileUpload.addEventListener('drop', (e) => {
        e.preventDefault();
        fileUpload.style.borderColor = '';
        fileUpload.style.background = '';
        
        const files = e.dataTransfer.files;
        handleFiles(files);
    });
    
    fileInput.addEventListener('change', function() {
        handleFiles(this.files);
    });
    
    // Form submission
    form.addEventListener('submit', function(e) {
        e.preventDefault();
        
        // Show success message
        showNotification('Solicitud enviada correctamente', 'success');
        
        // Reset form
        form.reset();
    });
}

function handleFiles(files) {
    const fileUpload = document.getElementById('fileUpload');
    
    if (files.length > 0) {
        const fileNames = Array.from(files).map(f => f.name).join(', ');
        fileUpload.innerHTML = `
            <i data-lucide="check-circle" style="color: var(--color-secondary);"></i>
            <p>${files.length} archivo(s) seleccionado(s)</p>
            <small>${fileNames}</small>
        `;
        lucide.createIcons();
    }
}

function resetForm() {
    const form = document.getElementById('solicitudForm');
    const fileUpload = document.getElementById('fileUpload');
    
    form.reset();
    
    fileUpload.innerHTML = `
        <i data-lucide="upload-cloud"></i>
        <p>Arrastra archivos aquí o <span>haz clic para seleccionar</span></p>
        <small>Máximo 10MB por archivo. Formatos: PDF, DOCX, SHP, KML, KMZ</small>
    `;
    lucide.createIcons();
}

function trackSolicitud() {
    const trackingNumber = document.getElementById('trackingNumber').value;
    const trackingResult = document.getElementById('trackingResult');
    
    if (trackingNumber.trim()) {
        trackingResult.style.display = 'block';
        
        // Animate timeline
        const timelineItems = trackingResult.querySelectorAll('.timeline-item');
        timelineItems.forEach((item, index) => {
            item.style.opacity = '0';
            item.style.transform = 'translateX(-20px)';
            
            setTimeout(() => {
                item.style.transition = 'all 0.4s ease';
                item.style.opacity = '1';
                item.style.transform = 'translateX(0)';
            }, index * 150);
        });
    } else {
        showNotification('Por favor ingrese un número de radicado', 'warning');
    }
}

// =====================================================
// Modals
// =====================================================

function initModals() {
    const modal = document.getElementById('mapModal');
    const overlay = modal.querySelector('.modal-overlay');
    
    overlay.addEventListener('click', closeModal);
    
    // Close on escape key
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape') {
            closeModal();
        }
    });
}

function openMapModal(title, category, year) {
    const modal = document.getElementById('mapModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalCategory = document.getElementById('modalCategory');
    const modalDate = document.getElementById('modalDate');
    const modalImage = document.getElementById('modalImage');
    
    modalTitle.textContent = title;
    modalCategory.textContent = category.charAt(0).toUpperCase() + category.slice(1);
    modalDate.textContent = `Año: ${year}`;
    
    // Placeholder image
    modalImage.src = `https://via.placeholder.com/800x500/1B4332/ffffff?text=${encodeURIComponent(title)}`;
    modalImage.alt = title;
    
    modal.classList.add('active');
    document.body.style.overflow = 'hidden';
}

function closeModal() {
    const modal = document.getElementById('mapModal');
    modal.classList.remove('active');
    document.body.style.overflow = '';
}

// =====================================================
// Notifications
// =====================================================

function showNotification(message, type = 'info') {
    // Remove existing notifications
    const existing = document.querySelector('.notification');
    if (existing) {
        existing.remove();
    }
    
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    
    const icons = {
        success: 'check-circle',
        warning: 'alert-triangle',
        error: 'x-circle',
        info: 'info'
    };
    
    const colors = {
        success: '#27AE60',
        warning: '#F39C12',
        error: '#E74C3C',
        info: '#3498DB'
    };
    
    notification.innerHTML = `
        <i data-lucide="${icons[type]}" style="width: 20px; height: 20px;"></i>
        <span>${message}</span>
    `;
    
    notification.style.cssText = `
        position: fixed;
        top: 100px;
        right: 20px;
        background: ${colors[type]};
        color: white;
        padding: 16px 24px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        gap: 12px;
        box-shadow: 0 10px 30px rgba(0,0,0,0.2);
        z-index: 3000;
        animation: slideIn 0.3s ease;
    `;
    
    document.body.appendChild(notification);
    lucide.createIcons();
    
    // Auto remove
    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease forwards';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

// Add notification animations
const notificationStyle = document.createElement('style');
notificationStyle.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(100%);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }
    
    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(100%);
            opacity: 0;
        }
    }
`;
document.head.appendChild(notificationStyle);

// =====================================================
// Filter Functions
// =====================================================

function applyFilters() {
    const category = document.getElementById('categoryFilter').value;
    const dept = document.getElementById('deptFilter').value;
    const year = document.getElementById('yearFilter').value;
    
    // Simulate filtering
    const mapsCount = document.getElementById('mapsCount');
    const randomCount = Math.floor(Math.random() * 20) + 5;
    mapsCount.textContent = randomCount;
    
    showNotification(`Se encontraron ${randomCount} mapas con los filtros aplicados`, 'success');
    
    // Animate grid
    const cards = document.querySelectorAll('.map-card');
    cards.forEach((card, index) => {
        card.style.opacity = '0';
        card.style.transform = 'scale(0.95)';
        
        setTimeout(() => {
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '1';
            card.style.transform = 'scale(1)';
        }, index * 50);
    });
}

// Year filter update
const yearFilter = document.getElementById('yearFilter');
const yearValue = document.getElementById('yearValue');

if (yearFilter && yearValue) {
    yearFilter.addEventListener('input', function() {
        yearValue.textContent = this.value;
    });
}

// =====================================================
// Smooth Scroll
// =====================================================

document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function(e) {
        e.preventDefault();
        
        const targetId = this.getAttribute('href');
        const target = document.querySelector(targetId);
        
        if (target) {
            const offsetTop = target.offsetTop - 80;
            
            window.scrollTo({
                top: offsetTop,
                behavior: 'smooth'
            });
        }
    });
});

// =====================================================
// Utility Functions
// =====================================================

// Debounce function
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}

// Throttle function
function throttle(func, limit) {
    let inThrottle;
    return function() {
        const args = arguments;
        const context = this;
        if (!inThrottle) {
            func.apply(context, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

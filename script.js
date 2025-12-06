// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function getCurrentSection() {
    // Get section from path (e.g., /home -> home) or hash (e.g., #home -> home)
    const path = window.location.pathname;
    const hash = window.location.hash;
    
    // Handle hash-based project details
    if (hash && hash.startsWith('#project-detail/')) {
        return hash.substring(1); // Returns "project-detail/ai-assistant"
    }
    
    if (path && path !== '/' && path !== '/index.html') {
        // Remove leading slash and .html if present
        return path.replace(/^\//, '').replace(/\.html$/, '');
    } else if (hash) {
        return hash.substring(1);
    }
    return 'home';
}

// Load saved theme and initialize on DOM ready
document.addEventListener('DOMContentLoaded', function() {
    // Handle GitHub Pages SPA redirect
    (function() {
        const redirect = sessionStorage.redirect;
        delete sessionStorage.redirect;
        if (redirect && redirect !== location.href) {
            const url = new URL(redirect);
            if (url.pathname && url.pathname !== '/' && url.pathname !== '/index.html') {
                history.replaceState(null, null, url.pathname);
            }
        }
    })();
    
    // Apply theme: saved preference (default is dark theme from :root)
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'light') {
        // Apply light theme if previously saved
        document.body.classList.add('dark');
    }
    // Default is dark theme (:root) - no condition needed
    
    // Single-section mode: show only the selected section
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');
    const footer = document.getElementById('site-footer');

    // Dynamically load selected sections from partials when served over HTTP(S)
    async function loadPartialForSection(id) {
        try {
            // Skip on file:// to avoid CORS issues
            if (location.protocol === 'file:') return;
            
            // Handle project detail pages
            let filePath = `partials/${id}.html`;
            if (id.startsWith('project-detail/')) {
                const projectSlug = id.replace('project-detail/', '');
                // Load from nested projects directory
                filePath = `partials/projects/project-${projectSlug}.html`;
                id = 'project-detail';
            }
            
            const res = await fetch(filePath, { cache: 'no-cache' });
            if (!res.ok) return;
            const html = await res.text();
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');
            const loaded = doc.querySelector(`section#${id}`);
            const host = document.getElementById(id);
            if (loaded && host) {
                // Replace only the inner content to preserve id/classes and SPA behavior
                host.innerHTML = loaded.innerHTML;
                // If we loaded the contact partial, rebind the form handler
                if (id === 'contact') {
                    bindContactForm();
                }
            }
        } catch (e) {
            // Silently ignore fetch issues (e.g., offline or CORS)
        }
    }

    function loadPartials(ids = []) {
        return Promise.all(ids.map(loadPartialForSection));
    }

    // Provide a friendly fallback message when running from file:// (no partials)
    function ensureLocalFallback(id) {
        if (location.protocol !== 'file:') return;
        const host = document.getElementById(id);
        if (!host) return;
        // Check if section has actual content (not just comments or whitespace)
        const content = host.innerHTML.trim();
        const hasContent = content && !content.startsWith('<!--') && content.length > 50;
        if (!hasContent && content.indexOf('data-local-fallback') === -1) {
            host.innerHTML = `
                <h2 class="section-title">${id.charAt(0).toUpperCase() + id.slice(1)}</h2>
                <div class="timeline-container" data-local-fallback>
                    <div class="timeline-item">
                        <h3>Content not loaded locally</h3>
                        <p class="timeline-date">Tip</p>
                        <p>This section loads from <code>partials/${id}.html</code>. To preview locally, run a local server (e.g., <code>python -m http.server 5500</code>) and open <code>http://localhost:5500/</code>.</p>
                    </div>
                </div>`;
        }
    }

    function showSection(id) {
        // Hide all sections
        sections.forEach(sec => sec.classList.remove('active-section'));
        
        // Handle project detail pages
        let targetId = id;
        if (id.startsWith('project-detail/')) {
            targetId = 'project-detail';
        }
        
        // Show the target section
        const target = document.getElementById(targetId);
        if (target) {
            target.classList.add('active-section');
        }

        // Scroll to top of content area
        const contentSide = document.querySelector('.content-side');
        if (contentSide) {
            contentSide.scrollTop = 0;
        }
        // Also scroll window to top for mobile
        window.scrollTo(0, 0);

        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = link.getAttribute('href');
            // For project details, highlight projects nav
            const compareId = id.startsWith('project-detail/') ? 'projects' : id;
            if (linkPath === `/${compareId}` || linkPath === `#${compareId}`) {
                link.classList.add('active');
            }
        });

        // Toggle footer visibility: only show for contact section
        if (footer) {
            footer.style.display = (id === 'contact') ? 'block' : 'none';
        }
    }
    
    // Handle nav clicks to switch sections
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Extract section id from either /#section or /section format
            const targetId = href.startsWith('#') ? href.substring(1) : href.replace(/^\//, '');
            // Try loading partial for any section; if it doesn't exist, no-op
            loadPartialForSection(targetId).finally(() => {
                ensureLocalFallback(targetId);
                showSection(targetId);
                // Use hash for project details, pushState for regular sections
                if (targetId.startsWith('project-detail/')) {
                    history.pushState(null, '', `#${targetId}`);
                } else {
                    history.pushState(null, '', `/${targetId}`);
                }
            });
        });
    });

    // Delegate click handling for dynamically loaded project detail links
    document.addEventListener('click', function(e) {
        if (e.target.classList.contains('project-detail-link')) {
            e.preventDefault();
            const targetId = e.target.getAttribute('href').substring(1); // Remove #
            loadPartialForSection(targetId).finally(() => {
                ensureLocalFallback(targetId);
                showSection(targetId);
                history.pushState(null, '', `#${targetId}`);
            });
        }
        
        // Handle contact-me-btn clicks
        if (e.target.classList.contains('contact-me-btn')) {
            e.preventDefault();
            const href = e.target.getAttribute('href');
            const targetId = href.startsWith('#') ? href.substring(1) : href.replace(/^\//, '');
            loadPartialForSection(targetId).finally(() => {
                ensureLocalFallback(targetId);
                showSection(targetId);
                history.pushState(null, '', `/${targetId}`);
            });
        }
    });

    // Respond to back/forward navigation
    window.addEventListener('popstate', () => {
        const id = getCurrentSection();
        loadPartialForSection(id).finally(() => {
            ensureLocalFallback(id);
            showSection(id);
        });
    });

    // Contact Form Handler (Google Apps Script via fetch)
    function bindContactForm() {
        // Remove any existing listeners first
        document.removeEventListener('submit', handleContactFormSubmit, true);
        document.removeEventListener('click', handleContactFormClick, true);
        // Use capturing phase to ensure we catch before native submit/navigation
        document.addEventListener('submit', handleContactFormSubmit, true);
        document.addEventListener('click', handleContactFormClick, true);
    }

    function handleContactFormClick(e) {
        // Intercept clicks on submit buttons within the contact form
        const submitEl = e.target && (e.target.closest('#contactForm button[type="submit"]') || e.target.closest('#contactForm input[type="submit"]'));
        if (!submitEl) return;
        const form = submitEl.closest('#contactForm');
        if (!form) return;
        e.preventDefault();
        e.stopPropagation();
        submitContactForm(form);
    }

    function handleContactFormSubmit(e) {
        const contactForm = e.target.closest('#contactForm');
        if (!contactForm) return;
        e.preventDefault();
        e.stopPropagation();
        submitContactForm(contactForm);
    }

    function submitContactForm(contactForm) {
        const statusEl = document.getElementById('contactStatus');
        const action = (contactForm.getAttribute('data-action') || contactForm.getAttribute('action') || '').trim();
        const isGAS = action.indexOf('script.google.com/macros/') !== -1;

        const name = document.getElementById('contactName')?.value.trim() || '';
        const email = document.getElementById('contactEmail')?.value.trim() || '';
        const message = document.getElementById('contactMessage')?.value.trim() || '';
        if (!name || !email || !message) {
            if (statusEl) { statusEl.textContent = 'Please fill in all fields.'; statusEl.classList.add('error'); }
            return;
        }
        if (!action) {
            if (statusEl) { statusEl.textContent = 'Form action missing.'; statusEl.classList.add('error'); }
            return;
        }
        if (statusEl) { statusEl.textContent = 'Sending…'; statusEl.classList.remove('error'); }
        const btn = contactForm.querySelector('button[type="submit"], input[type="submit"]');
        if (btn) btn.disabled = true;

        // Prepare payload: for GAS accept form-urlencoded (e.parameter) or JSON fallback
        let fetchOptions;
        if (isGAS) {
            const params = new URLSearchParams();
            params.append('name', name);
            params.append('email', email);
            params.append('message', message);
            fetchOptions = { method: 'POST', body: params };
        } else {
            fetchOptions = { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name, email, message }) };
        }

        fetch(action, fetchOptions).then(async r => {
            let ok = r.ok;
            try {
                const txt = await r.text();
                // Try parse JSON {ok:true}
                if (txt) {
                    try { const j = JSON.parse(txt); if (typeof j.ok !== 'undefined') ok = !!j.ok; } catch(_) {}
                }
            } catch(_) {}
            if (statusEl) { statusEl.textContent = ok ? 'Sent' : 'Error storing'; statusEl.classList.toggle('error', !ok); }
        }).catch(err => {
            if (statusEl) { statusEl.textContent = 'Network error'; statusEl.classList.add('error'); }
            console.error('Contact submit error', err);
        }).finally(() => {
            contactForm.reset();
            if (btn) btn.disabled = false;
        });
    }
    
    // Initial bind on page load
    bindContactForm();
    
    // Initialize: try to load partials for all sections, then show current section
    const initialId = getCurrentSection();
    const sectionIds = Array.from(sections).map(s => s.id).filter(Boolean);
    loadPartials(sectionIds).finally(() => {
        ['projects','work'].forEach(ensureLocalFallback);
        ensureLocalFallback(initialId);
        showSection(initialId);
        // Contact form handler is bound once on DOMContentLoaded when present; no stored submissions logic.
    });
});

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
    
    // Apply theme: saved preference > system preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        // Use saved preference
        if (savedTheme === 'dark') {
            document.body.classList.add('dark');
        }
    } else {
        // Use system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        if (prefersDark) {
            document.body.classList.add('dark');
        }
    }
    
    // Listen for system theme changes if no saved preference
    window.matchMedia('(prefers-color-scheme: dark)').addEventListener('change', (e) => {
        if (!localStorage.getItem('theme')) {
            if (e.matches) {
                document.body.classList.add('dark');
            } else {
                document.body.classList.remove('dark');
            }
        }
    });
    
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
    });

    // Respond to back/forward navigation
    window.addEventListener('popstate', () => {
        const id = getCurrentSection();
        loadPartialForSection(id).finally(() => {
            ensureLocalFallback(id);
            showSection(id);
        });
    });

    // Contact Form Handler
    const contactForm = document.getElementById("contactForm");
    if (contactForm) {
        contactForm.addEventListener("submit", function (e) {
            e.preventDefault();
            alert("Message sent successfully! Thank you for reaching out.");
            this.reset();
        });
    }
    
    // Initialize: try to load partials for all sections, then show current section
    const initialId = getCurrentSection();
    const sectionIds = Array.from(sections).map(s => s.id).filter(Boolean);
    loadPartials(sectionIds).finally(() => {
        ['projects','work'].forEach(ensureLocalFallback);
        ensureLocalFallback(initialId);
        showSection(initialId);
    });
});

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

function getCurrentSection() {
    // Get section from path (e.g., /home -> home) or hash (e.g., #home -> home)
    const path = window.location.pathname;
    const hash = window.location.hash;
    
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
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
    
    // Single-section mode: show only the selected section
    const sections = document.querySelectorAll('.section');
    const navLinks = document.querySelectorAll('.nav-link');

    function showSection(id) {
        // Hide all sections
        sections.forEach(sec => sec.classList.remove('active-section'));
        
        // Show the target section
        const target = document.getElementById(id);
        if (target) {
            target.classList.add('active-section');
        }

        // Update active nav link
        navLinks.forEach(link => {
            link.classList.remove('active');
            const linkPath = link.getAttribute('href');
            if (linkPath === `/${id}` || linkPath === `#${id}`) {
                link.classList.add('active');
            }
        });
    }
    
    // Handle nav clicks to switch sections
    navLinks.forEach(link => {
        link.addEventListener('click', function (e) {
            e.preventDefault();
            const href = this.getAttribute('href');
            // Extract section id from either /#section or /section format
            const targetId = href.startsWith('#') ? href.substring(1) : href.replace(/^\//, '');
            showSection(targetId);
            // Use pushState for clean URLs
            history.pushState(null, '', `/${targetId}`);
        });
    });

    // Respond to back/forward navigation
    window.addEventListener('popstate', () => {
        const id = getCurrentSection();
        showSection(id);
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
    
    // Simulate clicking home button to initialize the view
    const homeLink = document.querySelector('a[href="/home"], a[href="#home"]');
    if (homeLink) {
        homeLink.click();
    }
});

// Theme Toggle
function toggleTheme() {
    document.body.classList.toggle("dark");
    localStorage.setItem('theme', document.body.classList.contains('dark') ? 'dark' : 'light');
}

// Load saved theme
document.addEventListener('DOMContentLoaded', function() {
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark');
    }
});

// Single-section mode: show only the selected section (no fetch, all inline)
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
        if (link.getAttribute('href') === `#${id}`) {
            link.classList.add('active');
        }
    });
}

// Initialize visible section (from hash or default to 'home')
document.addEventListener('DOMContentLoaded', function () {
    const initialId = (location.hash && location.hash.substring(1)) || 'home';
    showSection(initialId);
});

// Handle nav clicks to switch sections
navLinks.forEach(link => {
    link.addEventListener('click', function (e) {
        e.preventDefault();
        const targetId = this.getAttribute('href').substring(1);
        showSection(targetId);
        history.replaceState(null, '', `#${targetId}`);
    });
});

// Respond to back/forward navigation on the hash
window.addEventListener('hashchange', () => {
    const id = (location.hash && location.hash.substring(1)) || 'home';
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


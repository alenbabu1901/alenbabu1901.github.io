function toggleTheme() {
    document.body.classList.toggle("dark");
}

// Simple contact form alert
document.getElementById("contactForm").addEventListener("submit", function (e) {
    e.preventDefault();
    alert("Message sent successfully!");
});

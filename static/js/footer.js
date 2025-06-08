// Smooth scroll behavior
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', function (e) {
        e.preventDefault();
        const target = document.querySelector(this.getAttribute('href'));
        if (target) {
            target.scrollIntoView({
                behavior: 'smooth'
            });
        }
    });
});

// Footer animation on scroll
const footer = document.querySelector('.site-footer');
const observerOptions = {
    threshold: 0.1,
    rootMargin: '0px 0px -50px 0px'
};

const footerObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
        if (entry.isIntersecting) {
            entry.target.style.animationPlayState = 'running';
        }
    });
}, observerOptions);

if (footer) {
    footerObserver.observe(footer);
}

// Add hover effects for social icons
const socialIcons = document.querySelectorAll('.social-icons a');
socialIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
        this.style.transform = 'translateY(-3px) scale(1.05) rotate(5deg)';
    });
    
    icon.addEventListener('mouseleave', function() {
        this.style.transform = 'translateY(0) scale(1) rotate(0deg)';
    });
});

// Add click tracking for footer links
const footerLinks = document.querySelectorAll('.footer-links a, .social-icons a');
footerLinks.forEach(link => {
    link.addEventListener('click', function(e) {
        const linkName = this.textContent.trim() || this.getAttribute('aria-label');
        console.log(`Footer link clicked: ${linkName}`);
        // Add analytics tracking here if needed
    });
});

// Add loading animation for footer elements
const footerCols = document.querySelectorAll('.footer-col');
footerCols.forEach((col, index) => {
    col.style.opacity = '0';
    col.style.transform = 'translateY(30px)';
    
    setTimeout(() => {
        col.style.transition = 'all 0.6s ease';
        col.style.opacity = '1';
        col.style.transform = 'translateY(0)';
    }, index * 100);
});
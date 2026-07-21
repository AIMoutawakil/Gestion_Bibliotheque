document.addEventListener('DOMContentLoaded', () => {

    const authSection = document.getElementById('nav-auth-section');
    const userJson = sessionStorage.getItem('user') || localStorage.getItem('user'); 

    if (userJson && authSection) {
        const user = JSON.parse(userJson);
        authSection.innerHTML = `
            <span style="font-weight: 500; color: inherit;">👋 Bonjour, ${user.fullname || 'Étudiant'}</span>
            <button onclick="seDeconnecterForce()" class="btn-text" style="color: #ef4444; border: 1px solid #ef4444; padding: 8px 16px; border-radius: 8px; cursor: pointer; background: transparent;">Déconnexion</button>
        `;
    }

    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 1200);
    }

    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    if (themeToggleBtn) {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'dark') {
            htmlElement.setAttribute('data-theme', 'dark');
            themeToggleBtn.textContent = '☀️';
        }

        themeToggleBtn.addEventListener('click', () => {
            if (htmlElement.getAttribute('data-theme') === 'dark') {
                htmlElement.removeAttribute('data-theme');
                localStorage.setItem('theme', 'light');
                themeToggleBtn.textContent = '🌙';
            } else {
                htmlElement.setAttribute('data-theme', 'dark');
                localStorage.setItem('theme', 'dark');
                themeToggleBtn.textContent = '☀️';
            }
        });
    }

    const faqItems = document.querySelectorAll('.faq-item');
    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        if(questionBtn) {
            questionBtn.addEventListener('click', () => {
                faqItems.forEach(otherItem => {
                    if (otherItem !== item) otherItem.classList.remove('active');
                });
                item.classList.toggle('active');
            });
        }
    });

    const counters = document.querySelectorAll('.stat-number');
    let animationsLancees = false;

    const statsSection = document.querySelector('.stats-section');
    if (statsSection && counters.length > 0) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !animationsLancees) {
                animationsLancees = true; // On verrouille l'animation

                counters.forEach(counter => {
                    const target = +counter.getAttribute('data-target');
                    const increment = target / 60; // Gère la vitesse
                    let current = 0;

                    const updateCounter = () => {
                        current += increment;
                        if (current < target) {
                            counter.innerText = Math.ceil(current);
                            requestAnimationFrame(updateCounter); // Boucle super fluide
                        } else {
                            counter.innerText = target + (target > 1000 ? '+' : '');
                        }
                    };
                    updateCounter(); // On lance le compteur
                });
            }
        }, { threshold: 0.1 }); // Déclenche dès qu'on voit 10% de la zone
        
        observer.observe(statsSection);
    }

    const elementsToAnimate = document.querySelectorAll('.feature-card, .trend-showcase-card, .testimonial-card, .faq-item');
    elementsToAnimate.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); 
                revealObserver.unobserve(entry.target); 
            }
        });
    }, { threshold: 0.15 });

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) { 
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }

});


function seDeconnecterForce() {
    sessionStorage.clear();
    localStorage.clear();
    window.location.href = 'index.html'; 
}

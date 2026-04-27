// public/js/landing.js

document.addEventListener('DOMContentLoaded', () => {
const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 1200);
    }
    const themeToggleBtn = document.getElementById('theme-toggle');
    const htmlElement = document.documentElement;

    // Vérifier si l'utilisateur a déjà choisi un thème auparavant
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        htmlElement.setAttribute('data-theme', 'dark');
        themeToggleBtn.textContent = '☀️';
    }

    // Changer le thème au clic
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


    // ----------------------------------------------------
    // 2. F.A.Q INTERACTIVE (Accordéon)
    // ----------------------------------------------------
    const faqItems = document.querySelectorAll('.faq-item');

    faqItems.forEach(item => {
        const questionBtn = item.querySelector('.faq-question');
        questionBtn.addEventListener('click', () => {
            // Fermer tous les autres (optionnel, pour faire plus propre)
            faqItems.forEach(otherItem => {
                if (otherItem !== item) otherItem.classList.remove('active');
            });
            // Ouvrir/Fermer celui qu'on a cliqué
            item.classList.toggle('active');
        });
    });


    // ----------------------------------------------------
    // 3. ANIMATION DES CHIFFRES CLÉS (Statistiques)
    // ----------------------------------------------------
    const counters = document.querySelectorAll('.stat-number');
    let started = false;

    // La fonction qui fait tourner les chiffres
    const startCounting = () => {
        counters.forEach(counter => {
            const target = +counter.getAttribute('data-target');
            const duration = 2000; // 2 secondes
            const increment = target / (duration / 16); // 60 images par secondes

            let current = 0;
            const updateCounter = () => {
                current += increment;
                if (current < target) {
                    counter.innerText = Math.ceil(current);
                    requestAnimationFrame(updateCounter);
                } else {
                    counter.innerText = target + (target > 1000 ? '+' : ''); // Ajoute un "+" pour les gros nombres
                }
            };
            updateCounter();
        });
    };

    // Le "Radar" qui vérifie si on scrolle jusqu'à la section
    const statsSection = document.querySelector('.stats-section');
    if (statsSection) {
        const observer = new IntersectionObserver((entries) => {
            if (entries[0].isIntersecting && !started) {
                startCounting();
                started = true; // Empêche de relancer l'animation si on remonte
            }
        }, { threshold: 0.5 }); // Se déclenche quand la section est à moitié visible
        
        observer.observe(statsSection);
    }

});
// ----------------------------------------------------
    // 4. SPLASH SCREEN (Écran de chargement)
    // ----------------------------------------------------
    const splashScreen = document.getElementById('splash-screen');
    if (splashScreen) {
        // Laisse le logo respirer pendant 1.2 secondes puis le cache
        setTimeout(() => {
            splashScreen.classList.add('hidden');
        }, 1200);
    }

    // ----------------------------------------------------
    // 5. ANIMATIONS AU SCROLL (Scroll Reveal)
    // ----------------------------------------------------
    // Astuce Pro : On ajoute automatiquement la classe .reveal à toutes les cartes sans toucher au HTML !
    const elementsToAnimate = document.querySelectorAll('.feature-card, .trend-card, .testimonial-card, .faq-item');
    elementsToAnimate.forEach(el => el.classList.add('reveal'));

    const revealObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('active'); // Fait apparaître l'élément
                revealObserver.unobserve(entry.target); // Ne l'anime qu'une seule fois
            }
        });
    }, { threshold: 0.15 }); // Se déclenche quand 15% de la carte apparaît à l'écran

    document.querySelectorAll('.reveal').forEach(el => revealObserver.observe(el));

    // ----------------------------------------------------
    // 6. BOUTON RETOUR EN HAUT
    // ----------------------------------------------------
    const backToTopBtn = document.getElementById('back-to-top');
    if (backToTopBtn) {
        // Apparaît / Disparaît en scrollant
        window.addEventListener('scroll', () => {
            if (window.scrollY > 400) { 
                backToTopBtn.classList.add('visible');
            } else {
                backToTopBtn.classList.remove('visible');
            }
        });

        // Remonte tout en haut avec une animation fluide
        backToTopBtn.addEventListener('click', () => {
            window.scrollTo({ top: 0, behavior: 'smooth' });
        });
    }
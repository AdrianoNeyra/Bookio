document.addEventListener('DOMContentLoaded', () => {
    const body = document.body;
    const textContainer = document.getElementById('readable-text');
    const header = document.querySelector('.reader-header');
    
    let lastScroll = 0;
    let fontSize = 1.25;

    // 1. Ocultar header al hacer scroll hacia abajo
    window.addEventListener('scroll', () => {
        const currentScroll = window.pageYOffset;
        if (currentScroll > lastScroll && currentScroll > 100) {
            header.style.transform = 'translateY(-100%)';
        } else {
            header.style.transform = 'translateY(0)';
        }
        lastScroll = currentScroll;
    });

    // 3. Modo Oscuro
    const toggleTheme = document.getElementById('toggle-theme');
    toggleTheme.addEventListener('click', () => {
        body.classList.toggle('dark-mode');
        const isDark = body.classList.contains('dark-mode');
        toggleTheme.innerHTML = isDark ? '<i class="fa-regular fa-sun"></i>' : '<i class="fa-regular fa-moon fa-sm"></i>';
        localStorage.setItem('reader-theme', isDark ? 'dark' : 'light');
    });

    // Cargar tema preferido
    if (localStorage.getItem('reader-theme') === 'dark') {
        body.classList.add('dark-mode');
        toggleTheme.innerHTML = '<i class="fas fa-sun"></i>';
    }
});
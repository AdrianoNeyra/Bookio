/* cabecalho.js */
document.addEventListener('DOMContentLoaded', () => {

    // ── DROPDOWN (data-action="dropdown") ───
    const dropTrigger = document.querySelector('[data-action="dropdown"]');
    const dropdown    = document.getElementById('userDropdown');

    if (dropTrigger && dropdown) {
        dropTrigger.addEventListener('click', () => dropdown.classList.toggle('show'));

        document.addEventListener('click', e => {
            if (!dropTrigger.contains(e.target) && !dropdown.contains(e.target))
                dropdown.classList.remove('show');
        });

        document.addEventListener('keydown', e => {
            if (e.key === 'Escape') dropdown.classList.remove('show');
        });
    }

    // ── NAV ACTIVE HIGHLIGHT ─────────────────
    const path = window.location.pathname;
    document.querySelectorAll('.nav-item').forEach(link => {
        const href = link.getAttribute('href');
        if (href && href !== '#' && href !== '/' && path.startsWith(href))
            link.classList.add('nav-active');
    });

    // ── SEARCH SHORTCUT "/" ──────────────────
    document.addEventListener('keydown', e => {
        if (['INPUT','TEXTAREA','SELECT'].includes(e.target.tagName)) return;
        if (e.key === '/') {
            e.preventDefault();
            const s = document.querySelector('.search-bar input, input[name="q"]');
            if (s) { s.focus(); s.select(); }
        }
    });

    // ── FLASH AUTO-HIDE ──────────────────────
    // Close buttons
    document.querySelectorAll('.flash-close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.flash').remove());
    });

    // Auto-hide after 4s
    setTimeout(() => {
        document.querySelectorAll('.flash').forEach(el => {
            el.style.transition = 'opacity .5s, transform .5s';
            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
            setTimeout(() => el.remove(), 500);
        }); // <-- CORREGIDO: Cierra el .forEach
    }, 4000); // <-- CORREGIDO: Cierra el setTimeout y define los 4000ms (4s)

    // ── BACK BUTTONS (data-back="true") ──────
    document.querySelectorAll('[data-back="true"]').forEach(el => {
        el.addEventListener('click', e => { e.preventDefault(); history.back(); });
    });
});
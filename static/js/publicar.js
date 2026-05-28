/* publicar.js */
document.addEventListener('DOMContentLoaded', () => {
    // ── SELECTORES ──
    const $ = id => document.getElementById(id);
    const nodes = {
        title: $('bookTitle'), genre: $('bookGenre'), desc: $('bookDesc'),
        cover: $('coverUpload'), zone: $('dropZone'), preview: $('imagePreview'),
        charNum: $('charNum'), cardTitle: $('cardTitleResult'),
        cardGenre: $('cardGenreResult'), cardImg: $('cardImgResult'),
        form: $('createBookForm')
    };

    const updatePreview = (el, target, def) => {
        if (el && target) target.textContent = el.value.trim() || def;
    };

    // ── PREVIEW & CONTADOR ──
    nodes.title?.addEventListener('input', () => updatePreview(nodes.title, nodes.cardTitle, 'Título do Livro'));
    nodes.genre?.addEventListener('change', () => updatePreview(nodes.genre, nodes.cardGenre, 'GÉNERO'));

    nodes.desc?.addEventListener('input', () => {
        const n = nodes.desc.value.length;
        if (nodes.charNum) {
            nodes.charNum.textContent = n;
            nodes.charNum.closest('.char-count').style.color = n > 450 ? (n >= 500 ? '#ef4444' : '#f97316') : '';
        }
    });

    // ── BOTÓN CANCELAR / VOLTAR (Añadido) ──
    document.querySelector('[data-back="true"]')?.addEventListener('click', e => {
        e.preventDefault();
        window.history.length > 1 ? window.history.back() : window.location.href = '/explorar';
    });

    // ── UPLOAD LOGIC ──
    const processFile = file => {
        if (!file.type.startsWith('image/')) return uploadErr('Usa JPG ou PNG.');
        if (file.size > 5 * 1024 * 1024) return uploadErr('Máx 5MB.');

        const reader = new FileReader();
        reader.onload = e => {
            const src = e.target.result;
            if (nodes.cardImg) { 
                nodes.cardImg.src = src; 
                nodes.cardImg.animate([{opacity: 0}, {opacity: 1}], 200); 
            }
            if (nodes.preview) { nodes.preview.src = src; nodes.preview.style.display = 'block'; }
            document.querySelector('.upload-content').style.display = 'none';
            
            showMsg(`✓ ${file.name}`, 'var(--p)');
        };
        reader.readAsDataURL(file);
    };

    if (nodes.zone && nodes.cover) {
        nodes.zone.onclick = e => e.target !== nodes.cover && nodes.cover.click();
        nodes.cover.onclick = e => e.stopPropagation();
        nodes.cover.onchange = () => nodes.cover.files[0] && processFile(nodes.cover.files[0]);

        // Drag & Drop con setDrag optimizado
        const setDrag = on => {
            nodes.zone.style.cssText = on ? 'border-color:var(--p); background:var(--p-soft); transform:scale(1.01)' : '';
        };

        ['dragenter', 'dragover'].forEach(ev => nodes.zone.addEventListener(ev, e => { e.preventDefault(); setDrag(true); }));
        ['dragleave', 'drop'].forEach(ev => nodes.zone.addEventListener(ev, e => {
            e.preventDefault(); setDrag(false);
            if (ev === 'drop' && e.dataTransfer.files[0]) {
                nodes.cover.files = e.dataTransfer.files;
                processFile(e.dataTransfer.files[0]);
            }
        }));
    }

    const showMsg = (msg, color) => {
        let m = nodes.zone.querySelector('.upload-msg') || document.createElement('p');
        m.className = 'upload-msg';
        m.style.cssText = `font-size:.8rem; color:${color}; margin-top:8px; font-weight:600;`;
        m.textContent = msg;
        nodes.zone.appendChild(m);
        if (color !== 'var(--p)') setTimeout(() => m.textContent = '', 3000);
    };
    const uploadErr = msg => showMsg('⚠ ' + msg, '#e11d48');

    // ── VALIDACIÓN & FLASH ──
    nodes.form?.addEventListener('submit', e => {
        if (!nodes.title.value.trim() || !nodes.genre.value) {
            e.preventDefault();
            const el = !nodes.title.value.trim() ? nodes.title : nodes.genre;
            el.focus();
            el.style.borderColor = '#ef4444';
            setTimeout(() => el.style.borderColor = '', 2000);
        } else {
            const btn = nodes.form.querySelector('button[type="submit"]');
            btn.disabled = true;
            btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
        }
    });

    document.querySelectorAll('.flash').forEach(f => {
        f.querySelector('.flash-close')?.addEventListener('click', () => f.remove());
        setTimeout(() => {
            f.style.opacity = '0';
            setTimeout(() => f.remove(), 400);
        }, 4000);
    });
});
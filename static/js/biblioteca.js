/* biblioteca.js */

// ── TAB SYSTEM (data-tab="...") ──────────
function openTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(t => {
        t.classList.remove('active');
        t.style.display = 'none';
    });
    document.querySelectorAll('.tab-btn').forEach(b => b.classList.remove('active'));

    const active = document.getElementById(tabName);
    if (active) { active.classList.add('active'); active.style.display = 'block'; }

    const btn = document.querySelector(`[data-tab="${tabName}"]`);
    if (btn) btn.classList.add('active');
}

function toggleFavoritoBiblioteca(btn) {
    const libroId = btn.getAttribute('data-id');
    const card = btn.closest('.ebook-card'); // Ajusta esta clase según tu diseño

    fetch(`/favorito/${libroId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
    })
    .then(response => response.json())
    .then(data => {
        if (data.status === 'removed') {
            // Animación suave para que desaparezca de la vista de favoritos
            card.style.transition = 'all 0.3s ease';
            card.style.opacity = '0';
            card.style.transform = 'scale(0.9)';
            setTimeout(() => card.remove(), 300);
        }
    })
    .catch(error => console.error('Erro:', error));
}

document.addEventListener('DOMContentLoaded', () => {

    // Bind tab buttons
    document.querySelectorAll('[data-tab]').forEach(btn => {
        btn.addEventListener('click', () => openTab(btn.dataset.tab));
    });

    // Garantir que primeiro tab visível por defeito
    const firstActive = document.querySelector('.tab-content.active');
    if (firstActive) firstActive.style.display = 'block';

    // Abrir tab por URL (?tab=mis-libros)
    const tabParam = new URLSearchParams(window.location.search).get('tab');
    if (tabParam) openTab(tabParam);

    // ── ELIMINAR LIVRO ───────────────────────
    const modalDelete = document.getElementById('delete-modal');
    const btnConfirmDelete = document.getElementById('btn-modal-confirm');
    const btnCancelDelete = document.getElementById('btn-modal-cancel');
    const modalBookTitle = document.getElementById('modal-book-title');

    // Variable global temporal para saber qué libro está en cola de borrado
    let libroIdDestino = null;

    // 2. Asignamos los eventos a los botones de eliminar
    document.querySelectorAll('.btn-delete').forEach(btn => {
        btn.addEventListener('click', (e) => {
            e.preventDefault();
            
            // Guardamos los datos del libro seleccionado
            libroIdDestino = btn.dataset.id;
            const title = btn.dataset.title;

            // Inyectamos el título y abrimos tu modal personalizado
            modalBookTitle.textContent = `"${title}"`;
            modalDelete.classList.add('is-active');
        });
    });

    // 3. Escuchamos el clic en el botón "Sim, Eliminar" dentro del modal
    btnConfirmDelete.addEventListener('click', async () => {
        if (!libroIdDestino) return;

        try {
            // Tu FETCH original
            const response = await fetch(`/eliminar/${libroIdDestino}`, { method: 'POST' });
            const data = await response.json();

            if (data.success) {
                // Borra el elemento del HTML sin recargar
                document.getElementById(`libro-${libroIdDestino}`).remove();
            } else {
                alert('Error al eliminar');
            }
        } catch (error) {
            alert('Error de conexión');
        } finally {
            // Cerramos el modal siempre al terminar la operación
            cerrarModal();
        }
    });

    // Funciones para cerrar el modal de forma limpia
    function cerrarModal() {
        modalDelete.classList.remove('is-active');
        libroIdDestino = null; 
    }

    btnCancelDelete.addEventListener('click', cerrarModal);

    modalDelete.addEventListener('click', (e) => {
        if (e.target === modalDelete) cerrarModal();
    });
});

function updateCount(tabId) {
    const tab = document.getElementById(tabId);
    const btn = document.querySelector(`[data-tab="${tabId}"]`);
    const counter = btn && btn.querySelector('.tab-count');
    if (!tab || !counter) return;
    const n = tab.querySelectorAll('.ebook-card').length;
    counter.textContent = n;
    if (n === 0 && tabId === 'favoritos') {
        const grid = tab.querySelector('.book-grid');
        if (grid) grid.innerHTML = `<div class="empty-tab"><i class="fas fa-heart" style="font-size:2rem;color:rgba(235,126,37,.3);display:block;margin-bottom:.8rem;"></i><p>Ainda não tens favoritos.</p><a href="/explorar">Explorar livros →</a></div>`;
    }
}

function toast(msg, type) {
    let box = document.querySelector('.flash-container');
    if (!box) { box = document.createElement('div'); box.className = 'flash-container'; document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = `flash flash-${type}`;
    t.innerHTML = `<i class="fas ${type==='success'?'fa-check-circle':'fa-exclamation-circle'}"></i><span>${msg}</span><button class="flash-close"><i class="fas fa-times"></i></button>`;
    t.querySelector('.flash-close').addEventListener('click', () => t.remove());
    box.appendChild(t);
    setTimeout(() => { t.style.transition='opacity .4s'; t.style.opacity='0'; setTimeout(()=>t.remove(),400); }, 4000);
}

/* detalle.js */
function inicializarBotonesLeerMais() {
    const contenedores = document.querySelectorAll('.comment-text-container');
    
    contenedores.forEach(contenedor => {
        const parrafo = contenedor.querySelector('.comment-text-content');
        const boton = contenedor.parentElement.querySelector('.btn-toggle-expand');
        
        // Evitamos duplicar la lógica si el comentario ya fue procesado
        if (contenedor.dataset.procesado === "true") return;

        // Comprobamos si el texto realmente se desborda de las 3 líneas configuradas
        // (scrollHeight es la altura real total, clientHeight es la altura visible truncada)
        if (parrafo.scrollHeight > parrafo.clientHeight) {
            boton.style.display = "inline-block";
            boton.textContent = "Ler mais";
            
            // Evento para expandir / contraer
            boton.onclick = function() {
                const tarjeta = contenedor.closest('.comment-card');
                if (tarjeta.classList.contains('expanded')) {
                    tarjeta.classList.remove('expanded');
                    boton.textContent = "Ler mais";
                } else {
                    tarjeta.classList.add('expanded');
                    boton.textContent = "Ler menos";
                }
            };
        }
        
        // Marcar como procesado
        contenedor.dataset.procesado = "true";
    });
}

document.addEventListener('DOMContentLoaded', () => {

    inicializarBotonesLeerMais();
    // ── IR AL CAPITULO ──────────────────────
    // Nota: Si usas onclick="irAlCapitulo(this)" en el HTML, 
    // esta función debe estar fuera del DOMContentLoaded.
    window.irAlCapitulo = function(elemento) {
        const url = elemento.getAttribute('data-url');
        if (url) window.location.href = url;
    }

    // ── TOGGLE FAVORITO ──────────────────────
    const btnFavorito = document.getElementById('btn-favorito');

    if (btnFavorito) {
        btnFavorito.addEventListener('click', async function(e) {
            e.preventDefault(); 

            const libroId = this.getAttribute('data-id');
            const icono = this.querySelector('i');
            const texto = this.querySelector('span');

            this.style.pointerEvents = 'none';

            try {
                const response = await fetch(`/favorito/${libroId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.status === 401) {
                    alert("Por favor, inicia sessão para guardar favoritos.");
                    return;
                }

                if (!response.ok) {
                    const errorData = await response.text(); 
                    console.error("Error del servidor:", errorData);
                    alert(`Erro do servidor: ${response.status}`);
                    return;
                }

                const data = await response.json();

                // ── AQUÍ ESTÁ LA LÓGICA QUE FALTABA ──
                if (data.status === 'added') {
                    this.classList.add('ativo');
                    if (icono) {
                        icono.classList.remove('far');
                        icono.classList.add('fas');
                    }
                    if (texto) texto.textContent = 'Remover aos favoritos';
                } else if (data.status === 'removed') {
                    this.classList.remove('ativo');
                    if (icono) {
                        icono.classList.remove('fas');
                        icono.classList.add('far');
                    }
                    if (texto) texto.textContent = 'Adicionar aos favoritos';
                }

            } catch (error) {
                console.error("Error en la petición Fetch:", error);
                alert("Erro de conexão.");
            } finally {
                this.style.pointerEvents = 'auto';
            }
        });
    }

    // ── ELIMINAR LIBRO ──────────────────────
    const btnEliminar = document.getElementById('btn-eliminar-libro');

    if (btnEliminar) {
        btnEliminar.addEventListener('click', async function() {
            const libroId = this.getAttribute('data-id');
            
            // Confirmación de seguridad
            const confirmar = confirm("Tens a certeza que queres eliminar este livro? Esta ação não pode ser desfeita e apagará todos os capítulos.");
            
            if (confirmar) {
                try {
                    const response = await fetch(`/eliminar/${libroId}`, {
                        method: 'POST'
                    });
                    if (response.ok) {
                        window.location.href = "/biblioteca"; // Redirigir a la biblioteca tras borrar
                    } else {
                        alert("Erro ao eliminar o livro.");
                    }
                } catch (error) {
                    console.error("Error:", error);
                    alert("Erro de conexão.");
                }
            }
        });
    }

    // ── BOTÓN DE APELACIÓN ──────────────────────
    const btnApelar = document.getElementById('btn-apelar');

    if (btnApelar) {
        btnApelar.addEventListener('click', async function() {
            const libroId = this.getAttribute('data-id');
            
            if (!confirm("Queres enviar este livro para uma nova revisão?")) return;

            try {
                const response = await fetch(`/apelar_libro/${libroId}`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' }
                });

                if (response.ok) {
                    alert("Apelação enviada! O estado do livro voltou a 'Pendente'.");
                    window.location.reload(); // Recargamos para actualizar la interfaz
                } else {
                    alert("Erro ao enviar apelação.");
                }
            } catch (error) {
                console.error("Error:", error);
            }
        });
    }

    // ── FLASH MESSAGES ──────────────
    document.querySelectorAll('.flash-close').forEach(btn => {
        btn.addEventListener('click', () => btn.closest('.flash').remove());
    });

    setTimeout(() => {
        document.querySelectorAll('.flash').forEach(el => {
            el.style.transition = 'opacity .4s, transform .4s';
            el.style.opacity = '0';
            el.style.transform = 'translateX(20px)';
            setTimeout(() => el.remove(), 400);
        });
    }, 4000);

    // ── CARGAR MÁS COMENTARIOS ──────────────────────
    const btnLoadMore = document.getElementById('btn-load-more');
    const commentsContainer = document.getElementById('comments-container');
    
    let currentOffset = 5; 

    if (btnLoadMore) {
        // Capturamos el ID del atributo HTML de manera segura
        const libroId = btnLoadMore.getAttribute('data-libro-id');

        btnLoadMore.addEventListener('click', function() {
            btnLoadMore.disabled = true;
            btnLoadMore.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A carregar...';

            // Usamos la variable limpia extraída del atributo HTML
            fetch(`/api/libro/${libroId}/comentarios?offset=${currentOffset}`)
                .then(res => {
                    if (!res.ok) {
                        throw new Error('Erro na resposta do servidor');
                    }
                    return res.json(); // Se procesa el JSON una SOLA vez de forma limpia
                })
                .then(comentarios => {
                    if (comentarios.length === 0) {
                        btnLoadMore.parentElement.innerHTML = '<p style="color: #95a5a6; font-size: 0.9rem;">Não há mais comentários para mostrar.</p>';
                        return;
                    }

                    comentarios.forEach(comentario => {
                        const card = document.createElement('div');
                        card.className = 'comment-card';
                        card.innerHTML = `
                            <div class="comment-header">
                                <span class="comment-author"><i class="fas fa-user-circle"></i> ${comentario.username}</span>
                                <span class="comment-date">
                                    <button class="btn-report-comment-trigger" data-id="${comentario.id}" title="Denunciar comentário">
                                        <i class="far fa-flag"></i>
                                    </button>
                                    <i class="fas fa-calendar-alt"></i> ${comentario.created_at}
                                </span>
                            </div>
                            <div class="comment-body">
                                <div class="comment-text-container" data-full-text="${comentario.content}">
                                    <p class="comment-text-content">${comentario.content}</p>
                                </div>
                                <button class="btn-toggle-expand" style="display: none;"></button>
                            </div>
                        `;
                        commentsContainer.appendChild(card);
                    });

                    // 🚨 CRÍTICO: Escaneamos de nuevo los textos insertados para calcular si necesitan el botón "Ler mais"
                    if (typeof inicializarBotonesLeerMais === "function") {
                        inicializarBotonesLeerMais();
                    }

                    currentOffset += comentarios.length;
                    
                    if (comentarios.length < 5) {
                        btnLoadMore.parentElement.innerHTML = '<p style="color: #95a5a6; font-size: 0.9rem;">Não há mais comentários para mostrar.</p>';
                    } else {
                        btnLoadMore.disabled = false;
                        btnLoadMore.innerHTML = '<i class="fas fa-sync-alt"></i> Carregar mais';
                    }
                })
                .catch(error => {
                    console.error('Erro ao carregar mais comentários:', error);
                    btnLoadMore.disabled = false;
                    btnLoadMore.innerHTML = '<i class="fas fa-exclamation-triangle"></i> Erro. Tentar novamente';
                });
        });
    }
    // ── CONTROL DEL MENÚ FLOTANTE DE REPORTES ──
    const openModalBtn = document.getElementById('open-report-modal');
    const closeModalBtn = document.getElementById('close-report-modal');
    const cancelModalBtn = document.getElementById('btn-cancel-modal');
    const modalOverlay = document.getElementById('report-modal-overlay');

    if (openModalBtn && modalOverlay) {
        // Abrir el menú flotante
        openModalBtn.addEventListener('click', () => {
            modalOverlay.classList.add('active');
        });

        // Funciones para cerrar el menú
        const cerrarModal = () => modalOverlay.classList.remove('active');

        closeModalBtn.addEventListener('click', cerrarModal);
        cancelModalBtn.addEventListener('click', cerrarModal);

        // Cerrar también si el usuario hace clic fuera de la tarjeta blanca (en lo oscuro)
        modalOverlay.addEventListener('click', (e) => {
            if (e.target === modalOverlay) cerrarModal();
        });
    }

    const commentModalOverlay = document.getElementById('comment-report-modal-overlay');
    const inputHiddenCommentId = document.getElementById('modal-comment-id');
    const closeCommentModalBtn = document.getElementById('close-comment-modal');
    const cancelCommentModalBtn = document.getElementById('btn-cancel-comment-modal');

    if (commentModalOverlay && inputHiddenCommentId) {
        
        // Escuchar el clic en las banderas usando delegación (sirve para todos los comentarios)
        document.addEventListener('click', function(e) {
            const button = e.target.closest('.btn-report-comment-trigger');
            
            if (button) {
                e.preventDefault();
                
                const commentId = button.getAttribute('data-id');
                
                // 🚨 Sencillamente asignamos el valor al input oculto
                inputHiddenCommentId.value = commentId;
                
                // Abrimos el modal
                commentModalOverlay.classList.add('active');
            }
        });

        const cerrarCommentModal = () => {
            commentModalOverlay.classList.remove('active');
            inputHiddenCommentId.value = ""; // Limpiamos el valor por seguridad
        };

        if (closeCommentModalBtn) closeCommentModalBtn.addEventListener('click', cerrarCommentModal);
        if (cancelCommentModalBtn) cancelCommentModalBtn.addEventListener('click', cerrarCommentModal);

        commentModalOverlay.addEventListener('click', (e) => {
            if (e.target === commentModalOverlay) cerrarCommentModal();
        });
    }
});
// ── CONTROL DE EXPANSIÓN DE COMENTARIOS EN TABLA DE REPORTES ──
function inicializarCajasComentariosAdmin() {
    const cajasTexto = document.querySelectorAll('.admin-comment-text');
    
    cajasTexto.forEach(caja => {
        const boton = caja.parentElement.querySelector('.btn-admin-comment-expand');
        if (!boton) return;

        // Si la pestaña está oculta en este instante, su altura es 0.
        // Removemos el procesado para permitir que se mida bien cuando el usuario haga clic en la pestaña.
        if (caja.clientHeight === 0) {
            caja.removeAttribute('data-procesado');
            return;
        }

        // Evitamos duplicar lógica si ya fue procesada con éxito estando visible
        if (caja.dataset.procesado === "true") return;

        // 🚨 CORREGIDO: Ahora comparamos contra 65 (la altura que definiste en tu CSS)
        // Añadimos un pequeño margen de 5px para evitar falsos positivos por paddings
        if (caja.scrollHeight > 70) {
            boton.style.display = "inline-block";
            boton.textContent = "Ver tudo";
            
            // Usamos una función limpia para evitar problemas de duplicación de eventos onclick
            boton.onclick = function(e) {
                e.preventDefault();
                if (caja.classList.contains('collapsed')) {
                    caja.classList.remove('collapsed');
                    caja.classList.add('expanded');
                    boton.textContent = "Colapsar";
                } else {
                    caja.classList.remove('expanded');
                    caja.classList.add('collapsed');
                    boton.textContent = "Ver tudo";
                }
            };
        } else {
            // Si el comentario es corto, nos aseguramos de que el botón no se vea
            boton.style.display = "none";
        }
        
        caja.dataset.procesado = "true";
    });
}

// ── SISTEMA DE PESTAÑAS (ACTUALIZADO) ──
function showTab(tabName) {
    // Ocultar todos los contenidos de pestañas
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    // Quitar el estado activo de los enlaces
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));
    
    // Mostrar la pestaña seleccionada
    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    // Marcar como activo el enlace donde se hizo clic
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    } else if (typeof event !== 'undefined' && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

// ── CONFIRMACIONES Y ACCIONES DE BORRADO (SE QUEDAN IGUAL) ──
function confirmarBan(id, nombre) {
    if (confirm("Tem certeza que deseja BANIR permanentemente o usuário " + nombre + "? Esta ação não pode ser desfeita.")) {
        window.location.href = "/admin/delete-user/" + id;
    }
}
function confirmarDeleteBook(btn) {
    const url = btn.getAttribute('data-url');
    if (confirm('Tens a certeza que queres eliminar este livro e TODOS os seus capítulos permanentemente?')) {
        window.location.href = url;
    }
}
function confirmarEliminarCap(btn) {
    const url = btn.getAttribute('data-url');
    if (confirm('Tens a certeza que queres eliminar este capítulo permanentemente?')) {
        window.location.href = url;
    }
}
function confirmarEliminarUser(btn) {
    const url = btn.getAttribute('data-url'); 
    if (confirm('EXCLUIR PERMANENTEMENTE? Isso apagará todos os dados deste utilizador.')) {
        window.location.href = url;
    }
}
function aprovarLivro(btn) {
    const url = btn.getAttribute('data-url');
    if (confirm('Desejas aprovar este livro para publicação?')) {
        window.location.href = url;
    }
}
function rejeitarLivro(btn) {
    const url = btn.getAttribute('data-url');
    if (confirm('Tens a certeza que desejas REJEITAR este livro?')) {
        window.location.href = url;
    }
}

// Ejecutar automáticamente al cargar la página del panel de administración
document.addEventListener("DOMContentLoaded", () => {
    // Le damos 100ms de cortesía para asegurarnos de que el CSS renderizó las celdas
    setTimeout(inicializarCajasComentariosAdmin, 100);
});
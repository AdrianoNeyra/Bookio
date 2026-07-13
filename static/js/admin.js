function inicializarCajasComentariosAdmin() {
    const cajasTexto = document.querySelectorAll('.admin-comment-text');
    
    cajasTexto.forEach(caja => {
        const boton = caja.parentElement.querySelector('.btn-admin-comment-expand');
        if (!boton) return;

        if (caja.clientHeight === 0) {
            caja.removeAttribute('data-procesado');
            return;
        }

        if (caja.dataset.procesado === "true") return;

        if (caja.scrollHeight > 70) {
            boton.style.display = "inline-block";
            boton.textContent = "Ver tudo";
            
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
            boton.style.display = "none";
        }
        
        caja.dataset.procesado = "true";
    });
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => tab.classList.remove('active'));
    document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('active'));

    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }
    
    if (window.event && window.event.currentTarget) {
        window.event.currentTarget.classList.add('active');
    } else if (typeof event !== 'undefined' && event.currentTarget) {
        event.currentTarget.classList.add('active');
    }
}

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

document.addEventListener("DOMContentLoaded", () => {
    setTimeout(inicializarCajasComentariosAdmin, 100);
});
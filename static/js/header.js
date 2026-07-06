document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('notifBtn');
    const dropdown = document.getElementById('notifDropdown');

    if (btn && dropdown) {
        // Escuchamos el clic directamente desde JavaScript
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            
            const badge = document.querySelector('.notif-badge');
            dropdown.classList.toggle('show');

            // Si se abre el menú y hay un punto rojo, avisamos a Flask
            if (dropdown.classList.contains('show') && badge) {
                console.log("Enviando petición de limpieza al servidor...");
                
                fetch('/notificaciones/leer-todas', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    }
                })
                .then(response => response.json())
                .then(data => {
                    console.log("Respuesta del servidor:", data);
                    
                    // Desvanecemos el punto rojo al instante
                    badge.style.display = 'none';
                    badge.remove();
                    
                    document.querySelectorAll('.notif-item.unread').forEach(item => {
                        item.classList.remove('unread');
                    });
                })
                .catch(err => console.error("Error en la petición:", err));
            }
        });
    }

    // HAMBURGUESA BOTON
    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const closeMenuBtn = document.getElementById("closeMenuBtn");
    const userNav = document.getElementById("userNav");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    // Función para abrir el menú lateral
    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", () => {
            userNav.classList.add("open");
            sidebarOverlay.classList.add("active");
            document.body.style.overflow = "hidden"; // Evita que se mueva el fondo al hacer scroll
        });
    }

    // Función para cerrar el menú lateral
    function cerrarMenu() {
        userNav.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = ""; // Devuelve el scroll normal
    }

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", cerrarMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", cerrarMenu);

    
    // Cerrar el menú si hacen clic fuera
    document.addEventListener('click', function(event) {
        if (dropdown && dropdown.classList.contains('show')) {
            if (!dropdown.contains(event.target) && !btn.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
});
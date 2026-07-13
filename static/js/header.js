document.addEventListener('DOMContentLoaded', function() {
    const btn = document.getElementById('notifBtn');
    const dropdown = document.getElementById('notifDropdown');

    if (btn && dropdown) {
        btn.addEventListener('click', function(event) {
            event.stopPropagation();
            
            const badge = document.querySelector('.notif-badge');
            dropdown.classList.toggle('show');

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


    const hamburgerBtn = document.getElementById("hamburgerBtn");
    const closeMenuBtn = document.getElementById("closeMenuBtn");
    const userNav = document.getElementById("userNav");
    const sidebarOverlay = document.getElementById("sidebarOverlay");

    if (hamburgerBtn) {
        hamburgerBtn.addEventListener("click", () => {
            userNav.classList.add("open");
            sidebarOverlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    }


    function cerrarMenu() {
        userNav.classList.remove("open");
        sidebarOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (closeMenuBtn) closeMenuBtn.addEventListener("click", cerrarMenu);
    if (sidebarOverlay) sidebarOverlay.addEventListener("click", cerrarMenu);

    

    document.addEventListener('click', function(event) {
        if (dropdown && dropdown.classList.contains('show')) {
            if (!dropdown.contains(event.target) && !btn.contains(event.target)) {
                dropdown.classList.remove('show');
            }
        }
    });
});
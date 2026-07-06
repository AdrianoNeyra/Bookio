document.addEventListener('DOMContentLoaded', function() {
    
    // ── ELEMENTOS DE FILTROS Y GRID ──
    const filterForm = document.getElementById("filterForm");
    const ebookGrid = document.getElementById("ebookGrid");
    const resultsCount = document.querySelector(".results-count strong");
    const sortSelect = document.getElementById('sort-select');

    // ── FUNCIÓN CENTRAL DE AJAX (Petición sin recargar) ──
    function ejecutarFiltroAjax() {
        if (!filterForm || !ebookGrid) return;

        // Capturamos los datos actuales del formulario (Buscador y Checkboxes)
        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams(formData);

        // Si existe el selector de ordenación, añadimos también su valor actual a la petición
        if (sortSelect) {
            searchParams.set('sort', sortSelect.value);
        }

        // Actualizamos la URL visual del navegador de forma elegante sin recargar
        window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

        // Realizamos la petición en segundo plano
        fetch(`${window.location.pathname}?${searchParams.toString()}`, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            const nuevoGrid = doc.getElementById("ebookGrid");
            const nuevoContador = doc.querySelector(".results-count strong");

            // Reemplazamos la cuadrícula de libros y el contador de resultados
            if (nuevoGrid && ebookGrid) ebookGrid.innerHTML = nuevoGrid.innerHTML;
            if (nuevoContador && resultsCount) resultsCount.innerText = nuevoContador.innerText;
        })
        .catch(error => console.error("Error al filtrar por AJAX:", error));
    }

    // Interceptamos los cambios en los Checkboxes y el buscador dentro del Formulario
    if (filterForm) {
        filterForm.addEventListener('change', function(e) {
            e.preventDefault();
            ejecutarFiltroAjax();
        });
        
        // Evitamos que al pulsar 'Enter' en la barra de búsqueda del sidebar se recargue la página
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            ejecutarFiltroAjax();
        });
    }

    // 🚨 MODIFICADO: Ahora el ordenamiento también usa AJAX y no recarga la página
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            ejecutarFiltroAjax();
        });
    }


    // ── INTERFAZ DE FILTROS FLOTANTES MÓVIL (Tu código intacto) ──
    const floatingFilterBtn = document.getElementById("floatingFilterBtn");
    const closeFiltersBtn = document.getElementById("closeFiltersBtn");
    const sidebarFilters = document.getElementById("sidebarFilters");
    const filtersOverlay = document.getElementById("filtersOverlay");

    if (floatingFilterBtn) {
        floatingFilterBtn.addEventListener("click", () => {
            sidebarFilters.classList.add("open");
            filtersOverlay.classList.add("active");
            document.body.style.overflow = "hidden";
        });
    }

    function cerrarFiltros() {
        sidebarFilters.classList.remove("open");
        filtersOverlay.classList.remove("active");
        document.body.style.overflow = "";
    }

    if (closeFiltersBtn) closeFiltersBtn.addEventListener("click", cerrarFiltros);
    if (filtersOverlay) filtersOverlay.addEventListener("click", cerrarFiltros);
});


// ── SISTEMA DE NOTIFICACIONES (Tu código intacto) ──
function toggleNotifDropdown(event) {
    event.stopPropagation();
    const dropdown = document.getElementById('notifDropdown');
    dropdown.classList.toggle('show');
}

document.addEventListener('click', function(event) {
    const dropdown = document.getElementById('notifDropdown');
    const btn = document.getElementById('notifBtn');
    
    if (dropdown && dropdown.classList.contains('show')) {
        if (!dropdown.contains(event.target) && !btn.contains(event.target)) {
            dropdown.classList.remove('show');
        }
    }
});
document.addEventListener('DOMContentLoaded', function() {
    
    const filterForm = document.getElementById("filterForm");
    const ebookGrid = document.getElementById("ebookGrid");
    const resultsCount = document.querySelector(".results-count strong");
    const sortSelect = document.getElementById('sort-select');


    function ejecutarFiltroAjax() {
        if (!filterForm || !ebookGrid) return;

        const formData = new FormData(filterForm);
        const searchParams = new URLSearchParams(formData);

        if (sortSelect) {
            searchParams.set('sort', sortSelect.value);
        }

        window.history.pushState({}, '', `${window.location.pathname}?${searchParams.toString()}`);

        fetch(`${window.location.pathname}?${searchParams.toString()}`, {
            headers: { "X-Requested-With": "XMLHttpRequest" }
        })
        .then(response => response.text())
        .then(html => {
            const parser = new DOMParser();
            const doc = parser.parseFromString(html, "text/html");
            
            const nuevoGrid = doc.getElementById("ebookGrid");
            const nuevoContador = doc.querySelector(".results-count strong");

            if (nuevoGrid && ebookGrid) ebookGrid.innerHTML = nuevoGrid.innerHTML;
            if (nuevoContador && resultsCount) resultsCount.innerText = nuevoContador.innerText;
        })
        .catch(error => console.error("Error al filtrar por AJAX:", error));
    }

    if (filterForm) {
        filterForm.addEventListener('change', function(e) {
            e.preventDefault();
            ejecutarFiltroAjax();
        });
        
        filterForm.addEventListener('submit', function(e) {
            e.preventDefault();
            ejecutarFiltroAjax();
        });
    }

    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            ejecutarFiltroAjax();
        });
    }


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
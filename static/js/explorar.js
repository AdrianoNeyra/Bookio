document.addEventListener('DOMContentLoaded', function() {
    const sortSelect = document.getElementById('sort-select');
    
    if (sortSelect) {
        sortSelect.addEventListener('change', function() {
            // 1. Capturamos la URL actual de la barra de direcciones
            const currentUrl = new URL(window.location.href);
            
            // 2. Modificamos o añadimos el parámetro 'sort' con la opción elegida
            currentUrl.searchParams.set('sort', this.value);
            
            // 3. Forzamos al navegador a viajar a la nueva URL
            window.location.href = currentUrl.href;
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('.input-content');
    const wordCount = document.getElementById('wordNum');
    let isDirty = false;

    // Ejecutar al cargar (por si estás editando un capítulo que ya tiene texto)
    if (textarea && wordCount) {
        const inicialText = textarea.value.trim();
        wordCount.textContent = inicialText ? inicialText.split(/\s+/).length : 0;
    }

    // Contador de palabras en tiempo real Y detector de cambios instantáneo
    textarea.addEventListener('input', () => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = words;
        
        isDirty = true; // El estado cambia a "sucio" desde la primera letra que escribe
    });

    // Confirmación al salir sin guardar
    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    // Quitar advertencia al enviar el formulario
    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', () => {
            isDirty = false;
        });
    }
});
document.addEventListener('DOMContentLoaded', () => {
    const textarea = document.querySelector('.input-content');
    const wordCount = document.getElementById('wordNum');
    let isDirty = false;

    if (textarea && wordCount) {
        const inicialText = textarea.value.trim();
        wordCount.textContent = inicialText ? inicialText.split(/\s+/).length : 0;
    }

    textarea.addEventListener('input', () => {
        const text = textarea.value.trim();
        const words = text ? text.split(/\s+/).length : 0;
        wordCount.textContent = words;
        
        isDirty = true;
    });

    window.addEventListener('beforeunload', (e) => {
        if (isDirty) {
            e.preventDefault();
            e.returnValue = '';
        }
    });

    const form = document.querySelector('form');
    if (form) {
        form.addEventListener('submit', () => {
            isDirty = false;
        });
    }
});
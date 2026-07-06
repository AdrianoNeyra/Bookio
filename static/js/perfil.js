document.addEventListener('DOMContentLoaded', () => {
    const avatarInput = document.getElementById('avatar-file');
    const avatarForm = document.getElementById('avatar-form');

    if (avatarInput && avatarForm) {
        avatarInput.addEventListener('change', function() {
            const ficheiro = this.files[0];
            if (ficheiro) {
                if (!ficheiro.type.startsWith('image/')) {
                    alert('Por favor, seleciona um ficheiro de imagem válido.');
                    return;
                }
                avatarForm.submit();
            }
        });
    }

    const openBtn = document.getElementById('open-username-modal');
    const closeBtn = document.getElementById('close-username-modal');
    const cancelBtn = document.getElementById('cancel-username-modal');
    const modal = document.getElementById('username-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        const closeModal = () => modal.classList.remove('active');

        closeBtn.addEventListener('click', closeModal);
        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }
});
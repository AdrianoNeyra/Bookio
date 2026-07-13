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
    const cancelBtn = document.getElementById('cancel-username-modal');
    const modal = document.getElementById('username-modal');

    if (openBtn && modal) {
        openBtn.addEventListener('click', () => {
            modal.classList.add('active');
        });

        const closeModal = () => modal.classList.remove('active');

        cancelBtn.addEventListener('click', closeModal);

        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeModal();
            }
        });
    }

    const btnOpenSettings = document.getElementById('btnOpenSettings');
    const settingsMenu = document.getElementById('settingsMenu');
    const btnTriggerDeleteModal = document.getElementById('btnTriggerDeleteModal');

    const deleteModal = document.getElementById('deleteAccountModal');
    const btnCloseModal = document.getElementById('btnCloseModal');
    const btnCancelDelete = document.getElementById('btnCancelDelete');
    const confirmInput = document.getElementById('confirmWordInput');
    const btnConfirmDelete = document.getElementById('btnConfirmDelete');

    if (btnOpenSettings && settingsMenu) {
        btnOpenSettings.addEventListener('click', (e) => {
            e.stopPropagation();
            settingsMenu.classList.toggle('show');
        });

        document.addEventListener('click', (e) => {
            if (!settingsMenu.contains(e.target) && e.target !== btnOpenSettings) {
                settingsMenu.classList.remove('show');
            }
        });
    }

    if (btnTriggerDeleteModal && deleteModal) {
        btnTriggerDeleteModal.addEventListener('click', () => {
            settingsMenu.classList.remove('show');
            deleteModal.classList.add('active');
            

            if (confirmInput) {
                confirmInput.value = '';
                setTimeout(() => confirmInput.focus(), 150);
            }
            if (btnConfirmDelete) btnConfirmDelete.disabled = true;
        });
    }

    const closeDeleteModal = () => {
        if (deleteModal) deleteModal.classList.remove('active');
    };

    btnCloseModal?.addEventListener('click', closeDeleteModal);
    btnCancelDelete?.addEventListener('click', closeDeleteModal);

    deleteModal?.addEventListener('click', (e) => {
        if (e.target === deleteModal) closeDeleteModal();
    });

    confirmInput?.addEventListener('input', (e) => {
        const value = e.target.value.trim();
        if (btnConfirmDelete) btnConfirmDelete.disabled = (value !== 'ELIMINAR');
    });


    btnConfirmDelete?.addEventListener('click', async () => {
        btnConfirmDelete.disabled = true;
        btnConfirmDelete.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A eliminar...';

        try {
            const response = await fetch('/eliminar-conta', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' }
            });

            const data = await response.json();

            if (data.success) {
                window.location.href = data.redirect_url;
            } else {
                alert(data.message || 'Erro ao eliminar a conta.');
                btnConfirmDelete.disabled = false;
                btnConfirmDelete.textContent = 'Eliminar a minha conta';
            }
        } catch (error) {
            console.error(error);
            alert('Erro de ligação ao servidor.');
            btnConfirmDelete.disabled = false;
            btnConfirmDelete.textContent = 'Eliminar a minha conta';
        }
    });
});
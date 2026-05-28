/* login.js */
document.addEventListener('DOMContentLoaded', () => {

    const loginForm    = document.getElementById('loginForm');
    const registerForm = document.getElementById('registerForm');
    const RPForm1      = document.getElementById('RPForm1');
    const RPForm2      = document.getElementById('RPForm2');
    let   email_recover = '';

    // ── FORM SWITCHER (data-form="...") ─────
    function selectorForm(key) {
        const map = { login: loginForm, register: registerForm, rp1: RPForm1, rp2: RPForm2 };
        Object.entries(map).forEach(([k, el]) => {
            if (!el) return;
            el.classList.toggle('active', k === key);
        });
        hideError();
        // Focus first input
        const form = map[key];
        if (form) {
            const first = form.querySelector('input');
            if (first) setTimeout(() => first.focus(), 200);
        }
    }

    // Bind data-form links
    document.querySelectorAll('[data-form]').forEach(el => {
        el.addEventListener('click', e => { e.preventDefault(); selectorForm(el.dataset.form); });
    });

    // ── ERROR HELPERS ────────────────────────
    function showError(msg) {
        const err = document.getElementById('error');
        if (!err) return;
        err.style.display = 'flex'; err.textContent = '⚠ ' + msg;
    }
    function hideError() {
        const err = document.getElementById('error');
        if (err) { err.style.display = 'none'; err.textContent = ''; }
    }

    // ── LOGIN VALIDATION ─────────────────────
    if (loginForm) {
        loginForm.addEventListener('submit', e => {
            const email = loginForm.querySelector('[name="loginEmail"]');
            const pass  = loginForm.querySelector('[name="loginPass"]');

            if (!email?.value.trim()) { e.preventDefault(); email?.focus(); return; }
            if (!email.value.includes('@')) { e.preventDefault(); email.focus(); return; }
            if (!pass?.value) { e.preventDefault(); pass?.focus(); return; }

            // Submit OK — show loading
            const btn = loginForm.querySelector('.btn-auth');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A entrar...'; }
        });
    }

    // ── REGISTER VALIDATION ──────────────────
    if (registerForm) {
        registerForm.addEventListener('submit', e => {
            e.preventDefault();
            hideError();

            const name     = document.getElementById('regName');
            const email    = document.getElementById('regEmail');
            const pass     = document.getElementById('regPass');

            if (!name?.value.trim() || !email?.value.trim() || !pass?.value)
                return showError('Todos os campos são obrigatórios.');
            if (!email.value.includes('@'))
                return showError('Insere um email válido.');
            if (!email.value.includes('.'))
                return showError('Insere um email válido.');
            if (pass.value.length < 6)
                return showError('A palavra-passe deve ter pelo menos 6 caracteres.');

            const btn = registerForm.querySelector('.btn-auth');
            if (btn) { btn.disabled = true; btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A criar conta...'; }
            registerForm.submit();
        });
    }

    // ── PASSWORD STRENGTH BAR ────────────────
    const regPass = document.getElementById('regPass');
    if (regPass) {
        const bar = document.createElement('div');
        bar.style.cssText = 'height:3px;border-radius:2px;margin-top:6px;background:#e5e7eb;transition:all .3s;';
        const fill = document.createElement('div');
        fill.style.cssText = 'height:100%;border-radius:2px;width:0%;transition:all .3s;';
        bar.appendChild(fill);
        regPass.closest('.input-group')?.appendChild(bar);

        regPass.addEventListener('input', () => {
            const v = regPass.value;
            let s = 0;
            if (v.length >= 6)  s++;
            if (v.length >= 10) s++;
            if (/[A-Z]/.test(v)) s++;
            if (/[0-9]/.test(v)) s++;
            if (/[^A-Za-z0-9]/.test(v)) s++;
            const colors = ['#ef4444','#f97316','#eab308','#22c55e','#16a34a'];
            fill.style.width      = `${s * 20}%`;
            fill.style.background = colors[s - 1] || 'transparent';
        });
    }

    // ── PASSWORD TOGGLE (eye icon) ───────────
    document.querySelectorAll('.input-wrapper').forEach(wrapper => {
        const input = wrapper.querySelector('input[type="password"]');
        if (!input) return;
        const btn = document.createElement('button');
        btn.type = 'button';
        btn.className = 'pass-toggle';
        btn.style.cssText = 'background:none;border:none;cursor:pointer;color:#c4c9d4;padding:0 4px;transition:color .2s;line-height:1;';
        btn.innerHTML = '<i class="fas fa-eye"></i>';
        btn.addEventListener('click', () => {
            const show = input.type === 'password';
            input.type = show ? 'text' : 'password';
            btn.querySelector('i').className = show ? 'fas fa-eye-slash' : 'fas fa-eye';
            btn.style.color = show ? 'var(--primary)' : '#c4c9d4';
        });
        wrapper.appendChild(btn);
    });

    // ── RECOVER PASSWORD (SOLICITAR) ─────────
    if (RPForm1) {
        RPForm1.addEventListener('submit', e => {
            const input = document.getElementById('RPEmail');
            const val = input?.value.trim() || '';
            
            if (!val || !val.includes('@')) {
                e.preventDefault();
                if (input) { input.style.borderColor = '#f87171'; setTimeout(() => input.style.borderColor = '', 2000); }
                return;
            }

            const btn = document.getElementById('btn-next-rp1');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A enviar código...';
            }
            // El formulario se envía de forma nativa a /forgot_password
        });
    }

    // ── RECOVER PASSWORD (VERIFICAR) ─────────
    if (RPForm2) {
        RPForm2.addEventListener('submit', e => {
            const code = document.getElementById('rpCode');
            const pass = document.getElementById('rpNewPass');

            if (code.value.trim().length < 6) {
                e.preventDefault();
                alert('O código deve ter 6 dígitos.');
                code.focus();
                return;
            }

            if (pass.value.length < 6) {
                e.preventDefault();
                alert('A nova palavra-passe deve ter pelo menos 6 caracteres.');
                pass.focus();
                return;
            }

            const btn = document.getElementById('btn-submit-rp2');
            if (btn) {
                btn.disabled = true;
                btn.innerHTML = '<i class="fas fa-spinner fa-spin"></i> A atualizar...';
            }
        });
    }

    // Initial focus
    const first = document.querySelector('.auth-form.active input');
    if (first) setTimeout(() => first.focus(), 300);
});

class PasswordInput extends HTMLElement {
    connectedCallback() {
        const inputId = this.getAttribute('input-id') || 'password';
        const placeholder = this.getAttribute('placeholder') || 'Password';
        const minlength = this.getAttribute('minlength');
        const isRequired = this.hasAttribute('required');
        const hideIcon = this.hasAttribute('hide-icon');
        
        // Setup slightly different styles depending on where it's used (like profile vs auth pages)
        const wrapperStyle = hideIcon 
            ? 'display: flex; align-items: center; background: #16171b; border: 1px solid #2a2a2a; border-radius: 4px; padding: 0 10px;' 
            : '';
        const inputStyle = hideIcon 
            ? 'width: 100%; padding: 10px 0; background: transparent; border: none; color: white; outline: none; flex-grow: 1;' 
            : '';

        this.innerHTML = `
            <div class="input-wrapper" style="${wrapperStyle}">
                ${hideIcon ? '' : '<span class="input-icon">🔒</span>'}
                <input 
                    type="password" 
                    id="${inputId}" 
                    placeholder="${placeholder}" 
                    ${minlength ? `minlength="${minlength}"` : ''} 
                    ${isRequired ? 'required' : ''}
                    style="${inputStyle}"
                >
                <button type="button" class="password-toggle" aria-label="Näytä salasana" style="background: none; border: none; font-size: 14px; cursor: pointer; color: #aaa; margin-left: 10px;">�</button>
            </div>
        `;

        const button = this.querySelector('.password-toggle');
        const input = this.querySelector('input');
        
        button.addEventListener('click', () => {
            if (input.type === 'password') {
                input.type = 'text';
                button.textContent = '👀';
                button.setAttribute('aria-label', 'Piilota salasana');
            } else {
                input.type = 'password';
                button.textContent = '🙈';
                button.setAttribute('aria-label', 'Näytä salasana');
            }
        });
    }
}

if (!customElements.get('password-input')) {
    customElements.define('password-input', PasswordInput);
}

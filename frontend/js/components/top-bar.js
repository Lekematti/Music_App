class TopBarComponent extends HTMLElement {
    connectedCallback() {
        const basePath = '/';
        const searchAction = '/pages/search.html';
        const searchQuery = new URLSearchParams(globalThis.location.search).get('q') || '';
        const escapeHtml = (value) => value
            .replaceAll('&', '&amp;')
            .replaceAll('"', '&quot;')
            .replaceAll("'", '&#39;')
            .replaceAll('<', '&lt;')
            .replaceAll('>', '&gt;');
        
        this.innerHTML = `
            <header class="top-bar">
                <div class="logo">
                    <a href="/index.html"><img src="${basePath}assets/icons/logo.png" alt="Logo"></a>
                </div>
                <form class="search-bar" action="${searchAction}" method="get" role="search" autocomplete="off">
                    <div class="search-field">
                        <input type="search" name="q" placeholder="Search songs or artists..." value="${escapeHtml(searchQuery)}" aria-label="Search songs or artists">
                        <button class="search-icon" type="submit"><img src="${basePath}assets/icons/search.png" alt="Search"></button>
                    </div>
                    <div class="search-suggestions" hidden></div>
                </form>
                <div class="user-nav">
                    <button id="menu-btn" class="menu-btn"><img src="${basePath}assets/icons/list.png" alt="Menu"></button>
                </div>
            </header>
        `;

        const form = this.querySelector('.search-bar');
        const input = this.querySelector('input[name="q"]');
        const suggestions = this.querySelector('.search-suggestions');
        let fetchToken = 0;
        let debounceTimer = null;

        const clearSuggestions = () => {
            suggestions.innerHTML = '';
            suggestions.hidden = true;
        };

        const renderSuggestions = (songs, query) => {
            suggestions.innerHTML = '';

            if (!songs.length) {
                suggestions.innerHTML = `<p class="search-suggestions-empty">No results for ${escapeHtml(query)}</p>`;
                suggestions.hidden = false;
                return;
            }

            songs.slice(0, 5).forEach((song) => {
                const item = document.createElement('a');
                item.className = 'search-suggestion-item';
                item.href = `/pages/song.html?id=${song.id}`;
                item.innerHTML = `
                    <span class="search-suggestion-title">${escapeHtml(song.title || 'Song')}</span>
                    <span class="search-suggestion-artist">${escapeHtml(song.artist || 'Artist')}</span>
                `;
                suggestions.appendChild(item);
            });

            suggestions.hidden = false;
        };

        const loadSuggestions = async (query) => {
            const currentToken = ++fetchToken;

            if (!query || query.trim().length < 2) {
                clearSuggestions();
                return;
            }

            suggestions.hidden = false;
            suggestions.innerHTML = '<p class="search-suggestions-empty">Searching...</p>';

            try {
                const response = await fetch(`/api/songs?search=${encodeURIComponent(query.trim())}`);

                if (currentToken !== fetchToken) {
                    return;
                }

                if (!response.ok) {
                    throw new Error(`Request failed with status ${response.status}`);
                }

                const songs = await response.json();

                if (currentToken !== fetchToken) {
                    return;
                }

                renderSuggestions(songs, query.trim());
            } catch (error) {
                if (currentToken !== fetchToken) {
                    return;
                }

                console.error('Error loading search suggestions:', error);
                suggestions.innerHTML = '<p class="search-suggestions-empty">Cannot load suggestions.</p>';
                suggestions.hidden = false;
            }
        };

        input.addEventListener('input', () => {
            globalThis.clearTimeout(debounceTimer);
            debounceTimer = globalThis.setTimeout(() => {
                loadSuggestions(input.value);
            }, 180);
        });

        input.addEventListener('focus', () => {
            if (input.value.trim().length >= 2) {
                loadSuggestions(input.value);
            }
        });

        form.addEventListener('submit', () => {
            clearSuggestions();
        });

        document.addEventListener('click', (event) => {
            if (!this.contains(event.target)) {
                clearSuggestions();
            }
        });
    }
}
customElements.define('top-bar-component', TopBarComponent);

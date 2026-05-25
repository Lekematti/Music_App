// Simple client-side router to keep the global player alive across internal navigation
(function () {
    const isSameOrigin = (url) => {
        try {
            const u = new URL(url, globalThis.location.href);
            return u.origin === globalThis.location.origin;
        } catch (e) {
            console.warn('Invalid URL for same-origin check', e);
            return false;
        }
    };

    const getAbsoluteUrl = (href) => new URL(href, globalThis.location.href);

    const loadScriptOnce = (src) => {
        return new Promise((resolve, reject) => {
            if (document.querySelector(`script[src='${src}']`)) return resolve();
            const s = document.createElement('script');
            s.src = src;
            s.async = false;
            s.onload = () => resolve();
            s.onerror = () => reject(new Error(`Failed to load script ${src}`));
            document.body.appendChild(s);
        });
    };

    const extractAndReplace = async (htmlText, url, replaceState = true) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const newMain = doc.querySelector('main.content');
        const targetMain = document.querySelector('main.content');
        if (newMain && targetMain) {
            targetMain.innerHTML = newMain.innerHTML;
        }

        // Update title
        if (doc.title) document.title = doc.title;

        if (replaceState) {
            history.pushState({ url }, doc.title, url);
        }

        // Execute inline scripts from fetched page
        const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])'));
        for (const s of inlineScripts) {
            try {
                const scriptEl = document.createElement('script');
                if (s.type) scriptEl.type = s.type;
                scriptEl.textContent = s.textContent;
                document.body.appendChild(scriptEl);
                // optional: remove to avoid clutter
                scriptEl.remove();
            } catch (e) {
                console.warn('Failed to run inline script', e);
            }
        }

        // Load external scripts from the fetched page (if not present)
        const externalScripts = Array.from(doc.querySelectorAll('script[src]')).map(s => s.src);
        for (const s of externalScripts) {
            try {
                await loadScriptOnce(s);
            } catch (e) {
                console.warn('Failed to load script', s, e);
            }
        }

        // Some page scripts register on DOMContentLoaded; dispatch a synthetic event
        // so those handlers run after we injected content, scripts, and the new URL.
        try {
            const domEvt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            document.dispatchEvent(domEvt);
        } catch (e) {
            console.warn('Failed to dispatch synthetic DOMContentLoaded', e);
        }

        // notify listeners that new content is in DOM
        document.dispatchEvent(new CustomEvent('router:contentLoaded', { detail: { url } }));
    };

    const navigateTo = async (href) => {
        const url = getAbsoluteUrl(href);
        try {
            const res = await fetch(url.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (!res.ok) throw new Error(`Failed to load ${url.href}`);
            const text = await res.text();
            await extractAndReplace(text, url.href, true);
        } catch (e) {
            console.error('Navigation failed, falling back to full load', e);
            globalThis.location.href = url.href; // fallback
        }
    };

    document.addEventListener('click', (ev) => {
        const a = ev.target?.closest?.('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;
        // ignore anchors, downloads, externals, and targets
        if (href.startsWith('#') || a.hasAttribute('download') || a.target === '_blank') return;

        const abs = getAbsoluteUrl(href);
        if (!isSameOrigin(abs)) return;

        const isSongPageLink = abs.pathname.endsWith('/song.html');
        if (!isSongPageLink) {
            return;
        }

        // Only intercept same-origin navigations that look like internal pages
        ev.preventDefault();
        navigateTo(abs);
    });

    globalThis.addEventListener('popstate', async (ev) => {
        const url = getAbsoluteUrl(ev.state?.url || globalThis.location.href);
        try {
            const res = await fetch(url.href, { headers: { 'X-Requested-With': 'XMLHttpRequest' } });
            if (res.ok) {
                const text = await res.text();
                await extractAndReplace(text, url.href, false);
            } else {
                globalThis.location.href = url.href;
            }
        } catch (e) {
            console.error('Popstate navigation failed', e);
            globalThis.location.href = url.href;
        }
    });

    // expose helper
    globalThis.appRouter = { navigateTo };
})();

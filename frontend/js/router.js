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

    const loadingScripts = new Map();

    const loadScriptOnce = (scriptInfo) => {
        const src = typeof scriptInfo === 'object' ? scriptInfo.src : scriptInfo;
        const type = typeof scriptInfo === 'object' ? scriptInfo.type : '';
        const absoluteSrc = new URL(src, globalThis.location.href).href;

        const alreadyExists = Array.from(document.querySelectorAll('script[src]'))
            .some(s => s.src === absoluteSrc);

        if (alreadyExists) return Promise.resolve();

        if (loadingScripts.has(absoluteSrc)) {
            return loadingScripts.get(absoluteSrc);
        }

        const loadPromise = new Promise((resolve, reject) => {
            const s = document.createElement('script');
            s.src = absoluteSrc;
            if (type) s.type = type;
            s.async = false;
            
            s.onload = () => {
                loadingScripts.delete(absoluteSrc);
                resolve();
            };
            s.onerror = () => {
                loadingScripts.delete(absoluteSrc);
                reject(new Error(`Failed to load script ${absoluteSrc}`));
            };
            document.body.appendChild(s);
        });

        loadingScripts.set(absoluteSrc, loadPromise);
        return loadPromise;
    };

    const extractAndReplace = async (htmlText, url, replaceState = true) => {
        const parser = new DOMParser();
        const doc = parser.parseFromString(htmlText, 'text/html');

        const newMain = doc.querySelector('main');
        const targetMain = document.querySelector('main');
        if (newMain && targetMain) {
            targetMain.className = newMain.className;
            targetMain.innerHTML = newMain.innerHTML;
        } else {
            console.warn(`[router] Page at ${url} is missing <main>. Nothing was swapped.`);
        }

        if (doc.title) document.title = doc.title;

        if (replaceState) {
            history.pushState({ url }, doc.title, url);
        }

        const inlineScripts = Array.from(doc.querySelectorAll('script:not([src])'));
        for (const s of inlineScripts) {
            try {
                const scriptEl = document.createElement('script');
                if (s.type) scriptEl.type = s.type;
                scriptEl.textContent = s.textContent;
                document.body.appendChild(scriptEl);
                scriptEl.remove();
            } catch (e) {
                console.warn('Failed to run inline script', e);
            }
        }

        const externalScripts = Array.from(doc.querySelectorAll('script[src]')).map(s => {
            return {
                src: new URL(s.getAttribute('src'), url).href,
                type: s.type || ''
            };
        });
        for (const scriptInfo of externalScripts) {
            try {
                await loadScriptOnce(scriptInfo);
            } catch (e) {
                console.warn('Failed to load script', scriptInfo.src, e);
            }
        }

        try {
            const domEvt = new Event('DOMContentLoaded', { bubbles: true, cancelable: true });
            document.dispatchEvent(domEvt);
        } catch (e) {
            console.warn('Failed to dispatch synthetic DOMContentLoaded', e);
        }

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
            globalThis.location.href = url.href;
        }
    };

    document.addEventListener('click', (ev) => {
        const a = ev.target?.closest?.('a');
        if (!a) return;
        const href = a.getAttribute('href');
        if (!href) return;

        // Opt-out: links with data-router-ignore do a normal full navigation
        if (a.dataset.routerIgnore !== undefined) return;

        if (href.startsWith('#') || a.hasAttribute('download') || a.target === '_blank') return;

        const abs = getAbsoluteUrl(href);
        if (!isSameOrigin(abs)) return;

        const isInternalHtml = abs.origin === globalThis.location.origin && abs.pathname.endsWith('.html');
        if (!isInternalHtml) return;

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

    globalThis.appRouter = { navigateTo };
})();
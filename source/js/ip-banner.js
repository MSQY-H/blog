// source/js/ip-banner.js
(function () {
    const MIRROR_HOST = 'www.msqy.cc.cd';
    const API_URL = 'https://www.loliapi.com/getip/';

    // 如果已经在镜像站，不再检测
    if (window.location.hostname === MIRROR_HOST) return;

    let isChina = false;
    let requestFinished = false;
    let bannerCreated = false;

    function handleResponse(data) {
        const country = data.country || data.country_code || data.region || '';
        isChina = /中国|CN|China/i.test(country);
        requestFinished = true;
        // 请求返回后立即尝试创建横幅
        tryCreateBanner();
    }

    // 立即发起 IP 请求（不等待 DOM）
    const xhr = new XMLHttpRequest();
    xhr.open('GET', API_URL, true);
    xhr.timeout = 5000;
    xhr.onload = function () {
        if (xhr.status === 200) {
            try {
                const data = JSON.parse(xhr.responseText);
                handleResponse(data);
            } catch (_) { /* 忽略 */ }
        }
    };
    xhr.onerror = xhr.ontimeout = function () { /* 静默失败 */ };
    xhr.send();

    // 轮询检测 body 是否可用，一旦可用立即创建
    function tryCreateBanner() {
        if (bannerCreated) return;
        if (!isChina || !requestFinished) return;
        if (!document.body) {
            // body 尚未存在，20ms 后重试
            setTimeout(tryCreateBanner, 20);
            return;
        }
        // body 已存在，立即创建横幅
        createBanner();
        bannerCreated = true;
    }

    // 额外保障：如果请求返回时 body 未准备好，上面轮询会重试；
    // 但如果脚本执行时 body 已经存在（极少情况），也要尝试
    if (document.body && document.readyState !== 'loading') {
        // 如果 body 已经存在且不是加载中，尝试创建（但请求可能未完成）
        // 我们可以先尝试，但会受 isChina 和 requestFinished 限制
        // 所以无事可做，请求回调会触发 tryCreateBanner
    }

    function createBanner() {
        const banner = document.createElement('div');
        banner.id = 'msqy-banner';
        banner.style.cssText = `
            position: fixed;
            top: .4rem;
            left: .9rem;
            right: .9rem;
            z-index: 99999;
            max-width: 600px;
            margin: 0 auto;
            background: var(--efu-card-bg, #fff);
            color: var(--efu-fontcolor, #363636);
            border-radius: 12px;
            padding: 16px 20px;
            box-shadow: 0 8px 30px rgba(0,0,0,0.15);
            font-size: 14px;
            font-family: system-ui, -apple-system, 'Segoe UI', Roboto, sans-serif;
            display: flex;
            align-items: center;
            justify-content: space-between;
            gap: 12px;
            border: var(--style-border, 1px solid var(--efu-card-border, #e3e8f7));
            box-sizing: border-box;
            transition: opacity 0.3s ease, transform 0.3s ease;
            opacity: 0;
            transform: translateY(-10px);
        `;

        const textWrapper = document.createElement('span');
        textWrapper.style.cssText = `
            flex: 1;
            line-height: 1.5;
            color: var(--efu-fontcolor, #363636);
        `;
        textWrapper.innerHTML = `
            🌏 检测到您在中国大陆，建议访问国内镜像站
            <a href="https://${MIRROR_HOST}${window.location.pathname}${window.location.search}"
               style="color: var(--efu-blue, #425aef); font-weight: 600; text-decoration: none;">
                ${MIRROR_HOST}
            </a>
            ，速度更快。
        `;

        const closeBtn = document.createElement('button');
        closeBtn.innerHTML = '✕';
        closeBtn.style.cssText = `
            background: none;
            border: none;
            font-size: 18px;
            cursor: pointer;
            color: var(--efu-secondtext, #a1a2b8);
            padding: 4px 6px;
            line-height: 1;
            transition: color 0.2s;
            flex-shrink: 0;
        `;
        closeBtn.addEventListener('mouseenter', () => {
            closeBtn.style.color = 'var(--efu-fontcolor, #363636)';
        });
        closeBtn.addEventListener('mouseleave', () => {
            closeBtn.style.color = 'var(--efu-secondtext, #a1a2b8)';
        });
        closeBtn.addEventListener('click', () => {
            banner.style.opacity = '0';
            banner.style.transform = 'translateY(-20px)';
            setTimeout(() => banner.remove(), 300);
            // 不保存状态，刷新后重新出现
        });

        banner.appendChild(textWrapper);
        banner.appendChild(closeBtn);
        document.body.appendChild(banner);

        requestAnimationFrame(() => {
            banner.style.opacity = '1';
            banner.style.transform = 'translateY(0)';
        });
    }
})();
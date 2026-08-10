---
title: 零预算网站域名解决方案
date: 2026-08-08 21:03:00
description: 没有预算买域名？GitHub Pages 的域名 + Cloudflare Pages 作镜像站，这个方案也不错。
tags:
  - Hexo
  - Pages
  - Bing
categories:
  - 网站
cover: cover.webp
comments: true
ai_text: 因 .cc.cd 域名被 Bing 屏蔽，改用 GitHub Pages 默认域名作主站，Cloudflare Pages 作国内镜像站。通过 IP 检测弹出横幅引导大陆用户，并用 canonical 标签避免重复内容影响 SEO，兼顾稳定与速度。
---
## 碎碎念

我之前一直使用的域名都是 ljxh-h.cc.cd。后来在让 Bing 收录的时候，不知道为什么，Bing 已经建立索引了，但是我没有办法搜索到这个域名。我以为是我操作时不小心动到了什么东西，让这个域名被污染了，于是，我又换到了 msqy.cc.cd。

问题依旧。Bing 死活不显示在搜索结果中。我也咨询了 Bing Webmaster Tools 团队好几次，他们也不说具体原因，只说“你的网站不符合规范，请根据文档进行操作”。没办法了，只好问 DeepSeek。DeepSeek ~~用最直接、最真相、最不绕弯、最扎心、最硬核、最干脆、最不墨迹、最戳痛点、最不留情面、最一针见血、最开门见山、最单刀直入、最不铺垫、最不客套、最不煽情、最不废话、最不拐弯、最不磨叽、最不装、最不端着、最不啰嗦、最不拖沓、最不委婉、最不掩饰、最不藏着掖着、最直白、最露骨、最实在、最通透、最毒辣、最爽快、最解气、最上头、最够劲、最过瘾、最粗暴、最有效、最狠、最准、最稳、最绝、最顶、最炸、最刚、最烈、最飒、最莽、最冲、最猛、最脆、最亮、最透、最干、最净、最利落、最霸道、最硬核、最生猛、最狂野、最直白、最粗暴、最不讲虚的、最不玩套路、最不搞形式、最不整虚头巴脑、最只讲干货、最只说重点、最只给结果、最只聊真相、最只谈核心、最只戳关键的方式来~~告诉我：

> 因为 cc.cd 的母域名 .cd 注册局早已瘫痪，过期域名无人清理、长期被滥用于垃圾站，Bing 直接判定其为高风险“僵尸域名池”，所以哪怕索引了也死都不会给你展示。

虽然 Bing 没有证实这一点，但是这句话还是有道理的。

当然也有可能是我的网站建立时间太短了，权威性不高，但我已经等了两个月了！我之前有一个 cc.cd 域名，Bing 一索引就能搜索到。那时候能显示，大概是因为当时 Bing 的要求比较宽松吧。

要解决这个问题最简单的方法是：买一个 .com、.net 这样的域名，可惜要钱。

DeepSeek 推荐了 GitHub Pages 的默认域名 \<yourusername\>.github.io。这个域名背后是 GitHub，比较稳定，而且“是微软亲儿子”，Bing 的信任度可能比较高。

那就用 \<yourusername\>.github.io 吧，毕竟很多人都选这个。

但是，GitHub Pages 毕竟是国外平台，访问速度是大家有目共睹的慢。那怎么搞比较好？

## 解决方案

我想到了个绝佳的好方法：以 Github Pages 为主站，搜索引擎、友链交换都用这个；用更快的 Cloudflare Pages 部署博客，使用 cc.cd 域名作国内镜像站。

那该怎么提示中国大陆用户去镜像站呢？

### 提示用户前往镜像站

首先要解决提示信息何时出现的问题。

如果我们把提示信息组件放在 `<body>` 里面，通过 JavaScript 控制显示隐藏，那么这个脚本可能会被浏览器最后加载，到了这时候，资源文件基本已经加载完了，再提示用户去镜像站就没有意义了。

那直接把组件和 JavaScript 嵌入到 `<head>` 里吧。一般的浏览器都会最先加载 `<head>` 部分，只要浏览器获取到了 html，那么浏览器必定能获取到内嵌的 JavaScript，不会被其他资源文件加载所阻塞。

至于在 JavaScript 显示组件的时机，应该是要获取到用户位置后立即显示，如果等 DOM 加载完成，那太晚了，资源文件可能已经加载好了。

获取用户位置，最简单的就是使用 IP 地址获取用户位置的 API 了。向 API 发送请求后，API 会返回带地区代码的数据。我们只要判断数据中的地区代码是否属于中国大陆即可。

知道了基本实现逻辑，那就可以直接写代码了。

``` JavaScript
// ip-banner.js
// DeepSeek 写的，质量不咋地，但能用
(function () {
    const MIRROR_HOST = '替换为你的镜像站';
    const API_URL = '替换为你的 api';

    // 如果已经在镜像站，不再检测
    if (window.location.hostname === MIRROR_HOST) return;

    let isChina = false;
    let requestFinished = false;
    let bannerCreated = false;
    //这里可能需要根据你的 api 返回数据修改
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
```

将这段代码嵌入到 `<head>` 里即可。

Solitude 主题自带了嵌入功能：

``` YAML
# Extend
# 扩展
extends:
  # Insert in head
  # 插入到 head
  head:
    - <scripts>#在这里嵌入代码</scripts>
```

这样，Hexo 在生成静态文件时，就会将这段嵌入到每个 html 文件的 `<head>` 部分。

### 部署

代码准备好了，接下来就是部署到 GitHub Pages 上了。我建议新建一个名为 \<yourusername\>.github.io 的仓库，将静态文件上传至该仓库，在仓库设置中开启 GitHub Pages。这样博客就会部署到根目录下，不用担心资源文件路径引用问题。

Hexo 有一个 `hexo deploy` 命令，能帮你自动把资源文件上传到仓库，特别方便，只要先安装 `hexo-deployer-git` 插件：

{% tabs 安装插件 %}

<!-- tab npm -->

``` Shell
npm install hexo-deployer-git --save
```

<!-- endtab -->

<!-- tab pnpm -->

``` Shell
pnpm add hexo-deployer-git
```

<!-- endtab -->

<!-- tab yarn -->

``` Shell
yarn add hexo-deployer-git
```

<!-- endtab -->

{% endtabs %}

在 Hexo 配置文件中设置：

``` YML
deploy:
  type: git
  repo: <repository url> # https://bitbucket.org/JohnSmith/johnsmith.bitbucket.io
  branch: [branch]
  message: [message]
```

之后直接 `hexo deploy` 即可。

Cloudflare Pages 可以直接关联 \<yourusername\>.github.io 仓库，也可以新建一个源码仓库，通过源码构建部署。

### Bing 收录与 SEO 优化

如果有两个内容相似的网站的话，Bing 会降低网站的排名。

不过要解决这个问题很简单，只要在 html 文件的 `<head>` 插入：

``` html
<link rel="canonical" href="你的主网站域名" />
```

即可。Bing 会优先索引你的主网站，镜像站不会被收录。

如果是 Hexo 博客，只要将配置文件中的

``` YML
url: 你的主网站
```

改为你的主网站即可。Hexo 在构建时会自动加入上述标签。

至于 \<yourusername\>.github.io 的收录情况，我会在这里更新。

### 结尾

折腾了大半天，终于解决了博客的域名问题。但愿能被 Bing 收录吧。不过收不收录也无所谓了，毕竟我一开始选择 \<yourusername\>.github.io 作主域名，也只是看中它更稳定罢了。
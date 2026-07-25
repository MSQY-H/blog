// scripts/fix-empty-alt.js
const cheerio = require('cheerio');

hexo.extend.filter.register('after_render:html', function (html, data) {
  const $ = cheerio.load(html, { decodeEntities: false });
  
  $('img').each((i, el) => {
    const $img = $(el);
    const alt = $img.attr('alt');
    
    // 如果 alt 缺失或为空字符串
    if (alt === undefined || alt.trim() === '') {
      // 从 src 或 data-lazy-src 中提取文件名（不含扩展名）
      let src = $img.attr('src') || $img.attr('data-lazy-src') || '';
      let fileName = src.split('/').pop().split('.').shift();
      
      // 如果还是无法提取，则用通用占位
      const defaultAlt = fileName || 'image';
      
      // 设置 alt 属性（保留原空字符串的情况）
      $img.attr('alt', defaultAlt);
    }
  });
  
  return $.html();
});
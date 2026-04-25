import fs from 'fs';

const files = ['app/[slug]/admin/page.tsx', 'components/ShopView.tsx'];

files.forEach(file => {
  let content = fs.readFileSync(file, 'utf8');
  content = content.replace(/bg-neutral-900(?!\s+theme-bg)/g, 'bg-neutral-900 theme-bg');
  content = content.replace(/text-neutral-900(?!\s+theme-text)/g, 'text-neutral-900 theme-text');
  content = content.replace(/hover:bg-neutral-800(?!\s+theme-bg-hover)/g, 'hover:bg-neutral-800 theme-bg-hover');
  content = content.replace(/border-neutral-900(?!\s+theme-border)/g, 'border-neutral-900 theme-border');
  // Avoid duplicating theme classes if they already exist
  content = content.replace(/theme-bg theme-bg/g, 'theme-bg');
  content = content.replace(/theme-text theme-text/g, 'theme-text');
  content = content.replace(/theme-bg-hover theme-bg-hover/g, 'theme-bg-hover');
  content = content.replace(/theme-border theme-border/g, 'theme-border');
  fs.writeFileSync(file, content);
});
console.log('Replaced successfully');

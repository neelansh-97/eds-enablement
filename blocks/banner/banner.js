import { createOptimizedPicture } from '../../scripts/aem.js';

export default function decorate(block) {
  const fields = {};

  [...block.children].forEach((row) => {
    const [labelDiv, valueDiv] = row.children;
    if (!labelDiv || !valueDiv) return;
    const label = labelDiv.textContent.trim().toLowerCase();
    fields[label] = valueDiv;
  });

  block.replaceChildren();

  const {
    image, title, text, color,
  } = fields;

  const colorValue = color?.textContent.trim();
  if (colorValue) block.style.setProperty('--banner-background-color', colorValue);

  const img = image?.querySelector('img');
  if (img) {
    image.replaceChildren(createOptimizedPicture(img.src, img.alt, false, [{ width: '750' }]));
    image.className = 'banner-image';
    block.append(image);
  }

  const contentParts = [...(title ? title.children : []), ...(text ? text.children : [])];
  if (contentParts.length) {
    const content = document.createElement('div');
    content.className = 'banner-content';
    content.append(...contentParts);
    block.append(content);
  }
}

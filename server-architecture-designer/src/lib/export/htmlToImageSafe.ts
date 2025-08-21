import * as htmlToImage from 'html-to-image';

export async function toPngSafe(el: HTMLElement, opts?: any): Promise<string> {
  const placeholder = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR4nGMAAQAABQABDQottAAAAABJRU5ErkJggg==';
  const options: any = {
    cacheBust: true,
    backgroundColor: '#ffffff',
    imagePlaceholder: placeholder,
    pixelRatio: 2,
    ...opts,
  };
  let added = false;
  if (!el.classList.contains('rf-exporting')) {
    el.classList.add('rf-exporting');
    added = true;
  }
  try {
    return await htmlToImage.toPng(el, options);
  } finally {
    if (added) el.classList.remove('rf-exporting');
  }
}

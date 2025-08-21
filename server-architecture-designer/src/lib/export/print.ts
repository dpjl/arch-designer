export function printDataUrl(dataUrl: string, title: string = 'Impression') {
  const iframe = document.createElement('iframe');
  iframe.style.position = 'fixed';
  iframe.style.right = '-10000px';
  iframe.style.bottom = '-10000px';
  iframe.style.width = '0';
  iframe.style.height = '0';
  iframe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(iframe);
  const idoc = iframe.contentDocument || iframe.contentWindow?.document;
  if (!idoc) { throw new Error('print: no document'); }
  idoc.open();
  idoc.write(`<!doctype html><html><head><meta charset="utf-8"><title>${title}</title>
    <style>@page{size:auto;margin:10mm}html,body{height:100%}body{margin:0;display:flex;align-items:center;justify-content:center;background:#fff}img{max-width:100%;max-height:100%}</style>
  </head><body><img id="print-img" alt="diagram" /></body></html>`);
  idoc.close();
  const iwin = iframe.contentWindow as Window;
  const imgEl = idoc.getElementById('print-img') as HTMLImageElement | null;
  if (!imgEl) { throw new Error('print: no image'); }
  imgEl.onload = () => {
    try { iwin.focus(); } catch {}
    setTimeout(() => { try { iwin.print(); } catch {} }, 50);
    setTimeout(() => { try { iframe.remove(); } catch {} }, 1000);
  };
  imgEl.src = dataUrl;
}

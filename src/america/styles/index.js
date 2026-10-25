// Stil kaydı: bu klasördeki her StyleSpec dosyası kendiliğinden yüklenir. Yeni stil = yeni dosya.
const modules = import.meta.glob(['./*.js', '!./index.js'], {eager:true});
export const STYLES = {};
for (const mod of Object.values(modules)) if (mod.default && mod.default.id) STYLES[mod.default.id] = mod.default;

const anaIcerik = document.getElementById('ana-icerik');
const sidebar = document.getElementById('sidebar');
const karartma = document.getElementById('karartma');
const sidebarMenu = document.getElementById('dinamik-defter-menusu');
const cekmece = document.getElementById('kisisellestirme-cekmece');
const renkPaletiKutusu = document.getElementById('renk-paleti');
const desenKutulari = document.querySelectorAll('.desen-kutu');
const adInput = document.getElementById('defter-adi-input');
const turInput = document.getElementById('defter-turu-input');
const sifreInput = document.getElementById('defter-sifre-input');
const onizlemeKutu = document.getElementById('defter-onizleme');

function guvenliOku(anahtar, varsayilan) { try { const veri = JSON.parse(localStorage.getItem(anahtar)); return (veri===null||typeof veri!=='object')?varsayilan:veri; } catch (e) { return varsayilan; } }

let defterler = Array.isArray(guvenliOku('defterler', [])) ? guvenliOku('defterler', []) : [];
let defterVerileri = guvenliOku('defterVerileri', {});
let maddeler = Array.isArray(guvenliOku('maddeler', [])) ? guvenliOku('maddeler', []) : [];
let aktifDefterId = null;
let aktifTarih = new Date();
let bekleyen = null; 
let duzenlenenDefterId = null;
let acilacakDefterId = null; // Şifre kontrolü için

const TUR_BILGI = {
    gunluk:   { ad: 'Günlük Ajanda',   ikon: '📅', etiket: 'GÜNLÜK AJANDA' },
    haftalik: { ad: 'Haftalık Ajanda', ikon: '📆', etiket: 'HAFTALIK AJANDA' },
    aylik:    { ad: 'Aylık Ajanda',    ikon: '🗓️', etiket: 'AYLIK AJANDA' },
    diary:    { ad: 'Sevgili Günlük',  ikon: '📖', etiket: 'SEVGİLİ GÜNLÜK' },
    todo:     { ad: 'To-Do List',      ikon: '📋', etiket: 'TO-DO LİST' },
    not:      { ad: 'Not Defteri',     ikon: '📝', etiket: 'NOT DEFTERİ' }
};

const MADDE_TURLERI = {
    normal:   { s: '',   ad: 'Normal' },
    sinav:    { s: '📝', ad: 'Sınav / Test' },
    quiz:     { s: '❓', ad: 'Ödev / Quiz' },
    dogum:    { s: '🎂', ad: 'Doğum Günü' },
    randevu:  { s: '🏥', ad: 'Randevu' },
    etkinlik: { s: '🎉', ad: 'Etkinlik' }
};

const ESTETIK_RENKLER = [
    '#f2ead3', '#f4e3d3', '#e5c5b5', '#e5c185', '#f3d1c1', '#e5b299', '#cb997e', '#e29578', '#d68071', '#f2c6c2',
    '#d6a3a9', '#8e5967', '#9b828d', '#9c89b8', '#6d6875', '#4a4e69', '#5c6b73', '#b1b1a5', '#9a9a86', '#c6d1b8',
    '#a3b18a', '#a8b89e', '#90a996', '#98b0a9', '#52796f', '#ddb892', '#d2b49e', '#ba937e', '#b4846c', '#7f5539'
];

let seciliRenk = '#b4846c';
let seciliDesen = 'desen-duz';

function esc(m) { return String(m).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;'); }
function tarihAnahtari(t) { return `${t.getFullYear()}-${String(t.getMonth()+1).padStart(2,'0')}-${String(t.getDate()).padStart(2,'0')}`; }
function haftaninPazartesisi(t) { const g = (t.getDay() + 6) % 7; return new Date(t.getFullYear(), t.getMonth(), t.getDate() - g); }

function kaydet() {
    localStorage.setItem('defterler', JSON.stringify(defterler));
    localStorage.setItem('defterVerileri', JSON.stringify(defterVerileri));
    localStorage.setItem('maddeler', JSON.stringify(maddeler));
}

function varsayilanAd(tur) {
    const temel = (TUR_BILGI[tur] || TUR_BILGI.not).ad; let ad = temel; let n = 2;
    while (defterler.some(d => d.ad === ad)) { ad = `${temel} ${n}`; n++; } return ad;
}

function init() {
    try {
        ESTETIK_RENKLER.forEach(r => {
            const div = document.createElement('div'); div.className = 'renk-secenek'; div.style.backgroundColor = r; div.dataset.renk = r;
            if(r===seciliRenk) div.classList.add('aktif');
            div.onclick = () => { document.querySelectorAll('.renk-secenek').forEach(el=>el.classList.remove('aktif')); div.classList.add('aktif'); seciliRenk = r; onizlemeGuncelle(); };
            renkPaletiKutusu.appendChild(div);
        });

        desenKutulari.forEach(k => k.onclick = () => { desenKutulari.forEach(el=>el.classList.remove('aktif')); k.classList.add('aktif'); seciliDesen = k.dataset.desen; onizlemeGuncelle(); });
        adInput.oninput = onizlemeGuncelle; turInput.onchange = onizlemeGuncelle;
        
        document.getElementById('btn-tema').onclick = () => { const k=document.body.classList.toggle('dark-mode'); localStorage.setItem('koyuTema',k); document.getElementById('btn-tema').textContent = k?'☀️ Gündüz Modu':'🌙 Gece Modu'; };
        
        document.getElementById('btn-yeni-defter-sidebar').onclick = () => { 
            duzenlenenDefterId = null;
            const baslikMetni = document.getElementById('cekmece-baslik-metni');
            if (baslikMetni) baslikMetni.textContent = 'Yeni Defter Oluştur';
            document.getElementById('btn-defter-kaydet').textContent = 'Masaya Koy';
            
            turInput.disabled = false;
            adInput.value = '';
            sifreInput.value = '';
            seciliRenk = '#b4846c'; seciliDesen = 'desen-duz';
            
            document.querySelectorAll('.renk-secenek').forEach(el => el.classList.toggle('aktif', el.dataset.renk === seciliRenk));
            desenKutulari.forEach(el => el.classList.toggle('aktif', el.dataset.desen === seciliDesen));
            
            sidebar.classList.remove('aktif'); cekmece.classList.add('acik'); karartma.classList.add('acik'); onizlemeGuncelle(); 
        };
        
        document.getElementById('btn-cekmece-kapat').onclick = () => { cekmece.classList.remove('acik'); karartma.classList.remove('acik'); };
        document.getElementById('btn-anasayfa').onclick = renderAnaSayfa;
        document.getElementById('btn-defter-kaydet').onclick = defterOlusturVeyaGuncelle;
        document.getElementById('menu-toggle').onclick = () => { sidebar.classList.toggle('aktif'); karartma.classList.toggle('acik', sidebar.classList.contains('aktif')); };
        karartma.onclick = () => { sidebar.classList.remove('aktif'); cekmece.classList.remove('acik'); karartma.classList.remove('acik'); };
        
        // Şifre kontrol butonu
        document.getElementById('btn-pin-onayla').onclick = sifreKontrolEt;

        if (localStorage.getItem('koyuTema')==='true') document.body.classList.add('dark-mode');
        document.getElementById('btn-tema').textContent = document.body.classList.contains('dark-mode')?'☀️ Gündüz Modu':'🌙 Gece Modu';
        
        onizlemeGuncelle(); renderAnaSayfa();
    } catch (error) { console.error("Hata:", error); }
}

function onizlemeGuncelle() {
    const t = turInput.value, b = TUR_BILGI[t]; adInput.placeholder = 'Boş bırakırsan: ' + varsayilanAd(t);
    onizlemeKutu.className = 'masadaki-defter onizleme-defter ' + seciliDesen + (t==='todo'?' spiralli':''); 
    onizlemeKutu.style.backgroundColor = seciliRenk;
    document.documentElement.style.setProperty('--onizleme-renk', seciliRenk);
    onizlemeKutu.querySelector('h3').textContent = adInput.value.trim() || varsayilanAd(t); onizlemeKutu.querySelector('span').textContent = b.etiket;
}

function renderSidebar() {
    sidebarMenu.innerHTML = '';
    defterler.forEach(d => {
        const b = TUR_BILGI[d.tur]; const btn = document.createElement('button'); 
        btn.className = 'menu-btn' + (d.id === aktifDefterId ? ' secili' : '');
        btn.innerHTML = `<span class="renk-nokta" style="background:${esc(d.renk)}"></span>${d.sifre?'🔒':b.ikon} ${esc(d.ad)}`;
        btn.onclick = () => defterAc(d.id); sidebarMenu.appendChild(btn);
    });
}

function renderAnaSayfa() {
    aktifDefterId = null; bekleyen = null; 
    renderSidebar();

    let html = `<div class="sayfa-baslik"><h1>🏠 Çalışma Masam</h1><p>${defterler.length?'Kahveni yudumla ve defterini seç...':'Masan şu an boş.'}</p></div>`;
    html += `<div class="masa-alani"><div class="masa-dekor dekor-bitki">🪴</div><div class="masa-dekor dekor-kahve">☕</div><div class="masa-dekor dekor-mum">🕯️</div><div class="masa-dekor dekor-kulaklik">🎧</div><div class="masa-dekor dekor-notlar">📝</div>`;
        
    if (defterler.length === 0) {
        html += `<div class="bos-masa"><div class="arti-buyuk" onclick="document.getElementById('btn-yeni-defter-sidebar').click()">➕</div><p>İlk defterini oluşturmak için tıkla</p></div>`;
    } else {
        html += `<div class="masa-sahnesi">`;
        defterler.forEach(d => { 
            const kilitIcon = d.sifre ? `<div class="kilit-ikon">🔒</div>` : '';
            html += `<div class="masadaki-defter ${esc(d.desen)}${d.tur==='todo'?' spiralli':''}" style="background-color:${esc(d.renk)}" onclick="defterAc(${d.id})">${kilitIcon}<div class="kapak-etiket"><h3>${esc(d.ad)}</h3><span>${TUR_BILGI[d.tur].etiket}</span></div></div>`; 
        });
        html += `<div class="masadaki-defter yeni-defter-kutu" onclick="document.getElementById('btn-yeni-defter-sidebar').click()"><span class="arti">➕</span></div></div>`;
    }
    anaIcerik.innerHTML = html + `</div>`; sidebar.classList.remove('aktif'); karartma.classList.remove('acik');
}

function defterOlusturVeyaGuncelle() {
    const tur = turInput.value; 
    const ad = adInput.value.trim() || varsayilanAd(tur);
    const sifre = sifreInput.value.trim();
    
    if (duzenlenenDefterId) {
        const d = defterler.find(x => x.id === duzenlenenDefterId);
        if (d) { d.ad = ad; d.renk = seciliRenk; d.desen = seciliDesen; d.sifre = sifre; }
    } else {
        const tekliTurler = ['gunluk', 'haftalik', 'aylik', 'diary'];
        if(tekliTurler.includes(tur) && defterler.some(d => d.tur === tur)){
            alert(`Masanızda zaten bir "${TUR_BILGI[tur].ad}" var!\n(Sadece Not Defteri ve To-Do List'ten birden fazla oluşturabilirsiniz)`);
            return;
        }
        const id = Date.now();
        defterler.push({ id, ad, tur, renk: seciliRenk, desen: seciliDesen, sifre: sifre }); defterVerileri[id] = {}; 
    }
    
    kaydet();
    cekmece.classList.remove('acik'); karartma.classList.remove('acik'); 
    
    if (duzenlenenDefterId) { sayfaCiz(); } 
    else { renderAnaSayfa(); }
}

function defterDuzenleModalAc(id) {
    duzenlenenDefterId = id;
    const d = defterler.find(x => x.id === id);
    if(!d) return;
    
    const baslikMetni = document.getElementById('cekmece-baslik-metni');
    if (baslikMetni) baslikMetni.textContent = 'Defteri Düzenle';
    document.getElementById('btn-defter-kaydet').textContent = 'Değişiklikleri Kaydet';
    
    adInput.value = d.ad;
    turInput.value = d.tur;
    turInput.disabled = true; 
    sifreInput.value = d.sifre || '';
    
    seciliRenk = d.renk;
    seciliDesen = d.desen;
    
    document.querySelectorAll('.renk-secenek').forEach(el => el.classList.toggle('aktif', el.dataset.renk === seciliRenk));
    desenKutulari.forEach(el => el.classList.toggle('aktif', el.dataset.desen === seciliDesen));
    
    onizlemeGuncelle();
    cekmece.classList.add('acik'); karartma.classList.add('acik');
}

function defterAc(id) { 
    const d = defterler.find(x => x.id === id);
    if(d.sifre && aktifDefterId !== id) {
        acilacakDefterId = id;
        document.getElementById('pin-giris').value = '';
        document.getElementById('pin-modal').style.display = 'flex';
    } else {
        defterAcOnay(id);
    }
}

function sifreKontrolEt() {
    const girilen = document.getElementById('pin-giris').value;
    const d = defterler.find(x => x.id === acilacakDefterId);
    if(d.sifre === girilen) {
        document.getElementById('pin-modal').style.display = 'none';
        defterAcOnay(acilacakDefterId);
    } else {
        alert('Yanlış şifre!');
        document.getElementById('pin-giris').value = '';
    }
}

function defterAcOnay(id) {
    aktifDefterId = id; aktifTarih = new Date(); sidebar.classList.remove('aktif'); karartma.classList.remove('acik'); sayfaCiz();
}

function bugunGit() { aktifTarih = new Date(); sayfaCiz(); }

function tarihDegistir(n) {
    const icerikKutusu = document.getElementById('animasyon-kutusu');
    if(!icerikKutusu) return;
    bekleyen = null; 
    
    icerikKutusu.style.animation = 'none'; void icerikKutusu.offsetWidth; 
    icerikKutusu.className = 'acik-defter-icerik sayfa-cevriliyor-gidis';
    
    setTimeout(() => {
        const d = defterler.find(x => x.id === aktifDefterId);
        if (d.tur === 'haftalik') aktifTarih.setDate(aktifTarih.getDate() + n * 7);
        else if (d.tur === 'aylik') aktifTarih.setMonth(aktifTarih.getMonth() + n);
        else aktifTarih.setDate(aktifTarih.getDate() + n);
        sayfaCiz(true); 
    }, 320); 
}

function gorunenler(tk) { 
    const aktifD = defterler.find(x => x.id === aktifDefterId);
    if(!aktifD) return [];

    let liste = [];
    maddeler.forEach(m => {
        if(m.ust) return; 
        if(m.tarih !== tk) return; 

        const kaynakD = defterler.find(x => x.id === m.defterId);
        if(!kaynakD) return;

        if(aktifD.tur === 'gunluk') {
            if(['gunluk', 'haftalik', 'aylik'].includes(kaynakD.tur)) {
                liste.push({...m, etiket: kaynakD.tur !== 'gunluk' ? kaynakD.tur : null});
            }
        } 
        else if(aktifD.tur === 'haftalik') {
            if(['haftalik', 'aylik'].includes(kaynakD.tur)) {
                liste.push({...m, etiket: kaynakD.tur !== 'haftalik' ? kaynakD.tur : null});
            }
        }
        else if(aktifD.tur === 'aylik' || aktifD.tur === 'todo') {
            if(kaynakD.tur === aktifD.tur && m.defterId === aktifD.id) liste.push({...m, etiket: null});
        }
    });
    return liste.sort((a,b)=>(a.saat||'99:99').localeCompare(b.saat||'99:99')); 
}

function satirHTML(tarih, ust) {
    if (!bekleyen || bekleyen.tarih !== tarih || bekleyen.ust !== ust) return '';
    return `<div class="satir-ekle">
        <textarea id="satir-girdi" rows="1" placeholder="Ne yapılacak?" oninput="this.style.height='';this.style.height=this.scrollHeight+'px'"></textarea>
        <button class="mini" data-eylem="satir-tamam">✔</button>
        <button class="mini sil" data-eylem="satir-iptal">✕</button>
    </div>`;
}

function maddeHTML(m) {
    const t = MADDE_TURLERI[m.tur] || MADDE_TURLERI.normal;
    const kaynakEtiketi = m.etiket ? `<em class="etiket-kaynak">${m.etiket === 'aylik' ? 'Aylık Plan' : 'Haftalık Plan'}</em>` : '';
    const isCascaded = m.etiket != null;

    const altlar = maddeler.filter(x => x.ust === m.id).map(a => `<div class="madde alt${a.bitti?' bitti':''}"><div class="madde-satir"><input type="checkbox" data-eylem="isaretle" data-id="${a.id}" ${a.bitti?'checked':''}><span class="madde-metin">${esc(a.metin)}</span>${!isCascaded ? `<button class="mini sil" data-eylem="sil" data-id="${a.id}">✕</button>`:''}</div></div>`).join('');
    const butonlar = !isCascaded ? `<button class="mini" data-eylem="alt" data-id="${m.id}">➕</button><button class="mini sil" data-eylem="sil" data-id="${m.id}">✕</button>` : '';

    return `<div class="madde tur-${m.tur}${m.bitti?' bitti':''}"><div class="madde-satir"><input type="checkbox" data-eylem="isaretle" data-id="${m.id}" ${m.bitti?'checked':''}><span class="madde-metin">${t.s} ${m.saat?`<b class="saat">${m.saat}</b> `:''}${esc(m.metin)} ${kaynakEtiketi}</span>${butonlar}</div>${altlar || satirHTML(m.tarih, m.id) ? `<div class="alt-liste">${altlar}${satirHTML(m.tarih, m.id)}</div>` : ''}</div>`;
}

function ekleKutusuAc(tarih, ust) {
    const eski = document.getElementById('kaplama'); if(eski) eski.remove();
    if(ust) { bekleyen = {tarih, ust, saat:'', tur:'normal'}; sayfaCiz(); return; } 
    const k = document.createElement('div'); k.className = 'kaplama'; k.id = 'kaplama';
    k.innerHTML = `<div class="kutu"><h3>Görev Detayları</h3>
        <label>Saat (isteğe bağlı)</label><input type="time" id="k-saat">
        <label>Tür</label><select id="k-tur">${Object.keys(MADDE_TURLERI).map(t=>`<option value="${t}">${MADDE_TURLERI[t].s}${MADDE_TURLERI[t].ad}</option>`).join('')}</select>
        <div class="kutu-butonlar"><button class="iptal" id="k-iptal">İptal</button><button class="tamam" id="k-tamam">Yazmaya Başla</button></div></div>`;
    document.body.appendChild(k);
    k.querySelector('#k-tamam').onclick = () => { bekleyen = {tarih, ust:null, saat:k.querySelector('#k-saat').value, tur:k.querySelector('#k-tur').value}; k.remove(); sayfaCiz(); };
    k.querySelector('#k-iptal').onclick = () => k.remove();
}

function bekleyeniEkle() {
    const girdi = document.getElementById('satir-girdi'); if(!girdi || !girdi.value.trim() || !bekleyen) return;
    maddeler.push({ id: Date.now().toString(36), defterId: aktifDefterId, tarih: bekleyen.tarih, ust: bekleyen.ust, metin: girdi.value.trim(), saat: bekleyen.saat, tur: bekleyen.tur, bitti: false });
    bekleyen = null; kaydet(); sayfaCiz();
}

anaIcerik.addEventListener('click', e => {
    const el = e.target.closest('[data-eylem]'); if(!el) return;
    const eylem = el.dataset.eylem; const id = el.dataset.id;
    if(eylem !== 'satir-tamam') bekleyen = null;
    
    if(eylem === 'ekle') ekleKutusuAc(el.dataset.tarih, null);
    else if(eylem === 'alt') ekleKutusuAc(maddeler.find(m=>m.id===id).tarih, id);
    else if(eylem === 'satir-tamam') bekleyeniEkle();
    else if(eylem === 'satir-iptal') sayfaCiz();
    else if(eylem === 'isaretle') { const h = maddeler.find(m=>m.id===id); if(h) { h.bitti = el.checked; kaydet(); sayfaCiz(); } }
    else if(eylem === 'sil') { maddeler = maddeler.filter(m=>m.id!==id && m.ust!==id); kaydet(); sayfaCiz(); }
    
    else if(eylem === 'gun-git') {
        const gunlukD = defterler.find(x => x.tur === 'gunluk');
        if(gunlukD) { aktifDefterId = gunlukD.id; aktifTarih = new Date(el.dataset.tarih); sayfaCiz(); }
        else { alert("Masanızda Günlük Ajanda yok. Önce bir Günlük Ajanda oluşturmalısınız!"); }
    }
    else if(eylem === 'hafta-git') {
        const haftalikD = defterler.find(x => x.tur === 'haftalik');
        if(haftalikD) { aktifDefterId = haftalikD.id; aktifTarih = new Date(el.dataset.tarih); sayfaCiz(); }
        else { alert("Masanızda Haftalık Ajanda yok. Önce bir Haftalık Ajanda oluşturmalısınız!"); }
    }
});
anaIcerik.addEventListener('keydown', e => { if(e.target.id==='satir-girdi' && e.key==='Enter' && !e.shiftKey){ e.preventDefault(); bekleyeniEkle(); } });

function veriKaydet(anahtar, deger) { if(!defterVerileri[aktifDefterId]) defterVerileri[aktifDefterId]={}; defterVerileri[aktifDefterId][anahtar] = deger; kaydet(); }

// MOOD TRACKER FONKSİYONU
window.moodKaydet = function(tk, emoji) {
    if(!defterVerileri[aktifDefterId]) defterVerileri[aktifDefterId]={};
    if (defterVerileri[aktifDefterId][tk + '-mood'] === emoji) {
        defterVerileri[aktifDefterId][tk + '-mood'] = null; // Tıklananı kaldır
    } else {
        defterVerileri[aktifDefterId][tk + '-mood'] = emoji;
    }
    kaydet(); sayfaCiz();
};

// STICKER SÜRÜKLE BIRAK SİSTEMİ
let aktifStickerId = null;
let offsetX = 0, offsetY = 0;

window.stickerTut = function(e, id) {
    if(e.target.classList.contains('sil-btn-sticker')) return;
    aktifStickerId = id;
    const el = e.currentTarget;
    offsetX = e.clientX - el.getBoundingClientRect().left;
    offsetY = e.clientY - el.getBoundingClientRect().top;
    document.addEventListener('mousemove', stickerSurukle);
    document.addEventListener('mouseup', stickerBirak);
};

function stickerSurukle(e) {
    if(!aktifStickerId) return;
    const icerikKutu = document.getElementById('animasyon-kutusu');
    const rect = icerikKutu.getBoundingClientRect();
    
    let x = e.clientX - rect.left - offsetX + icerikKutu.scrollLeft;
    let y = e.clientY - rect.top - offsetY + icerikKutu.scrollTop;
    
    const el = document.querySelector(`.eklenen-sticker[data-id="${aktifStickerId}"]`);
    if(el) { el.style.left = x + 'px'; el.style.top = y + 'px'; }
}

function stickerBirak(e) {
    if(!aktifStickerId) return;
    document.removeEventListener('mousemove', stickerSurukle);
    document.removeEventListener('mouseup', stickerBirak);
    
    const el = document.querySelector(`.eklenen-sticker[data-id="${aktifStickerId}"]`);
    if(el) {
        const d = defterler.find(x => x.id === aktifDefterId);
        const key = ['not', 'todo'].includes(d.tur) ? d.tur + '-genel-stickers' : tarihAnahtari(aktifTarih) + '-stickers';
        
        let arr = defterVerileri[aktifDefterId][key] || [];
        let st = arr.find(x => x.id == aktifStickerId);
        if(st) { st.x = parseInt(el.style.left); st.y = parseInt(el.style.top); kaydet(); }
    }
    aktifStickerId = null;
}

window.stickerEkle = function(e) {
    const d = defterler.find(x => x.id === aktifDefterId);
    const key = ['not', 'todo'].includes(d.tur) ? d.tur + '-genel-stickers' : tarihAnahtari(aktifTarih) + '-stickers';
    if(!defterVerileri[aktifDefterId]) defterVerileri[aktifDefterId]={};
    if(!defterVerileri[aktifDefterId][key]) defterVerileri[aktifDefterId][key] = [];
    
    const icerikKutu = document.getElementById('animasyon-kutusu');
    const x = icerikKutu.scrollLeft + 100 + (Math.random() * 50);
    const y = icerikKutu.scrollTop + 100 + (Math.random() * 50);

    defterVerileri[aktifDefterId][key].push({id: Date.now(), e: e, x: x, y: y});
    kaydet(); sayfaCiz();
};

window.stickerSil = function(e, id) {
    e.stopPropagation();
    const d = defterler.find(x => x.id === aktifDefterId);
    const key = ['not', 'todo'].includes(d.tur) ? d.tur + '-genel-stickers' : tarihAnahtari(aktifTarih) + '-stickers';
    if(defterVerileri[aktifDefterId][key]) {
        defterVerileri[aktifDefterId][key] = defterVerileri[aktifDefterId][key].filter(x => x.id != id);
        kaydet(); sayfaCiz();
    }
};

function sayfaCiz(animasyonIcindemi = false) {
    const d = defterler.find(x => x.id === aktifDefterId); if(!d) return renderAnaSayfa();
    renderSidebar(); 
    
    const veriler = defterVerileri[d.id] || {}; const tk = tarihAnahtari(aktifTarih); const bugunTk = tarihAnahtari(new Date());
    let icerik = ''; const tarihliMi = !['not', 'todo'].includes(d.tur);

    // YENİ: Mood Tracker
    let moodHTML = '';
    if (d.tur === 'gunluk' || d.tur === 'diary') {
        const moodHissi = veriler[tk + '-mood'] || '';
        const moodEmojis = ['😊', '😌', '😐', '😔', '😭', '😠'];
        moodHTML = `<div class="mood-kabi">
            ${moodEmojis.map(e => `<button class="mood-btn ${moodHissi === e ? 'aktif' : ''}" onclick="moodKaydet('${tk}', '${e}')" title="Modunu Seç">${e}</button>`).join('')}
        </div>`;
    }

    // YENİ: Sticker HTML (Sayfaya Basılanlar + Çekmece)
    const stickerKey = ['not', 'todo'].includes(d.tur) ? d.tur + '-genel-stickers' : tk + '-stickers';
    const aktifStickers = veriler[stickerKey] || [];
    const basilanStickers = aktifStickers.map(s => `<div class="eklenen-sticker" style="left:${s.x}px; top:${s.y}px;" data-id="${s.id}" onmousedown="stickerTut(event, '${s.id}')">${s.e}<button class="sil-btn-sticker" onclick="stickerSil(event, '${s.id}')">✕</button></div>`).join('');
    
// YENİ: Genişletilmiş Sticker Listesi
    const STICKER_LISTESI = [
        '📎','🖇️','📌','📍','🧷','🔖','🏷️','✂️','📝','🎀',
        '🩹','💌','🌸','🌷','🌻','🌿','🍀','🌵','🍄','🍓',
        '🍒','☕','🍵','🧸','🕯️','📖','🎧','📻','🌙','✨',
        '⭐','☁️','🤍','🤎','💖','🦋','🐝','🎨','🛒','🎈'
    ];

    const stickerMenu = `<button class="sticker-menu-btn" onclick="document.getElementById('sticker-kutu-icerik').classList.toggle('acik')">🎀 Sticker</button>
    <div class="sticker-kutusu" id="sticker-kutu-icerik">
        ${STICKER_LISTESI.map(e => `<div class="sticker-sec" onclick="stickerEkle('${e}')">${e}</div>`).join('')}
    </div>`;
    if (d.tur === 'not') {
        icerik = `<div class="sayfa-ust"><h2>${esc(d.ad)}</h2><p>Dilediğin gibi not al.</p></div><textarea class="serbest-yazi-alani" oninput="veriKaydet('genel', this.value)">${esc(veriler['genel']||'')}</textarea>`;
    } else if (d.tur === 'todo') {
        const tkGenel = 'todo-genel';
        icerik = `<div class="sayfa-ust"><h2>${esc(d.ad)}</h2><p>Yapılacaklar Listen</p></div><button class="ekle-btn" data-eylem="ekle" data-tarih="${tkGenel}">➕ Görev Ekle</button><div class="liste">${satirHTML(tkGenel,null)}${gorunenler(tkGenel).map(m=>maddeHTML(m)).join('')}</div>`;
    } else if (d.tur === 'diary') {
        icerik = `<div class="sayfa-ust"><h2>${aktifTarih.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long', year:'numeric'})}</h2><p>Sevgili Günlük...</p>${moodHTML}</div><textarea class="serbest-yazi-alani" placeholder="Bugün neler oldu? İçinden geçenleri yaz..." oninput="veriKaydet('${tk}', this.value)">${esc(veriler[tk]||'')}</textarea>`;
    } else if (d.tur === 'gunluk') {
        const gunlukMaddeler = gorunenler(tk);
        let toplam = 0; let tamamlanan = 0;
        
        gunlukMaddeler.forEach(m => {
            toplam++; if(m.bitti) tamamlanan++;
            maddeler.filter(x => x.ust === m.id).forEach(a => { toplam++; if(a.bitti) tamamlanan++; });
        });
        const yuzde = toplam === 0 ? 0 : Math.round((tamamlanan / toplam) * 100);
        const ilerlemeHTML = `<div class="ilerleme-kabi"><div class="ilerleme-cubugu" style="width: ${yuzde}%"></div><span class="ilerleme-metin">%${yuzde} TAMAMLANDI</span></div>`;

        icerik = `<div class="sayfa-ust"><h2>${aktifTarih.toLocaleDateString('tr-TR',{weekday:'long',day:'numeric',month:'long', year:'numeric'})}</h2><p>Günün Planı</p>${moodHTML}</div>${ilerlemeHTML}<button class="ekle-btn" data-eylem="ekle" data-tarih="${tk}">➕ Görev Ekle</button><div class="liste">${satirHTML(tk,null)}${gunlukMaddeler.map(m=>maddeHTML(m)).join('')}</div>`;
    } else if (d.tur === 'haftalik') {
        const pzt = haftaninPazartesisi(aktifTarih); let kartlar = '';
        for(let i=0; i<7; i++){
            const gun = new Date(pzt.getFullYear(), pzt.getMonth(), pzt.getDate()+i); const gunTk = tarihAnahtari(gun);
            kartlar += `<div class="gun-karti${gunTk===bugunTk?' bugun':''}">
                <div class="gun-baslik" data-eylem="gun-git" data-tarih="${gunTk}" title="Bu güne (Günlük Ajanda) ışınlan">${gun.toLocaleDateString('tr-TR',{weekday:'long'})}<small>${gun.toLocaleDateString('tr-TR',{day:'numeric',month:'long'})}</small></div>
                <button class="ekle-btn" data-eylem="ekle" data-tarih="${gunTk}">➕ Ekle</button>
                <div class="liste">${satirHTML(gunTk,null)}${gorunenler(gunTk).map(m=>maddeHTML(m)).join('')}</div>
            </div>`;
        }
        icerik = `<div class="sayfa-ust"><h2>Haftalık Plan</h2><p>${pzt.toLocaleDateString('tr-TR',{day:'numeric',month:'long'})} Haftası</p></div><div class="haftalik-izgara">${kartlar}</div>`;
    } else if (d.tur === 'aylik') {
        const y = aktifTarih.getFullYear(); const m = aktifTarih.getMonth(); const gunSayisi = new Date(y, m+1, 0).getDate(); const bosluk = (new Date(y, m, 1).getDay()+6)%7;
        let huc = ''; for(let i=0; i<bosluk; i++) huc += '<div class="ay-hucre bos"></div>';
        for(let g=1; g<=gunSayisi; g++){
            const gunTk = tarihAnahtari(new Date(y, m, g));
            huc += `<div class="ay-hucre${gunTk===bugunTk?' bugun':''}">
                <div class="ay-ust"><div class="ay-gun-no" data-eylem="gun-git" data-tarih="${gunTk}" title="Bu güne (Günlük Ajanda) ışınlan">${g}</div><button class="mini" data-eylem="ekle" data-tarih="${gunTk}">➕</button></div>
                <div class="liste">${satirHTML(gunTk,null)}${gorunenler(gunTk).map(m=>maddeHTML(m)).join('')}</div>
                ${new Date(y,m,g).getDay() === 0 ? `<button class="hafta-git-btn" data-eylem="hafta-git" data-tarih="${gunTk}">Haftaya Git ➔</button>`:''}
            </div>`;
        }
        icerik = `<div class="sayfa-ust"><h2>${aktifTarih.toLocaleDateString('tr-TR',{month:'long',year:'numeric'})}</h2><p>Aylık Hedefler</p></div><div class="ay-izgara">${huc}</div>`;
    }

    // Sticklerları içeriğe dahil et
    icerik += stickerMenu + basilanStickers;

    if(animasyonIcindemi) {
        const kutu = document.getElementById('animasyon-kutusu');
        kutu.innerHTML = icerik;
        kutu.className = 'acik-defter-icerik sayfa-cevriliyor-gelis'; 
        setTimeout(() => { document.getElementById('satir-girdi')?.focus(); }, 100);
    } else {
        const oklar = tarihliMi ? `<button class="sayfa-cevir-btn sayfa-geri" onclick="tarihDegistir(-1)">◀</button><button class="sayfa-cevir-btn sayfa-ileri" onclick="tarihDegistir(1)">▶</button>` : '';
        anaIcerik.innerHTML = `
            <div class="ust-bar">
                <button class="geri-btn" onclick="renderAnaSayfa()">← Masama Dön</button>
                <h1><span class="renk-nokta buyuk" style="background:${esc(d.renk)}"></span>${esc(d.ad)}</h1>
                ${tarihliMi ? '<button class="bugun-btn" onclick="bugunGit()">Bugün</button>' : ''}
                <button class="duzenle-btn" onclick="defterDuzenleModalAc(${d.id})">✏️ Düzenle</button>
                <button class="sil-btn" onclick="if(confirm('Defter silinecek?')){ defterler=defterler.filter(x=>x.id!==${d.id}); kaydet(); renderAnaSayfa(); }">🗑️ Çöpe At</button>
            </div>
            <div class="defter-govde" style="--defter-renk:${esc(d.renk)}">
                ${oklar}
                <div class="acik-defter-icerik" id="animasyon-kutusu">${icerik}</div>
            </div>`;
        document.getElementById('satir-girdi')?.focus();
    }
}
init();
import{u as O,r as l,au as $,aa as H,j as e,L as W,ae as G,e as J}from"./app-Bf__Zj4H.js";import{A as V}from"./arrow-left-DBK6kcGf.js";function Y(){const{currentUser:i,consultations:c,studentAdvisors:y,advisors:x,thesisTitles:g=[],minSessionsRequirement:w}=O(),a=(i==null?void 0:i.nim)||"";l.useMemo(()=>$(c,a,2),[c,a]);const _=l.useMemo(()=>{var s;if(!i)return"-";const r=String(a||(i==null?void 0:i.nim)||"").trim(),t=String((i==null?void 0:i.id)||"").trim(),n=String((i==null?void 0:i.nama)||"").trim().toLowerCase();if(Array.isArray(g)&&g.length>0){const m=g.filter(o=>{const p=r&&String(o.mhs_nim||"").trim()===r,N=t&&String(o.profile_id||"").trim()===t,k=n&&String(o.mhs_nama||"").trim().toLowerCase()===n;return p||N||k});if(m.length>0){const o=m.find(p=>p.status==="disetujui"||p.status==="judul_fix");if(o!=null&&o.judul)return o.judul;if((s=m[0])!=null&&s.judul)return m[0].judul}}return i!=null&&i.judul_ta?i.judul_ta:i!=null&&i.judul?i.judul:"-"},[g,i,a]),d=l.useMemo(()=>a?y.find(r=>String(r.student_nim).trim()===String(a).trim()):null,[y,a]),P=l.useMemo(()=>{if(d!=null&&d.dospem1_nip){const t=x.find(n=>n.nip===d.dospem1_nip);if(t)return t.nama}const r=c.find(t=>String(t.mhs_nim).trim()===String(a).trim()&&t.pembimbing==="Pembimbing 1");return r!=null&&r.dosen_nama?r.dosen_nama:"-"},[x,d,c,a]),I=l.useMemo(()=>{if(d!=null&&d.dospem2_nip){const t=x.find(n=>n.nip===d.dospem2_nip);if(t)return t.nama}const r=c.find(t=>String(t.mhs_nim).trim()===String(a).trim()&&t.pembimbing==="Pembimbing 2");return r!=null&&r.dosen_nama?r.dosen_nama:"-"},[x,d,c,a]),D=r=>{if(!r)return null;let t=r.jenis_revisi;const n=r.masukan_dosen||"";n.includes("[Revisi Mayor]")||n.includes("[Mayor]")?t="Mayor":n.includes("[Revisi Minor]")||n.includes("[Minor]")?t="Minor":n.includes("[Diterima]")||n.includes("[Disetujui]")?t="Diterima":n.includes("[Menunggu]")&&(t="Menunggu"),t||(r.status==="disetujui"?t="Diterima":r.status==="menunggu_tanggapan"?t="Menunggu":r.status==="perlu_revisi"?t="Minor":r.status==="ditolak"?t="Ditolak":t="Menunggu");const s=String(t).trim();return s==="Mayor"||s.toLowerCase()==="revisi mayor"?e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:"Revisi Mayor"}):s==="Minor"||s.toLowerCase()==="revisi minor"?e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-blue-300 bg-blue-50 text-blue-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:"Revisi Minor"}):s==="Menunggu"||s.toLowerCase()==="menunggu tanggapan"?e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-amber-300 bg-amber-50 text-amber-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:"Menunggu"}):s==="Diterima"||s.toLowerCase()==="disetujui"?e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-emerald-300 bg-emerald-50 text-emerald-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:"Diterima"}):s==="Ditolak"?e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-rose-300 bg-rose-50 text-rose-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:"Ditolak"}):e.jsx("span",{className:"inline-block text-[10px] font-extrabold px-2 py-0.5 rounded border border-slate-300 bg-slate-50 text-slate-700 uppercase tracking-wider print:border-black print:text-black print:bg-transparent",children:s})},T=r=>{if(!r)return!1;let t=r.jenis_revisi;const n=r.masukan_dosen||"";return n.includes("[Revisi Mayor]")||n.includes("[Mayor]")?t="Mayor":n.includes("[Revisi Minor]")||n.includes("[Minor]")?t="Minor":n.includes("[Diterima]")||n.includes("[Disetujui]")?t="Diterima":n.includes("[Menunggu]")&&(t="Menunggu"),t==="Menunggu"||(r.status==="menunggu_tanggapan"||r.status==="menunggu")&&(!r.masukan_dosen||r.masukan_dosen.includes("[Menunggu]"))?!1:r.status==="disetujui"||r.status==="perlu_revisi"||t==="Diterima"||t==="Minor"||t==="Mayor"},h=l.useMemo(()=>a?c.filter(r=>String(r.mhs_nim).trim()===String(a).trim()).sort((r,t)=>{const n=r.tanggal||"",s=t.tanggal||"";if(n!==s)return n.localeCompare(s);const m=r.created_at?new Date(r.created_at).getTime():0,o=t.created_at?new Date(t.created_at).getTime():0;if(m!==0&&o!==0&&m!==o)return m-o;const p=String(r.pembimbing||"").includes("2"),N=String(t.pembimbing||"").includes("2");if(p!==N)return p?1:-1;const k=r.waktu||"",A=t.waktu||"";return k!==A?k.localeCompare(A):String(r.id||"").localeCompare(String(t.id||""))}):[],[c,a]),R=typeof window<"u"?`${window.location.origin}/verify/bimbingan/${a}`:`/verify/bimbingan/${a}`,v=(r,t)=>{if(!r||!(t==="Pembimbing 1"?r.pembimbing==="Pembimbing 1"||!r.pembimbing:r.pembimbing==="Pembimbing 2"))return"";if(!T(r))return e.jsx("span",{className:"text-slate-400 font-semibold text-xs print:text-black",children:"-"});const s=`${R}?log=${r.id}`;return e.jsx("div",{className:"flex justify-center items-center py-1",children:e.jsx("a",{href:s,target:"_blank",rel:"noopener noreferrer",title:"Scan/Klik QR Verifikasi Bimbingan",children:e.jsx("img",{src:`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(s)}`,alt:`QR Paraf ${t}`,className:"w-14 h-14 sm:w-16 sm:h-16 object-contain inline-block border border-slate-300 p-1 rounded-sm shadow-2xs hover:scale-105 transition-transform print:border-slate-400"})})})},C=(w==null?void 0:w.minTotal)||H(),M=Math.max(C,h.length),K=l.useMemo(()=>new Date().toLocaleDateString("id-ID",{day:"numeric",month:"long",year:"numeric"}),[]),f=794,u=l.useRef(null),b=l.useRef(null),[S,E]=l.useState(f),[L,B]=l.useState(1123);l.useEffect(()=>{const r=()=>{if(u.current){const n=u.current.clientWidth;n>0&&E(n)}if(b.current){const n=b.current.offsetHeight||b.current.scrollHeight;n>0&&B(n)}};r();const t=typeof ResizeObserver<"u"?new ResizeObserver(r):null;return t&&(u.current&&t.observe(u.current),b.current&&t.observe(b.current)),window.addEventListener("resize",r),()=>{window.removeEventListener("resize",r),t==null||t.disconnect()}},[M,h.length]);const j=l.useMemo(()=>Math.min(1,Math.max(.32,S/f)),[S]),z=j<.99;return e.jsxs("div",{className:"kartu-page-wrapper max-w-4xl mx-auto space-y-4 sm:space-y-6 select-none bg-slate-50 p-1 sm:p-6 min-h-screen print:bg-white print:p-0 print:m-0 print:min-h-0",children:[e.jsx("div",{className:"space-y-2.5 print:hidden",children:e.jsxs("div",{className:"flex flex-wrap items-center justify-between gap-2.5",children:[e.jsxs(W,{href:"/thesis/consultations",className:"inline-flex items-center space-x-2 text-xs sm:text-sm font-bold text-slate-600 hover:text-blue-600 transition-colors",children:[e.jsx(V,{className:"w-4 h-4 shrink-0"}),e.jsx("span",{children:"Kembali ke Entry Bimbingan"})]}),e.jsxs("div",{className:"flex flex-wrap items-center gap-2 sm:gap-3",children:[e.jsxs("span",{className:"px-3 py-1.5 rounded-xl bg-white border border-slate-200 text-[11px] font-bold text-slate-600 shadow-2xs",children:[h.length," Sesi Tercatat"]}),e.jsxs("button",{type:"button",onClick:()=>window.print(),className:"px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-sm transition-all flex items-center space-x-2 cursor-pointer",children:[e.jsx(G,{className:"w-4 h-4 shrink-0"}),e.jsx("span",{children:"Cetak Kartu Bimbingan"})]})]})]})}),e.jsx("div",{ref:u,className:"kartu-scroll-wrap w-full overflow-x-hidden pb-6 print:pb-0",style:{touchAction:"pan-x pan-y pinch-zoom"},children:e.jsx("div",{className:"kartu-zoom-sizer mx-auto relative",style:{width:`${Math.round(f*j)}px`,height:`${Math.round(L*j)}px`},children:e.jsxs("div",{ref:b,className:"kartu-paper bg-white p-10 sm:p-12 shadow-sm border border-slate-200 print:p-0 print:shadow-none print:border-none print:m-0",style:{width:`${f}px`,minHeight:"297mm",transform:z?`scale(${j})`:void 0,transformOrigin:"top left"},children:[e.jsxs("div",{className:"kartu-header-block",children:[e.jsxs("div",{className:"mb-4",children:[e.jsxs("div",{className:"flex items-center justify-between gap-4",children:[e.jsx("div",{className:"shrink-0",children:e.jsx("img",{src:J,alt:"Logo Universitas Sriwijaya",className:"w-24 h-24 object-contain"})}),e.jsxs("div",{className:"flex-1 text-center text-black font-serif leading-tight",children:[e.jsxs("p",{className:"text-sm font-semibold tracking-wide uppercase",children:["KEMENTERIAN PENDIDIKAN TINGGI,",e.jsx("br",{}),"SAINS DAN TEKNOLOGI"]}),e.jsx("h2",{className:"text-lg font-extrabold tracking-wide uppercase mt-0.5",children:"UNIVERSITAS SRIWIJAYA"}),e.jsx("h3",{className:"text-base font-bold tracking-wide uppercase",children:"FAKULTAS ILMU KOMPUTER"}),e.jsx("h4",{className:"text-sm font-bold tracking-wide uppercase",children:"PROGRAM STUDI MANAJEMEN INFORMATIKA"}),e.jsxs("p",{className:"text-[11px] mt-1 text-slate-800 leading-normal print:text-black",children:["Kampus Unsri, Jalan Srijaya Negara Bukit Besar Palembang, Kode Pos: 30139",e.jsx("br",{}),"Telepon (+62711)379249 Pos-el: ",e.jsx("span",{className:"text-blue-700 underline print:text-black print:no-underline",children:"humas@ilkom.unsri.ac.id"})]})]}),e.jsx("div",{className:"w-24 shrink-0"})]}),e.jsx("div",{className:"w-full border-b-[3px] border-black mt-3 mb-0.5"}),e.jsx("div",{className:"w-full border-b-[1px] border-black mb-5"})]}),e.jsx("div",{className:"text-center mb-6",children:e.jsx("h1",{className:"text-sm sm:text-base font-extrabold uppercase text-black tracking-wider",children:"CATATAN KEGIATAN KONSULTASI AKADEMIK/PRIBADI"})}),e.jsxs("div",{className:"grid grid-cols-2 text-xs font-semibold text-black mb-6 gap-x-6 gap-y-1.5",children:[e.jsxs("div",{className:"space-y-1",children:[e.jsxs("p",{children:[e.jsx("span",{className:"w-28 inline-block font-bold",children:"Nama"}),": ",(i==null?void 0:i.nama)||"-"]}),e.jsxs("p",{children:[e.jsx("span",{className:"w-28 inline-block font-bold",children:"NIM"}),": ",a||"-"]}),e.jsxs("p",{children:[e.jsx("span",{className:"w-28 inline-block font-bold",children:"Program Studi"}),": ",(i==null?void 0:i.prodi)||"D3 Manajemen Informatika"]})]}),e.jsxs("div",{className:"space-y-1",children:[e.jsxs("p",{children:[e.jsx("span",{className:"w-28 inline-block font-bold",children:"Pembimbing 1"}),": ",P]}),e.jsxs("p",{children:[e.jsx("span",{className:"w-28 inline-block font-bold",children:"Pembimbing 2"}),": ",I]})]}),e.jsx("div",{className:"col-span-2 pt-1",children:e.jsxs("p",{className:"flex items-start",children:[e.jsx("span",{className:"w-28 inline-block font-bold shrink-0",children:"Judul TA"}),e.jsx("span",{className:"mr-1.5",children:":"}),e.jsx("span",{className:"flex-1 font-semibold leading-relaxed",children:_})]})})]})]}),e.jsxs("table",{className:"kartu-table w-full border-collapse border border-black text-xs text-black",children:[e.jsx("thead",{children:e.jsxs("tr",{className:"bg-slate-100",children:[e.jsx("th",{className:"border border-black py-2 px-1 text-center w-10",children:"No"}),e.jsxs("th",{className:"border border-black py-2 px-2 text-center w-28",children:["Tanggal",e.jsx("br",{}),"Bimbingan"]}),e.jsxs("th",{className:"border border-black py-2 px-3 text-center",children:["Materi / Bab",e.jsx("br",{}),"Konsultasi"]}),e.jsx("th",{className:"border border-black py-2 px-2 text-center w-24",children:"Status"}),e.jsxs("th",{className:"border border-black py-2 px-2 text-center w-28 sm:w-32",children:["Paraf",e.jsx("br",{}),"Pembimbing 1"]}),e.jsxs("th",{className:"border border-black py-2 px-2 text-center w-28 sm:w-32",children:["Paraf",e.jsx("br",{}),"Pembimbing 2"]})]})}),e.jsx("tbody",{children:Array.from({length:M}).map((r,t)=>{const n=h[t];return e.jsxs("tr",{className:"kartu-row",children:[e.jsx("td",{className:"border border-black py-2 px-1 text-center font-semibold align-middle h-14",children:t+1}),e.jsx("td",{className:"border border-black py-2 px-2 text-center align-middle h-14",children:n?n.tanggal:""}),e.jsx("td",{className:"border border-black py-2 px-3 text-left font-medium align-middle h-14",children:n?n.bab_topik:""}),e.jsx("td",{className:"border border-black p-1.5 text-center align-middle h-14",children:n?D(n):""}),e.jsx("td",{className:"border border-black p-1.5 text-center align-middle h-14",children:v(n,"Pembimbing 1")}),e.jsx("td",{className:"border border-black p-1.5 text-center align-middle h-14",children:v(n,"Pembimbing 2")})]},t)})})]}),e.jsx("div",{className:"kartu-signature-block mt-12",children:e.jsxs("div",{className:"flex justify-between items-end text-xs text-black",children:[e.jsxs("div",{className:"w-72 text-center space-y-1",children:[e.jsxs("p",{className:"font-semibold pb-24",children:["Koordinator Program Studi",e.jsx("br",{}),"Manajemen Informatika,"]}),e.jsx("div",{className:"border-b border-black w-full"}),e.jsx("p",{className:"font-bold pt-1.5",children:"Dr. Abdiansah, S.Kom., M.Cs."}),e.jsx("p",{className:"font-mono text-[11px]",children:"NIP: 198410012009121005"})]}),e.jsxs("div",{className:"w-72 text-center space-y-1",children:[e.jsxs("p",{className:"font-semibold",children:["Palembang, ",K]}),e.jsx("p",{className:"font-semibold pb-24",children:"Mahasiswa Ybs,"}),e.jsx("div",{className:"border-b border-black w-full"}),e.jsx("p",{className:"font-bold pt-1.5",children:(i==null?void 0:i.nama)||"-"}),e.jsxs("p",{className:"font-mono text-[11px]",children:["NIM: ",a||"-"]})]})]})})]})})}),e.jsx("style",{dangerouslySetInnerHTML:{__html:`
        .kartu-scroll-wrap::-webkit-scrollbar {
          height: 8px;
        }
        .kartu-scroll-wrap::-webkit-scrollbar-thumb {
          background: #94a3b8;
          border-radius: 9999px;
        }
        .kartu-scroll-wrap::-webkit-scrollbar-track {
          background: #e2e8f0;
          border-radius: 9999px;
        }
        @page {
          size: A4 portrait;
          margin: 12mm 14mm 15mm 14mm;
          @top-left { content: ""; }
          @top-center { content: ""; }
          @top-right { content: ""; }
          @bottom-left { content: ""; }
          @bottom-center { content: ""; }
          @bottom-right {
            content: counter(page);
            font-family: 'Plus Jakarta Sans', 'Inter', Arial, sans-serif;
            font-size: 9pt;
            font-weight: 600;
            color: #000000;
          }
        }
        @media print {
          html, body {
            background: #ffffff !important;
            margin: 0 !important;
            padding: 0 !important;
            height: auto !important;
            overflow: visible !important;
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          header, nav, .print\\:hidden, .fixed {
            display: none !important;
          }
          .kartu-page-wrapper {
            max-width: none !important;
            margin: 0 !important;
            padding: 0 !important;
            background: #ffffff !important;
            min-height: 0 !important;
            display: block !important;
          }
          .kartu-scroll-wrap {
            overflow: visible !important;
            padding: 0 !important;
          }
          .kartu-zoom-sizer {
            width: 100% !important;
            height: auto !important;
          }
          .kartu-paper {
            display: block !important;
            transform: none !important;
            width: 100% !important;
            min-width: 0 !important;
            max-width: none !important;
            min-height: 0 !important;
            margin: 0 !important;
            padding: 0 !important;
            box-shadow: none !important;
            border: none !important;
          }
          .kartu-table {
            width: 100% !important;
            border-collapse: collapse !important;
          }
          .kartu-table thead {
            display: table-header-group;
          }
          .kartu-table tbody {
            display: table-row-group;
          }
          .kartu-row,
          .kartu-header-block,
          .kartu-signature-block {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}})]})}export{Y as default};

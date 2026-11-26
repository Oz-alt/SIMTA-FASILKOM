import React, { useMemo } from 'react';
import { Link } from '@inertiajs/react';
import {
  MessageCircle,
  Users,
  AlertTriangle,
  ChevronRight,
  Sparkles,
  BookOpen,
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';
import { MOCK_ADVISORS } from '../../services/mockData.js';
import { calculateBimbinganEligibility } from '../../lib/consultationUtils.js';
import { normalizeWhatsAppNumber } from '../../lib/whatsappHelper.js';
import ThesisStepper from '../common/ThesisStepper.jsx';
import BimbinganTimeline from '../common/BimbinganTimeline.jsx';

export default function MobileDashboardMahasiswa() {
  const {
    currentUser,
    thesisTitles = [],
    thesisStages = [],
    consultations = [],
    studentAdvisors = [],
    advisors = [],
    minSessionsRequirement,
  } = useAuth();

  const nim = String(currentUser?.nim || '').trim();
  const isProfileLocked = currentUser?.role === 'mahasiswa' && !currentUser?.is_profile_completed;

  const myTitle = useMemo(
    () => (thesisTitles || []).find((t) => String(t.mhs_nim || '').trim() === nim) || null,
    [thesisTitles, nim]
  );

  const myStages = useMemo(() => {
    if (!myTitle?.id) return [];
    return (thesisStages || []).filter((s) => s.thesis_title_id === myTitle.id);
  }, [thesisStages, myTitle?.id]);

  const eligibility = useMemo(
    () =>
      calculateBimbinganEligibility(consultations, nim, {
        minPerAdvisor: minSessionsRequirement?.minPerAdvisor,
        minTotal: minSessionsRequirement?.minTotal,
      }),
    [consultations, nim, minSessionsRequirement]
  );

  const { dospem1, dospem2 } = useMemo(() => {
    const allAdvisors = advisors?.length > 0 ? advisors : MOCK_ADVISORS;
    const assigned = (studentAdvisors || []).find((sa) => String(sa.student_nim || '').trim() === nim);

    const resolveAdvisor = (slot) => {
      const targetNip =
        slot === 1
          ? assigned?.dospem1_nip || myTitle?.pembimbing_1_nip
          : assigned?.dospem2_nip || myTitle?.pembimbing_2_nip;
      const targetNama =
        slot === 1
          ? assigned?.dospem1_nama || myTitle?.pembimbing_1
          : assigned?.dospem2_nama || myTitle?.pembimbing_2;

      const matched = allAdvisors.find(
        (a) =>
          (targetNip && String(a.nip || '').trim() === String(targetNip).trim()) ||
          (targetNama &&
            a.nama &&
            a.nama.toLowerCase().includes(String(targetNama).split(',')[0].toLowerCase().trim()))
      );

      if (matched) return matched;
      if (targetNama) return { nama: targetNama, nip: targetNip || '' };
      return null;
    };

    return {
      dospem1: resolveAdvisor(1),
      dospem2: resolveAdvisor(2),
    };
  }, [advisors, studentAdvisors, myTitle, nim]);

  const buildWaUrl = (adv, slotLabel) => {
    const phoneCheck = normalizeWhatsAppNumber(adv?.no_hp);
    if (!phoneCheck.isValid) return null;
    const text = `Halo ${adv.nama}, saya ${currentUser?.nama || currentUser?.name || 'Mahasiswa'} (${nim || '-'}), mahasiswa bimbingan ${slotLabel} di SIMONITA FASILKOM UNSRI.`;
    return `https://wa.me/${phoneCheck.cleanNumber}?text=${encodeURIComponent(text)}`;
  };

  const isTitleApproved =
    myTitle?.status === 'disetujui' ||
    myTitle?.status === 'judul_fix' ||
    myTitle?.rekomendasi_dospem_status === 'direkomendasikan';

  const p1Pct = Math.min(
    100,
    Math.round((eligibility.countPemb1 / Math.max(eligibility.minPerPembimbing, 1)) * 100)
  );
  const p2Pct = Math.min(
    100,
    Math.round((eligibility.countPemb2 / Math.max(eligibility.minPerPembimbing, 1)) * 100)
  );

  return (
    <div className="space-y-4">
      {/* Hero Greeting Card */}
      <div className="rounded-3xl bg-gradient-to-br from-blue-900 via-indigo-900 to-slate-900 text-white p-5 shadow-md space-y-4">
        <div className="flex items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/15 text-[11px] font-bold text-blue-100">
            <Sparkles className="w-3 h-3 text-amber-300" />
            Portal Mahasiswa TA
          </span>
          <span
            className={`shrink-0 px-2.5 py-1 rounded-full text-[11px] font-extrabold border ${
              eligibility.isEligibleForDefense && eligibility.hasAccPemb1 && eligibility.hasAccPemb2
                ? 'bg-emerald-500/20 text-emerald-200 border-emerald-400/30'
                : 'bg-white/15 text-blue-100 border-white/20'
            }`}
          >
            {eligibility.progressPercent}% Progres
          </span>
        </div>

        <div className="space-y-1">
          <h1 className="text-base font-extrabold tracking-tight leading-snug break-words">
            Halo, {currentUser?.nama || currentUser?.name || 'Mahasiswa'}
          </h1>
          <p className="text-xs text-blue-100/85 font-medium leading-relaxed">
            NIM {nim || '-'} &bull; {currentUser?.prodi || 'D3 Manajemen Informatika'}
          </p>
        </div>

        {/* Advisor Progress Mini Bars */}
        <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-3.5 border border-white/15 space-y-2.5">
          <div className="flex items-center justify-between text-xs font-bold">
            <span>Syarat Bimbingan Sidang</span>
            <span className="text-blue-200">
              {eligibility.totalEvaluated} / {eligibility.minRequired} Sesi
            </span>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <div className="flex justify-between text-[11px] text-blue-100 mb-1.5">
                <span>Pembimbing 1</span>
                <span className="font-bold">
                  {eligibility.countPemb1}/{eligibility.minPerPembimbing}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-emerald-400 transition-all duration-500"
                  style={{ width: `${p1Pct}%` }}
                />
              </div>
            </div>
            <div>
              <div className="flex justify-between text-[11px] text-blue-100 mb-1.5">
                <span>Pembimbing 2</span>
                <span className="font-bold">
                  {eligibility.countPemb2}/{eligibility.minPerPembimbing}
                </span>
              </div>
              <div className="h-2 rounded-full bg-white/15 overflow-hidden">
                <div
                  className="h-full rounded-full bg-sky-400 transition-all duration-500"
                  style={{ width: `${p2Pct}%` }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Incomplete Profile Alert */}
      {isProfileLocked && (
        <Link
          href="/profile?first_login=true"
          className="flex items-center gap-3 p-4 rounded-2xl bg-amber-50 border border-amber-300 text-amber-900 shadow-sm"
        >
          <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
          <div className="flex-1 min-w-0">
            <div className="text-xs font-extrabold">Profil Wajib Dilengkapi</div>
            <p className="text-[11px] text-amber-800 leading-relaxed mt-0.5">
              Isi Nomor WhatsApp &amp; ubah sandi awal agar seluruh menu pengajuan terbuka.
            </p>
          </div>
          <ChevronRight className="w-4 h-4 text-amber-600 shrink-0" />
        </Link>
      )}

      {/* Dosen Pembimbing Contact Cards */}
      {(dospem1 || dospem2) && (
        <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <Users className="w-4 h-4 text-indigo-600" />
            <span>Dosen Pembimbing Anda</span>
          </h2>
          <div className="space-y-2.5">
            {[
              { role: 'Pembimbing 1', data: dospem1 },
              { role: 'Pembimbing 2', data: dospem2 },
            ].map(({ role, data }) => {
              if (!data) return null;
              const waUrl = buildWaUrl(data, role);
              return (
                <div
                  key={role}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/80 space-y-2.5"
                >
                  <div className="min-w-0">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-600">
                      {role}
                    </span>
                    <div className="text-[13px] font-bold text-slate-900 leading-snug mt-0.5 break-words">
                      {data.nama}
                    </div>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {waUrl && (
                      <a
                        href={waUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-xs font-bold shadow-sm"
                      >
                        <MessageCircle className="w-3.5 h-3.5" />
                        <span>Chat WA</span>
                      </a>
                    )}
                    {data.link_wa_group && (
                      <a
                        href={data.link_wa_group}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white border border-emerald-300 text-emerald-700 text-xs font-bold"
                      >
                        <Users className="w-3.5 h-3.5" />
                        <span>Grup WA</span>
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Pengajuan Judul TA */}
      <div className="bg-white border border-slate-200 rounded-2xl p-4 shadow-sm space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h2 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-1.5">
            <BookOpen className="w-4 h-4 text-blue-600" />
            <span>Status Judul TA</span>
          </h2>
          {myTitle ? (
            <span
              className={`shrink-0 whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full border ${
                isTitleApproved
                  ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                  : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
            >
              {isTitleApproved ? 'Disetujui' : 'Diajukan'}
            </span>
          ) : (
            <span className="shrink-0 whitespace-nowrap text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-500">
              Belum Ada
            </span>
          )}
        </div>

        {myTitle ? (
          <div className="space-y-2.5">
            <h3 className="text-xs font-bold text-slate-900 leading-relaxed break-words">
              {myTitle.judul}
            </h3>
            <div className="flex items-center justify-between text-xs pt-2.5 border-t border-slate-100">
              <span className="text-slate-500">Similarity Score</span>
              <span className="font-bold text-emerald-600">
                {Number(myTitle.skor_kemiripan_terakhir || 0)}%
              </span>
            </div>
          </div>
        ) : (
          <p className="text-xs text-slate-500 leading-relaxed">
            Belum ada judul Tugas Akhir diajukan.
          </p>
        )}

        <Link
          href={isProfileLocked ? '/profile?first_login=true' : '/thesis/submit'}
          className="w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl bg-indigo-50 text-indigo-700 text-xs font-bold"
        >
          <span>{myTitle ? 'Kelola Pengajuan TA' : 'Ajukan Judul Sekarang'}</span>
          <ChevronRight className="w-4 h-4" />
        </Link>
      </div>

      {/* Tahapan & Timeline Bimbingan */}
      <ThesisStepper currentTitle={myTitle} stages={myStages} />
      <BimbinganTimeline consultations={consultations} currentUser={currentUser} />
    </div>
  );
}

"use client";

import React, { useState } from 'react';
import {
  CalendarDays,
  CircleCheck,
  ClipboardList,
  LoaderCircle,
  MapPin,
  Navigation,
  Package,
  Save,
  Truck,
  User,
} from 'lucide-react';
import { db, ref, update } from '@/lib/firebase';

interface KaryawanViewProps {
  globalData: any[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function KaryawanView({ globalData, showToast }: KaryawanViewProps) {
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  const [kurirAntar1, setKurirAntar1] = useState('');
  const [kurirAntar2, setKurirAntar2] = useState('');
  const [jmlAntar, setJmlAntar] = useState('1');
  const [kurirJemput1, setKurirJemput1] = useState('');
  const [kurirJemput2, setKurirJemput2] = useState('');
  const [jmlJemput, setJmlJemput] = useState('1');
  const [loadingId, setLoadingId] = useState<string | null>(null);

  const parseStandardDate = (rawDate: string) => {
    if (!rawDate) return null;
    let str = String(rawDate);
    if (str.includes('T')) str = str.split('T')[0];
    const p = str.split('-');
    if (p.length === 3 && p[0].length === 4) {
      return new Date(parseInt(p[0]), parseInt(p[1]) - 1, parseInt(p[2]));
    }
    const d = new Date(rawDate);
    return isNaN(d.getTime()) ? null : d;
  };

  const formatTanggal = (rawDate: string) => {
    const d = parseStandardDate(rawDate);
    if (!d) return '-';
    return String(d.getDate()).padStart(2, '0') + '/' + String(d.getMonth() + 1).padStart(2, '0') + '/' + d.getFullYear();
  };

  const listKurirUnik = Array.from(new Set(globalData.flatMap(item => [item.kurirAntar1, item.kurirAntar2, item.kurirJemput1, item.kurirJemput2]).filter(Boolean)));

  const handleBukaEditCard = (item: any) => {
    if (activeCardId === item.id) {
      setActiveCardId(null);
    } else {
      setActiveCardId(item.id);
      setKurirAntar1(item.kurirAntar1 || '');
      setKurirAntar2(item.kurirAntar2 || '');
      setJmlAntar(item.kurirAntar2 ? '2' : '1');
      setKurirJemput1(item.kurirJemput1 || '');
      setKurirJemput2(item.kurirJemput2 || '');
      setJmlJemput(item.kurirJemput2 ? '2' : '1');
    }
  };

  const handleSimpanCard = async (item: any) => {
    setLoadingId(item.id);
    try {
      const unitNum = item.jumlahUnit || 1;
      const totalOngkirKurir = unitNum * 50000;

      const kA1 = kurirAntar1.trim();
      const kA2 = jmlAntar === '2' ? kurirAntar2.trim() : "";
      const kJ1 = kurirJemput1.trim();
      const kJ2 = jmlJemput === '2' ? kurirJemput2.trim() : "";

      // Status unit mengikuti data kurir yang tersimpan.
      let autoStatusUnit = "Belum Diantar";
      if (kJ1 || kJ2) {
        autoStatusUnit = "Selesai";
      } else if (kA1 || kA2) {
        autoStatusUnit = "Sedang Dipakai";
      }

      const payload: any = {
        statusUnit: autoStatusUnit,
        totalOngkirKurir,
        kurirAntar1: kA1,
        kurirAntar2: kA2,
        kurirJemput1: kJ1,
        kurirJemput2: kJ2,
      };

      await update(ref(db, '/' + item.id), payload);
      showToast('Tugas lapangan berhasil diperbarui!', 'success');
      setActiveCardId(null);
    } catch (error) {
      console.error(error);
      showToast('Gagal memperbarui data.', 'error');
    } finally {
      setLoadingId(null);
    }
  };

  // Card hilang dari daftar setelah unit dijemput.
  const activeJobs = globalData.filter(item => {
    const adaJemput = Boolean(item.kurirJemput1 || item.kurirJemput2);
    return !adaJemput;
  });

  activeJobs.sort((a, b) => (parseStandardDate(a.tanggal)?.getTime() || 0) - (parseStandardDate(b.tanggal)?.getTime() || 0));

  const getPeringatanHari = (tanggalEvent: string) => {
    const tgl = parseStandardDate(tanggalEvent);
    if (!tgl) return null;

    const hariIni = new Date();
    hariIni.setHours(0, 0, 0, 0);
    tgl.setHours(0, 0, 0, 0);

    const selisihWaktu = tgl.getTime() - hariIni.getTime();
    const selisihHari = Math.round(selisihWaktu / (1000 * 3600 * 24));

    if (selisihHari === 0 || selisihHari === 1) {
      return { teks: 'Hari ini — segera antarkan', tone: 'badge badge-bad' };
    }
    if (selisihHari > 1) {
      return { teks: `H-${selisihHari} pengantaran`, tone: 'badge badge-info' };
    }
    return null;
  };

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <datalist id="listKurirKaryawanCard">
        {listKurirUnik.map((k, idx) => <option key={idx} value={k} />)}
      </datalist>

      <div className="panel-head" style={{ marginBottom: 0 }}>
        <div>
          <div className="panel-title"><ClipboardList size={15} strokeWidth={1.9} /> Tugas lapangan</div>
          <div className="panel-sub">Antar unit · jemput setelah event</div>
        </div>
        <span className="badge badge-info">{activeJobs.length} aktif</span>
      </div>

      {activeJobs.length === 0 ? (
        <div className="empty-state">
          <CircleCheck size={22} strokeWidth={1.7} />
          <span>Tidak ada tugas lapangan yang aktif saat ini.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: 12 }}>
          {activeJobs.map((item) => {
            const isEditing = activeCardId === item.id;
            const adaAntar = Boolean(item.kurirAntar1 || item.kurirAntar2);

            const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean).join(' & ') || 'Belum diantar';
            const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean).join(' & ') || 'Belum dijemput';

            const statusUnitDinamis = adaAntar ? 'Sedang dipakai' : 'Belum diantar';
            const badgeStyleUnit = adaAntar ? 'badge badge-info' : 'badge badge-warn';
            const peringatan = !adaAntar ? getPeringatanHari(item.tanggal) : null;

            const mapsHref = item.linkMaps
              ? (String(item.linkMaps).startsWith('http')
                ? item.linkMaps
                : `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(item.linkMaps)}`)
              : null;

            return (
              <article
                key={item.id}
                className="surface"
                style={{
                  padding: 18,
                  display: 'flex',
                  flexDirection: 'column',
                  gap: 12,
                  borderColor: isEditing ? 'var(--accent-line)' : undefined,
                }}
              >
                <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.vendor || 'Tanpa Nama'}</div>
                    <div className="person-meta" style={{ marginTop: 3, display: 'inline-flex', alignItems: 'center', gap: 5 }}>
                      <CalendarDays size={10} /> {formatTanggal(item.tanggal)}
                    </div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                    <span className={badgeStyleUnit}>{statusUnitDinamis}</span>
                    {peringatan && <span className={peringatan.tone}>{peringatan.teks}</span>}
                  </div>
                </header>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 7 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span className="row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><MapPin size={11} /> Alamat</span>
                    <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right' }}>{item.alamat} · {item.jumlahUnit} unit</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span className="row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Truck size={11} /> Kurir antar</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{kAntar}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', gap: 10 }}>
                    <span className="row-label" style={{ display: 'inline-flex', alignItems: 'center', gap: 5 }}><Package size={11} /> Kurir jemput</span>
                    <span style={{ fontSize: 12, color: 'var(--text)', fontWeight: 600 }}>{kJemput}</span>
                  </div>
                </div>

                {mapsHref && (
                  <a
                    href={mapsHref}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="btn btn-ghost btn-sm"
                    style={{ alignSelf: 'flex-start' }}
                  >
                    <Navigation size={13} /> Buka Maps
                  </a>
                )}

                {isEditing && (
                  <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14, padding: 14, borderRadius: 'var(--radius)', border: '1px solid var(--line-strong)', background: 'rgba(4, 8, 12, 0.55)' }}>

                    <div>
                      <label className="label" htmlFor={`antar-jml-${item.id}`}>Kurir antar</label>
                      <select
                        id={`antar-jml-${item.id}`}
                        value={jmlAntar}
                        onChange={(e) => setJmlAntar(e.target.value)}
                        className="field"
                        style={{ minHeight: 40, padding: '8px 12px', marginBottom: 8 }}
                      >
                        <option value="1">1 orang</option>
                        <option value="2">2 orang</option>
                      </select>
                      <input
                        type="text"
                        value={kurirAntar1}
                        onChange={(e) => setKurirAntar1(e.target.value)}
                        list="listKurirKaryawanCard"
                        placeholder="Nama kurir antar 1"
                        className="field"
                        style={{ minHeight: 40, padding: '8px 12px', marginBottom: jmlAntar === '2' ? 8 : 0 }}
                        aria-label="Kurir antar 1"
                      />
                      {jmlAntar === '2' && (
                        <input
                          type="text"
                          value={kurirAntar2}
                          onChange={(e) => setKurirAntar2(e.target.value)}
                          list="listKurirKaryawanCard"
                          placeholder="Nama kurir antar 2"
                          className="field"
                          style={{ minHeight: 40, padding: '8px 12px' }}
                          aria-label="Kurir antar 2"
                        />
                      )}
                    </div>

                    <div>
                      <label className="label" htmlFor={`jemput-jml-${item.id}`}>Kurir jemput</label>
                      <select
                        id={`jemput-jml-${item.id}`}
                        value={jmlJemput}
                        onChange={(e) => setJmlJemput(e.target.value)}
                        className="field"
                        style={{ minHeight: 40, padding: '8px 12px', marginBottom: 8 }}
                      >
                        <option value="1">1 orang</option>
                        <option value="2">2 orang</option>
                      </select>
                      <input
                        type="text"
                        value={kurirJemput1}
                        onChange={(e) => setKurirJemput1(e.target.value)}
                        list="listKurirKaryawanCard"
                        placeholder="Nama kurir jemput 1"
                        className="field"
                        style={{ minHeight: 40, padding: '8px 12px', marginBottom: jmlJemput === '2' ? 8 : 0 }}
                        aria-label="Kurir jemput 1"
                      />
                      {jmlJemput === '2' && (
                        <input
                          type="text"
                          value={kurirJemput2}
                          onChange={(e) => setKurirJemput2(e.target.value)}
                          list="listKurirKaryawanCard"
                          placeholder="Nama kurir jemput 2"
                          className="field"
                          style={{ minHeight: 40, padding: '8px 12px' }}
                          aria-label="Kurir jemput 2"
                        />
                      )}
                    </div>

                    <button
                      onClick={() => handleSimpanCard(item)}
                      disabled={loadingId === item.id}
                      className="btn btn-primary btn-block"
                    >
                      {loadingId === item.id ? <LoaderCircle size={14} className="spin" /> : <Save size={14} />}
                      {loadingId === item.id ? 'Menyimpan…' : 'Simpan & update status'}
                    </button>
                  </div>
                )}

                <button
                  onClick={() => handleBukaEditCard(item)}
                  className={`btn ${isEditing ? 'btn-ghost' : 'btn-primary'} btn-block`}
                  style={{ marginTop: 'auto' }}
                >
                  <User size={13} />
                  {isEditing ? 'Tutup form' : 'Isi data kurir'}
                </button>
              </article>
            );
          })}
        </div>
      )}

    </div>
  );
}

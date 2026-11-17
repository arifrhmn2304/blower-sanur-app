"use client";

import React from 'react';
import { ArrowUpRight, ChevronRight, Store, Users } from 'lucide-react';

interface TabVendorProps {
  globalData: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  onBukaDetailVendor: (namaVendor: string) => void;
}

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

export default function TabVendor({
  globalData,
  currentSelectedBulan,
  currentSelectedTahun,
  onBulanChange,
  onTahunChange,
  onBukaDetailVendor
}: TabVendorProps) {

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

  const filteredData = globalData.filter((item) => {
    const d = parseStandardDate(item.tanggal);
    if (!d) return false;
    const itemBulan = String(d.getMonth() + 1).padStart(2, '0');
    const itemTahun = String(d.getFullYear());
    return (currentSelectedBulan === "ALL" || itemBulan === currentSelectedBulan) && (itemTahun === currentSelectedTahun);
  });

  const rekapVendor: { [key: string]: { totalJob: number; totalBiaya: number; totalDiterima: number; totalPiutang: number } } = {};

  filteredData.forEach((item) => {
    const namaVendor = (item.vendor || 'Tanpa Nama').trim();
    const uangVendor = Number(item.uangVendor) || 0;
    const sudahBayar = Number(item.sudahBayar) || 0;
    const sisaBayar = Number(item.sisaBayar) || 0;

    if (!rekapVendor[namaVendor]) {
      rekapVendor[namaVendor] = { totalJob: 0, totalBiaya: 0, totalDiterima: 0, totalPiutang: 0 };
    }
    rekapVendor[namaVendor].totalJob += 1;
    rekapVendor[namaVendor].totalBiaya += uangVendor;
    rekapVendor[namaVendor].totalDiterima += sudahBayar;
    rekapVendor[namaVendor].totalPiutang += sisaBayar;
  });

  const keysVendor = Object.keys(rekapVendor).sort((a, b) => rekapVendor[b].totalBiaya - rekapVendor[a].totalBiaya);

  const totalPiutangSemua = keysVendor.reduce((acc, v) => acc + rekapVendor[v].totalPiutang, 0);
  const totalBiayaSemua = keysVendor.reduce((acc, v) => acc + rekapVendor[v].totalBiaya, 0);

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div className="filter-bar">
        <span className="mono-label" style={{ paddingLeft: 4 }}>Periode</span>
        <select value={currentSelectedBulan} onChange={(e) => onBulanChange(e.target.value)} className="field" aria-label="Pilih bulan">
          <option value="ALL">Semua bulan</option>
          {BULAN.map((nama, i) => (
            <option key={nama} value={String(i + 1).padStart(2, '0')}>{nama}</option>
          ))}
        </select>
        <select value={currentSelectedTahun} onChange={(e) => onTahunChange(e.target.value)} className="field" aria-label="Pilih tahun">
          <option value="2026">2026</option>
          <option value="2025">2025</option>
          <option value="2024">2024</option>
        </select>
        <span className="mono-label" style={{ marginLeft: 'auto', paddingRight: 4 }}>
          {keysVendor.length} vendor
        </span>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Vendor aktif</span>
            <span className="stat-icon"><Store size={14} /></span>
          </div>
          <span className="stat-value">{keysVendor.length}</span>
          <span className="stat-foot">Periode terpilih</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Total nilai sewa</span>
            <span className="stat-icon"><ArrowUpRight size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--info)' }}>Rp {totalBiayaSemua.toLocaleString('id-ID')}</span>
          <span className="stat-foot">{filteredData.length} order</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Total piutang</span>
            <span className="stat-icon"><Users size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: totalPiutangSemua > 0 ? 'var(--bad)' : 'var(--good)' }}>
            Rp {totalPiutangSemua.toLocaleString('id-ID')}
          </span>
          <span className="stat-foot">{totalPiutangSemua > 0 ? 'Belum lunas' : 'Semua lunas'}</span>
        </div>
      </div>

      {keysVendor.length === 0 ? (
        <div className="empty-state">
          <Store size={22} strokeWidth={1.7} />
          <span>Tidak ada data vendor atau pelanggan pada periode ini.</span>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(272px, 1fr))', gap: 12 }}>
          {keysVendor.map((vName) => {
            const vData = rekapVendor[vName];
            const isLunas = vData.totalPiutang <= 0;
            const persen = vData.totalBiaya > 0 ? Math.min(100, Math.round((vData.totalDiterima / vData.totalBiaya) * 100)) : 0;

            return (
              <div
                key={vName}
                className="surface bento-card"
                style={{ padding: 18, display: 'flex', flexDirection: 'column', gap: 14 }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                  <div style={{ minWidth: 0 }}>
                    <h4 style={{ fontSize: 14, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{vName}</h4>
                    <div className="person-meta" style={{ marginTop: 3 }}>{vData.totalJob} kali sewa</div>
                  </div>
                  <span className={`badge ${isLunas ? 'badge-good' : 'badge-bad'}`}>
                    {isLunas ? 'Lunas' : 'Piutang'}
                  </span>
                </div>

                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 6 }}>
                    <span className="num" style={{ fontSize: 16, fontWeight: 600 }}>Rp {vData.totalBiaya.toLocaleString('id-ID')}</span>
                    <span className="mono-label" style={{ fontSize: 9 }}>{persen}% tertagih</span>
                  </div>
                  <div style={{ height: 4, borderRadius: 3, background: 'var(--surface-3)', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${persen}%`, background: isLunas ? 'var(--good)' : 'var(--accent)', borderRadius: 3 }} />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="row-label">Uang masuk</span>
                    <span className="num" style={{ fontSize: 11.5, color: 'var(--good)' }}>Rp {vData.totalDiterima.toLocaleString('id-ID')}</span>
                  </div>
                  <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                    <span className="row-label">Sisa piutang</span>
                    <span className="num" style={{ fontSize: 11.5, color: isLunas ? 'var(--text-3)' : 'var(--bad)' }}>Rp {vData.totalPiutang.toLocaleString('id-ID')}</span>
                  </div>
                </div>

                <button
                  onClick={() => onBukaDetailVendor(vName)}
                  className="btn btn-ghost btn-sm btn-block"
                  style={{ justifyContent: 'space-between', marginTop: 'auto' }}
                >
                  Lihat rincian order
                  <ChevronRight size={14} />
                </button>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

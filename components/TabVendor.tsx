"use client";

import React from 'react';

interface TabVendorProps {
  globalData: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  onBukaDetailVendor: (namaVendor: string) => void;
}

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

  const keysVendor = Object.keys(rekapVendor);

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* FILTER BAR */}
      <div className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '800' }}>
          <span>📅 PERIODE:</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '220px' }}>
          <select value={currentSelectedBulan} onChange={(e) => onBulanChange(e.target.value)} style={selectStyle}>
            <option value="ALL" style={{ background: '#0f172a' }}>Semua Bulan</option>
            <option value="01" style={{ background: '#0f172a' }}>Januari</option>
            <option value="02" style={{ background: '#0f172a' }}>Februari</option>
            <option value="03" style={{ background: '#0f172a' }}>Maret</option>
            <option value="04" style={{ background: '#0f172a' }}>April</option>
            <option value="05" style={{ background: '#0f172a' }}>Mei</option>
            <option value="06" style={{ background: '#0f172a' }}>Juni</option>
            <option value="07" style={{ background: '#0f172a' }}>Juli</option>
            <option value="08" style={{ background: '#0f172a' }}>Agustus</option>
            <option value="09" style={{ background: '#0f172a' }}>September</option>
            <option value="10" style={{ background: '#0f172a' }}>Oktober</option>
            <option value="11" style={{ background: '#0f172a' }}>November</option>
            <option value="12" style={{ background: '#0f172a' }}>Desember</option>
          </select>
          <select value={currentSelectedTahun} onChange={(e) => onTahunChange(e.target.value)} style={selectStyle}>
            <option value="2026" style={{ background: '#0f172a' }}>2026</option>
            <option value="2025" style={{ background: '#0f172a' }}>2025</option>
            <option value="2024" style={{ background: '#0f172a' }}>2024</option>
          </select>
        </div>
      </div>

      {/* GRID VENDOR CARDS */}
      {keysVendor.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '24px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Tidak ada data vendor atau pelanggan pada periode ini.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
          {keysVendor.map((vName) => {
            const vData = rekapVendor[vName];
            const isLunas = vData.totalPiutang <= 0;

            return (
              <div 
                key={vName} 
                onClick={() => onBukaDetailVendor(vName)}
                className="bento-card btn-interactive"
                style={vendorCardStyle}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '12px' }}>
                  <h4 style={{ margin: 0, fontSize: '15px', color: '#fff', fontWeight: '900' }}>{vName}</h4>
                  <span style={isLunas ? badgeLunasStyle : badgeBelumStyle}>
                    {isLunas ? 'LUNAS' : 'BELUM LUNAS'}
                  </span>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px' }}>
                  <div style={rowInfoStyle}><span style={{ color: '#94a3b8' }}>Frekuensi Sewa:</span><b style={{ color: '#fff' }}>{vData.totalJob} Kali</b></div>
                  <div style={rowInfoStyle}><span style={{ color: '#94a3b8' }}>Total Biaya:</span><b style={{ color: '#fff' }}>Rp {vData.totalBiaya.toLocaleString('id-ID')}</b></div>
                  <div style={rowInfoStyle}><span style={{ color: '#94a3b8' }}>Uang Masuk:</span><b style={{ color: '#34d399' }}>Rp {vData.totalDiterima.toLocaleString('id-ID')}</b></div>
                  <div style={rowInfoStyle}><span style={{ color: '#94a3b8' }}>Sisa Piutang:</span><b style={{ color: '#fca5a5' }}>Rp {vData.totalPiutang.toLocaleString('id-ID')}</b></div>
                </div>

                <div style={{ borderTop: '1px solid rgba(255,255,255,0.04)', paddingTop: '10px', display: 'flex', justifyContent: 'flex-end' }}>
                  <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800' }}>Ketuk untuk lihat rincian order →</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none', fontWeight: '700'
};
const vendorCardStyle: React.CSSProperties = {
  padding: '20px', cursor: 'pointer', display: 'flex', flexDirection: 'column', justifyContent: 'space-between'
};
const rowInfoStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', fontSize: '13px'
};
const badgeLunasStyle: React.CSSProperties = {
  backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px'
};
const badgeBelumStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '10px', fontWeight: '900', letterSpacing: '0.5px'
};
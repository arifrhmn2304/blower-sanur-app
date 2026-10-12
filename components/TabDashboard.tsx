"use client";

import React from 'react';

interface TabDashboardProps {
  globalData: any[];
  globalPengeluaran: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  onBukaDetailKurir: (namaKurir: string) => void;
  onBukaPelunasanKurir: (namaKurir: string) => void;
}

export default function TabDashboard({
  globalData,
  globalPengeluaran,
  currentSelectedBulan,
  currentSelectedTahun,
  onBulanChange,
  onTahunChange,
  onBukaDetailKurir,
  onBukaPelunasanKurir
}: TabDashboardProps) {

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

  const pengeluaranFiltered = globalPengeluaran.filter((p) => {
    const d = parseStandardDate(p.tanggal);
    if (!d) return false;
    const pBulan = String(d.getMonth() + 1).padStart(2, '0');
    const pTahun = String(d.getFullYear());
    return (currentSelectedBulan === "ALL" || pBulan === currentSelectedBulan) && (pTahun === currentSelectedTahun);
  });

  let sumKotor = 0, sumMasuk = 0, sumSisa = 0, sumOngkir = 0;
  const rekapKurir: { [key: string]: { nominal: number; rawIds: string[] } } = {};

  filteredData.forEach((item) => {
    const uangVendor = Number(item.uangVendor) || 0;
    const sudahBayar = Number(item.sudahBayar) || 0;
    const sisaBayar = Number(item.sisaBayar) || 0;
    const totalOngkirKurir = Number(item.totalOngkirKurir) || 0;

    sumKotor += uangVendor;
    sumMasuk += sudahBayar;
    sumSisa += sisaBayar;
    sumOngkir += totalOngkirKurir;

    const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean) as string[];
    const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean) as string[];

    if (totalOngkirKurir > 0) {
      const totalAntar = (item.jumlahUnit || 1) * 30000;
      const totalJemput = (item.jumlahUnit || 1) * 20000;

      kAntar.forEach((nama) => {
        const keyK = nama.replace(/[^a-zA-Z0-9]/g, '_');
        if (!item[`lunas_${keyK}`] && item.statusKurir !== "LUNAS") {
          const hakPerAntar = totalAntar / kAntar.length;
          if (!rekapKurir[nama]) rekapKurir[nama] = { nominal: 0, rawIds: [] };
          rekapKurir[nama].nominal += hakPerAntar;
          if (!rekapKurir[nama].rawIds.includes(item.id)) rekapKurir[nama].rawIds.push(item.id);
        }
      });

      kJemput.forEach((nama) => {
        const keyK = nama.replace(/[^a-zA-Z0-9]/g, '_');
        if (!item[`lunas_${keyK}`] && item.statusKurir !== "LUNAS") {
          const hakPerJemput = totalJemput / kJemput.length;
          if (!rekapKurir[nama]) rekapKurir[nama] = { nominal: 0, rawIds: [] };
          rekapKurir[nama].nominal += hakPerJemput;
          if (!rekapKurir[nama].rawIds.includes(item.id)) rekapKurir[nama].rawIds.push(item.id);
        }
      });
    }
  });

  const totalPengeluaranPeriode = pengeluaranFiltered.reduce((acc, p) => acc + (Number(p.nominal) || 0), 0);
  const untungBersihRiil = sumMasuk - sumOngkir - totalPengeluaranPeriode;

  const setTahun = new Set<string>();
  setTahun.add(currentSelectedTahun);
  globalData.forEach((item) => {
    const d = parseStandardDate(item.tanggal);
    if (d) setTahun.add(String(d.getFullYear()));
  });
  const listTahunUnik = Array.from(setTahun).sort().reverse();

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      
      {/* FILTER HEADER BAR */}
      <div className="glass-panel" style={{ padding: '16px', borderRadius: '20px', display: 'flex', gap: '12px', alignItems: 'center', flexWrap: 'wrap' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#94a3b8', fontSize: '12px', fontWeight: '800' }}>
          <span>📅 PERIODE:</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', flex: 1, minWidth: '220px' }}>
          <select 
            value={currentSelectedBulan} 
            onChange={(e) => onBulanChange(e.target.value)} 
            style={selectStyle}
          >
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

          <select 
            value={currentSelectedTahun} 
            onChange={(e) => onTahunChange(e.target.value)} 
            style={selectStyle}
          >
            {listTahunUnik.map((thn) => (
              <option key={thn} value={thn} style={{ background: '#0f172a' }}>{thn}</option>
            ))}
          </select>
        </div>
      </div>

      {/* HERO STATS CARD (UNTUNG BERSIH RIIL - UTAMA) */}
      <div className="bento-card" style={{ padding: '28px', background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(59, 130, 246, 0.1))', border: '1px solid rgba(139, 92, 246, 0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
          <div>
            <span style={{ fontSize: '11px', fontWeight: '900', letterSpacing: '1.5px', color: '#c084fc', textTransform: 'uppercase' }}>⭐ Net Profit / Untung Bersih</span>
            <h2 style={{ fontSize: '32px', fontWeight: '900', color: '#fff', margin: '4px 0 0', letterSpacing: '-1px' }}>
              Rp {untungBersihRiil.toLocaleString('id-ID')}
            </h2>
          </div>
          <div style={{ width: '48px', height: '48px', background: 'rgba(139, 92, 246, 0.2)', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px', border: '1px solid rgba(139, 92, 246, 0.4)' }}>
            📈
          </div>
        </div>
        <p style={{ margin: 0, fontSize: '12px', color: '#94a3b8' }}>*Sudah dikurangi total gaji kurir dan pengeluaran operasional periode ini.</p>
      </div>

      {/* GRID STATISTIK SEKUNDER (4 KARTU MODERN) */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '14px' }}>
        
        <div className="bento-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Total Tagihan</span>
            <span style={{ fontSize: '16px' }}>📑</span>
          </div>
          <span style={{ color: '#60a5fa', fontSize: '18px', fontWeight: '900' }}>Rp {sumKotor.toLocaleString('id-ID')}</span>
        </div>

        <div className="bento-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Uang Masuk</span>
            <span style={{ fontSize: '16px' }}>💰</span>
          </div>
          <span style={{ color: '#34d399', fontSize: '18px', fontWeight: '900' }}>Rp {sumMasuk.toLocaleString('id-ID')}</span>
        </div>

        <div className="bento-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Sisa Piutang</span>
            <span style={{ fontSize: '16px' }}>⏳</span>
          </div>
          <span style={{ color: '#fca5a5', fontSize: '18px', fontWeight: '900' }}>Rp {sumSisa.toLocaleString('id-ID')}</span>
        </div>

        <div className="bento-card" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '10px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '1px' }}>Pengeluaran</span>
            <span style={{ fontSize: '16px' }}>💸</span>
          </div>
          <span style={{ color: '#fca5a5', fontSize: '18px', fontWeight: '900' }}>Rp {totalPengeluaranPeriode.toLocaleString('id-ID')}</span>
        </div>

      </div>

      {/* REKAP GAJI KURIR BELUM DIBAYAR */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
          <div style={{ width: '36px', height: '36px', background: 'rgba(245, 158, 11, 0.15)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', border: '1px solid rgba(245, 158, 11, 0.3)' }}>⚡</div>
          <div>
            <h4 style={{ margin: 0, color: '#fff', fontSize: '15px', fontWeight: '900' }}>Gaji Kurir Belum Dibayar</h4>
            <p style={{ margin: 0, fontSize: '11px', color: '#94a3b8' }}>Daftar tanggungan honor tim lapangan</p>
          </div>
        </div>
        
        {Object.keys(rekapKurir).length === 0 ? (
          <div style={{ padding: '20px', background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.25)', borderRadius: '16px', textAlign: 'center' }}>
            <span style={{ fontSize: '13px', color: '#34d399', fontWeight: '800' }}>✨ Mantap! Seluruh gaji kurir pada periode ini sudah LUNAS.</span>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
            {Object.keys(rekapKurir).map((nKurir) => {
              const dataKurir = rekapKurir[nKurir];
              return (
                <div key={nKurir} style={kurirCardStyle} className="btn-interactive">
                  <div 
                    onClick={() => onBukaDetailKurir(nKurir)} 
                    style={{ flex: 1, cursor: 'pointer', paddingRight: '12px' }}
                  >
                    <div style={{ color: '#fff', fontWeight: '800', fontSize: '14px', marginBottom: '2px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <span>👤</span> <span style={{ textDecoration: 'underline', textDecorationColor: '#fde047' }}>{nKurir}</span>
                    </div>
                    <span style={{ color: '#fde047', fontSize: '13px', fontWeight: '900' }}>Rp {dataKurir.nominal.toLocaleString('id-ID')} <span style={{ fontSize: '10px', opacity: 0.7, fontWeight: 'normal' }}>(🔍 Lihat Rincian)</span></span>
                  </div>
                  
                  <button 
                    onClick={() => onBukaPelunasanKurir(nKurir)} 
                    style={btnBayarStyle}
                    className="btn-interactive"
                  >
                    💰 Lunaskan Sekarang
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(0, 0, 0, 0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none', fontWeight: '700'
};

const kurirCardStyle: React.CSSProperties = {
  display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(0, 0, 0, 0.25)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px 18px', borderRadius: '18px', flexWrap: 'wrap', gap: '12px'
};

const btnBayarStyle: React.CSSProperties = {
  backgroundColor: '#10b981', color: 'white', border: 'none', padding: '12px 18px', borderRadius: '14px', fontSize: '12px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)'
};
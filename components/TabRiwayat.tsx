"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';

interface TabRiwayatProps {
  globalData: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  onBukaEditModal: (id: string) => void;
  onHapusData: (id: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TabRiwayat({
  globalData,
  currentSelectedBulan,
  currentSelectedTahun,
  onBulanChange,
  onTahunChange,
  onBukaEditModal,
  onHapusData,
  showToast
}: TabRiwayatProps) {
  
  const [keyword, setKeyword] = useState('');

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

  let filteredData = globalData.filter((item) => {
    const d = parseStandardDate(item.tanggal);
    if (!d) return false;
    const itemBulan = String(d.getMonth() + 1).padStart(2, '0');
    const itemTahun = String(d.getFullYear());
    return (currentSelectedBulan === "ALL" || itemBulan === currentSelectedBulan) && (itemTahun === currentSelectedTahun);
  });

  if (keyword.trim() !== "") {
    const kw = keyword.toLowerCase();
    filteredData = filteredData.filter((item) => {
      const v = String(item.vendor || "").toLowerCase();
      const a = String(item.alamat || "").toLowerCase();
      const k1 = String(item.kurirAntar1 || "").toLowerCase();
      const k2 = String(item.kurirAntar2 || "").toLowerCase();
      const k3 = String(item.kurirJemput1 || "").toLowerCase();
      const k4 = String(item.kurirJemput2 || "").toLowerCase();
      const t = formatTanggal(item.tanggal).toLowerCase();
      return v.includes(kw) || a.includes(kw) || k1.includes(kw) || k2.includes(kw) || k3.includes(kw) || k4.includes(kw) || t.includes(kw);
    });
  }

  filteredData.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  const exportDataKeExcel = () => {
    if (filteredData.length === 0) {
      showToast("Tidak ada data transaksi pada periode ini untuk di-download!", "error");
      return;
    }

    const excelData = filteredData.map((item) => {
      const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean).join(' & ');
      const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean).join(' & ');
      const totalOngkir = Number(item.totalOngkirKurir) || 0;
      const totalSewa = Number(item.uangVendor) || 0;

      return {
        "Tanggal": formatTanggal(item.tanggal),
        "Nama Vendor / Penyewa": item.vendor || "-",
        "Alamat Event": item.alamat || "-",
        "Jumlah Unit": item.jumlahUnit || 0,
        "Total Biaya Sewa (Rp)": totalSewa,
        "Sudah Diterima (Rp)": Number(item.sudahBayar) || 0,
        "Sisa Piutang (Rp)": Number(item.sisaBayar) || 0,
        "Status Bayar Vendor": item.sisaBayar <= 0 ? "LUNAS" : "BELUM LUNAS",
        "Status Unit": item.statusUnit || "Belum Diantar",
        "Gaji Kurir (Rp)": totalOngkir,
        "Untung Bersih (Rp)": totalSewa - totalOngkir,
        "Kurir Antar": kAntar || "-",
        "Kurir Jemput": kJemput || "-",
        "Status Gaji Kurir": item.statusKurir || "Belum Dibayar"
      };
    });

    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Laporan Keuangan");

    const namaBulan = (currentSelectedBulan === "ALL") ? "Semua_Bulan" : "Bulan_" + currentSelectedBulan;
    const namaFile = `Laporan_BlowerSanur_${namaBulan}_${currentSelectedTahun}.xlsx`;

    XLSX.writeFile(workbook, namaFile);
    showToast('Laporan Excel berhasil di-download!', 'success');
  };

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

      {/* DOWNLOAD EXCEL & SEARCH BAR */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button onClick={exportDataKeExcel} style={btnExcelStyle} className="btn-interactive">
          📊 Download Laporan Excel (.xlsx)
        </button>

        <div style={searchContainerStyle}>
          <span style={{ fontSize: '16px' }}>🔍</span>
          <input 
            type="text" 
            value={keyword} 
            onChange={(e) => setKeyword(e.target.value)} 
            placeholder="Cari vendor, alamat, kurir, tanggal..." 
            style={searchInputStyle} 
          />
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="glass-panel" style={{ padding: '40px 20px', textAlign: 'center', borderRadius: '24px' }}>
          <p style={{ color: '#94a3b8', fontSize: '13px', margin: 0 }}>Tidak ada transaksi ditemukan pada periode ini.</p>
        </div>
      ) : (
        <>
          {/* KARTU MOBILE MODERN */}
          <div className="mobile-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
            {filteredData.map((item, index) => {
              const uangVendor = Number(item.uangVendor) || 0;
              const sudahBayar = Number(item.sudahBayar) || 0;
              const sisaBayar = Number(item.sisaBayar) || 0;
              const isLunas = sisaBayar <= 0;
              const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean).join(' & ') || 'Belum Diantar';
              const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean).join(' & ') || 'Belum Dijemput';

              return (
                <div 
                  key={item.id} 
                  className="bento-card" 
                  style={{ padding: '18px', animationDelay: `${index * 0.04}s` }}
                >
                  <div style={mobileCardHeader}>
                    <div>
                      <b style={{ color: '#fff', fontSize: '15px', fontWeight: '900' }}>{item.vendor || 'Tanpa Nama'}</b><br />
                      <span style={{ fontSize: '11px', color: '#60a5fa', fontWeight: '800' }}>📅 {formatTanggal(item.tanggal)}</span>
                    </div>
                    <span style={item.statusUnit === 'Selesai' ? badgeLunas : badgeProses}>
                      {item.statusUnit || 'Belum Diantar'}
                    </span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', marginBottom: '14px', fontSize: '12px' }}>
                    <div style={mobileRow}><span style={{ color: '#94a3b8' }}>📍 Alamat:</span><span style={{ fontWeight: '700', color: '#e2e8f0' }}>{item.alamat} ({item.jumlahUnit} Unit)</span></div>
                    <div style={mobileRow}><span style={{ color: '#94a3b8' }}>💰 Biaya / Masuk:</span><span>Rp {uangVendor.toLocaleString('id-ID')} / <b style={{ color: isLunas ? '#34d399' : '#fca5a5' }}>Rp {sudahBayar.toLocaleString('id-ID')}</b></span></div>
                    <div style={mobileRow}><span style={{ color: '#94a3b8' }}>🚚 Kurir Antar:</span><span style={{ color: '#fff' }}>{kAntar}</span></div>
                    <div style={mobileRow}><span style={{ color: '#94a3b8' }}>📦 Kurir Jemput:</span><span style={{ color: '#fff' }}>{kJemput}</span></div>
                    <div style={mobileRow}><span style={{ color: '#94a3b8' }}>⚙️ Status Gaji:</span><span><span style={item.statusKurir === 'LUNAS' ? badgeLunas : badgeBelum}>{item.statusKurir || 'Belum Bayar'}</span></span></div>
                  </div>
                  
                  <div style={{ display: 'flex', gap: '8px', paddingTop: '12px', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
                    <button onClick={() => onBukaEditModal(item.id)} className="btn-interactive" style={{ ...btnEditStyle, flex: 1, padding: '10px' }}>✏️ Edit</button>
                    <button onClick={() => onHapusData(item.id)} className="btn-interactive" style={{ ...btnHapusStyle, flex: 1, padding: '10px' }}>🗑️ Hapus</button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABEL DESKTOP MODERN */}
          <div className="desktop-table-wrapper" style={{ overflowX: 'auto', background: 'rgba(15, 23, 42, 0.6)', padding: '12px', borderRadius: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            <table style={{ width: '100%', borderCollapse: 'separate', borderSpacing: '0 8px', fontSize: '13px', whiteSpace: 'nowrap' }}>
              <thead>
                <tr>
                  <th style={thStyle}>Tanggal</th>
                  <th style={thStyle}>Vendor</th>
                  <th style={thStyle}>Alamat</th>
                  <th style={thStyle}>Unit</th>
                  <th style={thStyle}>Biaya</th>
                  <th style={thStyle}>Diterima</th>
                  <th style={thStyle}>Sisa</th>
                  <th style={thStyle}>Bayar</th>
                  <th style={thStyle}>Status Unit</th>
                  <th style={thStyle}>Kurir Antar</th>
                  <th style={thStyle}>Kurir Jemput</th>
                  <th style={thStyle}>Gaji Kurir</th>
                  <th style={thStyle}>Aksi</th>
                </tr>
              </thead>
              <tbody>
              {/* BAGIAN DI DALAM KARTU MOBILE DAN TABEL DESKTOP */}
              {filteredData.map((item, index) => {
              const uangVendor = Number(item.uangVendor) || 0;
              const sudahBayar = Number(item.sudahBayar) || 0;
              const sisaBayar = Number(item.sisaBayar) || 0;
              const isLunas = sisaBayar <= 0;
              
              const adaAntar = Boolean(item.kurirAntar1 || item.kurirAntar2);
              const adaJemput = Boolean(item.kurirJemput1 || item.kurirJemput2);
              
              const kAntar = [item.kurirAntar1, item.kurirAntar2].filter(Boolean).join(' & ') || 'Belum Diantar';
              const kJemput = [item.kurirJemput1, item.kurirJemput2].filter(Boolean).join(' & ') || 'Belum Dijemput';

              // LOGIKA STATUS OTOMATIS BERDASARKAN KURIR
              let statusUnitDinamis = "⏳ Belum Diantar";
              let badgeStyleUnit = badgeBelum; // Warna Kuning/Orange (Default belum)

              if (adaJemput) {
                  statusUnitDinamis = "✅ Selesai";
                  badgeStyleUnit = badgeLunas; // Warna Hijau
              } else if (adaAntar) {
                  statusUnitDinamis = "🚚 Sedang Dipakai";
                  badgeStyleUnit = badgeProses; // Warna Biru (Ada tapi belum selesai)
              }
              
              /* 
                 Nanti di JSX (HTML)-nya, panggil statusnya pakai:
                 <span style={badgeStyleUnit}>{statusUnitDinamis}</span>
              */

                  return (
                    <tr key={item.id}>
                      <td style={tdStyle}>{formatTanggal(item.tanggal)}</td>
                      <td style={{ ...tdStyle, fontWeight: '900', color: '#fff' }}>{item.vendor}</td>
                      <td style={tdStyle}>{item.alamat}</td>
                      <td style={tdStyle}>{item.jumlahUnit} Unit</td>
                      <td style={tdStyle}>Rp {uangVendor.toLocaleString('id-ID')}</td>
                      <td style={{ ...tdStyle, color: isLunas ? '#34d399' : '#fca5a5', fontWeight: '900' }}>Rp {sudahBayar.toLocaleString('id-ID')}</td>
                      <td style={{ ...tdStyle, color: '#fca5a5' }}>Rp {sisaBayar.toLocaleString('id-ID')}</td>
                      <td style={tdStyle}>
                        <span style={isLunas ? badgeLunas : badgeBelum}>{isLunas ? 'LUNAS' : 'BELUM'}</span>
                      </td>
                      <td style={tdStyle}>
                        <span style={item.statusUnit === 'Selesai' ? badgeLunas : badgeProses}>{item.statusUnit || 'Belum Diantar'}</span>
                      </td>
                      <td style={tdStyle}>{kAntar}</td>
                      <td style={tdStyle}>{kJemput}</td>
                      <td style={tdStyle}>
                        <span style={item.statusKurir === 'LUNAS' ? badgeLunas : badgeBelum}>{item.statusKurir || 'Belum Bayar'}</span>
                      </td>
                      <td style={tdStyle}>
                        <div style={{ display: 'flex', gap: '6px', justifyContent: 'center' }}>
                          <button onClick={() => onBukaEditModal(item.id)} className="btn-interactive" style={btnEditStyle}>Edit</button>
                          <button onClick={() => onHapusData(item.id)} className="btn-interactive" style={btnHapusStyle}>Hapus</button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const selectStyle: React.CSSProperties = { flex: 1, padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none', fontWeight: '700' };
const btnExcelStyle: React.CSSProperties = { backgroundColor: '#10b981', color: 'white', border: 'none', padding: '14px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', width: '100%', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)', fontSize: '14px' };
const searchContainerStyle: React.CSSProperties = { display: 'flex', alignItems: 'center', gap: '12px', backgroundColor: 'rgba(15, 23, 42, 0.6)', padding: '12px 18px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.08)' };
const searchInputStyle: React.CSSProperties = { border: 'none', background: 'transparent', color: 'white', outline: 'none', width: '100%', fontSize: '14px', fontWeight: '600' };
const mobileCardHeader: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '10px', marginBottom: '12px' };
const mobileRow: React.CSSProperties = { display: 'flex', justifyContent: 'space-between', fontSize: '12px' };
const thStyle: React.CSSProperties = { padding: '14px 12px', color: '#94a3b8', fontWeight: '900', textTransform: 'uppercase', fontSize: '10px', textAlign: 'center', letterSpacing: '0.8px' };
const tdStyle: React.CSSProperties = { padding: '14px 12px', textAlign: 'center', backgroundColor: 'rgba(0, 0, 0, 0.25)', borderTop: '1px solid rgba(255,255,255,0.03)', borderBottom: '1px solid rgba(255,255,255,0.03)', color: '#f8fafc' };
const badgeLunas: React.CSSProperties = { backgroundColor: 'rgba(16, 185, 129, 0.15)', color: '#34d399', border: '1px solid rgba(16, 185, 129, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };
const badgeBelum: React.CSSProperties = { backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };
const badgeProses: React.CSSProperties = { backgroundColor: 'rgba(245, 158, 11, 0.15)', color: '#fcd34d', border: '1px solid rgba(245, 158, 11, 0.3)', padding: '4px 10px', borderRadius: '20px', fontSize: '9px', fontWeight: '900', letterSpacing: '0.5px' };
const btnEditStyle: React.CSSProperties = { backgroundColor: '#3b82f6', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', cursor: 'pointer', fontWeight: '900', boxShadow: '0 4px 12px rgba(59, 130, 246, 0.3)' };
const btnHapusStyle: React.CSSProperties = { backgroundColor: '#ef4444', color: 'white', border: 'none', padding: '8px 12px', borderRadius: '10px', fontSize: '11px', cursor: 'pointer', fontWeight: '900', boxShadow: '0 4px 12px rgba(239, 68, 68, 0.3)' };
"use client";

import React, { useState } from 'react';
import { db, ref, set, remove } from '@/lib/firebase';

interface TabPengeluaranProps {
  globalPengeluaran: any[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
  onBulanChange: (val: string) => void;
  onTahunChange: (val: string) => void;
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TabPengeluaran({
  globalPengeluaran,
  currentSelectedBulan,
  currentSelectedTahun,
  onBulanChange,
  onTahunChange,
  showToast
}: TabPengeluaranProps) {
  const [tglPengeluaran, setTglPengeluaran] = useState('');
  const [kategoriPengeluaran, setKategoriPengeluaran] = useState('BBM / Bensin');
  const [nominalPengeluaran, setNominalPengeluaran] = useState('');
  const [ketPengeluaran, setKetPengeluaran] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRupiahChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setNominalPengeluaran('');
      return;
    }
    setNominalPengeluaran(Number(rawVal).toLocaleString('id-ID'));
  };

  const cleanNumber = (valStr: string) => {
    if (!valStr) return 0;
    return parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
  };

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

  const handleSimpanPengeluaran = async (e: React.FormEvent) => {
    e.preventDefault();
    const nom = cleanNumber(nominalPengeluaran);
    if (!tglPengeluaran || nom <= 0) {
      showToast('Mohon isi tanggal dan nominal pengeluaran secara benar!', 'error');
      return;
    }

    setLoading(true);
    try {
      const idBaru = String(new Date().getTime());
      const payload = {
        id: idBaru,
        tanggal: tglPengeluaran,
        kategori: kategoriPengeluaran,
        nominal: nom,
        keterangan: ketPengeluaran.trim()
      };

      await set(ref(db, '/pengeluaran/' + idBaru), payload);
      showToast('Pengeluaran operasional berhasil dicatat!', 'success');
      
      setTglPengeluaran('');
      setNominalPengeluaran('');
      setKetPengeluaran('');
    } catch (error) {
      console.error("Gagal menyimpan pengeluaran:", error);
      showToast('Terjadi kesalahan saat menyimpan.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleHapusPengeluaran = async (firebaseKey: string) => {
    try {
      await remove(ref(db, '/pengeluaran/' + firebaseKey));
      showToast('Pengeluaran berhasil dihapus!', 'success');
    } catch (error) {
      console.error("Gagal menghapus:", error);
      showToast('Gagal menghapus pengeluaran.', 'error');
    }
  };

  const pengeluaranFiltered = globalPengeluaran.filter((p) => {
    const d = parseStandardDate(p.tanggal);
    if (!d) return false;
    const pBulan = String(d.getMonth() + 1).padStart(2, '0');
    const pTahun = String(d.getFullYear());
    return (currentSelectedBulan === "ALL" || pBulan === currentSelectedBulan) && (pTahun === currentSelectedTahun);
  });

  pengeluaranFiltered.sort((a, b) => (parseStandardDate(b.tanggal)?.getTime() || 0) - (parseStandardDate(a.tanggal)?.getTime() || 0));

  const totalBiayaPeriode = pengeluaranFiltered.reduce((acc, curr) => acc + (Number(curr.nominal) || 0), 0);

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

      {/* FORM INPUT PENGELUARAN BENTO */}
      <div className="bento-card" style={{ padding: '24px' }}>
        <form onSubmit={handleSimpanPengeluaran} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '16px' }}>
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Tanggal Pengeluaran:</label>
            <input type="date" value={tglPengeluaran} onChange={(e) => setTglPengeluaran(e.target.value)} style={inputStyle} required />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Kategori Pengeluaran:</label>
            <select value={kategoriPengeluaran} onChange={(e) => setKategoriPengeluaran(e.target.value)} style={inputStyle}>
              <option value="BBM / Bensin" style={{ background: '#0f172a' }}>⛽ BBM / Bensin</option>
              <option value="Servis & Perawatan" style={{ background: '#0f172a' }}>🛠️ Servis & Perawatan Blower</option>
              <option value="Pembelian Peralatan" style={{ background: '#0f172a' }}>🔌 Pembelian Alat / Kabel Roll</option>
              <option value="Pengeluaran Lainnya" style={{ background: '#0f172a' }}>📦 Pengeluaran Lainnya</option>
            </select>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Nominal (Rp):</label>
            <input type="text" value={nominalPengeluaran} onChange={handleRupiahChange} placeholder="Contoh: 50.000" inputMode="numeric" pattern="[0-9]*" style={inputStyle} required />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>Keterangan / Rincian:</label>
            <input type="text" value={ketPengeluaran} onChange={(e) => setKetPengeluaran(e.target.value)} placeholder="Contoh: Isi bensin mobil antar unit" style={inputStyle} />
          </div>

          <button type="submit" disabled={loading} className="btn-interactive" style={btnSimpanStyle}>
            {loading ? 'Menyimpan...' : '+ Simpan Pengeluaran'}
          </button>
        </form>
      </div>

      {/* SECTION RIWAYAT PENGELUARAN */}
      <div className="glass-panel" style={{ padding: '24px', borderRadius: '24px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '12px' }}>
          <h4 style={{ color: '#fff', fontSize: '14px', margin: 0, fontWeight: '900', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
            📋 Riwayat Pengeluaran
          </h4>
          <span style={{ color: '#fca5a5', fontSize: '13px', fontWeight: '900' }}>
            Total: Rp {totalBiayaPeriode.toLocaleString('id-ID')}
          </span>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {pengeluaranFiltered.length === 0 ? (
            <p style={{ color: '#94a3b8', textAlign: 'center', fontSize: '13px', padding: '16px 0' }}>Belum ada pengeluaran dicatat pada periode ini.</p>
          ) : (
            pengeluaranFiltered.map((p) => (
              <div key={p.firebaseKey} style={itemCardStyle} className="btn-interactive">
                <div style={{ flex: 1, paddingRight: '12px' }}>
                  <b style={{ color: '#fff', fontSize: '14px', fontWeight: '800' }}>{p.kategori}</b><br />
                  <span style={{ fontSize: '11px', color: '#94a3b8' }}>📅 {formatTanggal(p.tanggal)} {p.keterangan ? `• ${p.keterangan}` : ''}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <span style={{ color: '#fca5a5', fontWeight: '900', fontSize: '15px' }}>Rp {Number(p.nominal).toLocaleString('id-ID')}</span>
                  <button onClick={() => handleHapusPengeluaran(p.firebaseKey)} style={btnHapusStyle} className="btn-interactive" title="Hapus Pengeluaran">🗑️</button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

    </div>
  );
}

const selectStyle: React.CSSProperties = {
  flex: 1, padding: '12px 16px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '13px', outline: 'none', fontWeight: '700'
};
const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px'
};
const inputStyle: React.CSSProperties = {
  width: '100%', padding: '14px 16px', borderRadius: '14px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxSizing: 'border-box', fontSize: '14px', outline: 'none', fontWeight: '600'
};
const btnSimpanStyle: React.CSSProperties = {
  gridColumn: 'span 2', backgroundColor: '#10b981', color: 'white', border: 'none', padding: '16px', borderRadius: '16px', fontWeight: '900', cursor: 'pointer', boxShadow: '0 6px 20px rgba(16, 185, 129, 0.35)', fontSize: '14px'
};
const itemCardStyle: React.CSSProperties = {
  backgroundColor: 'rgba(0,0,0,0.25)', border: '1px solid rgba(255,255,255,0.06)', padding: '16px', borderRadius: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center'
};
const btnHapusStyle: React.CSSProperties = {
  backgroundColor: 'rgba(239, 68, 68, 0.15)', color: '#fca5a5', border: '1px solid rgba(239, 68, 68, 0.3)', padding: '10px 12px', borderRadius: '12px', cursor: 'pointer', fontSize: '13px'
};
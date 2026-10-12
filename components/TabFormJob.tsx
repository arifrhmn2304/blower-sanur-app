"use client";

import React, { useState } from 'react';
import { db, ref, set } from '@/lib/firebase';

interface TabFormJobProps {
  listVendor: string[];
  showToast: (message: string, type: 'success' | 'error' | 'info') => void;
}

export default function TabFormJob({ listVendor, showToast }: TabFormJobProps) {
  const [tanggal, setTanggal] = useState('');
  const [vendor, setVendor] = useState('');
  const [alamat, setAlamat] = useState('');
  const [linkMaps, setLinkMaps] = useState('');
  const [jumlahUnit, setJumlahUnit] = useState('');
  const [uangVendor, setUangVendor] = useState('');
  const [sudahBayar, setSudahBayar] = useState('');
  const [loading, setLoading] = useState(false);

  const handleRupiahChange = (e: React.ChangeEvent<HTMLInputElement>, setter: (val: string) => void) => {
    const rawVal = e.target.value.replace(/[^0-9]/g, '');
    if (rawVal === '') {
      setter('');
      return;
    }
    const formatted = Number(rawVal).toLocaleString('id-ID');
    setter(formatted);
  };

  const cleanNumber = (valStr: string) => {
    if (!valStr) return 0;
    return parseInt(valStr.replace(/[^0-9]/g, ''), 10) || 0;
  };

  const handleSimpanOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!tanggal || !vendor || !alamat || !jumlahUnit || !uangVendor) {
      showToast('Mohon isi Tanggal, Vendor, Alamat, Jumlah Unit, dan Total Biaya Sewa secara lengkap!', 'error');
      return;
    }

    setLoading(true);
    try {
      const unitNum = parseInt(jumlahUnit, 10) || 0;
      const totalSewa = cleanNumber(uangVendor);
      const diterima = cleanNumber(sudahBayar);
      const sisaBayar = totalSewa - diterima;
      const statusBayar = sisaBayar <= 0 ? "LUNAS" : "BELUM LUNAS";
      const totalOngkirKurir = unitNum * 50000;
      const idBaru = String(new Date().getTime());

      const payload = {
        id: idBaru,
        tanggal,
        vendor: vendor.trim(),
        alamat: alamat.trim(),
        linkMaps: linkMaps.trim(),
        jumlahUnit: unitNum,
        uangVendor: totalSewa,
        sudahBayar: diterima,
        sisaBayar,
        statusBayar,
        totalOngkirKurir,
        kurirAntar1: "",
        kurirAntar2: "",
        kurirJemput1: "",
        kurirJemput2: "",
        statusKurir: "Belum Dibayar",
        statusUnit: "Belum Diantar"
      };

      await set(ref(db, '/' + idBaru), payload);
      showToast('Orderan / Job baru berhasil disimpan ke database!', 'success');
      
      setTanggal('');
      setVendor('');
      setAlamat('');
      setLinkMaps('');
      setJumlahUnit('');
      setUangVendor('');
      setSudahBayar('');
    } catch (error) {
      console.error("Gagal menyimpan data:", error);
      showToast('Terjadi kesalahan saat menyimpan data.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
      {/* FORM CONTAINER BENTO */}
      <div className="bento-card" style={{ padding: '28px' }}>
        <form onSubmit={handleSimpanOrder} style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '20px' }}>
          
          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>📅 Tanggal Peminjaman Event:</label>
            <input 
              type="date" 
              value={tanggal} 
              onChange={(e) => setTanggal(e.target.value)} 
              style={inputStyle} 
              required 
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>👥 Nama Penyewa / Vendor:</label>
            <input 
              type="text" 
              value={vendor} 
              onChange={(e) => setVendor(e.target.value)} 
              list="listVendorOptions" 
              placeholder="Ketik atau pilih nama vendor..." 
              style={inputStyle} 
              required 
            />
            <datalist id="listVendorOptions">
              {listVendor.map((v, idx) => (
                <option key={idx} value={v} style={{ background: '#0f172a' }} />
              ))}
            </datalist>
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>📍 Alamat / Lokasi Tujuan Event:</label>
            <input 
              type="text" 
              value={alamat} 
              onChange={(e) => setAlamat(e.target.value)} 
              placeholder="Contoh: Gedung Serbaguna Siteba" 
              style={inputStyle} 
              required 
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>🗺️ Link Google Maps / Share Loc WA (Opsional):</label>
            <input 
              type="text" 
              value={linkMaps} 
              onChange={(e) => setLinkMaps(e.target.value)} 
              placeholder="Tempel tautan Google Maps di sini..." 
              style={inputStyle} 
            />
          </div>

          <div>
            <label style={labelStyle}>𖣘 Jumlah Unit Blower:</label>
            <input 
              type="number" 
              value={jumlahUnit} 
              onChange={(e) => setJumlahUnit(e.target.value)} 
              placeholder="Contoh: 2" 
              style={inputStyle} 
              min="1" 
              required 
            />
          </div>

          <div>
            <label style={labelStyle}>💵 Total Biaya Sewa (Rp):</label>
            <input 
              type="text" 
              value={uangVendor} 
              onChange={(e) => handleRupiahChange(e, setUangVendor)} 
              placeholder="Contoh: 350.000" 
              style={inputStyle} 
              required 
            />
          </div>

          <div style={{ gridColumn: 'span 2' }}>
            <label style={labelStyle}>💳 Uang Muka / DP Diterima (Rp):</label>
            <input 
              type="text" 
              value={sudahBayar} 
              onChange={(e) => handleRupiahChange(e, setSudahBayar)} 
              placeholder="Isi 0 jika belum bayar sama sekali" 
              style={inputStyle} 
            />
            <span style={{ fontSize: '11px', color: '#64748b', marginTop: '6px', display: 'block' }}>*Sisa piutang akan dihitung otomatis oleh sistem.</span>
          </div>

          <button 
            type="submit" 
            disabled={loading} 
            className="btn-interactive"
            style={{ 
              gridColumn: 'span 2', 
              backgroundColor: '#10b981', 
              color: 'white', 
              border: 'none', 
              padding: '18px', 
              borderRadius: '16px', 
              fontWeight: '900', 
              cursor: 'pointer',
              fontSize: '15px',
              marginTop: '10px',
              boxShadow: '0 8px 25px rgba(16, 185, 129, 0.45)',
              letterSpacing: '0.5px'
            }}
          >
            {loading ? 'Menyimpan ke Database...' : '+ Simpan Orderan Baru'}
          </button>

        </form>
      </div>
    </div>
  );
}

const labelStyle: React.CSSProperties = {
  display: 'block', marginBottom: '8px', fontSize: '11px', fontWeight: '900', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.8px'
};

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '16px 18px', borderRadius: '16px', backgroundColor: 'rgba(0,0,0,0.4)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', boxSizing: 'border-box', fontSize: '14px', outline: 'none', fontWeight: '600'
};
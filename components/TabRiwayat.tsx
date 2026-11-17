"use client";

import React, { useState } from 'react';
import * as XLSX from 'xlsx';
import { Download, Pencil, Search, Trash, Wallet } from 'lucide-react';

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

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];

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

  // LOGIKA PINTAR: Cek status unit dan cek apakah semua kurir sudah dibayar
  const getDynamicStatus = (item: any) => {
    const kAntarArr = [item.kurirAntar1, item.kurirAntar2].filter(Boolean);
    const kJemputArr = [item.kurirJemput1, item.kurirJemput2].filter(Boolean);

    let statusUnit = "Belum Diantar";
    let badgeUnit = "badge badge-warn";
    if (kJemputArr.length > 0) {
      statusUnit = "Selesai";
      badgeUnit = "badge badge-good";
    } else if (kAntarArr.length > 0) {
      statusUnit = "Sedang Dipakai";
      badgeUnit = "badge badge-info";
    }

    const semuaKurir = Array.from(new Set([...kAntarArr, ...kJemputArr]));
    let statusGaji = "Belum Bayar";
    let badgeGaji = "badge badge-warn";

    if (semuaKurir.length > 0) {
      const semuaSudahLunas = semuaKurir.every(k => {
        const keyK = String(k).replace(/[^a-zA-Z0-9]/g, '_');
        return item[`lunas_${keyK}`] === true;
      });

      if (semuaSudahLunas || item.statusKurir === "LUNAS") {
        statusGaji = "LUNAS";
        badgeGaji = "badge badge-good";
      }
    } else if (item.statusKurir === "LUNAS") {
      statusGaji = "LUNAS";
      badgeGaji = "badge badge-good";
    }

    return {
      statusUnit, badgeUnit, statusGaji, badgeGaji,
      kAntar: kAntarArr.join(' & ') || 'Belum Diantar',
      kJemput: kJemputArr.join(' & ') || 'Belum Dijemput'
    };
  };

  const exportDataKeExcel = () => {
    if (filteredData.length === 0) {
      showToast("Tidak ada data transaksi pada periode ini untuk di-download!", "error");
      return;
    }

    const excelData = filteredData.map((item) => {
      const { statusUnit, statusGaji, kAntar, kJemput } = getDynamicStatus(item);
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
        "Status Unit": statusUnit,
        "Gaji Kurir (Rp)": totalOngkir,
        "Untung Bersih (Rp)": totalSewa - totalOngkir,
        "Kurir Antar": kAntar === 'Belum Diantar' ? '-' : kAntar,
        "Kurir Jemput": kJemput === 'Belum Dijemput' ? '-' : kJemput,
        "Status Gaji Kurir": statusGaji
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

  const totalSewa = filteredData.reduce((acc, it) => acc + (Number(it.uangVendor) || 0), 0);
  const totalMasuk = filteredData.reduce((acc, it) => acc + (Number(it.sudahBayar) || 0), 0);
  const totalSisa = filteredData.reduce((acc, it) => acc + (Number(it.sisaBayar) || 0), 0);

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

      <div className="filter-bar">
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

        <div className="search-wrap">
          <Search size={14} style={{ position: 'absolute', left: 13, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-3)', pointerEvents: 'none' }} />
          <input
            type="search"
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            placeholder="Cari vendor, alamat, kurir, tanggal"
            className="field"
            style={{ paddingLeft: 36 }}
            aria-label="Cari transaksi"
          />
        </div>

        <button onClick={exportDataKeExcel} className="btn btn-good btn-sm export-btn" style={{ minHeight: 42 }}>
          <Download size={14} /> Excel
        </button>
      </div>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Transaksi</span>
            <span className="stat-icon"><Search size={13} /></span>
          </div>
          <span className="stat-value">{filteredData.length}</span>
          <span className="stat-foot">{keyword ? 'Hasil pencarian' : 'Periode terpilih'}</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Total sewa</span>
            <span className="stat-icon"><Wallet size={13} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--info)' }}>Rp {totalSewa.toLocaleString('id-ID')}</span>
          <span className="stat-foot">Nilai kontrak</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Diterima</span>
            <span className="stat-icon"><Download size={13} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--good)' }}>Rp {totalMasuk.toLocaleString('id-ID')}</span>
          <span className="stat-foot">Kas masuk</span>
        </div>
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Sisa piutang</span>
            <span className="stat-icon"><Wallet size={13} /></span>
          </div>
          <span className="stat-value" style={{ color: totalSisa > 0 ? 'var(--bad)' : 'var(--good)' }}>Rp {totalSisa.toLocaleString('id-ID')}</span>
          <span className="stat-foot">{totalSisa > 0 ? 'Belum tertagih' : 'Semua lunas'}</span>
        </div>
      </div>

      {filteredData.length === 0 ? (
        <div className="empty-state">
          <Search size={22} strokeWidth={1.7} />
          <span>Tidak ada transaksi ditemukan{keyword ? ` untuk “${keyword}”` : ' pada periode ini'}.</span>
        </div>
      ) : (
        <>
          {/* KARTU MOBILE */}
          <div className="mobile-card-wrapper" style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filteredData.map((item) => {
              const uangVendor = Number(item.uangVendor) || 0;
              const sudahBayar = Number(item.sudahBayar) || 0;
              const sisaBayar = Number(item.sisaBayar) || 0;
              const isLunas = sisaBayar <= 0;

              const { badgeUnit, badgeGaji, statusGaji, kAntar, kJemput, statusUnit } = getDynamicStatus(item);

              return (
                <div key={item.id} className="surface" style={{ padding: 16 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10, paddingBottom: 12, borderBottom: '1px solid var(--line)' }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{item.vendor || 'Tanpa Nama'}</div>
                      <div className="person-meta" style={{ marginTop: 2 }}>{formatTanggal(item.tanggal)} · {item.jumlahUnit} unit</div>
                    </div>
                    <span className={badgeUnit}>{statusUnit}</span>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6, padding: '12px 0' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
                      <span className="row-label">Alamat</span>
                      <span style={{ fontSize: 12, textAlign: 'right', color: 'var(--text-2)' }}>{item.alamat}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="row-label">Biaya / masuk</span>
                      <span className="num" style={{ fontSize: 12 }}>
                        Rp {uangVendor.toLocaleString('id-ID')} / <b style={{ color: isLunas ? 'var(--good)' : 'var(--bad)' }}>Rp {sudahBayar.toLocaleString('id-ID')}</b>
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                      <span className="row-label">Kurir antar / jemput</span>
                      <span style={{ fontSize: 12, color: 'var(--text-2)', textAlign: 'right' }}>{kAntar} / {kJemput}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span className="row-label">Gaji kurir</span>
                      <span className={badgeGaji}>{statusGaji}</span>
                    </div>
                  </div>

                  <div style={{ display: 'flex', gap: 8, paddingTop: 12, borderTop: '1px solid var(--line)' }}>
                    <button onClick={() => onBukaEditModal(item.id)} className="btn btn-ghost btn-sm" style={{ flex: 1 }}>
                      <Pencil size={13} /> Edit
                    </button>
                    <button onClick={() => onHapusData(item.id)} className="btn btn-danger btn-sm" style={{ flex: 1 }}>
                      <Trash size={13} /> Hapus
                    </button>
                  </div>
                </div>
              );
            })}
          </div>

          {/* TABEL DESKTOP */}
          <div className="desktop-table-wrapper">
            <div className="data-table-wrap">
              <table className="data-table">
              <thead>
                <tr>
                  <th>Tanggal</th>
                  <th>Vendor</th>
                  <th>Alamat</th>
                  <th>Unit</th>
                  <th>Biaya</th>
                  <th>Diterima</th>
                  <th>Sisa</th>
                  <th>Bayar</th>
                  <th>Status unit</th>
                  <th>Kurir antar</th>
                  <th>Kurir jemput</th>
                  <th>Gaji kurir</th>
                  <th>Aksi</th>
                </tr>
              </thead>
              <tbody>
                {filteredData.map((item) => {
                  const uangVendor = Number(item.uangVendor) || 0;
                  const sudahBayar = Number(item.sudahBayar) || 0;
                  const sisaBayar = Number(item.sisaBayar) || 0;
                  const isLunas = sisaBayar <= 0;

                  const { badgeUnit, badgeGaji, statusGaji, kAntar, kJemput, statusUnit } = getDynamicStatus(item);

                  return (
                    <tr key={item.id}>
                      <td className="num">{formatTanggal(item.tanggal)}</td>
                      <td style={{ fontWeight: 700, color: 'var(--text)' }}>{item.vendor}</td>
                      <td style={{ maxWidth: 210, overflow: 'hidden', textOverflow: 'ellipsis' }} title={item.alamat}>{item.alamat}</td>
                      <td className="num">{item.jumlahUnit}</td>
                      <td className="num">Rp {uangVendor.toLocaleString('id-ID')}</td>
                      <td className="num" style={{ color: isLunas ? 'var(--good)' : 'var(--bad)', fontWeight: 600 }}>Rp {sudahBayar.toLocaleString('id-ID')}</td>
                      <td className="num" style={{ color: sisaBayar > 0 ? 'var(--bad)' : 'var(--text-3)' }}>Rp {sisaBayar.toLocaleString('id-ID')}</td>
                      <td><span className={`badge ${isLunas ? 'badge-good' : 'badge-bad'}`}>{isLunas ? 'Lunas' : 'Belum'}</span></td>
                      <td><span className={badgeUnit}>{statusUnit}</span></td>
                      <td>{kAntar}</td>
                      <td>{kJemput}</td>
                      <td><span className={badgeGaji}>{statusGaji}</span></td>
                      <td>
                        <div style={{ display: 'flex', gap: 6, justifyContent: 'center' }}>
                          <button onClick={() => onBukaEditModal(item.id)} className="icon-btn" style={{ width: 30, height: 30 }} title="Edit transaksi" aria-label={`Edit transaksi ${item.vendor}`}>
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => onHapusData(item.id)} className="icon-btn" style={{ width: 30, height: 30, color: 'var(--bad)' }} title="Hapus transaksi" aria-label={`Hapus transaksi ${item.vendor}`}>
                            <Trash size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
            <p className="helper" style={{ margin: '10px 2px 0' }}>
              Geser tabel ke samping untuk melihat kolom kurir &amp; gaji.
            </p>
          </div>
        </>
      )}
    </div>
  );
}

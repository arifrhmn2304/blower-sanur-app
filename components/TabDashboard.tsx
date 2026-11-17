"use client";

import React from 'react';
import {
  ArrowUpRight,
  Banknote,
  CircleCheck,
  Receipt,
  TrendingUp,
  Users,
  Wallet,
} from 'lucide-react';
import CountUp from './CountUp';

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

const BULAN = [
  'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
  'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
];
const BULAN_PENDEK = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];

const initials = (name: string) =>
  name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('');

const juta = (value: number) => {
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)} jt`;
  if (value >= 1_000) return `${Math.round(value / 1_000)} rb`;
  return String(Math.round(value));
};

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

  let sumKotor = 0, sumMasuk = 0, sumSisa = 0, sumOngkir = 0, sumUnit = 0;
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
    sumUnit += Number(item.jumlahUnit) || 1;

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
  const persenTertagih = sumKotor > 0 ? Math.round((sumMasuk / sumKotor) * 100) : 0;
  const marginBersih = sumMasuk > 0 ? Math.round((untungBersihRiil / sumMasuk) * 100) : 0;

  // Skala bar komposisi: bandingkan arus masuk, biaya, dan laba pada rentang yang sama.
  const bridgeScale = Math.max(
    sumMasuk,
    sumOngkir,
    totalPengeluaranPeriode,
    Math.abs(untungBersihRiil),
    1
  );
  const bridgeWidth = (value: number) => `${Math.min(100, Math.max(0, (Math.abs(value) / bridgeScale) * 100))}%`;

  const setTahun = new Set<string>();
  setTahun.add(currentSelectedTahun);
  globalData.forEach((item) => {
    const d = parseStandardDate(item.tanggal);
    if (d) setTahun.add(String(d.getFullYear()));
  });
  const listTahunUnik = Array.from(setTahun).sort().reverse();

  // Arus kas 6 bulan terakhir — jangkar di periode yang dipilih.
  const anchor = (() => {
    if (currentSelectedBulan !== 'ALL') {
      return new Date(Number(currentSelectedTahun), Number(currentSelectedBulan) - 1, 1);
    }
    let latest = new Date(Number(currentSelectedTahun), 11, 1);
    globalData.forEach((item) => {
      const d = parseStandardDate(item.tanggal);
      if (d && d.getFullYear() === Number(currentSelectedTahun) && d > latest) latest = d;
    });
    return new Date(latest.getFullYear(), latest.getMonth(), 1);
  })();

  const chartMonths = Array.from({ length: 6 }, (_, i) => {
    const d = new Date(anchor.getFullYear(), anchor.getMonth() - (5 - i), 1);
    return { key: `${d.getFullYear()}-${d.getMonth()}`, label: BULAN_PENDEK[d.getMonth()], year: d.getFullYear(), masuk: 0, keluar: 0 };
  });

  globalData.forEach((item) => {
    const d = parseStandardDate(item.tanggal);
    if (!d) return;
    const bucket = chartMonths.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.masuk += Number(item.sudahBayar) || 0;
  });
  globalPengeluaran.forEach((p) => {
    const d = parseStandardDate(p.tanggal);
    if (!d) return;
    const bucket = chartMonths.find((m) => m.key === `${d.getFullYear()}-${d.getMonth()}`);
    if (bucket) bucket.keluar += Number(p.nominal) || 0;
  });

  const chartMax = Math.max(1, ...chartMonths.map((m) => Math.max(m.masuk, m.keluar)));

  return (
    <div className="animate-enter" style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      <div className="filter-bar">
        <span className="mono-label" style={{ paddingLeft: 4 }}>Periode</span>
        <select value={currentSelectedBulan} onChange={(e) => onBulanChange(e.target.value)} className="field" aria-label="Pilih bulan">
          <option value="ALL">Semua bulan</option>
          {BULAN.map((nama, i) => (
            <option key={nama} value={String(i + 1).padStart(2, '0')}>{nama}</option>
          ))}
        </select>
        <select value={currentSelectedTahun} onChange={(e) => onTahunChange(e.target.value)} className="field" aria-label="Pilih tahun">
          {listTahunUnik.map((thn) => (
            <option key={thn} value={thn}>{thn}</option>
          ))}
        </select>
        <span className="mono-label" style={{ marginLeft: 'auto', paddingRight: 4 }}>
          {filteredData.length} order · {sumUnit} unit
        </span>
      </div>

      <section className="hero-panel corner" aria-label="Laba bersih periode">
        <div className="hero-content">
          <span className="mono-label" style={{ color: 'var(--accent)' }}>Net profit / periode</span>
          <div className="hero-amount">
            <span className="curr">Rp</span>
            <CountUp value={untungBersihRiil} />
          </div>
          <p className="hero-note">Sudah dikurangi honor kurir dan pengeluaran operasional periode ini.</p>
          <div className="hero-meta">
            <div>
              <span>Order</span>
              <b>{filteredData.length}</b>
            </div>
            <div>
              <span>Unit</span>
              <b>{sumUnit}</b>
            </div>
            <div>
              <span>Total tagihan</span>
              <b>Rp {sumKotor.toLocaleString('id-ID')}</b>
            </div>
            <div>
              <span>Margin</span>
              <b className={marginBersih < 0 ? 'text-bad' : 'text-good'}>{marginBersih}%</b>
            </div>
          </div>
        </div>

        <aside className="hero-bridge" aria-label="Komposisi laba bersih">
          <div className="hero-bridge-head">
            <span className="mono-label">Komposisi Keuangan</span>
            <span className="hero-bridge-chip">{persenTertagih}% tertagih</span>
          </div>

          <div className="hero-bridge-rows">
            <div className="hero-bridge-row" data-kind="in">
              <div className="hero-bridge-row-top">
                <span>Uang masuk</span>
                <b>Rp {sumMasuk.toLocaleString('id-ID')}</b>
              </div>
              <div className="hero-bridge-track" aria-hidden="true">
                <i style={{ width: bridgeWidth(sumMasuk) }} />
              </div>
            </div>

            <div className="hero-bridge-row" data-kind="cost">
              <div className="hero-bridge-row-top">
                <span>Honor kurir</span>
                <b>−Rp {sumOngkir.toLocaleString('id-ID')}</b>
              </div>
              <div className="hero-bridge-track" aria-hidden="true">
                <i style={{ width: bridgeWidth(sumOngkir) }} />
              </div>
            </div>

            <div className="hero-bridge-row" data-kind="ops">
              <div className="hero-bridge-row-top">
                <span>Operasional</span>
                <b>−Rp {totalPengeluaranPeriode.toLocaleString('id-ID')}</b>
              </div>
              <div className="hero-bridge-track" aria-hidden="true">
                <i style={{ width: bridgeWidth(totalPengeluaranPeriode) }} />
              </div>
            </div>
          </div>

          <div className="hero-bridge-net" data-negative={untungBersihRiil < 0}>
            <span>Laba bersih</span>
            <b>
              Rp <CountUp value={untungBersihRiil} />
            </b>
          </div>

          <div className="hero-bridge-foot">
            <span>
              Sisa piutang
            </span>
            <b className={sumSisa > 0 ? 'text-bad' : 'text-good'}>
              Rp {sumSisa.toLocaleString('id-ID')}
            </b>
          </div>
        </aside>
      </section>

      <div className="stat-strip">
        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Total tagihan</span>
            <span className="stat-icon"><Receipt size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--info)' }}>Rp <CountUp value={sumKotor} /></span>
          <span className="stat-foot">{filteredData.length} transaksi</span>
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Uang masuk</span>
            <span className="stat-icon"><Banknote size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--good)' }}>Rp <CountUp value={sumMasuk} /></span>
          <span className="stat-foot">{persenTertagih}% dari tagihan</span>
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Sisa piutang</span>
            <span className="stat-icon"><Wallet size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--bad)' }}>Rp <CountUp value={sumSisa} /></span>
          <span className="stat-foot">{sumSisa > 0 ? 'Perlu ditagih' : 'Semua lunas'}</span>
        </div>

        <div className="stat">
          <div className="stat-top">
            <span className="mono-label">Pengeluaran</span>
            <span className="stat-icon"><ArrowUpRight size={14} /></span>
          </div>
          <span className="stat-value" style={{ color: 'var(--bad)' }}>Rp <CountUp value={totalPengeluaranPeriode} /></span>
          <span className="stat-foot">{pengeluaranFiltered.length} catatan</span>
        </div>
      </div>

      <div className="dashboard-grid">
        <section className="surface panel" aria-label="Arus kas enam bulan">
          <div className="panel-head">
            <div>
              <div className="panel-title"><TrendingUp size={15} strokeWidth={1.9} /> Grafik Keuangan</div>
              <div className="panel-sub">6 bulan terakhir</div>
            </div>
            <div className="legend">
              <span><i className="in" /> Masuk</span>
              <span><i className="out" /> Keluar</span>
            </div>
          </div>

          <div className="chart">
            {chartMonths.map((m) => {
              const hIn = Math.max(2, Math.round((m.masuk / chartMax) * 100));
              const hOut = Math.max(2, Math.round((m.keluar / chartMax) * 100));
              return (
                <div
                  key={m.key}
                  className="chart-col"
                  data-tip={`${m.label} ${m.year}\nMasuk  Rp ${m.masuk.toLocaleString('id-ID')}\nKeluar Rp ${m.keluar.toLocaleString('id-ID')}`}
                >
                  <div className="chart-bars">
                    <span className="chart-bar in" style={{ height: `${hIn}%` }} />
                    <span className="chart-bar out" style={{ height: `${hOut}%` }} />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="chart-labels">
            {chartMonths.map((m) => <span key={m.key}>{m.label}</span>)}
          </div>
          <p className="helper" style={{ marginTop: 12, marginBottom: 0 }}>
            Puncak arus masuk {juta(Math.max(...chartMonths.map((m) => m.masuk)))} · pengeluaran tertinggi {juta(Math.max(...chartMonths.map((m) => m.keluar)))}
          </p>
        </section>

        <section className="surface panel" aria-label="Gaji kurir belum dibayar">
          <div className="panel-head">
            <div>
              <div className="panel-title"><Users size={15} strokeWidth={1.9} /> Gaji kurir</div>
              <div className="panel-sub">Belum dibayar · periode ini</div>
            </div>
            {Object.keys(rekapKurir).length > 0 && (
              <span className="badge badge-warn">{Object.keys(rekapKurir).length} orang</span>
            )}
          </div>

          {Object.keys(rekapKurir).length === 0 ? (
            <div className="empty-state">
              <CircleCheck size={22} strokeWidth={1.7} />
              <span>Seluruh honor kurir pada periode ini sudah lunas.</span>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {Object.entries(rekapKurir).map(([nKurir, dataKurir]) => (
                <div key={nKurir} className="list-row">
                  <div className="payout-row" style={{ flex: 1, minWidth: 0 }}>
                    <div className="person">
                      <span className="avatar" aria-hidden="true">{initials(nKurir)}</span>
                      <div style={{ minWidth: 0 }}>
                        <div className="person-name">{nKurir}</div>
                        <div className="person-meta">{dataKurir.rawIds.length} order</div>
                      </div>
                    </div>
                    <span className="num" style={{ fontSize: 13, fontWeight: 600, color: 'var(--accent)' }}>
                      Rp {dataKurir.nominal.toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div style={{ display: 'flex', gap: 6, flex: 'none' }}>
                    <button className="btn btn-ghost btn-sm" onClick={() => onBukaDetailKurir(nKurir)}>
                      Rincian
                    </button>
                    <button className="btn btn-primary btn-sm" onClick={() => onBukaPelunasanKurir(nKurir)}>
                      Lunaskan
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </div>

    </div>
  );
}

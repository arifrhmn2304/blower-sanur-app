"use client";

type Job = {
  id?: string;
  tanggal?: string;
  vendor?: string;
  jumlahUnit?: number;
  statusUnit?: string;
  uangVendor?: number;
  sudahBayar?: number;
  sisaBayar?: number;
};

type Props = {
  globalData: Job[];
  currentSelectedBulan: string;
  currentSelectedTahun: string;
};

const BULAN_PENDEK = [
  "Jan", "Feb", "Mar", "Apr", "Mei", "Jun",
  "Jul", "Agu", "Sep", "Okt", "Nov", "Des",
];

const parseDate = (raw?: string) => {
  if (!raw) return null;
  let str = String(raw);
  if (str.includes("T")) str = str.split("T")[0];
  const parts = str.split("-");
  if (parts.length === 3 && parts[0].length === 4) {
    return new Date(Number(parts[0]), Number(parts[1]) - 1, Number(parts[2]));
  }
  const date = new Date(raw);
  return Number.isNaN(date.getTime()) ? null : date;
};

const shortDate = (raw?: string) => {
  const date = parseDate(raw);
  if (!date) return "--/--";
  return `${String(date.getDate()).padStart(2, "0")}/${String(date.getMonth() + 1).padStart(2, "0")}`;
};

const statusOf = (raw?: string) => {
  const value = String(raw || "").toLowerCase();
  if (!value) return { key: "new", label: "Baru" };
  if (value.includes("selesai") || value.includes("lunas")) return { key: "done", label: "Selesai" };
  if (value.includes("dipakai") || value.includes("pakai")) return { key: "active", label: "Dipakai" };
  if (value.includes("antar")) return { key: "queue", label: "Antri" };
  return { key: "new", label: "Baru" };
};

const compactRupiah = (value: number) => {
  const amount = Math.abs(Math.round(value));
  if (amount >= 1_000_000_000) {
    return `Rp ${(amount / 1_000_000_000).toFixed(1).replace(".", ",")} M`;
  }
  if (amount >= 1_000_000) {
    return `Rp ${(amount / 1_000_000).toFixed(1).replace(".", ",")} jt`;
  }
  if (amount >= 1_000) return `Rp ${Math.round(amount / 1_000)} rb`;
  return `Rp ${amount.toLocaleString("id-ID")}`;
};

export default function AuthOperationsBoard({
  globalData,
  currentSelectedBulan,
  currentSelectedTahun,
}: Props) {
  const periodJobs = globalData.filter((item) => {
    const date = parseDate(item.tanggal);
    if (!date) return false;
    const month = String(date.getMonth() + 1).padStart(2, "0");
    return (
      (currentSelectedBulan === "ALL" || month === currentSelectedBulan) &&
      String(date.getFullYear()) === currentSelectedTahun
    );
  });

  const totalUnits = periodJobs.reduce(
    (total, item) => total + (Number(item.jumlahUnit) || 1),
    0
  );

  const stages = { queue: 0, active: 0, done: 0 };
  periodJobs.forEach((item) => {
    const units = Number(item.jumlahUnit) || 1;
    const status = statusOf(item.statusUnit);
    if (status.key === "done") stages.done += units;
    else if (status.key === "active") stages.active += units;
    else stages.queue += units;
  });

  const totalTagihan = periodJobs.reduce(
    (total, item) => total + (Number(item.uangVendor) || 0),
    0
  );
  const totalMasuk = periodJobs.reduce(
    (total, item) => total + (Number(item.sudahBayar) || 0),
    0
  );
  const totalSisa = periodJobs.reduce((total, item) => {
    const explicit = Number(item.sisaBayar);
    if (Number.isFinite(explicit) && item.sisaBayar !== undefined) return total + explicit;
    return total + Math.max(0, (Number(item.uangVendor) || 0) - (Number(item.sudahBayar) || 0));
  }, 0);

  const collection = totalTagihan > 0
    ? Math.min(100, Math.max(0, Math.round((totalMasuk / totalTagihan) * 100)))
    : 0;

  const recentJobs = [...periodJobs]
    .sort((a, b) => (parseDate(b.tanggal)?.getTime() || 0) - (parseDate(a.tanggal)?.getTime() || 0))
    .slice(0, 4);

  const monthIndex = Number(currentSelectedBulan) - 1;
  const periodLabel =
    currentSelectedBulan === "ALL"
      ? `Tahun ${currentSelectedTahun}`
      : `${BULAN_PENDEK[monthIndex] || "Periode"} ${currentSelectedTahun}`;

  return (
    <section className="auth-ops" aria-label="Ringkasan operasional terkini">
      <header className="auth-ops-head">
        <span className="auth-ops-kicker">Papan dispatch</span>
        <span className="auth-ops-period">{periodLabel}</span>
      </header>

      <div className="auth-ops-summary">
        <div className="auth-ops-total">
          <span className="auth-ops-total-value">{totalUnits}</span>
          <span className="auth-ops-total-label">
            unit
            <br />
            bergerak
          </span>
        </div>

        <div className="auth-ops-stages">
          <div className="auth-stage" data-stage="queue">
            <i />
            <span>Belum diantar</span>
            <b>{stages.queue}</b>
          </div>
          <div className="auth-stage" data-stage="active">
            <i />
            <span>Sedang dipakai</span>
            <b>{stages.active}</b>
          </div>
          <div className="auth-stage" data-stage="done">
            <i />
            <span>Selesai</span>
            <b>{stages.done}</b>
          </div>
        </div>
      </div>

      <div className="auth-ops-collection">
        <div className="auth-ops-collection-head">
          <span>Penagihan periode</span>
          <b>{collection}%</b>
        </div>
        <div className="auth-ops-track" aria-hidden="true">
          <i style={{ width: `${collection}%` }} />
        </div>
        <div className="auth-ops-money">
          <span>
            Masuk <b>{compactRupiah(totalMasuk)}</b>
          </span>
          <span>
            Sisa <b className={totalSisa > 0 ? "text-bad" : "text-good"}>{compactRupiah(totalSisa)}</b>
          </span>
        </div>
      </div>

      <div className="auth-ops-ledger">
        <div className="auth-ops-ledger-head">
          <span>Tgl</span>
          <span>Vendor</span>
          <span>Unit</span>
          <span>Status</span>
        </div>

        {recentJobs.length === 0 ? (
          <div className="auth-ops-empty">Belum ada order pada periode ini.</div>
        ) : (
          recentJobs.map((item, index) => {
            const status = statusOf(item.statusUnit);
            return (
              <div className="auth-ops-row" key={`${item.id || "job"}-${index}`}>
                <span className="auth-ops-when">{shortDate(item.tanggal)}</span>
                <span className="auth-ops-vendor" title={item.vendor || "Tanpa vendor"}>
                  {item.vendor || "Tanpa vendor"}
                </span>
                <span className="auth-ops-qty">{Number(item.jumlahUnit) || 1}</span>
                <span className="auth-ops-status" data-status={status.key}>
                  {status.label}
                </span>
              </div>
            );
          })
        )}
      </div>
    </section>
  );
}

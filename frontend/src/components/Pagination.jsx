import { HiOutlineChevronLeft, HiOutlineChevronRight } from "react-icons/hi";

function Pagination({
  page,
  totalItems,
  pageSize,
  onPageChange,
  onPageSizeChange,
  tailles = [10, 25, 50],
}) {
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize));
  const debut = totalItems === 0 ? 0 : (page - 1) * pageSize + 1;
  const fin = Math.min(page * pageSize, totalItems);

  const btnStyle = (actif, desactive) => ({
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    width: "30px",
    height: "30px",
    borderRadius: "6px",
    border: "1px solid #d9d7cc",
    background: actif ? "#f77100" : "#fff",
    color: actif ? "#fff" : desactive ? "#c8c6bc" : "#2b2a26",
    cursor: desactive ? "default" : "pointer",
    fontSize: "13px",
    fontWeight: 600,
  });

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        flexWrap: "wrap",
        gap: "12px",
        marginTop: "16px",
        fontFamily: "'Montserrat', sans-serif",
        fontSize: "clamp(12px, 0.85vw, 14px)",
        color: "#8a887e",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
        <span>Afficher</span>
        <select
          value={pageSize}
          onChange={(e) => {
            onPageSizeChange(Number(e.target.value));
            onPageChange(1);
          }}
          style={{
            padding: "5px 8px",
            border: "1px solid #d9d7cc",
            borderRadius: "6px",
            fontSize: "13px",
            fontFamily: "'Montserrat', sans-serif",
            color: "#2b2a26",
            background: "#fff",
          }}
        >
          {tailles.map((t) => (
            <option
              key={t}
              value={t}
            >
              {t}
            </option>
          ))}
        </select>
        <span>par page</span>
      </div>

      <span>
        {debut}–{fin} sur {totalItems}
      </span>

      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
        <div
          onClick={() => page > 1 && onPageChange(page - 1)}
          style={btnStyle(false, page <= 1)}
        >
          <HiOutlineChevronLeft size={15} />
        </div>
        <span style={{ color: "#2b2a26", fontWeight: 600, padding: "0 4px" }}>
          {page} / {totalPages}
        </span>
        <div
          onClick={() => page < totalPages && onPageChange(page + 1)}
          style={btnStyle(false, page >= totalPages)}
        >
          <HiOutlineChevronRight size={15} />
        </div>
      </div>
    </div>
  );
}

export default Pagination;

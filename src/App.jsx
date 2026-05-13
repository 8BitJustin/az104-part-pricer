import { useState, useRef, useEffect } from "react";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import * as XLSX from "xlsx";

const STORAGE_KEY = "car-task-pricer-parts";

function loadParts() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export default function CarTaskPricer() {
  const [parts, setParts] = useState(() => loadParts());
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState(null);
  const [form, setForm] = useState({ name: "", price: "", manufacturer: "", type: "", category: "", link: "" });
  const [errors, setErrors] = useState({});
  const nameRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(parts));
    } catch {}
  }, [parts]);

  useEffect(() => {
    if (showForm && nameRef.current) nameRef.current.focus();
  }, [showForm]);

  const unpurchased = parts.filter((p) => !p.purchased);
  const purchased = parts.filter((p) => p.purchased);
  const included = unpurchased.filter((p) => p.included);
  const excluded = unpurchased.filter((p) => !p.included);
  const runningTotal = included.reduce((s, p) => s + p.price, 0);
  const grossTotal = unpurchased.reduce((s, p) => s + p.price, 0);
  const deducted = excluded.reduce((s, p) => s + p.price, 0);
  const purchasedTotal = purchased.reduce((s, p) => s + p.price, 0);

  const fmt = (n) =>
    "$" + n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 });


  const exportToExcel = () => {
    const rows = parts.map((p) => ({
      Name: p.name,
      Manufacturer: p.manufacturer || "",
      "Type / Description": p.type || "",
      Category: p.category || "",
      Price: p.price,
      Status: p.purchased ? "Purchased" : p.included ? "Active" : "Excluded",
      Link: p.link || "",
    }));

    const ws = XLSX.utils.json_to_sheet(rows);

    // Column widths
    ws["!cols"] = [
      { wch: 28 }, // Name
      { wch: 20 }, // Manufacturer
      { wch: 24 }, // Type
      { wch: 16 }, // Category
      { wch: 12 }, // Price
      { wch: 12 }, // Status
      { wch: 40 }, // Link
    ];

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Parts List");

    const date = new Date().toISOString().slice(0, 10);
    XLSX.writeFile(wb, `integra-parts-${date}.xlsx`);
  };

  const openAddForm = () => {
    setEditId(null);
    setForm({ name: "", price: "", manufacturer: "", type: "", category: "", link: "" });
    setErrors({});
    setShowForm(true);
  };

  const openEditForm = (part) => {
    setEditId(part.id);
    setForm({
      name: part.name,
      price: String(part.price),
      manufacturer: part.manufacturer || "",
      type: part.type || "",
      category: part.category || "",
      link: part.link || "",
    });
    setErrors({});
    setShowForm(true);
  };

  const cancelForm = () => {
    setShowForm(false);
    setEditId(null);
    setErrors({});
  };

  const validateAndSave = () => {
    const errs = {};
    if (!form.name.trim()) errs.name = "Name is required";
    const price = parseFloat(form.price);
    if (!form.price.trim() || isNaN(price) || price < 0) errs.price = "Enter a valid price";
    if (Object.keys(errs).length) { setErrors(errs); return; }

    if (editId !== null) {
      setParts((prev) =>
        prev.map((p) =>
          p.id === editId
            ? { ...p, name: form.name.trim(), price, manufacturer: form.manufacturer.trim(), type: form.type.trim(), category: form.category.trim(), link: form.link.trim() }
            : p
        )
      );
    } else {
      setParts((prev) => [
        ...prev,
        {
          id: Date.now(),
          name: form.name.trim(),
          price,
          manufacturer: form.manufacturer.trim(),
          type: form.type.trim(),
          category: form.category.trim(),
          link: form.link.trim(),
          included: true,
          purchased: false,
        },
      ]);
    }
    setShowForm(false);
    setEditId(null);
    setErrors({});
  };

  const deleteItem = (id) => setParts((prev) => prev.filter((p) => p.id !== id));
  const toggleItem = (id) =>
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, included: !p.included } : p)));
  const togglePurchased = (id) =>
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, purchased: !p.purchased } : p)));

  const onDragEnd = (result) => {
    if (!result.destination) return;
    if (result.destination.index === result.source.index) return;
    const reordered = Array.from(unpurchased);
    const [moved] = reordered.splice(result.source.index, 1);
    reordered.splice(result.destination.index, 0, moved);
    setParts([...reordered, ...purchased]);
  };

  const inputStyle = (hasError) => ({
    width: "100%",
    background: "#0a1020",
    border: `1px solid ${hasError ? "#FF6B6B" : "#1e2d4a"}`,
    borderRadius: 5,
    color: "#e8eaf0",
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: 12,
    padding: "8px 12px",
  });

  const iconBtnStyle = {
    background: "transparent",
    border: "1px solid #1e2d4a",
    borderRadius: 5,
    color: "#4a5580",
    cursor: "pointer",
    width: 30,
    height: 30,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontSize: 13,
  };

  const PartCard = ({ part, provided, snapshot, isDraggable = true }) => (
    <div
      ref={provided?.innerRef}
      {...(provided?.draggableProps || {})}
      className="cp-part-card"
      style={{
        background: part.purchased
          ? "#0a1a0f"
          : snapshot?.isDragging
          ? "#1a2545"
          : part.included
          ? "#111827"
          : "#0a0e16",
        border: part.purchased
          ? "1px solid #06D6A0"
          : `1px solid ${snapshot?.isDragging ? "#00B4D8" : part.included ? "#1e2d4a" : "#12192e"}`,
        borderRadius: 8,
        padding: "14px 18px",
        display: "flex",
        alignItems: "center",
        gap: 14,
        opacity: part.included || part.purchased ? 1 : 0.45,
        boxShadow: part.purchased
          ? "0 0 12px rgba(6,214,160,0.15), 0 0 1px rgba(6,214,160,0.4)"
          : snapshot?.isDragging
          ? "0 8px 32px rgba(0,180,216,0.18)"
          : "none",
        transition: snapshot?.isDragging ? "none" : "all 0.2s",
        ...(provided?.draggableProps?.style || {}),
      }}
    >
      {/* Drag Handle */}
      {isDraggable ? (
        <div
          {...(provided?.dragHandleProps || {})}
          title="Drag to reorder"
          style={{ flexShrink: 0, color: "#2a3a5a", fontSize: 16, cursor: "grab", userSelect: "none", lineHeight: 1, paddingRight: 2 }}
        >
          ⠿
        </div>
      ) : (
        <div style={{ width: 18, flexShrink: 0 }} />
      )}

      {/* Include/Exclude Toggle */}
      {!part.purchased ? (
        <div
          className="cp-toggle"
          title={part.included ? "Exclude from total" : "Include in total"}
          onClick={() => toggleItem(part.id)}
          style={{ flexShrink: 0, width: 34, height: 20, background: part.included ? "#06D6A0" : "#1a2840", border: `1px solid ${part.included ? "#06D6A0" : "#2a3a5a"}`, borderRadius: 10, position: "relative" }}
        >
          <div style={{ position: "absolute", width: 14, height: 14, background: part.included ? "#000" : "#4a5580", borderRadius: "50%", top: 2, left: part.included ? 17 : 2, transition: "left 0.2s" }} />
        </div>
      ) : (
        <div style={{ width: 34, flexShrink: 0 }} />
      )}

      {/* Info — left: name + manufacturer/type */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{
          fontFamily: "'Space Grotesk', sans-serif",
          fontSize: 15,
          fontWeight: 600,
          color: part.purchased ? "#06D6A0" : part.included ? "#e8eaf0" : "#4a5580",
          whiteSpace: "nowrap",
          overflow: "hidden",
          textOverflow: "ellipsis",
          textDecoration: part.purchased ? "line-through" : "none",
          opacity: part.purchased ? 0.7 : 1,
        }}>
          {part.name}
        </div>
        <div style={{ display: "flex", gap: 8, marginTop: 3, alignItems: "center" }}>
          {part.manufacturer && (
            <span style={{ fontSize: 11, color: "#4a6a8a" }}>{part.manufacturer}</span>
          )}
          {part.type && (
            <span style={{ fontSize: 11, color: "#2a4a6a" }}>
              {part.manufacturer ? "· " : ""}{part.type}
            </span>
          )}
        </div>
      </div>

      {/* Right-pinned: category + link */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, flexShrink: 0 }}>
        {part.category && (
          <span style={{ fontSize: 10, color: "#FFB703", background: "#1a1400", border: "1px solid #2a2000", borderRadius: 3, padding: "2px 7px", letterSpacing: 0.5, whiteSpace: "nowrap" }}>
            {part.category}
          </span>
        )}
        {part.link && (
          <a
            href={part.link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            style={{ fontSize: 10, color: "#00B4D8", background: "#001a28", border: "1px solid #002a3a", borderRadius: 3, padding: "2px 7px", textDecoration: "none", letterSpacing: 0.5, whiteSpace: "nowrap" }}
          >
            ↗ View Part
          </a>
        )}
      </div>

      {/* Price */}
      <div style={{
        fontFamily: "'Space Grotesk', sans-serif",
        fontSize: 16,
        fontWeight: 700,
        color: part.purchased ? "#2a5a3a" : part.included ? "#00B4D8" : "#2a3a5a",
        textDecoration: (!part.included && !part.purchased) ? "line-through" : "none",
        flexShrink: 0,
        whiteSpace: "nowrap",
        minWidth: 80,
        textAlign: "right",
      }}>
        {fmt(part.price)}
      </div>

      {/* Actions */}
      <div style={{ display: "flex", gap: 6, flexShrink: 0 }}>
        <button
          className="cp-icon-btn"
          title={part.purchased ? "Mark as unpurchased" : "Mark as purchased"}
          onClick={() => togglePurchased(part.id)}
          style={{ ...iconBtnStyle, border: part.purchased ? "1px solid #06D6A0" : "1px solid #1e2d4a", color: part.purchased ? "#06D6A0" : "#4a5580" }}
        >✓</button>
        <button className="cp-icon-btn" title="Edit" onClick={() => openEditForm(part)} style={iconBtnStyle}>✎</button>
        <button className="cp-icon-btn del" title="Delete" onClick={() => deleteItem(part.id)} style={iconBtnStyle}>✕</button>
      </div>
    </div>
  );

  return (
    <div style={{ minHeight: "100vh", background: "#0a0e1a", color: "#e8eaf0", fontFamily: "'IBM Plex Mono', 'Courier New', monospace" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@300;400;500;600&family=Space+Grotesk:wght@400;600;700&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0a0e1a; }
        ::-webkit-scrollbar-thumb { background: #2a3050; border-radius: 4px; }
        .cp-add-btn:hover { opacity: 0.85; transform: scale(0.98); }
        .cp-save-btn:hover { opacity: 0.85; }
        .cp-cancel-btn:hover { opacity: 0.75; }
        .cp-part-card:hover { background: #1a2040 !important; }
        .cp-icon-btn { transition: all 0.15s; }
        .cp-icon-btn:hover { border-color: #00B4D8 !important; color: #00B4D8 !important; }
        .cp-icon-btn.del:hover { border-color: #FF6B6B !important; color: #FF6B6B !important; }
        .cp-toggle { transition: all 0.2s; cursor: pointer; }
        .cp-toggle:hover { opacity: 0.85; }
        .cp-input:focus { border-color: #00B4D8 !important; outline: none; }
        .cp-input::placeholder { color: #2a3a5a; }
      `}</style>

      {/* Header */}
      <div style={{ background: "linear-gradient(135deg, #0d1428 0%, #111827 50%, #0a1628 100%)", borderBottom: "1px solid #1e2d4a", padding: "24px 32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 16 }}>
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 4 }}>
            <span style={{ fontSize: 26 }}>🔧</span>
            <span style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: "-0.5px" }}>Task Pricer</span>
            <span style={{ background: "#FFB703", color: "#000", fontSize: 10, fontWeight: 600, padding: "2px 8px", borderRadius: 3, letterSpacing: 1 }}>CAR BUILD</span>
          </div>
          <div style={{ color: "#6b7a99", fontSize: 12 }}>Track parts · Toggle included · Mark purchased · See live total</div>
        </div>
        <div style={{ display: "flex", gap: 10 }}>
          <button
            onClick={exportToExcel}
            disabled={parts.length === 0}
            style={{ background: "transparent", border: "1px solid #1e3a1a", color: parts.length === 0 ? "#2a3a2a" : "#06D6A0", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, padding: "10px 18px", borderRadius: 6, cursor: parts.length === 0 ? "not-allowed" : "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}
          >
            ↓ Export Excel
          </button>
          <button className="cp-add-btn" onClick={openAddForm} style={{ background: "linear-gradient(135deg, #00B4D8, #06D6A0)", border: "none", color: "#000", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, padding: "10px 20px", borderRadius: 6, cursor: "pointer", display: "flex", alignItems: "center", gap: 6, transition: "all 0.15s" }}>
            + Add Part
          </button>
        </div>
      </div>

      <div style={{ maxWidth: 900, margin: "0 auto", padding: "24px 32px" }}>

        {/* Total Box */}
        <div style={{ background: "#111827", border: "1px solid #1e2d4a", borderRadius: 10, padding: "20px 28px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: 20, marginBottom: 24 }}>
          <div>
            <div style={{ color: "#4a5580", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Running Total</div>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 36, fontWeight: 700, color: "#06D6A0", letterSpacing: "-1px", lineHeight: 1 }}>{fmt(runningTotal)}</div>
            <div style={{ color: "#4a5580", fontSize: 11, marginTop: 6 }}>
              {unpurchased.length} item{unpurchased.length !== 1 ? "s" : ""}{excluded.length > 0 && ` · ${excluded.length} excluded`}
            </div>
          </div>
          <div style={{ display: "flex", gap: 32, flexWrap: "wrap" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#4a5580", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>All Parts</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: "#4a5580" }}>{fmt(grossTotal)}</div>
              {deducted > 0 && <div style={{ color: "#FFB703", fontSize: 11, marginTop: 4 }}>{fmt(deducted)} deducted</div>}
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ color: "#06D6A0", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", marginBottom: 6 }}>Purchased</div>
              <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 20, fontWeight: 600, color: purchased.length > 0 ? "#06D6A0" : "#2a3a5a" }}>{fmt(purchasedTotal)}</div>
              <div style={{ color: "#4a5580", fontSize: 11, marginTop: 4 }}>{purchased.length} item{purchased.length !== 1 ? "s" : ""} done</div>
            </div>
          </div>
        </div>

        {/* Add / Edit Form */}
        {showForm && (
          <div style={{ background: "#0d1428", border: "1px solid #1e3a5a", borderRadius: 10, padding: "20px 22px", marginBottom: 20 }}>
            <div style={{ fontFamily: "'Space Grotesk', sans-serif", fontSize: 14, fontWeight: 600, color: "#00B4D8", marginBottom: 16 }}>
              {editId !== null ? "✎ Edit Part" : "+ Add New Part"}
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
              <div>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Name <span style={{ color: "#E040FB" }}>*</span></label>
                <input ref={nameRef} className="cp-input" value={form.name} onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))} placeholder="e.g. Coilover Kit" style={inputStyle(errors.name)} />
                {errors.name && <div style={{ color: "#FF6B6B", fontSize: 10, marginTop: 4 }}>{errors.name}</div>}
              </div>
              <div>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Price <span style={{ color: "#E040FB" }}>*</span></label>
                <input className="cp-input" value={form.price} onChange={(e) => setForm((f) => ({ ...f, price: e.target.value }))} placeholder="e.g. 349.99" type="number" min="0" step="0.01" style={inputStyle(errors.price)} />
                {errors.price && <div style={{ color: "#FF6B6B", fontSize: 10, marginTop: 4 }}>{errors.price}</div>}
              </div>
              <div>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Manufacturer</label>
                <input className="cp-input" value={form.manufacturer} onChange={(e) => setForm((f) => ({ ...f, manufacturer: e.target.value }))} placeholder="e.g. KW Suspension" style={inputStyle(false)} />
              </div>
              <div>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Type / Description</label>
                <input className="cp-input" value={form.type} onChange={(e) => setForm((f) => ({ ...f, type: e.target.value }))} placeholder="e.g. Suspension, Stage 2" style={inputStyle(false)} />
              </div>
              <div>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Category</label>
                <input className="cp-input" value={form.category} onChange={(e) => setForm((f) => ({ ...f, category: e.target.value }))} placeholder="e.g. Engine, Exterior, Interior" style={inputStyle(false)} />
              </div>
              <div style={{ gridColumn: "1 / -1" }}>
                <label style={{ color: "#4a5580", fontSize: 10, letterSpacing: 1.5, textTransform: "uppercase", display: "block", marginBottom: 5 }}>Link to Part</label>
                <input className="cp-input" value={form.link} onChange={(e) => setForm((f) => ({ ...f, link: e.target.value }))} placeholder="https://..." type="url" style={inputStyle(false)} />
              </div>
            </div>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: 10, marginTop: 16 }}>
              <button className="cp-cancel-btn" onClick={cancelForm} style={{ background: "transparent", border: "1px solid #1e2d4a", color: "#6b7a99", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, padding: "8px 18px", borderRadius: 5, cursor: "pointer", transition: "opacity 0.15s" }}>Cancel</button>
              <button className="cp-save-btn" onClick={validateAndSave} style={{ background: "#06D6A0", border: "none", color: "#000", fontFamily: "'IBM Plex Mono', monospace", fontSize: 12, fontWeight: 600, padding: "8px 20px", borderRadius: 5, cursor: "pointer", transition: "opacity 0.15s" }}>Save Part</button>
            </div>
          </div>
        )}

        {/* Empty state */}
        {parts.length === 0 && (
          <div style={{ textAlign: "center", color: "#2a3a5a", fontSize: 12, padding: "60px 0", letterSpacing: 1 }}>
            No parts yet — click &ldquo;Add Part&rdquo; to get started
          </div>
        )}

        {/* Unpurchased list — draggable */}
        {unpurchased.length > 0 && (
          <DragDropContext onDragEnd={onDragEnd}>
            <Droppable droppableId="parts-list">
              {(provided) => (
                <div ref={provided.innerRef} {...provided.droppableProps} style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                  {unpurchased.map((part, index) => (
                    <Draggable key={String(part.id)} draggableId={String(part.id)} index={index}>
                      {(provided, snapshot) => (
                        <PartCard part={part} provided={provided} snapshot={snapshot} isDraggable={true} />
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        )}

        {/* Purchased section */}
        {purchased.length > 0 && (
          <div style={{ marginTop: unpurchased.length > 0 ? 28 : 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 10 }}>
              <div style={{ flex: 1, height: 1, background: "#0e2a1a" }} />
              <span style={{ color: "#06D6A0", fontSize: 10, letterSpacing: 2, textTransform: "uppercase", opacity: 0.6 }}>
                ✓ Purchased — {purchased.length} item{purchased.length !== 1 ? "s" : ""} · {fmt(purchasedTotal)}
              </span>
              <div style={{ flex: 1, height: 1, background: "#0e2a1a" }} />
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {purchased.map((part) => (
                <PartCard
                  key={part.id}
                  part={part}
                  provided={{ innerRef: undefined, draggableProps: {}, dragHandleProps: {} }}
                  snapshot={{ isDragging: false }}
                  isDraggable={false}
                />
              ))}
            </div>
          </div>
        )}

        {/* Footer hint */}
        {parts.length > 0 && (
          <div style={{ color: "#2a3a5a", fontSize: 11, textAlign: "center", marginTop: 28, letterSpacing: 0.5 }}>
            ⠿ drag to reorder · toggle to include/exclude · ✓ to mark purchased
          </div>
        )}
      </div>
    </div>
  );
}

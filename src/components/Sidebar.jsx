const SidebarIcon = {
  new: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <line x1="12" y1="5" x2="12" y2="19" />
      <line x1="5" y1="12" x2="19" y2="12" />
    </svg>
  ),
  dl: (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
};

export default function Sidebar({ C, tab, setTab, grade: gr, brand, onNew, onDownload, downloading, NAV_TABS, isMobile, isTablet }) {
  if (isMobile) return null;

  const gc =
    gr === "A+" || gr === "A" || gr === "A-"
      ? C.green
      : gr?.startsWith("B")
        ? C.amber
        : gr?.startsWith("C")
          ? C.gold
          : C.red;
  return (
    <div
      style={{
        width: isTablet ? 208 : C.sideW,
        minWidth: isTablet ? 208 : C.sideW,
        background: C.ink,
        borderRight: `1px solid ${C.border}`,
        height: "100vh",
        position: "sticky",
        top: 0,
        display: "flex",
        flexDirection: "column",
        overflowY: "auto",
        flexShrink: 0,
        zIndex: 50,
        fontFamily: "'Inter','DM Sans',sans-serif",
        boxShadow: `18px 0 48px ${C.shadow}`,
      }}
    >
      {/* Brand header */}
      <div style={{ padding: "26px 20px 22px", borderBottom: `1px solid ${C.border}` }}>
        <img
          src="/advantage-logo.png"
          alt="ADVantage Insights"
          onError={(e) => {
            e.target.style.display = "none";
          }}
          style={{
            height: 28,
            maxWidth: "100%",
            objectFit: "contain",
            marginBottom: 14,
            display: "block",
          }}
        />
        <div style={{ fontSize: 10, fontWeight: 800, color: C.gold, textTransform: "uppercase", marginBottom: 8, fontFamily: "'DM Mono',monospace", letterSpacing: 1.8 }}>
          ADVantage Insights<sup style={{ fontSize: 6, color: C.gold, verticalAlign: "super" }}>TM</sup>
        </div>
        <div
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: C.text,
            letterSpacing: 0,
            lineHeight: 1.2,
            fontFamily: "'Playfair Display',serif",
          }}
        >
          AdCritIQ<sup style={{ fontSize: 8, color: C.gold, verticalAlign: "super" }}>TM</sup>
        </div>
        {gr && (
          <div style={{ marginTop: 14, display: "flex", alignItems: "center", gap: 8 }}>
            <div
              style={{
                background: `${gc}16`,
                border: `1px solid ${gc}55`,
                borderRadius: 8,
                padding: "4px 12px",
                fontSize: 14,
                fontWeight: 800,
                color: gc,
                fontFamily: "'DM Mono',monospace",
                letterSpacing: 1,
              }}
            >
              {gr}
            </div>
            {brand && (
              <div
                style={{
                  fontSize: 11,
                  color: C.dim,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  maxWidth: 100,
                }}
              >
                {brand}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {NAV_TABS.map((n) => {
          const active = tab === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setTab(n.id)}
              style={{
                width: "100%",
                display: "flex",
                alignItems: "center",
                gap: 10,
                padding: "11px 12px",
                marginBottom: 4,
                background: active ? `linear-gradient(135deg,${C.gold}1f,${C.gold}09)` : "transparent",
                border: active ? `1px solid ${C.gold}44` : `1px solid transparent`,
                borderRadius: 10,
                cursor: "pointer",
                color: active ? C.gold : C.dim,
                fontSize: 12,
                fontWeight: active ? 700 : 500,
                transition: "all 0.15s ease",
                fontFamily: "'Inter','DM Sans',sans-serif",
                letterSpacing: 0,
                textAlign: "left",
              }}
            >
              <span style={{ display: "flex", opacity: active ? 1 : 0.62, flexShrink: 0, color: active ? C.gold : C.dim }}>{n.icon}</span>
              <span style={{ lineHeight: 1.3 }}>{n.label}</span>
            </button>
          );
        })}
      </nav>

      {/* New Analysis button */}
      <div style={{ padding: "16px 20px", borderTop: `1px solid ${C.border}` }}>
        {onDownload && (
          <button
            onClick={onDownload}
            disabled={downloading}
            style={{
              width: "100%",
              background: downloading ? `${C.gold}22` : C.gold,
              border: "none",
              borderRadius: 10,
              padding: "11px 14px",
              color: downloading ? C.gold : C.ink,
              fontSize: 12,
              fontWeight: 800,
              cursor: downloading ? "wait" : "pointer",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 6,
              fontFamily: "'Inter','DM Sans',sans-serif",
              letterSpacing: 0,
              marginBottom: 10,
              transition: "all 0.2s",
              boxShadow: downloading ? "none" : `0 4px 16px ${C.gold}30`,
            }}
          >
            {SidebarIcon.dl} {downloading ? "Generating PDF..." : "Download PDF Report"}
          </button>
        )}
        <button
          onClick={onNew}
          style={{
            width: "100%",
            background: `linear-gradient(135deg,${C.gold}22,${C.gold}0a)`,
            border: `1px solid ${C.gold}44`,
            borderRadius: 10,
            padding: "10px 14px",
            color: C.gold,
            fontSize: 12,
            fontWeight: 700,
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 6,
            fontFamily: "'Inter','DM Sans',sans-serif",
            letterSpacing: 0,
            transition: "all 0.2s",
          }}
        >
          {SidebarIcon.new} New Analysis
        </button>
        <div
          style={{
            marginTop: 12,
            fontSize: 9,
            color: C.muted,
            textAlign: "center",
            fontFamily: "'DM Mono',monospace",
            letterSpacing: 1,
          }}
        >
          NEURAL CREATIVE INTELLIGENCE
        </div>
      </div>
    </div>
  );
}

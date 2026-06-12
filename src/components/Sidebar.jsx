import { useState } from "react";

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

export default function Sidebar({ C, tab, setTab, grade: gr, brand, onNew, onDownload, downloading, NAV_TABS, isMobile, isTablet, isDarkMode, compareMode, resultsB }) {
  const [hoveredTab, setHoveredTab] = useState(null);

  if (isMobile) return null;

  const groupedTabs = NAV_TABS.reduce((groups, item) => {
    const label = item.category || "Dashboard";
    if (!groups.find((group) => group.label === label)) {
      groups.push({
        label,
        colorKey: item.categoryColor || "gold",
        items: [],
      });
    }
    groups.find((group) => group.label === label).items.push(item);
    return groups;
  }, []);

  const categoryColor = (key) => {
    const map = {
      gold: C.gold,
      goldD: C.goldD || C.gold,
      cyan: C.cyan,
      teal: C.teal || C.cyan,
      amber: C.amber || C.gold,
      purple: C.purple || C.gold,
    };
    return map[key] || C.gold;
  };

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
          src={isDarkMode ? "/adcritiq-logo-dark.png" : "/adcritiq-logo-light.png"}
          alt="AdCritIQ™"
          style={{
            display: "block",
            width: "100%",
            maxWidth: 205,
            height: "auto",
            objectFit: "contain",
            borderRadius: 8,
          }}
        />
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
        {compareMode && resultsB && (
          <div
            style={{
              marginTop: 10,
              padding: "6px 10px",
              background: `${C.gold}12`,
              border: `1px solid ${C.gold}33`,
              borderRadius: 6,
              fontSize: 9,
              color: C.gold,
              fontFamily: "'DM Mono',monospace",
              letterSpacing: "0.1em",
              textAlign: "center",
            }}
          >
            ⚖️ A/B MODE ACTIVE
          </div>
        )}
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "14px 10px" }}>
        {groupedTabs.map((group, groupIdx) => {
          const accent = categoryColor(group.colorKey);
          return (
            <div
              key={group.label}
              style={{
                marginTop: groupIdx === 0 ? 0 : 13,
                padding: "10px 6px 8px",
                borderRadius: 10,
                background: `linear-gradient(135deg, ${accent}10, transparent 72%)`,
                border: `1px solid ${accent}18`,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "0 8px 8px",
                  color: accent,
                  opacity: 0.96,
                  fontSize: 8,
                  fontWeight: 900,
                  fontFamily: "'DM Mono',monospace",
                  letterSpacing: "0.14em",
                  textTransform: "uppercase",
                }}
              >
                <span style={{ width: 3, height: 14, borderRadius: 999, background: accent, opacity: 0.95, flexShrink: 0, boxShadow: `0 0 12px ${accent}44` }} />
                <span style={{ whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>{group.label}</span>
              </div>
              <div style={{ paddingBottom: groupIdx === groupedTabs.length - 1 ? 0 : 3 }}>
                {group.items.map((n) => {
                  const active = tab === n.id;
                  const hovered = hoveredTab === n.id;
                  return (
                    <button
                      key={n.id}
                      onClick={() => setTab(n.id)}
                      onMouseEnter={() => setHoveredTab(n.id)}
                      onMouseLeave={() => setHoveredTab(null)}
                      style={{
                        width: "100%",
                        display: "flex",
                        alignItems: "center",
                        gap: 10,
                        padding: "10px 12px",
                        marginBottom: 2,
                        background: active
                          ? "linear-gradient(90deg, rgba(245,158,11,0.10) 0%, transparent 100%)"
                          : hovered
                            ? "rgba(255,255,255,0.03)"
                            : "transparent",
                        borderLeft: active ? `3px solid ${C.gold}` : "3px solid transparent",
                        borderRight: "none",
                        borderTop: "none",
                        borderBottom: "none",
                        borderRadius: 0,
                        cursor: "pointer",
                        color: active ? C.gold : C.text,
                        opacity: active || hovered ? 1 : 0.55,
                        fontSize: 12,
                        fontWeight: active ? 700 : 500,
                        transition: "all 0.15s ease",
                        fontFamily: "'Inter','DM Sans',sans-serif",
                        letterSpacing: 0,
                        textAlign: "left",
                      }}
                    >
                      <span style={{ display: "flex", opacity: 1, flexShrink: 0, color: active ? C.gold : C.text }}>{n.icon}</span>
                      <span style={{ lineHeight: 1.3 }}>{n.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>
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

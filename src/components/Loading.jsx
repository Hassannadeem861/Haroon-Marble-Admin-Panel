import React from "react";
import './FullPageLoader.css';


// ─────────────────────────────────────────────
// FULL PAGE LOADER — Used during route transitions
// ─────────────────────────────────────────────
export const FullPageLoader1 = ({ message = "Loading..." }) => {
  return (
    <div style={styles.fullPage}>
      <div style={styles.loaderCard}>
        <OrbitLoader />
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
};

export const FullPageLoader = ({ message = "Loading..." }) => {
  return (
    <div className="full-page-loader">
      <div className="loader-container">
        <div className="spinner"></div>
        <div className="loader-text">{message}</div>
      </div>
    </div>
  );
};

export const SkeletonRows = ({ rows = 5, columns = 7 }) => {
  return (
    <>
      {Array(rows).fill().map((_, index) => (
        <tr key={index} className="skeleton-row">
          {Array(columns).fill().map((_, colIndex) => (
            <td key={colIndex}>
              <div className="skeleton-cell">
                <div className="skeleton shimmer"></div>
              </div>
            </td>
          ))}
        </tr>
      ))}
    </>
  );
};

export const TableLoader = () => {
  return (
    <div className="table-loader-container">
      <div className="table-spinner"></div>
      {/* <div className="table-loader-text">{message}</div> */}
    </div>
  );
};

// ─────────────────────────────────────────────
// INLINE BUTTON LOADER — Used inside buttons during API calls
// ─────────────────────────────────────────────
export const ButtonLoader = ({ size = 20, color = "#ffffff" }) => {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
      <circle
        cx="12"
        cy="12"
        r="10"
        stroke={color}
        strokeOpacity="0.25"
        strokeWidth="3"
      />
      <path
        d="M12 2a10 10 0 0 1 10 10"
        stroke={color}
        strokeWidth="3"
        strokeLinecap="round"
      />
    </svg>
  );
};

// ─────────────────────────────────────────────
// OVERLAY LOADER — Used over forms/modals during submission
// ─────────────────────────────────────────────
export const OverlayLoader = ({ message = "Please wait..." }) => {
  return (
    <div style={styles.overlay}>
      <div style={styles.overlayContent}>
        <OrbitLoader size="small" />
        <span style={styles.overlayText}>{message}</span>
      </div>
    </div>
  );
};

// ─────────────────────────────────────────────
// ORBIT LOADER — Core animated SVG loader
// ─────────────────────────────────────────────
const OrbitLoader = ({ size = "default" }) => {
  const dim = size === "small" ? 36 : 56;
  return (
    <div style={{ ...styles.orbit, width: dim, height: dim }}>
      <style>{`
        @keyframes orbitSpin {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes orbitSpinReverse {
          0%   { transform: rotate(0deg); }
          100% { transform: rotate(-360deg); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50%       { opacity: 0.6; transform: scale(0.85); }
        }
        .orbit-ring-1 { animation: orbitSpin 1s linear infinite; }
        .orbit-ring-2 { animation: orbitSpinReverse 0.7s linear infinite; }
        .orbit-core   { animation: pulse 1.2s ease-in-out infinite; }
      `}</style>

      <svg
        width={dim}
        height={dim}
        viewBox="0 0 56 56"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* Outer ring */}
        <circle
          className="orbit-ring-1"
          cx="28"
          cy="28"
          r="24"
          stroke="#C9A84C"
          strokeOpacity="0.25"
          strokeWidth="2"
          style={{ transformOrigin: "28px 28px" }}
        />
        <circle
          className="orbit-ring-1"
          cx="28"
          cy="28"
          r="24"
          stroke="#C9A84C"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="30 120"
          style={{ transformOrigin: "28px 28px" }}
        />

        {/* Inner ring */}
        <circle
          className="orbit-ring-2"
          cx="28"
          cy="28"
          r="15"
          stroke="#8B6FE8"
          strokeOpacity="0.2"
          strokeWidth="2"
          style={{ transformOrigin: "28px 28px" }}
        />
        <circle
          className="orbit-ring-2"
          cx="28"
          cy="28"
          r="15"
          stroke="#8B6FE8"
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray="18 75"
          style={{ transformOrigin: "28px 28px" }}
        />

        {/* Core dot */}
        <circle
          className="orbit-core"
          cx="28"
          cy="28"
          r="5"
          fill="#C9A84C"
          style={{ transformOrigin: "28px 28px" }}
        />
      </svg>
    </div>
  );
};



// ─────────────────────────────────────────────
// STYLES
// ─────────────────────────────────────────────
const styles = {
  fullPage: {
    position: "fixed",
    inset: 0,
    background: "#0A0D1A",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 9999,
  },
  loaderCard: {
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    gap: "16px",
  },
  message: {
    color: "#8A93B2",
    fontSize: "13px",
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    fontFamily: "'DM Mono', monospace",
    margin: 0,
  },
  orbit: {
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  overlay: {
    position: "absolute",
    inset: 0,
    background: "rgba(10, 13, 26, 0.75)",
    backdropFilter: "blur(4px)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    borderRadius: "inherit",
    zIndex: 10,
  },
  overlayContent: {
    display: "flex",
    flexDirection: "row",
    alignItems: "center",
    gap: "10px",
  },
  overlayText: {
    color: "#C9A84C",
    fontSize: "13px",
    letterSpacing: "0.05em",
    fontFamily: "'DM Mono', monospace",
  },
};

export default SkeletonRows;
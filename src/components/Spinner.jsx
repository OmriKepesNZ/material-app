// src/components/Spinner.jsx
export default function Spinner() {
  return (
    <svg
      width={18}
      height={18}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      style={{ animation: "spin 0.8s linear infinite" }}
    >
      <circle cx="12" cy="12" r="9" strokeDasharray="56.55" strokeDashoffset="0" />
    </svg>
  );
}
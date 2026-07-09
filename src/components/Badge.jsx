// src/components/Badge.jsx
import React from "react";
import { getStatusColor } from "../utils/colorUtils";

export default function Badge({ status, type = "approval" }) {
  const colors = getStatusColor(status, type);

  return (
    <span
      style={{
        display: "inline-flex",
        alignItems: "center",
        gap: 5,
        padding: "3px 9px",
        borderRadius: 20,
        background: colors.bg,
        color: colors.text,
        fontSize: 11.5,
        fontWeight: 500,
      }}
    >
      <span
        style={{
          width: 5,
          height: 5,
          borderRadius: "50%",
          background: colors.dot,
          flexShrink: 0,
        }}
      />
      {status}
    </span>
  );
}
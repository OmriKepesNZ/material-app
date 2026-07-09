// src/utils/colorUtils.js
import { COLORS } from "../constants";

export function getStatusColor(status, type = "approval") {
  const colorSet = type === "approval" ? COLORS.STATUS : COLORS.SHIP;
  return colorSet[status] || { bg: "#F3F4F6", text: "#374151", dot: "#9CA3AF" };
}
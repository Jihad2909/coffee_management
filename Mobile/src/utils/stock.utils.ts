import { colors } from "../constants/colors";
import { StockStatus } from "../models/StockStatus";

export function getStockStatus(stock: number, minStock: number): StockStatus {
  if (stock <= 0) {
    return "out";
  }

  if (stock <= minStock) {
    return "low";
  }

  return "ok";
}

export function statusLabel(status: StockStatus): string {
  switch (status) {
    case "out":
      return "Out of stock";

    case "low":
      return "Low stock";

    default:
      return "In stock";
  }
}

export function statusColors(status: StockStatus) {
  switch (status) {
    case "out":
      return {
        fg: colors.danger,
        bg: colors.dangerBg,
      };

    case "low":
      return {
        fg: colors.warning,
        bg: colors.warningBg,
      };

    default:
      return {
        fg: colors.success,
        bg: colors.successBg,
      };
  }
}

import toast from "react-hot-toast";

/**
 * Show a toast notification. Use for validation messages, success/error feedback.
 * @param {string} message - Main message text
 * @param {'success'|'error'|'info'} type - Toast type
 * @param {string} [title] - Optional title
 */
export function showToast(message, type = "success", title) {
  const opts = { duration: 4000 };
  if (title) opts.icon = type === "error" ? "❌" : type === "info" ? "ℹ️" : "✓";
  switch (type) {
    case "error":
      toast.error(title ? `${title}\n${message}` : message, opts);
      break;
    case "info":
      toast(title ? `${title}\n${message}` : message, { ...opts, icon: "ℹ️" });
      break;
    default:
      toast.success(title ? `${title}\n${message}` : message, opts);
  }
}

export default showToast;

export async function copyText(value: string) {
  if (navigator.clipboard?.writeText) {
    let timeout: number | undefined;
    try {
      await Promise.race([
        navigator.clipboard.writeText(value),
        new Promise<never>((_, reject) => {
          timeout = window.setTimeout(() => reject(new Error("Clipboard API timed out")), 1200);
        }),
      ]);
      return;
    } catch {
      // Fall back when browser permission handling fails or does not finish promptly.
    } finally {
      window.clearTimeout(timeout);
    }
  }

  const textarea = document.createElement("textarea");
  textarea.value = value;
  textarea.setAttribute("readonly", "true");
  textarea.style.position = "fixed";
  textarea.style.opacity = "0";
  document.body.appendChild(textarea);
  textarea.select();
  const copied = document.execCommand("copy");
  textarea.remove();

  if (!copied) throw new Error("Copy command failed");
}

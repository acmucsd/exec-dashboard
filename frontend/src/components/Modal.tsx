import { useEffect, useRef, type ReactNode } from "react";

// Shared dialog shell: backdrop, ARIA heading, initial focus on mount, focus
// trap, and busy-guarded Escape. Focus is never restored here on unmount —
// form -> confirmation is an internal transition; App owns final restoration.
function Modal({
  className,
  eyebrow,
  titleId,
  title,
  busy,
  bodyKey,
  onEscape,
  children,
}: {
  className: string;
  eyebrow: string;
  titleId: string;
  title: ReactNode;
  busy: boolean;
  // Changes when the dialog swaps its body (e.g. preview -> apply result).
  bodyKey?: string;
  onEscape: () => void;
  children: ReactNode;
}) {
  const modalRef = useRef<HTMLElement>(null);

  const focusables = () => {
    const modal = modalRef.current;
    if (!modal) return [] as HTMLElement[];
    return Array.from(
      modal.querySelectorAll<HTMLElement>(
        "input:not(:disabled), select:not(:disabled), button:not(:disabled), summary",
      ),
    );
  };

  // Initial focus happens once per dialog, never on re-renders: typing in a
  // field must not steal focus back.
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    if (!modal.contains(document.activeElement)) {
      (focusables()[0] ?? modal).focus();
    }
  }, []);

  // Listeners are re-bound whenever busy/onEscape change so Escape always uses
  // the current values and can never cancel an in-flight apply.
  useEffect(() => {
    const modal = modalRef.current;
    if (!modal) return;
    const focusFirst = () => (focusables()[0] ?? modal).focus();
    const onFocusIn = (event: FocusEvent) => {
      if (!modal.contains(event.target as Node)) focusFirst();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        if (!busy) onEscape();
        return;
      }
      if (event.key !== "Tab") return;
      const controls = focusables();
      const firstControl = controls[0];
      const last = controls[controls.length - 1];
      const active = document.activeElement;
      if (!firstControl) {
        event.preventDefault();
        modal.focus();
      } else if (!modal.contains(active) || active === modal) {
        event.preventDefault();
        (event.shiftKey ? last : firstControl).focus();
      } else if (event.shiftKey && active === firstControl) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && active === last) {
        event.preventDefault();
        firstControl.focus();
      }
    };
    document.addEventListener("keydown", onKeyDown);
    document.addEventListener("focusin", onFocusIn);
    return () => {
      document.removeEventListener("keydown", onKeyDown);
      document.removeEventListener("focusin", onFocusIn);
    };
  }, [busy, onEscape]);

  // A busy transition or a preview-to-result swap can delete the focused
  // control. Move focus back inside the dialog, but only when focus was lost
  // or landed on a disabled control, so live typing is never disturbed.
  useEffect(() => {
    if (!busy && bodyKey === undefined) return;
    const modal = modalRef.current;
    if (!modal) return;
    const active = document.activeElement;
    // After an HTML update the removed node stays reachable as activeElement
    // until the browser resets it, so check containment before anything else.
    const lost =
      !modal.contains(active) ||
      active === document.body ||
      (active instanceof HTMLElement && active.matches(":disabled"));
    if (lost) (focusables()[0] ?? modal).focus();
  }, [busy, bodyKey]);

  return (
    <div className="modal-backdrop">
      <section
        className={className}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        ref={modalRef}
        tabIndex={-1}
      >
        <div className="modal-heading">
          <div>
            <p className="eyebrow">{eyebrow}</p>
            <h2 id={titleId}>{title}</h2>
          </div>
        </div>
        {children}
      </section>
    </div>
  );
}

export default Modal;

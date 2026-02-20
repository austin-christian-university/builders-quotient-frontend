function Footer() {
  return (
    <footer className="border-t border-border px-6 py-12">
      <div className="mx-auto flex max-w-6xl flex-col items-center gap-6 sm:flex-row sm:justify-between">
        <p className="text-[length:var(--text-fluid-xs)] text-text-secondary">
          &copy; {new Date().getFullYear()} Austin Christian University
        </p>
        <nav aria-label="Footer">
          <ul className="flex gap-6 text-[length:var(--text-fluid-xs)]">
            <li>
              <a
                href="/privacy"
                className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded"
              >
                Privacy
              </a>
            </li>
            <li>
              <a
                href="/terms"
                className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded"
              >
                Terms
              </a>
            </li>
            <li>
              <a
                href="/contact"
                className="text-text-secondary transition-colors hover:text-text-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-bg-base rounded"
              >
                Contact
              </a>
            </li>
          </ul>
        </nav>
      </div>
    </footer>
  );
}

export { Footer };

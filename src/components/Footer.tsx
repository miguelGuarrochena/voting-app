'use client';

const Footer = () => {

  return (
    <footer className="bg-[var(--bg)] border-t border-[var(--border)] py-8 text-center text-[var(--text-muted)]">
      <p>
        © {new Date().getFullYear()} Created by{' '}
        <a href="https://miguelguarrochena.dev" target="_blank" rel="noopener noreferrer" className="hover:underline">
          miguelguarrochena.dev
        </a>
      </p>
    </footer>
  );
};

export default Footer;

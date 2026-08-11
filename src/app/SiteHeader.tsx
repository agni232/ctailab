import Link from "next/link";
import { FlaskConical } from "lucide-react";

export function SiteHeader() {
  return (
    <header className="site-header">
      <a className="skip-link" href="#main-content">
        Skip to learning
      </a>
      <div className="content-frame site-header-inner">
        <Link className="brand" href="/" aria-label="CTAI Lab home">
          <span className="brand-mark" aria-hidden="true">
            <FlaskConical size={21} strokeWidth={2.5} />
          </span>
          <span>
            <strong>CTAI Lab</strong>
            <small>Learn by doing</small>
          </span>
        </Link>
        <span className="curriculum-label">CBSE · Classes 3–8</span>
      </div>
    </header>
  );
}

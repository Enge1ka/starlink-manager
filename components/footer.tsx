export default function Footer() {
  const year = new Date().getFullYear()
  return (
    <footer className="footer">
      <div className="footer-links">
        <a href="/settings">Settings</a>
        <a href="/reports">Reports</a>
        <a href="/invoices">Invoices</a>
        <a href="/kits">Fleet</a>
      </div>
      <div className="footer-bottom">
        <span>© {year} Starlink Manager. All rights reserved.</span>
      </div>
    </footer>
  )
}

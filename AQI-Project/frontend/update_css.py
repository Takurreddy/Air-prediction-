import os

css_append = """
/* ═══════════════════════════════════════════════
   LIGHT MODE OVERRIDES
   ═══════════════════════════════════════════════ */
[data-theme="light"] {
  --bg-base:     #f8fafc;
  --bg-surface:  #ffffff;
  --bg-panel:    #f1f5f9;
  --bg-card:     #ffffff;
  --bg-hover:    #e2e8f0;

  --text-main:   #0f172a;
  --text-muted:  #64748b;
  --text-dim:    #94a3b8;

  --border:      rgba(15,23,42,.15);
  --border-mid:  rgba(15,23,42,.25);

  --teal:        #0f766e;
  --teal-lt:     #0d9488;
  --teal-dim:    rgba(13,148,136,.12);
  --teal-glow:   rgba(13,148,136,.25);

  --shadow:      0 4px 20px rgba(0,0,0,.08);
  --shadow-lg:   0 12px 40px rgba(0,0,0,.12);
}
"""

with open("src/App.css", "a", encoding="utf-8") as f:
    f.write(css_append)

# Also update Navbar to toggle theme
import re
with open("src/components/Navbar.js", "r", encoding="utf-8") as f:
    nav_content = f.read()

# Replace the static Dark button with a functional toggle
old_btn = """        <button className="nav-theme-btn" type="button">
          <MoonIcon /> Dark <span style={{ color: "var(--text-muted)" }}>▾</span>
        </button>"""

new_btn = """        <button className="nav-theme-btn" type="button" onClick={() => {
          const isLight = document.documentElement.getAttribute('data-theme') === 'light';
          document.documentElement.setAttribute('data-theme', isLight ? 'dark' : 'light');
          setTheme(isLight ? 'dark' : 'light');
        }}>
          {theme === 'light' ? '☀️' : <MoonIcon />} {theme === 'light' ? t('nav.light') : t('nav.dark')} <span style={{ color: "var(--text-muted)" }}>▾</span>
        </button>"""

nav_content = nav_content.replace(old_btn, new_btn)
nav_content = nav_content.replace('const [now, setNow] = useState(new Date());', 'const [now, setNow] = useState(new Date());\\n  const [theme, setTheme] = useState(document.documentElement.getAttribute("data-theme") || "dark");')

with open("src/components/Navbar.js", "w", encoding="utf-8") as f:
    f.write(nav_content)

"""Check local HTML assets, fragment targets and Markdown file links (no network)."""
from html.parser import HTMLParser
from pathlib import Path
import re
from urllib.parse import unquote, urlsplit

ROOT = Path(__file__).resolve().parent.parent

class Page(HTMLParser):
    def __init__(self):
        super().__init__()
        self.ids = set()
        self.links = []
        self.errors = []

    def handle_starttag(self, tag, attrs):
        attrs = dict(attrs)
        ident = attrs.get("id")
        if ident:
            if ident in self.ids:
                self.errors.append(f"duplicate id: {ident}")
            self.ids.add(ident)
        for key in ("href", "src"):
            if attrs.get(key):
                self.links.append(attrs[key])

page = Page()
page.feed((ROOT / "index.html").read_text())
errors = page.errors
checked = 0

def check(reference, source):
    global checked
    url = urlsplit(reference)
    if url.scheme or url.netloc:
        return
    target = (source.parent / unquote(url.path)).resolve() if url.path else source
    if not target.is_relative_to(ROOT):
        errors.append(f"{source.name}: link leaves repository: {reference}")
    elif not target.exists():
        errors.append(f"{source.name}: missing local target: {reference}")
    elif target == ROOT / "index.html" and url.fragment and unquote(url.fragment) not in page.ids:
        errors.append(f"{source.name}: missing HTML fragment: {reference}")
    checked += 1

for link in page.links:
    check(link, ROOT / "index.html")
for source in ROOT.rglob("*.md"):
    if ".git" in source.parts:
        continue
    for link in re.findall(r"!?\[[^\]]*\]\(([^\s)]+)\)", source.read_text()):
        check(link, source)
if errors:
    raise SystemExit("\n".join(errors))
print(f"PASS: {checked} local references; {len(page.ids)} unique HTML ids")

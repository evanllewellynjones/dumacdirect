#!/usr/bin/env python3
"""
gen-timeline-md.py — regenerate understanding-ai-timeline.md from the reader.

The HTML is the source of truth. This script never writes to it.
Run after every edit to the MONTHS array:

    python gen-timeline-md.py

No dependencies. Python 3.8+.
"""

import json, re, sys, pathlib

HERE = pathlib.Path(__file__).parent
SRC  = HERE / "understanding-ai-timeline.html"
OUT  = HERE / "understanding-ai-timeline.md"


def grab(src, name):
    """Pull `const NAME = [ ... ];` out of the script and parse it as JSON."""
    m = re.search(r"const %s\s*=\s*(\[.*?\n\]);" % name, src, re.S)
    if not m:
        sys.exit("FAIL: could not find const %s in %s" % (name, SRC.name))
    blob = m.group(1)
    # "text." + s(7)  ->  "text.[^7]"
    blob = re.sub(r'"\s*\+\s*s\((\d+)\)', r'[^\1]"', blob)
    # bare keys -> quoted keys
    blob = re.sub(r'([{,]\s*)([A-Za-z_]\w*)\s*:', r'\1"\2":', blob)
    try:
        return json.loads(blob)
    except json.JSONDecodeError as e:
        sys.exit("FAIL: %s did not parse as JSON (%s). Check the array syntax." % (name, e))


def strip_html(s):
    s = re.sub(r"<b>|</b>", "**", s)
    s = re.sub(r"<[^>]+>", "", s)
    return s.strip()


def main():
    src = SRC.read_text(encoding="utf-8")

    ver = re.search(r'const VERSION\s*=\s*"([^"]+)"', src)
    version = ver.group(1) if ver else "unversioned"

    refs   = grab(src, "REFS")
    months = grab(src, "MONTHS")
    phases = grab(src, "PHASES")

    # integrity checks
    used = set()
    for m in months:
        for e in m["events"]:
            used.update(int(n) for n in re.findall(r"\[\^(\d+)\]", e))
    bad = sorted(n for n in used if n < 1 or n > len(refs))
    if bad:
        sys.exit("FAIL: reference(s) out of range: %s" % bad)
    ids = [m["id"] for m in months]
    if len(ids) != len(set(ids)):
        sys.exit("FAIL: duplicate month IDs")
    unused = [n for n in range(1, len(refs) + 1) if n not in used]

    L = []
    L.append("# Understanding AI — Timeline")
    L.append("")
    L.append("%s · %d months, %s to %s" % (version, len(months), months[0]["label"], months[-1]["label"]))
    L.append("")
    L.append("> **Generated file. Do not hand-edit.**")
    L.append("> Source: `understanding-ai-timeline.html`. Regenerate with `python gen-timeline-md.py`.")
    L.append("")
    L.append("A running chronology of the AI market. Not a chapter: it records what happened and what "
             "the market was arguing about at the time, so a claim made in any chapter can be placed "
             "against the moment it was made. Appended to as months close; never closed.")
    L.append("")
    L.append("**Provenance.** Months marked `UNVERIFIED` come from training knowledge and have not been "
             "source-checked — treat dates and figures as indicative. All other months are search-verified "
             "and carry numbered references to the list at the end.")
    L.append("")
    L.append("**Permanent IDs.** `T-YYYY-MM` for a month, `TS-nnn` for a deep-dive slide. Both registers "
             "are separate from the chapters' `S-nnn` and never change.")
    L.append("")
    L.append("---")
    L.append("")

    # contents
    L.append("## Contents")
    L.append("")
    L.append("| Month | ID | Status | Deep dive |")
    L.append("|---|---|---|---|")
    for m in months:
        status = []
        if not m.get("verified"):
            status.append("UNVERIFIED")
        if m.get("open"):
            status.append("month open")
        L.append("| %s | `%s` | %s | %s |" % (
            m["label"], m["id"], ", ".join(status) or "verified",
            ("`%s`" % m["deep"]) if m.get("deep") else "—"))
    L.append("")
    L.append("---")
    L.append("")

    # months
    for m in months:
        for p in phases:
            if p["before"] == m["id"]:
                L.append("## %s" % strip_html(p["h"]))
                L.append("")
                L.append("_%s_" % strip_html(p["p"]))
                L.append("")
        flags = []
        if not m.get("verified"):
            flags.append("**UNVERIFIED** — training knowledge, not source-checked")
        if m.get("open"):
            flags.append("month still open")
        L.append("### %s · `%s`" % (m["label"], m["id"]))
        L.append("")
        if flags:
            L.append(" · ".join(flags))
            L.append("")
        for e in m["events"]:
            L.append("- %s" % strip_html(e))
        L.append("")
        L.append("**What the market was asking.** %s" % strip_html(m["asking"]))
        L.append("")
        if m.get("deep"):
            L.append("Deep dive: `%s`" % m["deep"])
            L.append("")

    L.append("---")
    L.append("")
    L.append("## References")
    L.append("")
    for n, t in enumerate(refs, 1):
        L.append("%d. %s" % (n, t))
    L.append("")
    if unused:
        L.append("_Unused reference numbers: %s_" % ", ".join(str(n) for n in unused))
        L.append("")
    L.append("_Descriptive chronology of events reported in public sources. Price and market-"
             "capitalisation moves are recorded as reported on the day. Not investment advice and not a "
             "view on any security. No rating, price target or recommendation from any source is "
             "reproduced here._")
    L.append("")

    OUT.write_text("\n".join(L), encoding="utf-8")
    print("OK  %s — %d months, %d references, %d unused" % (OUT.name, len(months), len(refs), len(unused)))


if __name__ == "__main__":
    main()

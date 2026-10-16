# Recycle Group — website

Static site, served by GitHub Pages from `docs/` on `main`.

Pages: `/` · `/solutions/` · `/who-we-work-with/` (Sectors) · `/infrastructure/` · `/reporting/` · `/the-group/` (the family) · `/initiatives/` · `/about/` · `/contact/` · `/impact/` (demo dashboard).

`/timbercycle/` is generated from the rdodeployme/timbercycle-site repo (`python3 rg-build/build.py install`, then copy `rg-build/out/timbercycle/` here) — edit Timbercycle there, not here.

Built with `build_v3.py` in the Claude "rg resources" project (`BASE=/recycle-group OUT=docs python3 build_v3.py`). Images in `docs/img/`, shared stylesheet `docs/css/main.css`.

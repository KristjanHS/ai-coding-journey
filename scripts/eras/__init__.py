"""Per-era metric-filler modules, dispatched by scripts/measurements.py <era>.

Each module exposes measure(argv: list[str]) -> int and fills its own slice of
sources/measurements/eras-full.json via scripts/measlib.py.
"""

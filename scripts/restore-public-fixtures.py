"""Restore optional upstream test fixtures for the public Lancer Harness source snapshot."""
import argparse
import hashlib
import json
import os
import tempfile
import re
import subprocess
from concurrent.futures import ThreadPoolExecutor
from itertools import count
from pathlib import Path
from urllib.parse import quote
from urllib.request import urlopen

ROOT = Path(__file__).resolve().parents[1]
MANIFEST = json.loads((ROOT / "scripts/public-fixtures.json").read_text())
BRAND = re.compile(MANIFEST["brandTokenPattern"].encode(), re.IGNORECASE)


def blob_id(data):
    return hashlib.sha1(b"blob " + str(len(data)).encode() + b"\0" + data).hexdigest()


def restore(name, upstream):
    spec = MANIFEST["files"][name]
    expected = spec.get("resultBlob", spec["upstreamBlob"])
    target = ROOT / name
    if not target.resolve().is_relative_to(ROOT) or target.is_symlink():
        raise ValueError(f"Unexpected fixture path: {name}")
    if target.exists():
        if blob_id(target.read_bytes()) == expected:
            return
        raise ValueError(f"Existing file differs from the expected fixture: {name}")
    if upstream:
        data = subprocess.check_output(["git", "-C", upstream, "show", f"{MANIFEST['commit']}:{name}"])
    else:
        url = f"https://raw.githubusercontent.com/pingdotgg/t3code/{MANIFEST['commit']}/{quote(name)}"
        with urlopen(url, timeout=60) as response:
            data = response.read()
    if blob_id(data) != spec["upstreamBlob"]:
        raise ValueError(f"Upstream fixture checksum mismatch: {name}")
    if "edits" in spec:
        edits = dict(spec["edits"])
        indices = count()
        data = BRAND.sub(lambda match: edits.get(next(indices), match[0].decode()).encode(), data)
    if blob_id(data) != expected:
        raise ValueError(f"Lancer fixture checksum mismatch: {name}")
    target.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.NamedTemporaryFile(dir=target.parent) as output:
        output.write(data)
        output.flush()
        try:
            os.link(output.name, target)
        except FileExistsError:
            if blob_id(target.read_bytes()) != expected:
                raise ValueError(f"Concurrent write produced a different fixture: {name}")


if __name__ == "__main__":
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--upstream", help="Read the pinned public Git objects from an existing checkout.")
    args = parser.parse_args()
    with ThreadPoolExecutor(max_workers=6) as pool:
        list(pool.map(lambda name: restore(name, args.upstream), MANIFEST["files"]))
    print(f"Verified {len(MANIFEST['files'])} public test fixtures.")

"""Check native package identity before recording provenance; no signature trust implied."""
from pathlib import Path
from zipfile import BadZipFile, ZipFile


def validate_package(path: Path) -> None:
    suffix = path.suffix.lower()
    with path.open("rb") as handle:
        prefix = handle.read(8)
        handle.seek(0, 2)
        size = handle.tell()
        handle.seek(max(0, size - 512))
        tail = handle.read()

    if suffix == ".exe":
        if not prefix.startswith(b"MZ"):
            raise ValueError(f"Invalid Windows PE/NSIS header: {path.name}")
    elif suffix == ".appimage":
        if not prefix.startswith(b"\x7fELF"):
            raise ValueError(f"Invalid AppImage ELF header: {path.name}")
    elif suffix == ".deb":
        if prefix != b"!<arch>\n":
            raise ValueError(f"Invalid Debian archive header: {path.name}")
    elif suffix == ".dmg":
        if len(tail) != 512 or tail[:4] != b"koly":
            raise ValueError(f"Invalid macOS UDIF trailer: {path.name}")
    elif suffix in (".apk", ".zip"):
        try:
            with ZipFile(path) as archive:
                bad = archive.testzip()
                if bad:
                    raise ValueError(f"Corrupt ZIP member in {path.name}: {bad}")
                names = archive.namelist()
                if suffix == ".apk":
                    if "AndroidManifest.xml" not in names or not any(
                        name == "classes.dex" or name.startswith("classes") and name.endswith(".dex")
                        for name in names
                    ):
                        raise ValueError(f"APK lacks Android manifest or executable classes: {path.name}")
                elif not any(name.endswith(".app/Info.plist") for name in names):
                    raise ValueError(f"iOS simulator ZIP lacks app Info.plist: {path.name}")
        except BadZipFile as exc:
            raise ValueError(f"Invalid ZIP package: {path.name}") from exc

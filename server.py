import json
import re
import zlib
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


ROOT = Path(__file__).resolve().parent
PORT = 4321


class ExamPulseHandler(SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET,POST,OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(204)
        self.end_headers()

    def do_POST(self):
        if self.path != "/api/import-local":
            self.send_json(404, {"ok": False, "error": "Not found"})
            return

        try:
            length = int(self.headers.get("Content-Length", "0"))
            payload = json.loads(self.rfile.read(length) or b"{}")
            file_path = Path(str(payload.get("path", ""))).expanduser().resolve()

            if not file_path.exists():
                self.send_json(404, {"ok": False, "error": "Ficheiro nao encontrado"})
                return

            suffix = file_path.suffix.lower()
            if suffix in {".txt", ".md"}:
                text = file_path.read_text(encoding="utf-8", errors="ignore")
            elif suffix == ".pdf":
                text = extract_pdf_text(file_path.read_bytes())
            else:
                self.send_json(400, {"ok": False, "error": "Por caminho local, nesta fase aceito PDF, TXT e MD"})
                return

            self.send_json(200, {"ok": True, "name": file_path.name, "text": text})
        except Exception as error:
            self.send_json(500, {"ok": False, "error": str(error)})

    def send_json(self, status, payload):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)


def extract_pdf_text(data):
    chunks = []
    pattern = re.compile(rb"(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream")

    for match in pattern.finditer(data):
        header, stream = match.group(1), match.group(2)
        if re.search(rb"/Subtype\s*/Image", header):
            continue

        if b"FlateDecode" in header:
            try:
                stream = zlib.decompress(stream)
            except Exception:
                continue

        chunks.append(extract_pdf_strings(stream))

    text = "\n\n".join(chunks)
    text = re.sub(r"[ \t]{2,}", " ", text)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    if len(text) < 20:
        raise ValueError("PDF sem texto extraivel")
    return text


def extract_pdf_strings(data):
    text_parts = []

    for match in re.finditer(rb"\((?:\\.|[^\\()])*\)", data):
        decoded = decode_pdf_literal(match.group(0))
        if is_useful_pdf_text(decoded):
            text_parts.append(decoded)

    for match in re.finditer(rb"<([0-9A-Fa-f\s]{4,})>", data):
        decoded = decode_pdf_hex(match.group(1))
        if is_useful_pdf_text(decoded):
            text_parts.append(decoded)

    return " ".join(text_parts)


def decode_pdf_literal(value):
    raw = value[1:-1]
    escape_map = {
        b"n": b"\n",
        b"r": b"\r",
        b"t": b"\t",
        b"b": b"",
        b"f": b"",
        b"(": b"(",
        b")": b")",
        b"\\": b"\\",
    }
    raw = re.sub(rb"\\([nrtbf()\\])", lambda m: escape_map.get(m.group(1), m.group(1)), raw)
    raw = re.sub(rb"\\([0-7]{1,3})", lambda m: bytes([int(m.group(1), 8) & 255]), raw)
    raw = re.sub(rb"\\\r?\n", b"", raw)
    return raw.decode("latin1", errors="ignore")


def decode_pdf_hex(value):
    clean = re.sub(rb"\s+", b"", value)
    bytes_out = bytes(int(clean[index:index + 2], 16) for index in range(0, len(clean) - 1, 2))

    if bytes_out.startswith(b"\xfe\xff"):
        output = []
        for index in range(2, len(bytes_out) - 1, 2):
            output.append(chr((bytes_out[index] << 8) + bytes_out[index + 1]))
        return "".join(output)

    return bytes_out.decode("latin1", errors="ignore")


def is_useful_pdf_text(value):
    text = value.strip()
    if len(text) <= 1:
        return False

    printable = sum(
        char in "\t\n\r" or 32 <= ord(char) < 127 or ord(char) >= 160
        for char in text
    )
    letters = len(re.findall(r"[A-Za-z0-9]", text))
    return printable / max(1, len(text)) > 0.86 and letters >= max(2, int(len(text) * 0.18))


if __name__ == "__main__":
    import os

    os.chdir(ROOT)
    server = ThreadingHTTPServer(("127.0.0.1", PORT), ExamPulseHandler)
    print(f"ExamPulse ready at http://127.0.0.1:{PORT}")
    server.serve_forever()

const http = require("node:http");
const fs = require("node:fs");
const path = require("node:path");
const zlib = require("node:zlib");

const PORT = 4321;
const ROOT = __dirname;
const LOG_FILE = path.join(ROOT, "server-debug.log");

process.on("uncaughtException", (error) => {
  fs.appendFileSync(LOG_FILE, `uncaught: ${error.stack || error.message}\n`);
});

process.on("unhandledRejection", (error) => {
  fs.appendFileSync(LOG_FILE, `unhandled: ${error.stack || error}\n`);
});

process.on("exit", (code) => {
  fs.appendFileSync(LOG_FILE, `exit: ${code}\n`);
});

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".json": "application/json; charset=utf-8",
};

const server = http.createServer(async (req, res) => {
  setCors(res);

  if (req.method === "OPTIONS") {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.url === "/api/import-local" && req.method === "POST") {
    handleLocalImport(req, res);
    return;
  }

  serveStatic(req, res);
});

server.listen(PORT, "127.0.0.1", () => {
  fs.appendFileSync(LOG_FILE, `listen: ${new Date().toISOString()}\n`);
  console.log(`ExamPulse ready at http://127.0.0.1:${PORT}`);
});

function setCors(res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

function serveStatic(req, res) {
  const url = new URL(req.url, `http://127.0.0.1:${PORT}`);
  const requested = url.pathname === "/" ? "/index.html" : decodeURIComponent(url.pathname);
  const filePath = path.resolve(ROOT, `.${requested}`);

  if (!filePath.startsWith(ROOT)) {
    sendJson(res, 403, { ok: false, error: "Forbidden" });
    return;
  }

  fs.readFile(filePath, (error, data) => {
    if (error) {
      sendJson(res, 404, { ok: false, error: "Not found" });
      return;
    }

    res.writeHead(200, { "Content-Type": TYPES[path.extname(filePath)] || "application/octet-stream" });
    res.end(data);
  });
}

function handleLocalImport(req, res) {
  let body = "";

  req.on("data", (chunk) => {
    body += chunk;
    if (body.length > 1_000_000) req.destroy();
  });

  req.on("end", () => {
    try {
      const payload = JSON.parse(body || "{}");
      const filePath = path.resolve(String(payload.path || ""));

      if (!fs.existsSync(filePath)) {
        sendJson(res, 404, { ok: false, error: "Ficheiro nao encontrado" });
        return;
      }

      const ext = path.extname(filePath).toLowerCase();
      let text = "";

      if (ext === ".txt" || ext === ".md") {
        text = fs.readFileSync(filePath, "utf8");
      } else if (ext === ".pdf") {
        text = extractPdfText(fs.readFileSync(filePath));
      } else {
        sendJson(res, 400, { ok: false, error: "Por caminho local, nesta fase aceito PDF, TXT e MD" });
        return;
      }

      sendJson(res, 200, { ok: true, name: path.basename(filePath), text });
    } catch (error) {
      sendJson(res, 500, { ok: false, error: error.message || "Erro ao importar" });
    }
  });
}

function sendJson(res, status, payload) {
  res.writeHead(status, { "Content-Type": "application/json; charset=utf-8" });
  res.end(JSON.stringify(payload));
}

function extractPdfText(buffer) {
  const source = buffer.toString("binary");
  const streamPattern = /(<<[\s\S]*?>>)\s*stream\r?\n?([\s\S]*?)\r?\n?endstream/g;
  const chunks = [];
  let match = streamPattern.exec(source);

  while (match) {
    const header = match[1];
    if (/\/Subtype\s*\/Image/.test(header)) {
      match = streamPattern.exec(source);
      continue;
    }

    let streamBuffer = Buffer.from(match[2], "binary");

    if (/FlateDecode/.test(header)) {
      try {
        streamBuffer = zlib.inflateSync(streamBuffer);
      } catch {
        match = streamPattern.exec(source);
        continue;
      }
    }

    chunks.push(extractPdfStrings(streamBuffer.toString("binary")));
    match = streamPattern.exec(source);
  }

  const text = chunks.join("\n\n").replace(/[ \t]{2,}/g, " ").replace(/\n{3,}/g, "\n\n").trim();
  if (text.length < 20) throw new Error("PDF sem texto extraivel");
  return text;
}

function extractPdfStrings(content) {
  const textParts = [];
  const literalPattern = /\((?:\\.|[^\\()])*\)/g;
  const hexPattern = /<([0-9A-Fa-f\s]{4,})>/g;

  for (const match of content.matchAll(literalPattern)) {
    const decoded = decodePdfLiteral(match[0]);
    if (isUsefulPdfText(decoded)) textParts.push(decoded);
  }

  for (const match of content.matchAll(hexPattern)) {
    const decoded = decodePdfHex(match[1]);
    if (isUsefulPdfText(decoded)) textParts.push(decoded);
  }

  return textParts.join(" ");
}

function decodePdfLiteral(value) {
  const inner = value.slice(1, -1);
  return inner
    .replace(/\\([nrtbf()\\])/g, (_, char) => {
      const escapes = { n: "\n", r: "\r", t: "\t", b: "", f: "", "(": "(", ")": ")", "\\": "\\" };
      return escapes[char] || char;
    })
    .replace(/\\([0-7]{1,3})/g, (_, octal) => String.fromCharCode(parseInt(octal, 8) & 255))
    .replace(/\\\r?\n/g, "");
}

function decodePdfHex(value) {
  const clean = value.replace(/\s+/g, "");
  const bytes = [];
  for (let index = 0; index < clean.length - 1; index += 2) {
    bytes.push(parseInt(clean.slice(index, index + 2), 16));
  }

  if (bytes[0] === 0xfe && bytes[1] === 0xff) {
    let output = "";
    for (let index = 2; index < bytes.length - 1; index += 2) {
      output += String.fromCharCode((bytes[index] << 8) + bytes[index + 1]);
    }
    return output;
  }

  return Buffer.from(bytes).toString("latin1");
}

function isUsefulPdfText(value) {
  const text = value.trim();
  if (text.length <= 1) return false;

  const printable = [...text].filter((char) => {
    const code = char.charCodeAt(0);
    return code === 9 || code === 10 || code === 13 || (code >= 32 && code < 127) || code >= 160;
  }).length;
  const letters = (text.match(/[A-Za-z0-9]/g) || []).length;

  return printable / text.length > 0.86 && letters >= Math.max(2, Math.floor(text.length * 0.18));
}

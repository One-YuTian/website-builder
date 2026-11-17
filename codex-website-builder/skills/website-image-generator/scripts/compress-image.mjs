// Adapted from the user-owned Lanhu compression MCP (src/compression.ts).
// Pure Node.js; TinyPNG upload/download, validated bytes, no native codecs.
import { createHash, randomUUID } from "node:crypto";
import {readFile,lstat,mkdir,open,rename,unlink} from "node:fs/promises";
import {pathToFileURL} from "node:url";
import path from "node:path";
import { inflateSync } from "node:zlib";
const MAX_IMAGE_BYTES = 200e5;
const imageExtension = /\.(jpe?g|png|webp)$/i;
const digest = (data) => createHash("sha256").update(data).digest("hex");
function validateImage(data, name) {
  const ext = path.extname(name).toLowerCase();
  if (ext === ".png") {
    if (!data.subarray(0, 8).equals(Buffer.from("89504e470d0a1a0a", "hex"))) throw new Error("PNG \u6587\u4EF6\u5934\u65E0\u6548");
    let offset = 8, ended = false, header = false;
    const idat = [];
    while (offset + 12 <= data.length) {
      const size = data.readUInt32BE(offset), end = offset + size + 12;
      if (end > data.length) throw new Error("PNG \u6570\u636E\u4E0D\u5B8C\u6574");
      const type = data.toString("ascii", offset + 4, offset + 8);
      if (!header && (type !== "IHDR" || size !== 13)) throw new Error("PNG \u7F3A\u5C11 IHDR");
      header = true;
      let crc = 4294967295;
      for (const byte of data.subarray(offset + 4, end - 4)) {
        crc ^= byte;
        for (let bit = 0; bit < 8; bit++) crc = crc >>> 1 ^ (crc & 1 ? 3988292384 : 0);
      }
      if ((crc ^ 4294967295) >>> 0 !== data.readUInt32BE(end - 4)) throw new Error("PNG \u6821\u9A8C\u5931\u8D25");
      if (type === "IDAT") idat.push(data.subarray(offset + 8, end - 4));
      offset = end;
      if (type === "IEND") {
        ended = size === 0 && offset === data.length;
        break;
      }
    }
    if (!ended || !idat.length) throw new Error("PNG \u6570\u636E\u4E0D\u5B8C\u6574");
    inflateSync(Buffer.concat(idat), { maxOutputLength: 128 * 1024 * 1024 });
  } else if (ext === ".webp") {
    if (data.length < 20 || data.toString("ascii", 0, 4) !== "RIFF" || data.toString("ascii", 8, 12) !== "WEBP" || data.readUInt32LE(4) + 8 !== data.length) throw new Error("WebP \u6570\u636E\u4E0D\u5B8C\u6574");
    let offset = 12, image = false;
    while (offset + 8 <= data.length) {
      const type = data.toString("ascii", offset, offset + 4), size = data.readUInt32LE(offset + 4);
      offset += 8 + size + size % 2;
      if (offset > data.length) throw new Error("WebP \u5206\u5757\u4E0D\u5B8C\u6574");
      if (["VP8 ", "VP8L", "ANMF"].includes(type)) image = true;
    }
    if (offset !== data.length || !image) throw new Error("WebP \u56FE\u7247\u6570\u636E\u65E0\u6548");
  } else if (ext === ".jpg" || ext === ".jpeg") {
    if (data.length < 4 || data[0] !== 255 || data[1] !== 216 || data[data.length - 2] !== 255 || data[data.length - 1] !== 217) throw new Error("JPEG \u6570\u636E\u4E0D\u5B8C\u6574");
  } else throw new Error("\u4EC5\u652F\u6301 JPG\u3001JPEG\u3001PNG\u3001WebP");
}
async function limitedBody(response, limit, progress) {
  if (!response.ok) {
    await response.body?.cancel();
    throw new Error(`TinyPNG \u8FD4\u56DE HTTP ${response.status}${response.status === 429 ? "\uFF0C\u8BF7\u7A0D\u540E\u91CD\u8BD5" : ""}`);
  }
  const advertised = response.headers.get("content-length");
  if (advertised && Number(advertised) > limit) {
    await response.body?.cancel();
    throw new Error("\u54CD\u5E94\u8D85\u8FC7\u5141\u8BB8\u5927\u5C0F");
  }
  const reader = response.body?.getReader();
  if (!reader) throw new Error("\u7B2C\u4E09\u65B9\u8FD4\u56DE\u7A7A\u54CD\u5E94");
  const chunks = [];
  let size = 0;
  try {
    for (; ; ) {
      const result = await reader.read();
      if (result.done) break;
      size += result.value.length;
      if (size > limit) throw new Error("\u54CD\u5E94\u8D85\u8FC7\u5141\u8BB8\u5927\u5C0F");
      chunks.push(result.value);
      progress?.(size, Number(advertised) || 0);
    }
  } catch (error) {
    await reader.cancel().catch(() => void 0);
    throw error;
  } finally {
    reader.releaseLock();
  }
  if (advertised && !response.headers.get("content-encoding") && Number(advertised) !== size) throw new Error("\u4E0B\u8F7D\u957F\u5EA6\u4E0D\u5339\u914D");
  return Buffer.concat(chunks);
}
async function compressImage(input, name, phase = () => {
}, fetcher = fetch, progress = () => {
}) {
  if (!input.length || input.length > MAX_IMAGE_BYTES) throw new Error("\u56FE\u7247\u4E3A\u7A7A\u6216\u8D85\u8FC7 TinyPNG \u7F51\u9875\u63A5\u53E3\u7684 5.2 MB \u4E0A\u9650");
  validateImage(input, name);
  phase("uploading");
  progress(10);
  const response = await fetcher("https://tinypng.com/backend/opt/shrink", {
    method: "POST",
    redirect: "error",
    signal: AbortSignal.timeout(6e4),
    headers: { "Content-Type": "application/octet-stream", "User-Agent": "Mozilla/5.0" },
    body: new Uint8Array(input)
  });
  const payload = JSON.parse((await limitedBody(response, 64 * 1024)).toString("utf8"));
  if (payload.error) throw new Error(String(payload.message || payload.error).slice(0, 300));
  const output = payload.output;
  if (!output || !Number.isSafeInteger(output.size) || output.size <= 0 || output.size > MAX_IMAGE_BYTES) throw new Error("\u538B\u7F29\u670D\u52A1\u8FD4\u56DE\u65E0\u6548\u5927\u5C0F");
  const url = new URL(output.url);
  if (url.protocol !== "https:" || !["tinypng.com", "www.tinypng.com"].includes(url.hostname) || url.port || url.username || url.password || !/^\/(?:web\/output|backend\/opt\/output)\/[A-Za-z0-9_-]+$/.test(url.pathname)) throw new Error("\u538B\u7F29\u670D\u52A1\u8FD4\u56DE\u65E0\u6548\u4E0B\u8F7D\u5730\u5740");
  phase("downloading");
  progress(50);
  const binary = await limitedBody(await fetcher(url, { redirect: "error", signal: AbortSignal.timeout(6e4) }), MAX_IMAGE_BYTES, (received, total) => progress(50 + Math.min(1, received / (total || output.size)) * 38));
  if (binary.length !== output.size) throw new Error("\u538B\u7F29\u7ED3\u679C\u5C1A\u672A\u4E0B\u8F7D\u5B8C\u6574\uFF0C\u4FDD\u7559\u539F\u56FE");
  validateImage(binary, name);
  return { binary, size: binary.length, originalSize: input.length, unchanged: binary.length >= input.length };
}
export {
  MAX_IMAGE_BYTES,
  compressImage,
  imageExtension,
  validateImage
};

export async function compressImageWithRetry(input, name, options = {}) {
  const { attemptsUsed = 0, maxAttempts = 3, fetcher = fetch, onAttempt = () => {}, phase = () => {}, progress = () => {}, sleep = ms => new Promise(resolve => setTimeout(resolve, ms)) } = options;
  if (!Number.isInteger(attemptsUsed) || attemptsUsed < 0 || maxAttempts !== 3) throw Error('Compression supports at most three total attempts');
  let last;
  for (let attempt = attemptsUsed + 1; attempt <= 3; attempt++) {
    await onAttempt(attempt);
    try { const result = await compressImage(input, name, phase, fetcher, progress);return { ...result, binary: result.unchanged ? input : result.binary, size: result.unchanged ? input.length : result.size, attempts: attempt }; }
    catch (error) { last = error;if (attempt < 3) await sleep(500 * attempt); }
  }
  const failure = Error('图片压缩失败（已尝试3次）：' + String(last?.message || '本任务已用完重试次数').slice(0, 500));
  failure.attempts = 3;throw failure;
}

// Optional standalone CLI; the MCP publisher uses the buffer API above.
export async function compressFile(source, target, options = {}) {
  source = path.resolve(source);target = path.resolve(target);
  if (source === target) throw Error('material原图不得原地覆盖');
  const info = await lstat(source);if (!info.isFile() || info.isSymbolicLink()) throw Error('原图必须为普通文件');
  const input = await readFile(source),originalHash=digest(input);
  const previous=await lstat(target).catch(error=>{if(error.code==='ENOENT')return null;throw error;});
  if(previous?.isSymbolicLink()||previous&&!previous.isFile())throw Error('目标必须为普通文件');
  const previousHash=previous?digest(await readFile(target)):null;
  const result=await compressImageWithRetry(input,path.basename(source),options);
  if(digest(await readFile(source))!==originalHash)throw Error('原图已变化，未发布');
  await mkdir(path.dirname(target),{recursive:true});const temporary=path.join(path.dirname(target),'.'+path.basename(target)+'.'+randomUUID()+'.tmp');
  try{const handle=await open(temporary,'wx');try{await handle.writeFile(result.binary);await handle.sync();}finally{await handle.close();}
    const current=await readFile(target).then(digest).catch(error=>{if(error.code==='ENOENT')return null;throw error;});if(current!==previousHash)throw Error('目标图片已变化，未覆盖');
    if(digest(await readFile(source))!==originalHash)throw Error('原图在写入期间变化，未发布');
    await rename(temporary,target);
  }finally{await unlink(temporary).catch(error=>{if(error.code!=='ENOENT')throw error;});}
  return {attempts:result.attempts,original_size:result.originalSize,compressed_size:result.size,unchanged:result.unchanged};
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href){
  const [, ,source,target]=process.argv;if(!source||!target){process.stderr.write('Usage: node compress-image.mjs material/image.png src/images/image.png\n');process.exitCode=1;}
  else{try{console.log(JSON.stringify(await compressFile(source,target)));}catch(error){process.stderr.write(error.message+'\n');process.exitCode=1;}}
}

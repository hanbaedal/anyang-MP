import { createHash } from "node:crypto";
import { existsSync } from "node:fs";
import { cache } from "react";
import type { ContractListFilters, ContractListKind } from "./contract-book";
import { contractLookupFields } from "./contract-book";
import { dataFile, readJsonFile, writeJsonFile } from "./local-json";
import { getDb, hasMongo, mongoDbName, mongoUriSet, requireDb } from "./mongo";
import type { CemeteryInfoCopy, ContractCopy, ContractFileCopy, FeeCopy, ReceiptCopy, ReportCopy, BaseItem } from "./cemetery-parse";

export type WorkMeta = {
  syncedAt: string;
  sourceHost: string;
  contractCount: number;
  listedContractTotal: number;
  feeCount: number;
  receiptCount: number;
  reportCount: number;
  cemeteryCount: number;
  message: string;
  feeDigest?: string;
  receiptDigest?: string;
  reportDigest?: string;
  cemeteryDigest?: string;
};

export type WorkStorage = {
  used: "mongo" | "file" | "none";
  mongoConfigured: boolean;
  filePresent: boolean;
};

type WorkLists = {
  meta: WorkMeta | null;
  contracts: ContractCopy[];
  fees: FeeCopy[];
  receipts: ReceiptCopy[];
  reports: ReportCopy[];
  cemetery: CemeteryInfoCopy[];
};

export type WorkDump = WorkLists & { storage: WorkStorage };

export const WORK_COLLECTIONS = ["contracts", "fees", "receipts", "work_reports", "cemetery_info", "contract_files", "work_meta"] as const;

export type WorkSaveResult = {
  mongo: boolean;
  file: boolean;
  dbName: string;
  counts: Record<(typeof WORK_COLLECTIONS)[number], number>;
};

const files = {
  meta: dataFile("work-meta.local.json"),
  contracts: dataFile("work-contracts.local.json"),
  fees: dataFile("work-fees.local.json"),
  receipts: dataFile("work-receipts.local.json"),
  reports: dataFile("work-reports.local.json"),
  cemetery: dataFile("work-cemetery.local.json"),
  contractFiles: dataFile("work-contract-files.local.json"),
  baseItems: dataFile("work-base-items.local.json"),
};

const DOT = ".";
const DOT_SAFE = "\uFF0E";

function encodeMongoKey(key: string) {
  return key.replaceAll(DOT, DOT_SAFE);
}

function decodeMongoKey(key: string) {
  return key.replaceAll(DOT_SAFE, DOT);
}

function mapKeys(value: unknown, mapKey: (key: string) => string): unknown {
  if (Array.isArray(value)) return value.map((item) => mapKeys(item, mapKey));
  if (value && typeof value === "object") {
    const out: Record<string, unknown> = {};
    for (const [key, nested] of Object.entries(value as Record<string, unknown>)) {
      if (key === "_id") continue;
      out[mapKey(key)] = mapKeys(nested, mapKey);
    }
    return out;
  }
  return value;
}

function toMongoDocs(docs: object[]) {
  return docs.map((doc) => mapKeys(doc, encodeMongoKey) as object);
}

function workFilesPresent() {
  return existsSync(files.meta) || existsSync(files.contracts) || existsSync(files.fees);
}

export function dumpHasCopyRows(dump: WorkLists) {
  return (
    dump.contracts.length > 0 ||
    dump.fees.length > 0 ||
    dump.receipts.length > 0 ||
    dump.reports.length > 0 ||
    dump.cemetery.length > 0
  );
}

export function pickWorkDump(
  mongo: WorkLists | null,
  file: WorkLists,
  flags: { mongoConfigured: boolean; filePresent: boolean },
): WorkDump {
  if (mongo) {
    return { ...mongo, storage: { used: "mongo", ...flags } };
  }
  if (dumpHasCopyRows(file) || flags.filePresent) {
    return { ...file, storage: { used: "file", ...flags } };
  }
  return { ...file, storage: { used: flags.filePresent ? "file" : "none", ...flags } };
}

function withoutMongoId<T>(docs: object[]): T[] {
  return docs.map((doc) => {
    const { _id: _ignored, ...rest } = doc as { _id?: unknown } & T;
    return mapKeys(rest, decodeMongoKey) as T;
  });
}

export type WorkDumpSlice = "full" | "contracts" | "fees" | "receipts" | "reports" | "master" | "status";

type WorkListKey = keyof Omit<WorkLists, "meta">;

type WorkSliceSpec = {
  meta: boolean;
  contracts: boolean;
  fees: boolean;
  receipts: boolean;
  reports: boolean;
  cemetery: boolean;
};

const SLICE_SPEC: Record<WorkDumpSlice, WorkSliceSpec> = {
  full: { meta: true, contracts: true, fees: true, receipts: true, reports: true, cemetery: true },
  contracts: { meta: true, contracts: true, fees: false, receipts: false, reports: false, cemetery: false },
  fees: { meta: true, contracts: false, fees: true, receipts: false, reports: false, cemetery: false },
  receipts: { meta: true, contracts: true, fees: true, receipts: false, reports: false, cemetery: false },
  reports: { meta: true, contracts: false, fees: false, receipts: false, reports: true, cemetery: false },
  master: { meta: true, contracts: false, fees: false, receipts: false, reports: false, cemetery: false },
  status: { meta: true, contracts: true, fees: true, receipts: false, reports: false, cemetery: false },
};

function sliceHasRows(spec: WorkSliceSpec, lists: WorkLists) {
  if (lists.meta) return true;
  const keys: WorkListKey[] = ["contracts", "fees", "receipts", "reports", "cemetery"];
  return keys.some((key) => spec[key] && lists[key].length > 0);
}

async function readFileSlice(spec: WorkSliceSpec): Promise<WorkLists> {
  const [meta, contracts, fees, receipts, reports, cemetery] = await Promise.all([
    spec.meta ? readJsonFile<WorkMeta | null>(files.meta, null) : Promise.resolve(null),
    spec.contracts ? readJsonFile<ContractCopy[]>(files.contracts, []) : Promise.resolve([]),
    spec.fees ? readJsonFile<FeeCopy[]>(files.fees, []) : Promise.resolve([]),
    spec.receipts ? readJsonFile<ReceiptCopy[]>(files.receipts, []) : Promise.resolve([]),
    spec.reports ? readJsonFile<ReportCopy[]>(files.reports, []) : Promise.resolve([]),
    spec.cemetery ? readJsonFile<CemeteryInfoCopy[]>(files.cemetery, []) : Promise.resolve([]),
  ]);
  return { meta, contracts, fees, receipts, reports, cemetery };
}

async function readFileDump(): Promise<WorkLists> {
  return readFileSlice(SLICE_SPEC.full);
}

async function readMongoSlice(spec: WorkSliceSpec): Promise<WorkLists | null> {
  if (!mongoUriSet()) return null;
  try {
    const db = await getDb();
    if (!db) return null;
    const names = new Set((await db.listCollections().toArray()).map((item) => item.name));
    const many = async <T,>(name: string) =>
      names.has(name) ? withoutMongoId<T>((await db.collection(name).find({}).toArray()) as object[]) : [];
    const metaPromise = spec.meta
      ? many<WorkMeta>("work_meta").then((rows) => rows[0] ?? null)
      : Promise.resolve(null);
    const [meta, contracts, fees, receipts, reports, cemetery] = await Promise.all([
      metaPromise,
      spec.contracts ? many<ContractCopy>("contracts") : Promise.resolve([]),
      spec.fees ? many<FeeCopy>("fees") : Promise.resolve([]),
      spec.receipts ? many<ReceiptCopy>("receipts") : Promise.resolve([]),
      spec.reports ? many<ReportCopy>("work_reports") : Promise.resolve([]),
      spec.cemetery ? many<CemeteryInfoCopy>("cemetery_info") : Promise.resolve([]),
    ]);
    return { meta, contracts, fees, receipts, reports, cemetery };
  } catch {
    console.error("[work-store] mongo read failed; falling back to local files (URI not logged)");
    return null;
  }
}

async function readMongoDump(): Promise<WorkLists | null> {
  return readMongoSlice(SLICE_SPEC.full);
}

function storageFlags(fileHint: boolean) {
  return {
    mongoConfigured: hasMongo(),
    filePresent: workFilesPresent() || fileHint,
  };
}

async function readWorkDumpSliceImpl(slice: WorkDumpSlice): Promise<WorkDump> {
  const spec = SLICE_SPEC[slice];
  if (mongoUriSet()) {
    const mongo = await readMongoSlice(spec);
    if (mongo && sliceHasRows(spec, mongo)) {
      return { ...mongo, storage: { used: "mongo", ...storageFlags(false) } };
    }
  }
  const file = await readFileSlice(spec);
  const mongo = mongoUriSet() ? await readMongoSlice(spec) : null;
  const fileHint = dumpHasCopyRows(file) || Boolean(file.meta);
  return pickWorkDump(mongo, file, storageFlags(fileHint));
}

async function replaceCollection(
  db: Awaited<ReturnType<typeof requireDb>>,
  name: string,
  docs: object[],
  onChunk?: (done: number, total: number) => void,
) {
  const staging = `${name}__staging`;
  const staged = db.collection(staging);
  await staged.drop().catch(() => undefined);
  const payload = toMongoDocs(docs);
  if (payload.length === 0) {
    await db.collection(name).deleteMany({});
    await staged.drop().catch(() => undefined);
    onChunk?.(1, 1);
    return;
  }
  let written = 0;
  onChunk?.(0, payload.length);
  for (let i = 0; i < payload.length; i += 500) {
    const chunk = payload.slice(i, i + 500);
    if (chunk.length) await staged.insertMany(chunk, { ordered: false });
    written += chunk.length;
    onChunk?.(written, payload.length);
  }
  try {
    await db.renameCollection(staging, name, { dropTarget: true });
  } catch {
    const live = db.collection(name);
    await live.deleteMany({});
    written = 0;
    for (let i = 0; i < payload.length; i += 500) {
      const chunk = payload.slice(i, i + 500);
      if (chunk.length) await live.insertMany(chunk, { ordered: false });
      written += chunk.length;
      onChunk?.(written, payload.length);
    }
    await staged.drop().catch(() => undefined);
  }
  onChunk?.(payload.length, payload.length);
}

async function writeMongoDump(
  dump: WorkLists,
  onCollection?: (name: (typeof WORK_COLLECTIONS)[number], done: number, total: number) => void,
) {
  const db = await requireDb();
  await replaceCollection(db, "contracts", dump.contracts, (done, total) => onCollection?.("contracts", done, total));
  await replaceCollection(db, "fees", dump.fees, (done, total) => onCollection?.("fees", done, total));
  await replaceCollection(db, "receipts", dump.receipts, (done, total) => onCollection?.("receipts", done, total));
  await replaceCollection(db, "work_reports", dump.reports, (done, total) => onCollection?.("work_reports", done, total));
  await replaceCollection(db, "cemetery_info", dump.cemetery, (done, total) => onCollection?.("cemetery_info", done, total));
  const metaCol = db.collection<{ _id: string } & Record<string, unknown>>("work_meta");
  onCollection?.("work_meta", 0, 1);
  if (dump.meta) {
    const body = toMongoDocs([dump.meta])[0] as Record<string, unknown>;
    await metaCol.replaceOne({ _id: "current" }, { _id: "current", ...body }, { upsert: true });
  } else {
    await metaCol.deleteMany({});
  }
  onCollection?.("work_meta", 1, 1);
}

async function writeFileDump(dump: WorkLists) {
  await writeJsonFile(files.contracts, dump.contracts);
  await writeJsonFile(files.fees, dump.fees);
  await writeJsonFile(files.receipts, dump.receipts);
  await writeJsonFile(files.reports, dump.reports);
  await writeJsonFile(files.cemetery, dump.cemetery);
  await writeJsonFile(files.meta, dump.meta);
}

export async function saveWorkDump(
  dump: WorkLists,
  opts: { onCollection?: (name: (typeof WORK_COLLECTIONS)[number], done: number, total: number) => void } = {},
): Promise<WorkSaveResult> {
  const counts: WorkSaveResult["counts"] = {
    contracts: dump.contracts.length,
    fees: dump.fees.length,
    receipts: dump.receipts.length,
    work_reports: dump.reports.length,
    cemetery_info: dump.cemetery.length,
    contract_files: 0,
    work_meta: dump.meta ? 1 : 0,
  };
  let mongo = false;
  if (mongoUriSet()) {
    await writeMongoDump(dump, opts.onCollection);
    mongo = true;
    console.log(
      `[work-store] mongo upsert db=${mongoDbName()} contracts=${counts.contracts} fees=${counts.fees} receipts=${counts.receipts} reports=${counts.work_reports} cemetery=${counts.cemetery_info}`,
    );
  } else {
    const mark = (name: (typeof WORK_COLLECTIONS)[number], total: number) => {
      opts.onCollection?.(name, 0, total || 1);
      opts.onCollection?.(name, total || 1, total || 1);
    };
    mark("contracts", counts.contracts);
    mark("fees", counts.fees);
    mark("receipts", counts.receipts);
    mark("work_reports", counts.work_reports);
    mark("cemetery_info", counts.cemetery_info);
    mark("work_meta", counts.work_meta);
  }
  let file = false;
  try {
    await writeFileDump(dump);
    file = true;
  } catch {
    console.error("[work-store] local json write failed");
    if (!mongo) throw new Error("FILE_WRITE_FAILED");
  }
  return { mongo, file, dbName: mongoDbName(), counts };
}

/** 경영관리·계약·관리비·영수증이 같은 복사본을 읽습니다. URI가 있으면 Mongo가 우선, JSON은 로컬 폴백입니다. */
export const readWorkDumpBySlice = cache(readWorkDumpSliceImpl);

export async function readWorkDump(): Promise<WorkDump> {
  return readWorkDumpBySlice("full");
}

export async function saveContractFiles(rows: ContractFileCopy[]) {
  let mongo = false;
  if (mongoUriSet()) {
    const db = await requireDb();
    await replaceCollection(db, "contract_files", rows);
    await db.collection("contract_files").createIndex({ tombNo: 1, contractNo: 1 }).catch(() => undefined);
    mongo = true;
  }
  try {
    await writeJsonFile(files.contractFiles, rows);
  } catch {
    if (!mongo) throw new Error("FILE_WRITE_FAILED");
  }
  return { mongo, count: rows.length };
}

export async function readContractFile(tombNo: string, contractNo: string) {
  if (!tombNo) return null;
  if (mongoUriSet()) {
    try {
      const db = await getDb();
      const doc = db ? await db.collection("contract_files").findOne({ tombNo, contractNo }) : null;
      if (doc) return withoutMongoId<ContractFileCopy>([doc])[0] ?? null;
    } catch {
      console.error("[work-store] contract_files read failed");
    }
  }
  const rows = await readJsonFile<ContractFileCopy[]>(files.contractFiles, []);
  return rows.find((row) => row.tombNo === tombNo && row.contractNo === contractNo) ?? null;
}

async function upsertLocal<T extends { tombNo: string; contractNo: string }>(
  path: string,
  previous: { tombNo: string; contractNo: string } | null,
  next: T,
) {
  const rows = await readJsonFile<T[]>(path, []);
  if (rows.length === 0) return false;
  const same = (row: T, key: { tombNo: string; contractNo: string }) =>
    row.tombNo === key.tombNo && row.contractNo === key.contractNo;
  const kept = rows.filter((row) => (previous ? !same(row, previous) : true) && !same(row, next));
  kept.push(next);
  await writeJsonFile(path, kept);
  return true;
}

async function removeLocal<T extends { tombNo: string; contractNo: string }>(
  path: string,
  key: { tombNo: string; contractNo: string },
) {
  const rows = await readJsonFile<T[]>(path, []);
  if (rows.length === 0) return false;
  await writeJsonFile(
    path,
    rows.filter((row) => row.tombNo !== key.tombNo || row.contractNo !== key.contractNo),
  );
  return true;
}

export async function upsertSupervisorContract(
  previous: { tombNo: string; contractNo: string } | null,
  contract: ContractCopy,
  file: ContractFileCopy,
) {
  let mongo = false;
  if (mongoUriSet()) {
    const db = await requireDb();
    const contracts = db.collection("contracts");
    const filesCol = db.collection("contract_files");
    if (previous && (previous.tombNo !== contract.tombNo || previous.contractNo !== contract.contractNo)) {
      await contracts.deleteOne({ tombNo: previous.tombNo, contractNo: previous.contractNo });
      await filesCol.deleteOne({ tombNo: previous.tombNo, contractNo: previous.contractNo });
    }
    const existing = await contracts.findOne({ tombNo: contract.tombNo, contractNo: contract.contractNo });
    const lookup = contractLookupFields(file.inputs);
    const merged = {
      ...(existing ? (withoutMongoId<ContractCopy>([existing])[0] ?? {}) : {}),
      ...contract,
      ...(lookup.moveKind ? { moveKind: lookup.moveKind } : {}),
      ...(lookup.phoneDigits ? { phoneDigits: lookup.phoneDigits } : {}),
    };
    await contracts.replaceOne(
      { tombNo: contract.tombNo, contractNo: contract.contractNo },
      toMongoDocs([merged])[0],
      { upsert: true },
    );
    await filesCol.replaceOne(
      { tombNo: file.tombNo, contractNo: file.contractNo },
      toMongoDocs([file])[0],
      { upsert: true },
    );
    mongo = true;
  }
  let fileSaved = false;
  try {
    await upsertLocal(files.contracts, previous, contract);
    fileSaved = await upsertLocal(files.contractFiles, previous, file);
  } catch {
    if (!mongo) throw new Error("FILE_WRITE_FAILED");
  }
  if (!mongo && !fileSaved) throw new Error("FILE_WRITE_FAILED");
  return { mongo, file: fileSaved };
}

export async function deleteSupervisorContract(key: { tombNo: string; contractNo: string }) {
  let mongo = false;
  if (mongoUriSet()) {
    const db = await requireDb();
    await db.collection("contracts").deleteOne({ tombNo: key.tombNo, contractNo: key.contractNo });
    await db.collection("contract_files").deleteOne({ tombNo: key.tombNo, contractNo: key.contractNo });
    mongo = true;
  }
  let fileSaved = false;
  try {
    await removeLocal(files.contracts, key);
    fileSaved = await removeLocal(files.contractFiles, key);
  } catch {
    if (!mongo) throw new Error("FILE_WRITE_FAILED");
  }
  if (!mongo && !fileSaved) throw new Error("FILE_WRITE_FAILED");
  return { mongo, file: fileSaved };
}

export async function countWorkCollections() {
  if (!mongoUriSet()) return { configured: false as const, dbName: mongoDbName(), counts: null };
  const db = await requireDb();
  const counts: Record<string, number> = {};
  for (const name of WORK_COLLECTIONS) {
    counts[name] = await db.collection(name).countDocuments();
  }
  return { configured: true as const, dbName: mongoDbName(), counts };
}

export function summarizeFees(fees: FeeCopy[]) {
  const unpaidStatuses = new Set(["미납", "납부중", "보류"]);
  let paidCount = 0;
  let paidAmount = 0;
  let unpaidCount = 0;
  let unpaidAmount = 0;
  const paidKeys = new Set<string>();
  const unpaidKeys = new Set<string>();
  for (const row of fees) {
    const key = row.tombNo || row.ref || `${row.userName}-${row.billedOn}`;
    if (row.status === "완납" || (row.paidAmount > 0 && row.balance === 0 && row.status !== "미납")) {
      paidAmount += row.paidAmount;
      if (!paidKeys.has(key)) {
        paidKeys.add(key);
        paidCount += 1;
      }
    }
    if (unpaidStatuses.has(row.status) || row.balance > 0) {
      unpaidAmount += row.balance > 0 ? row.balance : Math.max(0, row.billedAmount - row.paidAmount);
      if (!unpaidKeys.has(key)) {
        unpaidKeys.add(key);
        unpaidCount += 1;
      }
    }
  }
  return { paidCount, paidAmount, unpaidCount, unpaidAmount };
}

const CONTRACT_PAGE = 30;
const MOV = "contractContract\uFF0Etp_mov";
const TEL = "contractContract\uFF0Etel_con";
const HP = "contractFamily\uFF0Eno_hp";
const HOME = "contractFamily\uFF0Eno_home";

let lookupReady: Promise<void> | null = null;

function escapeRegex(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function contains(value: string) {
  return { $regex: escapeRegex(value), $options: "i" };
}

function stable(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map((item) => stable(item)).join(",")}]`;
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([key]) => key !== "_id" && key !== "sourceHash" && key !== "sourceKey")
      .sort(([a], [b]) => a.localeCompare(b));
    return `{${entries.map(([key, item]) => `${JSON.stringify(key)}:${stable(item)}`).join(",")}}`;
  }
  return JSON.stringify(value ?? null);
}

function digestOf(rows: object[]) {
  const hash = createHash("sha1");
  for (const part of rows.map((row) => stable(row)).sort()) hash.update(part).update("\n");
  return hash.digest("hex");
}

function contractBody(row: {
  tombNo?: string;
  contractNo?: string;
  burialDate?: string;
  userName?: string;
  familyName?: string;
  pyeong?: string;
  address?: string;
}) {
  return {
    tombNo: row.tombNo ?? "",
    contractNo: row.contractNo ?? "",
    burialDate: row.burialDate ?? "",
    userName: row.userName ?? "",
    familyName: row.familyName ?? "",
    pyeong: row.pyeong ?? "",
    address: row.address ?? "",
  };
}

async function ensureContractIndexes(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  await Promise.all([
    db.collection("contracts").createIndex({ tombNo: 1, contractNo: 1 }).catch(() => undefined),
    db.collection("contracts").createIndex({ moveKind: 1 }).catch(() => undefined),
    db.collection("fees").createIndex({ tombNo: 1 }).catch(() => undefined),
    db.collection("receipts").createIndex({ tombNo: 1 }).catch(() => undefined),
    db.collection("contract_files").createIndex({ tombNo: 1, contractNo: 1 }).catch(() => undefined),
  ]);
}

async function backfillContractLookup(db: NonNullable<Awaited<ReturnType<typeof getDb>>>) {
  const missing = await db.collection("contracts").countDocuments({ moveKind: { $exists: false } });
  if (missing === 0) return;
  const cursor = db.collection("contract_files").find(
    {},
    { projection: { tombNo: 1, contractNo: 1, [`inputs.${MOV}`]: 1, [`inputs.${TEL}`]: 1, [`inputs.${HP}`]: 1, [`inputs.${HOME}`]: 1 } },
  );
  const ops: { updateOne: { filter: { tombNo: string; contractNo: string }; update: { $set: { moveKind: string; phoneDigits: string } } } }[] = [];
  const flush = async () => {
    if (!ops.length) return;
    await db.collection("contracts").bulkWrite(ops, { ordered: false });
    ops.length = 0;
  };
  for await (const doc of cursor) {
    const inputs = (doc.inputs ?? {}) as Record<string, string>;
    const moveKind = String(inputs[MOV] ?? "").trim();
    const phoneDigits = [inputs[TEL], inputs[HP], inputs[HOME]].join("").replace(/\D/g, "");
    const tombNo = String(doc.tombNo ?? "");
    const contractNo = String(doc.contractNo ?? "");
    if (!tombNo) continue;
    ops.push({ updateOne: { filter: { tombNo, contractNo }, update: { $set: { moveKind, phoneDigits } } } });
    if (ops.length >= 400) await flush();
  }
  await flush();
  await db.collection("contracts").updateMany({ moveKind: { $exists: false } }, { $set: { moveKind: "", phoneDigits: "" } });
}

export function ensureContractLookup() {
  if (!mongoUriSet()) return Promise.resolve();
  if (!lookupReady) {
    lookupReady = (async () => {
      const db = await getDb();
      if (!db) return;
      await ensureContractIndexes(db);
      await backfillContractLookup(db);
    })().catch((err) => {
      lookupReady = null;
      console.error("[work-store] contract lookup backfill failed");
      console.error(err);
    });
  }
  return lookupReady;
}

function kindMove(kind: ContractListKind) {
  if (kind === "contract") return "매장";
  if (kind === "move") return "이장";
  return "";
}

export async function searchSupervisorContracts(filters: ContractListFilters & { page: number }) {
  const pageSize = CONTRACT_PAGE;
  const phone = filters.phone.replace(/\D/g, "");
  const kind = kindMove(filters.kind);
  if (mongoUriSet()) {
    await ensureContractLookup();
    const db = await getDb();
    if (db) {
      const query: Record<string, unknown> = {};
      if (filters.tomb) query.tombNo = contains(filters.tomb);
      if (filters.user) query.userName = contains(filters.user);
      if (filters.family) query.familyName = contains(filters.family);
      if (phone) query.phoneDigits = contains(phone);
      if (kind) query.moveKind = kind;
      const col = db.collection("contracts");
      const [total, matched] = await Promise.all([
        col.countDocuments({}),
        col.countDocuments(query),
      ]);
      const pages = Math.max(1, Math.ceil(matched / pageSize));
      const page = Math.min(Math.max(1, filters.page), pages);
      const docs = await col
        .find(query, { projection: { tombNo: 1, contractNo: 1, burialDate: 1, userName: 1, familyName: 1, pyeong: 1, address: 1 } })
        .sort({ tombNo: 1, contractNo: 1 })
        .skip((page - 1) * pageSize)
        .limit(pageSize)
        .toArray();
      return { hits: withoutMongoId<ContractCopy>(docs), total, matched, page, pageSize };
    }
  }
  const rows = await readJsonFile<ContractCopy[]>(files.contracts, []);
  const needsFile = Boolean(phone || kind);
  const filesByKey = new Map<string, ContractFileCopy>();
  if (needsFile) {
    const stored = await readJsonFile<ContractFileCopy[]>(files.contractFiles, []);
    for (const file of stored) filesByKey.set(`${file.tombNo}\0${file.contractNo}`, file);
  }
  const matchedRows = rows.filter((row) => {
    if (filters.tomb && !row.tombNo.toLowerCase().includes(filters.tomb.toLowerCase())) return false;
    if (filters.user && !row.userName.toLowerCase().includes(filters.user.toLowerCase())) return false;
    if (filters.family && !row.familyName.toLowerCase().includes(filters.family.toLowerCase())) return false;
    const lookup = row.moveKind
      ? { moveKind: row.moveKind, phoneDigits: row.phoneDigits ?? "" }
      : contractLookupFields(filesByKey.get(`${row.tombNo}\0${row.contractNo}`)?.inputs);
    if (kind && lookup.moveKind !== kind) return false;
    if (phone && !(lookup.phoneDigits ?? "").includes(phone)) return false;
    return true;
  });
  const pages = Math.max(1, Math.ceil(matchedRows.length / pageSize));
  const page = Math.min(Math.max(1, filters.page), pages);
  const hits = matchedRows
    .slice()
    .sort((a, b) => a.tombNo.localeCompare(b.tombNo, "ko") || a.contractNo.localeCompare(b.contractNo, "ko"))
    .slice((page - 1) * pageSize, page * pageSize);
  return { hits, total: rows.length, matched: matchedRows.length, page, pageSize };
}

export async function listContractYearsFast(): Promise<number[]> {
  if (mongoUriSet()) {
    try {
      const db = await getDb();
      if (db) {
        const qYears = (await db.collection("contracts").distinct("_q.contractYear")).filter(
          (y): y is number => typeof y === "number" && y >= 1900 && y <= 2100,
        );
        if (qYears.length) return [...new Set(qYears)].sort((a, b) => b - a);
        const fromDates = await db
          .collection("contracts")
          .aggregate([
            { $project: { y: { $substrBytes: [{ $ifNull: ["$burialDate", ""] }, 0, 4] } } },
            { $match: { y: { $regex: "^\\d{4}$" } } },
            { $group: { _id: "$y" } },
          ])
          .toArray();
        const years = fromDates.map((doc) => Number(doc._id)).filter((n) => n >= 1900 && n <= 2100);
        if (years.length) return [...new Set(years)].sort((a, b) => b - a);
      }
    } catch {
      console.error("[work-store] contract years query failed");
    }
  }
  const dump = await readWorkDumpBySlice("contracts");
  const years = new Set<number>();
  for (const row of dump.contracts) {
    const y = Number(String(row.burialDate || "").replace(/\D/g, "").slice(0, 4));
    if (y >= 1900 && y <= 2100) years.add(y);
  }
  return [...years].sort((a, b) => b - a);
}

export async function listContractsForYear(year: number): Promise<ContractCopy[]> {
  if (mongoUriSet()) {
    try {
      const db = await getDb();
      if (db) {
        const docs = await db
          .collection("contracts")
          .find({
            $or: [{ "_q.contractYear": year }, { burialDate: { $regex: `^${year}` } }],
          })
          .project({ tombNo: 1, contractNo: 1, burialDate: 1, userName: 1, familyName: 1, pyeong: 1, address: 1 })
          .toArray();
        return withoutMongoId<ContractCopy>(docs);
      }
    } catch {
      console.error("[work-store] contracts-by-year query failed");
    }
  }
  const dump = await readWorkDumpBySlice("contracts");
  return dump.contracts.filter((row) => String(row.burialDate || "").startsWith(String(year)));
}

export async function countUndatedContracts(): Promise<number> {
  if (mongoUriSet()) {
    try {
      const db = await getDb();
      if (db) {
        return await db.collection("contracts").countDocuments({
          $and: [
            { $or: [{ "_q.contractYear": null }, { "_q.contractYear": { $exists: false } }] },
            { burialDate: { $not: { $regex: "^\\d{4}" } } },
          ],
        });
      }
    } catch {
      console.error("[work-store] undated contract count failed");
    }
  }
  const dump = await readWorkDumpBySlice("contracts");
  return dump.contracts.filter((row) => !/^\d{4}/.test(String(row.burialDate || ""))).length;
}

export async function readStoredReports(): Promise<ReportCopy[]> {
  if (mongoUriSet()) {
    const db = await getDb();
    if (db) {
      const docs = await db.collection("work_reports").find({}).toArray();
      if (docs.length) return withoutMongoId<ReportCopy>(docs);
    }
  }
  return readJsonFile<ReportCopy[]>(files.reports, []);
}

export async function readStoredCemetery(): Promise<CemeteryInfoCopy[]> {
  if (mongoUriSet()) {
    const db = await getDb();
    if (db) {
      const docs = await db.collection("cemetery_info").find({}).sort({ _id: 1 }).toArray();
      if (docs.length) return withoutMongoId<CemeteryInfoCopy>(docs);
    }
  }
  return readJsonFile<CemeteryInfoCopy[]>(files.cemetery, []);
}

export async function readBaseItems(kind: BaseItem["kind"]): Promise<BaseItem[]> {
  if (mongoUriSet()) {
    const db = await getDb();
    if (db) {
      const docs = await db.collection("base_items").find({ kind }).toArray();
      return withoutMongoId<BaseItem>(docs);
    }
  }
  const rows = await readJsonFile<BaseItem[]>(files.baseItems, []);
  return rows.filter((row) => row.kind === kind);
}

export async function saveReportDetails(rows: ReportCopy[]) {
  if (!mongoUriSet() || !rows.length) return 0;
  const db = await requireDb();
  const col = db.collection("work_reports");
  let saved = 0;
  for (const row of rows) {
    const encoded = toMongoDocs([row])[0] as ReportCopy;
    const result = await col.updateOne(
      { date: row.date },
      {
        $set: {
          attendance: row.attendance ?? "",
          reportDate: row.reportDate ?? "",
          reportNo: row.reportNo ?? "",
          tasks: encoded.tasks ?? [],
          plans: encoded.plans ?? [],
        },
      },
    );
    if (result.matchedCount) saved += 1;
  }
  return saved;
}

export async function saveBaseItems(rows: BaseItem[]) {
  if (!rows.length) return 0;
  if (mongoUriSet()) {
    const db = await requireDb();
    await replaceCollection(db, "base_items", rows);
    return rows.length;
  }
  await writeJsonFile(files.baseItems, rows);
  return rows.length;
}

export async function readStoredReceipts(): Promise<ReceiptCopy[]> {
  if (mongoUriSet()) {
    const db = await getDb();
    if (db) {
      const docs = await db.collection("receipts").find({}).toArray();
      if (docs.length) return withoutMongoId<ReceiptCopy>(docs);
    }
  }
  return readJsonFile<ReceiptCopy[]>(files.receipts, []);
}

export async function saveReceiptDetails(rows: ReceiptCopy[]) {
  if (!mongoUriSet() || !rows.length) return 0;
  const db = await requireDb();
  const col = db.collection("receipts");
  let saved = 0;
  for (const row of rows) {
    const encoded = toMongoDocs([row])[0] as { inputs?: Record<string, string> };
    const result = await col.updateOne(
      { serial: row.serial, date: row.date },
      { $set: { year: row.year ?? "", receiptNo: row.receiptNo ?? "", inputs: encoded.inputs ?? {} } },
    );
    if (result.matchedCount) saved += 1;
  }
  return saved;
}

export async function readContractBundle(tombNo: string, contractNo: string) {
  const contract = mongoUriSet()
    ? await (async () => {
        const db = await getDb();
        const doc = db ? await db.collection("contracts").findOne({ tombNo, contractNo }) : null;
        return doc ? (withoutMongoId<ContractCopy>([doc])[0] ?? null) : null;
      })()
    : (await readJsonFile<ContractCopy[]>(files.contracts, [])).find((row) => row.tombNo === tombNo && row.contractNo === contractNo) ?? null;
  const file = await readContractFile(tombNo, contractNo);
  const fees = await readRowsForTomb<FeeCopy>("fees", files.fees, tombNo);
  const receipts = await readRowsForTomb<ReceiptCopy>("receipts", files.receipts, tombNo);
  return { contract, file, fees, receipts };
}

async function readRowsForTomb<T>(collection: string, path: string, tombNo: string) {
  const plain = tombNo.replace(/\s/g, "");
  if (mongoUriSet()) {
    const db = await getDb();
    if (db) {
      const docs = await db
        .collection(collection)
        .find(plain === tombNo ? { tombNo } : { $or: [{ tombNo }, { tombNo: plain }] })
        .toArray();
      return withoutMongoId<T>(docs);
    }
  }
  const rows = await readJsonFile<Array<T & { tombNo?: string }>>(path, []);
  return rows.filter((row) => row.tombNo === tombNo || row.tombNo?.replace(/\s/g, "") === plain);
}

export async function readStoredWorkMeta() {
  if (mongoUriSet()) {
    const db = await getDb();
    const doc = db ? await db.collection("work_meta").findOne({ _id: "current" } as never) : null;
    return doc ? (withoutMongoId<WorkMeta>([doc])[0] ?? null) : null;
  }
  return readJsonFile<WorkMeta | null>(files.meta, null);
}

async function writeStoredWorkMeta(meta: WorkMeta) {
  if (mongoUriSet()) {
    const db = await requireDb();
    const body = toMongoDocs([meta])[0] as Record<string, unknown>;
    await db.collection("work_meta").replaceOne({ _id: "current" } as never, { _id: "current", ...body }, { upsert: true });
    return;
  }
  await writeJsonFile(files.meta, meta);
}

export async function upsertContractFiles(rows: ContractFileCopy[]) {
  if (!rows.length) return 0;
  if (mongoUriSet()) {
    const db = await requireDb();
    const filesCol = db.collection("contract_files");
    const contracts = db.collection("contracts");
    for (let i = 0; i < rows.length; i += 200) {
      const chunk = rows.slice(i, i + 200);
      await filesCol.bulkWrite(
        chunk.map((file) => ({
          replaceOne: {
            filter: { tombNo: file.tombNo, contractNo: file.contractNo },
            replacement: toMongoDocs([file])[0],
            upsert: true,
          },
        })),
        { ordered: false },
      );
      const updates = chunk.flatMap((file) => {
        const lookup = contractLookupFields(file.inputs);
        const $set = {
          ...(lookup.moveKind ? { moveKind: lookup.moveKind } : {}),
          ...(lookup.phoneDigits ? { phoneDigits: lookup.phoneDigits } : {}),
        };
        if (!Object.keys($set).length) return [];
        return [{ updateOne: { filter: { tombNo: file.tombNo, contractNo: file.contractNo }, update: { $set } } }];
      });
      if (updates.length) await contracts.bulkWrite(updates, { ordered: false });
    }
    return rows.length;
  }
  const stored = await readJsonFile<ContractFileCopy[]>(files.contractFiles, []);
  if (stored.length === 0) return 0;
  const next = new Map(stored.map((row) => [`${row.tombNo}\0${row.contractNo}`, row]));
  for (const row of rows) next.set(`${row.tombNo}\0${row.contractNo}`, row);
  await writeJsonFile(files.contractFiles, [...next.values()]);
  return rows.length;
}

export type SourceDiffInput = {
  contracts: ContractCopy[];
  fees: FeeCopy[];
  receipts: ReceiptCopy[];
  reports: ReportCopy[];
  cemetery: CemeteryInfoCopy[];
  listedContractTotal: number;
  sourceHost: string;
};

export async function applyNightlySourceDiff(input: SourceDiffInput) {
  const meta = (await readStoredWorkMeta()) ?? {
    syncedAt: "",
    sourceHost: input.sourceHost,
    contractCount: 0,
    listedContractTotal: 0,
    feeCount: 0,
    receiptCount: 0,
    reportCount: 0,
    cemeteryCount: 0,
    message: "",
  };
  const feeDigest = input.fees.length ? digestOf(input.fees) : meta.feeDigest;
  const receiptDigest = input.receipts.length ? digestOf(input.receipts) : meta.receiptDigest;
  const reportDigest = input.reports.length ? digestOf(input.reports) : meta.reportDigest;
  const cemeteryDigest = input.cemetery.length ? digestOf(input.cemetery) : meta.cemeteryDigest;
  let feeCount = 0;
  let receiptCount = 0;
  let reportCount = 0;
  let cemeteryCount = 0;
  if (mongoUriSet()) {
    const db = await requireDb();
    if (input.fees.length && feeDigest !== meta.feeDigest) {
      await replaceCollection(db, "fees", input.fees);
      feeCount = input.fees.length;
    }
    if (input.receipts.length && receiptDigest !== meta.receiptDigest) {
      await replaceCollection(db, "receipts", input.receipts);
      receiptCount = input.receipts.length;
    }
    if (input.reports.length && reportDigest !== meta.reportDigest) {
      await replaceCollection(db, "work_reports", input.reports);
      reportCount = input.reports.length;
    }
    if (input.cemetery.length && cemeteryDigest !== meta.cemeteryDigest) {
      await replaceCollection(db, "cemetery_info", input.cemetery);
      cemeteryCount = input.cemetery.length;
    }
    await ensureContractIndexes(db);
  }
  const contractDiff = input.contracts.length ? await diffContractList(input.contracts) : { changed: 0, refresh: [] as { tombNo: string; contractNo: string }[] };
  const nextMeta: WorkMeta = {
    ...meta,
    syncedAt: new Date().toISOString(),
    sourceHost: input.sourceHost,
    contractCount: input.contracts.length || meta.contractCount,
    listedContractTotal: input.listedContractTotal || meta.listedContractTotal,
    feeCount: input.fees.length || meta.feeCount,
    receiptCount: input.receipts.length || meta.receiptCount,
    reportCount: input.reports.length || meta.reportCount,
    cemeteryCount: input.cemetery.length || meta.cemeteryCount,
    feeDigest,
    receiptDigest,
    reportDigest,
    cemeteryDigest,
    message: `새벽 맞춤: 계약 ${contractDiff.changed}건, 계약서 ${contractDiff.refresh.length}건, 관리비 ${feeCount ? input.fees.length : 0}건, 영수증 ${receiptCount ? input.receipts.length : 0}건을 갱신했습니다.`,
  };
  await writeStoredWorkMeta(nextMeta);
  return { ...contractDiff, feeCount, receiptCount, reportCount, cemeteryCount, message: nextMeta.message };
}

async function diffContractList(rows: ContractCopy[]) {
  const refresh: { tombNo: string; contractNo: string }[] = [];
  let changed = 0;
  if (!mongoUriSet()) {
    const stored = await readJsonFile<ContractCopy[]>(files.contracts, []);
    const byKey = new Map(stored.map((row) => [`${row.tombNo}\0${row.contractNo}`, row]));
    let dirty = false;
    for (const row of rows) {
      const key = `${row.tombNo}\0${row.contractNo}`;
      const prev = byKey.get(key);
      const body = contractBody(row);
      const nextHash = createHash("sha1").update(stable(body)).digest("hex");
      if (!prev || stable(contractBody(prev)) !== stable(body)) {
        byKey.set(key, { ...(prev ?? {}), ...body });
        refresh.push({ tombNo: body.tombNo, contractNo: body.contractNo });
        changed += 1;
        dirty = true;
      } else if ((prev as ContractCopy & { sourceHash?: string }).sourceHash !== nextHash) {
        byKey.set(key, { ...prev, sourceHash: nextHash } as ContractCopy);
        dirty = true;
      }
    }
    if (dirty && stored.length > 0) await writeJsonFile(files.contracts, [...byKey.values()]);
    return { changed, refresh };
  }
  const db = await requireDb();
  const col = db.collection("contracts");
  const filesCol = db.collection("contract_files");
  const [existing, fileDocs] = await Promise.all([
    col
      .find({}, { projection: { tombNo: 1, contractNo: 1, burialDate: 1, userName: 1, familyName: 1, pyeong: 1, address: 1, sourceHash: 1 } })
      .toArray(),
    filesCol.find({}, { projection: { tombNo: 1, contractNo: 1 } }).toArray(),
  ]);
  const byKey = new Map(existing.map((doc) => [`${doc.tombNo ?? ""}\0${doc.contractNo ?? ""}`, doc]));
  const fileKeys = new Set(fileDocs.map((doc) => `${doc.tombNo ?? ""}\0${doc.contractNo ?? ""}`));
  const ops: object[] = [];
  for (const row of rows) {
    const body = contractBody(row);
    const key = `${body.tombNo}\0${body.contractNo}`;
    const nextHash = createHash("sha1").update(stable(body)).digest("hex");
    const prev = byKey.get(key) as { sourceHash?: string; tombNo?: string; contractNo?: string; burialDate?: string; userName?: string; familyName?: string; pyeong?: string; address?: string } | undefined;
    const bodySame = Boolean(prev) && stable(contractBody(prev ?? {})) === stable(body);
    if (!prev) {
      ops.push({ insertOne: { document: { ...body, sourceHash: nextHash, sourceKey: key } } });
      refresh.push({ tombNo: body.tombNo, contractNo: body.contractNo });
      changed += 1;
      continue;
    }
    if (!bodySame) {
      ops.push({
        updateOne: {
          filter: { tombNo: body.tombNo, contractNo: body.contractNo },
          update: { $set: { ...body, sourceHash: nextHash, sourceKey: key } },
        },
      });
      refresh.push({ tombNo: body.tombNo, contractNo: body.contractNo });
      changed += 1;
      continue;
    }
    if (prev.sourceHash !== nextHash) {
      ops.push({
        updateOne: {
          filter: { tombNo: body.tombNo, contractNo: body.contractNo },
          update: { $set: { sourceHash: nextHash, sourceKey: key } },
        },
      });
    }
    if (!fileKeys.has(key)) refresh.push({ tombNo: body.tombNo, contractNo: body.contractNo });
  }
  for (let i = 0; i < ops.length; i += 400) {
    const chunk = ops.slice(i, i + 400);
    if (chunk.length) await col.bulkWrite(chunk as never, { ordered: false });
  }
  return { changed, refresh };
}

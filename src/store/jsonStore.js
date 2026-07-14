import { readFile, writeFile, rename, mkdir } from 'node:fs/promises';
import { dirname } from 'node:path';

/**
 * Minimal file-backed key/value store with atomic writes.
 *
 * Kept deliberately generic and behind a small interface so it can be swapped
 * for SQLite/Redis later without changing callers. Writes go to a temp file
 * then rename() over the target, so a crash mid-write can't corrupt the data.
 */
export class JsonStore {
  #path;
  #data;
  #writing = Promise.resolve();

  constructor(path) {
    this.#path = path;
    this.#data = {};
  }

  async load() {
    try {
      const raw = await readFile(this.#path, 'utf8');
      this.#data = JSON.parse(raw);
    } catch (err) {
      if (err.code === 'ENOENT') {
        this.#data = {};
      } else {
        throw err;
      }
    }
    return this;
  }

  get(key) {
    return this.#data[key];
  }

  all() {
    return { ...this.#data };
  }

  values() {
    return Object.values(this.#data);
  }

  async set(key, value) {
    this.#data[key] = value;
    await this.#persist();
  }

  async delete(key) {
    if (!(key in this.#data)) return;
    delete this.#data[key];
    await this.#persist();
  }

  // Serialize writes so concurrent set/delete calls can't interleave.
  #persist() {
    this.#writing = this.#writing.then(() => this.#writeToDisk());
    return this.#writing;
  }

  async #writeToDisk() {
    await mkdir(dirname(this.#path), { recursive: true });
    const tmp = `${this.#path}.tmp`;
    await writeFile(tmp, JSON.stringify(this.#data, null, 2), 'utf8');
    await rename(tmp, this.#path);
  }
}

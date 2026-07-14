import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';
import { JsonStore } from './jsonStore.js';

const __dirname = dirname(fileURLToPath(import.meta.url));
const DATA_PATH = join(__dirname, '..', '..', 'data', 'pending-members.json');

/**
 * Tracks members who joined but haven't yet received the New Wegos role.
 * Persisted so pending grants survive a bot restart.
 *
 * Record shape, keyed by `${guildId}:${userId}`:
 *   { guildId, userId, joinedAt (epoch ms), grantAt (epoch ms) }
 */
class PendingMembersStore {
  #store = new JsonStore(DATA_PATH);

  async init() {
    await this.#store.load();
    return this;
  }

  static key(guildId, userId) {
    return `${guildId}:${userId}`;
  }

  async add({ guildId, userId, joinedAt, grantAt }) {
    await this.#store.set(PendingMembersStore.key(guildId, userId), {
      guildId,
      userId,
      joinedAt,
      grantAt,
    });
  }

  async remove(guildId, userId) {
    await this.#store.delete(PendingMembersStore.key(guildId, userId));
  }

  has(guildId, userId) {
    return this.#store.get(PendingMembersStore.key(guildId, userId)) !== undefined;
  }

  /** All pending members whose grant time is at or before `now`. */
  due(now) {
    return this.#store.values().filter((record) => record.grantAt <= now);
  }

  all() {
    return this.#store.values();
  }
}

export const pendingMembers = new PendingMembersStore();

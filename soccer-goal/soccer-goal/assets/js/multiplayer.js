import { BACKEND_CONFIG, hasMultiplayerBackend } from "./config/backend.js";
import { getSupabaseClient } from "./auth.js";

const CODE_CHARS = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function getClientId() {
  const key = "sg_client_id";
  let id = localStorage.getItem(key);
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem(key, id);
  }
  return id;
}

function randomPartyCode() {
  return Array.from({ length: 3 }, () => CODE_CHARS[Math.floor(Math.random() * CODE_CHARS.length)]).join("");
}

export class MultiplayerSession {
  constructor(onRemoteUpdate) {
    this.onRemoteUpdate = onRemoteUpdate;
    this.clientId = getClientId();
    this.supabase = null;
    this.channel = null;
    this.roomId = null;
    this.roomCode = null;
    this.slot = null;
    this.mode = null;
    this.userId = null;
    this.playerNames = ["?", "?"];
    this.active = false;
    this.isHost = false;
    this._pushing = false;
    this._queueChannel = null;
  }

  async init(userId) {
    if (!hasMultiplayerBackend()) return false;
    this.userId = userId;
    this.supabase = await getSupabaseClient();
    return Boolean(this.supabase);
  }

  async createParty(alias) {
    if (!this.supabase || !this.userId) throw new Error("Nicht angemeldet");

    let code = randomPartyCode();
    for (let i = 0; i < 8; i++) {
      const { data: existing } = await this.supabase
        .from(BACKEND_CONFIG.roomsTable)
        .select("id")
        .eq("room_code", code)
        .maybeSingle();
      if (!existing) break;
      code = randomPartyCode();
    }

    const row = {
      room_code: code,
      mode: "party",
      player1_id: this.userId,
      player1_name: alias,
      player1_client: this.clientId,
      host_slot: 0,
      status: "waiting",
      game_state: {},
      log_lines: [],
    };

    const { data, error } = await this.supabase
      .from(BACKEND_CONFIG.roomsTable)
      .insert(row)
      .select()
      .single();

    if (error) throw error;
    await this.attachRoom(data, 0);
    return code;
  }

  async joinParty(code, alias) {
    if (!this.supabase || !this.userId) throw new Error("Nicht angemeldet");

    const partyCode = code.trim().toUpperCase();
    if (partyCode.length !== 3) throw new Error("Party-Code muss genau 3 Zeichen haben.");

    const { data, error } = await this.supabase
      .from(BACKEND_CONFIG.roomsTable)
      .select("*")
      .eq("room_code", partyCode)
      .eq("mode", "party")
      .maybeSingle();

    if (error) throw error;
    if (!data) throw new Error("Party nicht gefunden.");
    if (data.status === "playing") throw new Error("Partie läuft bereits.");
    if (data.player1_id === this.userId) throw new Error("Das ist deine eigene Party.");
    if (data.player2_id && data.player2_id !== this.userId) throw new Error("Party ist voll.");

    const update = {
      player2_id: this.userId,
      player2_name: alias,
      player2_client: this.clientId,
      status: "ready",
      updated_at: new Date().toISOString(),
    };

    const { data: updated, error: upErr } = await this.supabase
      .from(BACKEND_CONFIG.roomsTable)
      .update(update)
      .eq("id", data.id)
      .select()
      .single();

    if (upErr) throw upErr;
    await this.attachRoom(updated, 1);
    return updated;
  }

  async findRandomMatch(alias) {
    if (!this.supabase || !this.userId) throw new Error("Nicht angemeldet");

    await this.leaveQueue();

    await this.supabase.from(BACKEND_CONFIG.queueTable).insert({
      user_id: this.userId,
      alias,
      client_id: this.clientId,
    });

    const { data: waiting } = await this.supabase
      .from(BACKEND_CONFIG.queueTable)
      .select("*")
      .neq("user_id", this.userId)
      .order("created_at", { ascending: true })
      .limit(1);

    if (!waiting?.length) {
      await this.watchQueue();
      return { status: "waiting" };
    }

    const opponent = waiting[0];
    const iCreate = this.userId < opponent.user_id;

    if (iCreate) {
      await this.supabase.from(BACKEND_CONFIG.queueTable).delete().eq("user_id", this.userId);
      await this.supabase.from(BACKEND_CONFIG.queueTable).delete().eq("user_id", opponent.user_id);

      const hostSlot = Math.random() < 0.5 ? 0 : 1;
      const row = {
        room_code: null,
        mode: "random",
        player1_id: hostSlot === 0 ? this.userId : opponent.user_id,
        player2_id: hostSlot === 0 ? opponent.user_id : this.userId,
        player1_name: hostSlot === 0 ? alias : opponent.alias,
        player2_name: hostSlot === 0 ? opponent.alias : alias,
        player1_client: hostSlot === 0 ? this.clientId : opponent.client_id,
        player2_client: hostSlot === 0 ? opponent.client_id : this.clientId,
        host_slot: hostSlot,
        status: "ready",
        game_state: {},
        log_lines: [],
      };

      const { data, error } = await this.supabase
        .from(BACKEND_CONFIG.roomsTable)
        .insert(row)
        .select()
        .single();

      if (error) throw error;
      const slot = data.player1_id === this.userId ? 0 : 1;
      await this.attachRoom(data, slot);
      return { status: "matched", room: data };
    }

    await this.watchQueue();
    return { status: "waiting" };
  }

  async watchQueue() {
    if (this._queueChannel) return;

    this._queueChannel = this.supabase
      .channel(`queue-${this.userId}`)
      .on(
        "postgres_changes",
        { event: "INSERT", schema: "public", table: BACKEND_CONFIG.roomsTable },
        async (payload) => {
          const room = payload.new;
          if (!room || room.mode !== "random") return;
          if (room.player1_id !== this.userId && room.player2_id !== this.userId) return;
          if (this.active) return;

          const slot = room.player1_id === this.userId ? 0 : 1;
          await this.leaveQueue();
          await this.attachRoom(room, slot);
          this.onRemoteUpdate({ ...room, _autoStart: true });
        }
      )
      .subscribe();
  }

  async leaveQueue() {
    if (this._queueChannel && this.supabase) {
      await this.supabase.removeChannel(this._queueChannel);
      this._queueChannel = null;
    }
    if (this.supabase && this.userId) {
      await this.supabase.from(BACKEND_CONFIG.queueTable).delete().eq("user_id", this.userId);
    }
  }

  async attachRoom(row, slot) {
    this.roomId = row.id;
    this.roomCode = row.room_code;
    this.slot = slot;
    this.mode = row.mode;
    this.isHost = slot === row.host_slot;
    this.playerNames = [row.player1_name || "?", row.player2_name || "?"];
    this.active = true;

    if (this.channel) await this.supabase.removeChannel(this.channel);

    this.channel = this.supabase
      .channel(`soccer-room-${row.id}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: BACKEND_CONFIG.roomsTable, filter: `id=eq.${row.id}` },
        (payload) => {
          if (this._pushing) return;
          const remote = payload.new;
          if (!remote) return;
          this.playerNames = [remote.player1_name || "?", remote.player2_name || "?"];
          this.onRemoteUpdate(remote);
        }
      )
      .subscribe();
  }

  async push(gameState, logLines, status = "playing") {
    if (!this.active || !this.roomId || this._pushing) return;
    this._pushing = true;
    try {
      await this.supabase
        .from(BACKEND_CONFIG.roomsTable)
        .update({
          game_state: gameState,
          log_lines: logLines,
          status,
          updated_at: new Date().toISOString(),
        })
        .eq("id", this.roomId);
    } finally {
      this._pushing = false;
    }
  }

  canAct(gameState) {
    if (!this.active || this.slot === null) return true;
    const defender = gameState.attacker === 0 ? 1 : 0;
    if (["defense", "defense_shot", "keeper"].includes(gameState.phase)) {
      return this.slot === defender;
    }
    return this.slot === gameState.attacker;
  }

  myName() {
    return this.playerNames[this.slot] || "?";
  }

  opponentName() {
    return this.playerNames[this.slot === 0 ? 1 : 0] || "?";
  }

  async leave() {
    this.active = false;
    await this.leaveQueue();
    if (this.channel && this.supabase) await this.supabase.removeChannel(this.channel);
    this.channel = null;
    this.roomId = null;
    this.roomCode = null;
    this.slot = null;
    this.mode = null;
  }
}

export { hasMultiplayerBackend };

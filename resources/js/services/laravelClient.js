/**
 * Laravel MySQL Backend Client Adapter for SIMONITA FASILKOM.
 * Replaces direct Supabase PostgREST, RPC, and Storage client calls with
 * stateless Laravel JSON endpoints (`/api/simta/*`) suited for Rumahweb shared hosting.
 */

const buildQueryHeaders = (isJson = true) => {
  const headers = {
    Accept: 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
  };
  if (isJson) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
};

class LaravelQueryBuilder {
  constructor(tableName) {
    this._table = tableName;
    this._action = 'select';
    this._columns = '*';
    this._filters = [];
    this._order = [];
    this._limit = null;
    this._single = false;
    this._maybeSingle = false;
    this._payload = null;
    this._onConflict = null;
    this._returning = null;
    this._executionPromise = null;
  }

  select(columns = '*') {
    if (this._action === 'insert' || this._action === 'update' || this._action === 'upsert') {
      this._returning = true;
      this._columns = typeof columns === 'string' && columns.trim() ? columns : '*';
    } else {
      this._action = 'select';
      this._columns = typeof columns === 'string' && columns.trim() ? columns : '*';
    }
    return this;
  }

  insert(payload) {
    this._action = 'insert';
    this._payload = payload;
    return this;
  }

  update(payload) {
    this._action = 'update';
    this._payload = payload;
    return this;
  }

  upsert(payload, options = {}) {
    this._action = 'upsert';
    this._payload = payload;
    this._onConflict = options?.onConflict || null;
    return this;
  }

  delete() {
    this._action = 'delete';
    return this;
  }

  eq(column, value) {
    this._filters.push({ type: 'eq', column, value });
    return this;
  }

  in(column, values) {
    this._filters.push({ type: 'in', column, value: Array.isArray(values) ? values : [] });
    return this;
  }

  or(expression) {
    if (expression) {
      this._filters.push({ type: 'or', expression: String(expression) });
    }
    return this;
  }

  order(column, options = {}) {
    if (column) {
      this._order.push({
        column,
        ascending: options?.ascending !== false,
      });
    }
    return this;
  }

  limit(count) {
    const parsed = Number(count);
    if (Number.isFinite(parsed) && parsed > 0) {
      this._limit = Math.floor(parsed);
    }
    return this;
  }

  single() {
    this._single = true;
    this._maybeSingle = false;
    if (this._returning === null && this._action !== 'select') {
      this._returning = true;
    }
    return this;
  }

  maybeSingle() {
    this._maybeSingle = true;
    this._single = false;
    if (this._returning === null && this._action !== 'select') {
      this._returning = true;
    }
    return this;
  }

  async _execute() {
    if (typeof window === 'undefined' && typeof fetch !== 'function') {
      return { data: null, error: { message: 'Fetch API tidak tersedia.' } };
    }

    const body = {
      table: this._table,
      action: this._action,
      columns: this._columns,
      filters: this._filters,
      order: this._order,
      limit: this._limit,
      single: this._single,
      maybeSingle: this._maybeSingle,
      payload: this._payload,
      onConflict: this._onConflict,
      returning: this._returning !== null ? this._returning : this._action === 'select',
    };

    try {
      const response = await fetch('/api/simta/query', {
        method: 'POST',
        headers: buildQueryHeaders(true),
        credentials: 'same-origin',
        body: JSON.stringify(body),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: json?.error || { message: json?.message || `HTTP ${response.status}` },
        };
      }

      if (json && typeof json === 'object' && ('data' in json || 'error' in json)) {
        return {
          data: json.data ?? null,
          error: json.error ?? null,
        };
      }

      return { data: json, error: null };
    } catch (err) {
      return {
        data: null,
        error: { message: err?.message || 'Koneksi ke server Laravel gagal.' },
      };
    }
  }

  then(onFulfilled, onRejected) {
    if (!this._executionPromise) {
      this._executionPromise = this._execute();
    }
    return this._executionPromise.then(onFulfilled, onRejected);
  }

  catch(onRejected) {
    return this.then(undefined, onRejected);
  }
}

export const laravelClient = {
  from(tableName) {
    return new LaravelQueryBuilder(tableName);
  },

  async rpc(functionName, params = {}) {
    try {
      const response = await fetch(`/api/simta/rpc/${encodeURIComponent(functionName)}`, {
        method: 'POST',
        headers: buildQueryHeaders(true),
        credentials: 'same-origin',
        body: JSON.stringify(params || {}),
      });

      const json = await response.json().catch(() => null);

      if (!response.ok) {
        return {
          data: null,
          error: json?.error || { message: json?.message || `HTTP ${response.status}` },
        };
      }

      return {
        data: json?.data ?? null,
        error: json?.error ?? null,
      };
    } catch (err) {
      return {
        data: null,
        error: { message: err?.message || 'Gagal menghubungi endpoint RPC Laravel.' },
      };
    }
  },

  storage: {
    from(bucketName) {
      return {
        async upload(filePath, file) {
          try {
            const formData = new FormData();
            formData.append('bucket', bucketName);
            formData.append('path', String(filePath || '').replace(/^\/+/, ''));
            formData.append('file', file);

            const response = await fetch('/api/simta/storage/upload', {
              method: 'POST',
              headers: buildQueryHeaders(false),
              credentials: 'same-origin',
              body: formData,
            });

            const json = await response.json().catch(() => null);
            if (!response.ok || json?.error) {
              return {
                data: null,
                error: json?.error || { message: json?.message || `Upload gagal (HTTP ${response.status})` },
              };
            }

            return { data: json?.data ?? null, error: null };
          } catch (err) {
            return {
              data: null,
              error: { message: err?.message || 'Gagal mengunggah berkas ke server.' },
            };
          }
        },

        getPublicUrl(filePath) {
          const cleanPath = String(filePath || '')
            .replace(/^\/+/, '')
            .split('/')
            .filter(Boolean)
            .map((segment) => encodeURIComponent(segment))
            .join('/');
          return {
            data: {
              publicUrl: `/api/simta/storage/${encodeURIComponent(bucketName)}/${cleanPath}`,
            },
          };
        },
      };
    },
  },

  // Compatibility stubs so legacy channel/auth calls never throw if invoked unexpectedly.
  channel() {
    const noopChannel = {
      on() {
        return noopChannel;
      },
      subscribe(cb) {
        if (typeof cb === 'function') cb('CLOSED');
        return noopChannel;
      },
      async send() {
        return 'ok';
      },
    };
    return noopChannel;
  },

  getChannels() {
    return [];
  },

  removeChannel() {
    return Promise.resolve('ok');
  },

  auth: {
    async getSession() {
      return { data: { session: null }, error: null };
    },
    onAuthStateChange() {
      return { data: { subscription: { unsubscribe: () => {} } } };
    },
    async signInWithPassword() {
      return { data: { user: null, session: null }, error: null };
    },
    async signUp() {
      return { data: { user: null, session: null }, error: null };
    },
    async signOut() {
      return { error: null };
    },
    async updateUser() {
      return { data: { user: null }, error: null };
    },
  },
};

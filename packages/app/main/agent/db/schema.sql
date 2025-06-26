CREATE TABLE embeddings (
  id TEXT PRIMARY KEY,
  path TEXT NOT NULL,
  chunk TEXT NOT NULL,
  vector BLOB NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_embeddings_path ON embeddings(path);
CREATE INDEX idx_embeddings_created_at ON embeddings(created_at); 
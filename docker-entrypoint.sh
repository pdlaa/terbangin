#!/bin/sh
set -e

echo "============================================"
echo "  Terbangin — Docker Entrypoint"
echo "============================================"

# ============================================
# 1. Validasi environment variables wajib
# ============================================
if [ -z "$DATABASE_URL" ]; then
  echo "[ERROR] DATABASE_URL is not set" >&2
  exit 1
fi

# Print environment info (tanpa value sensitif)
echo "[INFO] NODE_ENV: $NODE_ENV"
echo "[INFO] DATABASE_URL: ${DATABASE_URL%%@*}@****:****@${DATABASE_URL##*@}"
echo "[INFO] APP_URL: ${NEXT_PUBLIC_APP_URL:-http://localhost}"

# ============================================
# 2. Push database schema (migrations)
# ============================================
echo "[DB] Menjalankan prisma db push..."
npx prisma db push --skip-generate 2>&1 || {
  echo "[WARN] db push gagal, mencoba tanpa --skip-generate..."
  npx prisma db push 2>&1 || {
    echo "[ERROR] Gagal menjalankan prisma db push" >&2
    exit 1
  }
}
echo "[DB] ✅ Database schema berhasil di-sync"

# ============================================
# 3. Generate Prisma client
# ============================================
echo "[DB] Generate Prisma client..."
npx prisma generate 2>&1
echo "[DB] ✅ Prisma client generated"

# ============================================
# 4. Run seed jika SKIP_SEED tidak di-set
# ============================================
if [ "$SKIP_SEED" != "true" ]; then
  echo "[SEED] Menjalankan seed data..."
  npx prisma db seed 2>&1 || echo "[SEED] ⚠️ Seed gagal atau sudah ada data — melanjutkan..."
else
  echo "[SEED] ⏭️ SKIP_SEED=true, melewati seed"
fi

# ============================================
# 5. Jalankan aplikasi
# ============================================
echo "============================================"
echo "  ✅ Semua persiapan selesai"
echo "  🚀 Menjalankan Next.js di port ${PORT:-3000}..."
echo "============================================"

exec "$@"
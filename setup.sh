#!/bin/bash
set -e

# ============================================================
#  setup.sh — автоустановка AI Generator на Ubuntu 22.04
#  Репозиторий: https://github.com/dimatolpygin/site_neiro
# ============================================================

RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

info()    { echo -e "${BLUE}[INFO]${NC} $1"; }
success() { echo -e "${GREEN}[OK]${NC} $1"; }
warn()    { echo -e "${YELLOW}[WARN]${NC} $1"; }
error()   { echo -e "${RED}[ERROR]${NC} $1"; exit 1; }

REPO_URL="https://github.com/dimatolpygin/site_neiro.git"
APP_DIR="/var/www/app"
NGINX_CONF="/etc/nginx/sites-available/app"

# ------------------------------------------------------------
# 0. Проверка прав
# ------------------------------------------------------------
if [ "$EUID" -ne 0 ]; then
  error "Запустите скрипт от root: sudo bash setup.sh"
fi

echo ""
echo "============================================================"
echo "  AI Generator — автоустановка"
echo "============================================================"
echo ""

# ------------------------------------------------------------
# 1. Обновление системы
# ------------------------------------------------------------
info "Обновление системы..."
apt-get update -qq
apt-get upgrade -y -qq
apt-get install -y -qq curl git nginx certbot python3-certbot-nginx ufw
success "Система обновлена"

# ------------------------------------------------------------
# 2. Node.js 20
# ------------------------------------------------------------
if ! command -v node &>/dev/null || [[ "$(node -v)" != v20* ]]; then
  info "Установка Node.js 20..."
  curl -fsSL https://deb.nodesource.com/setup_20.x | bash - &>/dev/null
  apt-get install -y -qq nodejs
  success "Node.js $(node -v) установлен"
else
  success "Node.js $(node -v) уже установлен"
fi

# ------------------------------------------------------------
# 3. PM2
# ------------------------------------------------------------
if ! command -v pm2 &>/dev/null; then
  info "Установка PM2..."
  npm install -g pm2 --quiet
  success "PM2 установлен"
else
  success "PM2 уже установлен"
fi

# ------------------------------------------------------------
# 4. Клонирование репозитория
# ------------------------------------------------------------
if [ -d "$APP_DIR/.git" ]; then
  info "Репозиторий уже существует в $APP_DIR, выполняем git pull..."
  cd "$APP_DIR"
  git pull origin master
else
  info "Клонирование репозитория в $APP_DIR..."
  mkdir -p /var/www
  git clone --branch master "$REPO_URL" "$APP_DIR"
  success "Репозиторий клонирован"
fi

cd "$APP_DIR"

# ------------------------------------------------------------
# 5. Интерактивный ввод .env переменных
# ------------------------------------------------------------
echo ""
echo "============================================================"
echo "  Настройка переменных окружения (.env.local)"
echo "  Все значения можно найти в вашем аккаунте Supabase/Redis"
echo "============================================================"
echo ""

read_var() {
  local prompt="$1"
  local var_name="$2"
  local default="$3"
  local value=""

  while [ -z "$value" ]; do
    if [ -n "$default" ]; then
      printf '  %s [%s]: ' "$prompt" "$default" > /dev/tty
      read -r value < /dev/tty || true
      value="${value:-$default}"
    else
      printf '  %s: ' "$prompt" > /dev/tty
      read -r value < /dev/tty || true
    fi
    if [ -z "$value" ]; then
      warn "Значение не может быть пустым"
    fi
  done

  # printf -v безопасен для значений со спецсимволами (@, $, !, ', пробелы)
  printf -v "$var_name" '%s' "$value"
}

read_var "NEXT_PUBLIC_SUPABASE_URL (напр. https://xxx.supabase.co)" SUPABASE_URL
read_var "NEXT_PUBLIC_SUPABASE_ANON_KEY" SUPABASE_ANON_KEY
read_var "SUPABASE_SERVICE_ROLE_KEY" SUPABASE_SERVICE_ROLE_KEY
read_var "REDIS_URL (напр. redis://default:password@host:port)" REDIS_URL
read_var "YOOKASSA_SHOP_ID" YOOKASSA_SHOP_ID
read_var "YOOKASSA_SECRET_KEY" YOOKASSA_SECRET_KEY

SERVER_IP=$(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')
read_var "NEXT_PUBLIC_APP_URL (напр. https://ваш-домен.ru или http://$SERVER_IP)" APP_URL "http://$SERVER_IP"
read_var "YOOKASSA_RETURN_URL (напр. ${APP_URL}/billing/success)" YOOKASSA_RETURN_URL "${APP_URL}/billing/success"
read_var "WAVESPEED_API_KEY" WAVESPEED_API_KEY

info "Создание файла .env.local..."
# Используем printf '%s\n' чтобы значения записывались буквально,
# без интерпретации $ и других спецсимволов bash
{
  printf 'NEXT_PUBLIC_SUPABASE_URL=%s\n'    "$SUPABASE_URL"
  printf 'NEXT_PUBLIC_SUPABASE_ANON_KEY=%s\n' "$SUPABASE_ANON_KEY"
  printf 'SUPABASE_SERVICE_ROLE_KEY=%s\n'   "$SUPABASE_SERVICE_ROLE_KEY"
  printf 'REDIS_URL=%s\n'                   "$REDIS_URL"
  printf 'YOOKASSA_SHOP_ID=%s\n'            "$YOOKASSA_SHOP_ID"
  printf 'YOOKASSA_SECRET_KEY=%s\n'         "$YOOKASSA_SECRET_KEY"
  printf 'YOOKASSA_RETURN_URL=%s\n'         "$YOOKASSA_RETURN_URL"
  printf 'WAVESPEED_API_KEY=%s\n'           "$WAVESPEED_API_KEY"
  printf 'NEXT_PUBLIC_APP_URL=%s\n'         "$APP_URL"
} > "$APP_DIR/.env.local"
chmod 600 "$APP_DIR/.env.local"
success ".env.local создан"

# ------------------------------------------------------------
# 6. Установка зависимостей и сборка
# ------------------------------------------------------------
info "Установка npm-зависимостей..."
cd "$APP_DIR"
npm ci --quiet

info "Сборка Next.js (может занять 2-5 минут)..."
npm run build
success "Сборка завершена"

# ------------------------------------------------------------
# 7. PM2 ecosystem.config.js
# ------------------------------------------------------------
info "Создание ecosystem.config.js..."
cat > "$APP_DIR/ecosystem.config.js" <<'ECOSYS'
module.exports = {
  apps: [
    {
      name: 'next-app',
      script: 'node_modules/.bin/next',
      args: 'start',
      cwd: '/var/www/app',
      env_file: '/var/www/app/.env.local',
      max_memory_restart: '512M',
    },
    {
      name: 'worker',
      script: 'node_modules/.bin/tsx',
      args: 'worker/index.ts',
      cwd: '/var/www/app',
      env_file: '/var/www/app/.env.local',
      max_memory_restart: '256M',
    },
  ],
}
ECOSYS
success "ecosystem.config.js создан"

# ------------------------------------------------------------
# 8. Запуск через PM2
# ------------------------------------------------------------
info "Запуск приложения через PM2..."
pm2 delete all 2>/dev/null || true
pm2 start "$APP_DIR/ecosystem.config.js"
pm2 startup systemd -u root --hp /root | tail -1 | bash
pm2 save
success "PM2 запущен и добавлен в автозапуск"

# ------------------------------------------------------------
# 9. Nginx
# ------------------------------------------------------------
info "Настройка Nginx..."
cat > "$NGINX_CONF" <<NGINXCONF
server {
    listen 80;
    server_name _;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade \$http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host \$host;
        proxy_set_header X-Real-IP \$remote_addr;
        proxy_set_header X-Forwarded-For \$proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto \$scheme;
        proxy_cache_bypass \$http_upgrade;
        proxy_read_timeout 60s;
    }
}
NGINXCONF

ln -sf "$NGINX_CONF" /etc/nginx/sites-enabled/app
rm -f /etc/nginx/sites-enabled/default
nginx -t
systemctl reload nginx
systemctl enable nginx
success "Nginx настроен"

# ------------------------------------------------------------
# 10. Firewall
# ------------------------------------------------------------
info "Настройка UFW..."
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
success "Firewall настроен"

# ------------------------------------------------------------
# 11. deploy.sh
# ------------------------------------------------------------
info "Создание deploy.sh..."
cat > "$APP_DIR/deploy.sh" <<'DEPLOY'
#!/bin/bash
set -e

APP_DIR="/var/www/app"
cd "$APP_DIR"

echo "[deploy] git pull..."
git pull origin master

echo "[deploy] npm ci..."
npm ci --quiet

echo "[deploy] npm run build..."
npm run build

echo "[deploy] pm2 restart..."
pm2 restart all

echo "[deploy] Done!"
DEPLOY
chmod +x "$APP_DIR/deploy.sh"
success "deploy.sh создан"

# ------------------------------------------------------------
# 12. SSH-ключ для GitHub Actions (подключение к серверу)
# ------------------------------------------------------------
if [ ! -f /root/.ssh/id_ed25519 ]; then
  info "Генерация SSH-ключа для GitHub Actions..."
  mkdir -p /root/.ssh
  ssh-keygen -t ed25519 -C "github-actions@$(hostname)" -f /root/.ssh/id_ed25519 -N ""
fi

# Добавляем публичный ключ в authorized_keys чтобы GitHub Actions мог зайти на сервер
if ! grep -qF "$(cat /root/.ssh/id_ed25519.pub)" /root/.ssh/authorized_keys 2>/dev/null; then
  cat /root/.ssh/id_ed25519.pub >> /root/.ssh/authorized_keys
  chmod 600 /root/.ssh/authorized_keys
  success "Публичный ключ добавлен в authorized_keys"
fi

# ------------------------------------------------------------
# 13. Опциональный SSL через certbot
# ------------------------------------------------------------
echo ""
printf '  Есть домен для SSL? Введите домен (или нажмите Enter чтобы пропустить): ' > /dev/tty
read -r DOMAIN < /dev/tty || true
if [ -n "$DOMAIN" ]; then
  info "Получение SSL-сертификата для $DOMAIN..."
  sed -i "s/server_name _;/server_name $DOMAIN;/" "$NGINX_CONF"
  nginx -t && systemctl reload nginx
  certbot --nginx -d "$DOMAIN" --non-interactive --agree-tos --email "admin@$DOMAIN" || \
    warn "certbot не смог получить сертификат. Проверьте что домен указывает на этот IP."
fi

# ------------------------------------------------------------
# Итог
# ------------------------------------------------------------
echo ""
echo "============================================================"
echo -e "${GREEN}  Установка завершена!${NC}"
echo "============================================================"
echo ""
echo "  Сайт доступен по адресу: http://$SERVER_IP"
[ -n "$DOMAIN" ] && echo "  Домен: https://$DOMAIN"
echo ""
echo "  Статус процессов:"
pm2 list
echo ""
echo "------------------------------------------------------------"
echo "  НАСТРОЙКА АВТОДЕПЛОЯ (GitHub Actions):"
echo "------------------------------------------------------------"
echo "  Добавьте в GitHub → Settings → Secrets три переменные:"
echo ""
echo "  SERVER_HOST  = $(curl -s ifconfig.me 2>/dev/null || hostname -I | awk '{print $1}')"
echo "  SERVER_USER  = root"
echo "  SERVER_SSH_KEY = (содержимое приватного ключа ниже)"
echo ""
echo "  Приватный ключ (скопируйте целиком включая BEGIN/END строки):"
echo "------------------------------------------------------------"
cat /root/.ssh/id_ed25519
echo "------------------------------------------------------------"
echo ""
echo "  Репозиторий публичный — Deploy Key в GitHub НЕ нужен."
echo "------------------------------------------------------------"
echo "  Полезные команды:"
echo "    pm2 logs next-app   — логи приложения"
echo "    pm2 logs worker     — логи воркера"
echo "    pm2 restart all     — перезапустить всё"
echo "    bash /var/www/app/deploy.sh  — ручной деплой"
echo "============================================================"

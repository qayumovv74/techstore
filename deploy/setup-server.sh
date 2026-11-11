#!/usr/bin/env bash
# Первичная настройка VPS под TechStore (Ubuntu 22.04 / 24.04). Запускать один раз, от root:
#
#   scp deploy/setup-server.sh root@IP:~ && ssh root@IP "bash setup-server.sh мой-домен.ru"
#
# Что делает:
#   1. обновления системы и автоустановка обновлений безопасности
#   2. swap 2 ГБ — на тарифе с 2 ГБ памяти PostgreSQL и Next.js иначе тесно
#   3. Docker
#   4. пользователь deploy с вашим SSH-ключом; вход root и вход по паролю выключаются
#   5. firewall: открыты только 22 (SSH), 80 и 443 (сайт)
#   6. fail2ban: IP, который подбирает пароль к SSH, банится на час
#   7. проект в /home/deploy/techstore и .env.production со сгенерированными ключами —
#      ключи создаются здесь, на сервере, и больше нигде не хранятся
#   8. отдельный SSH-ключ для автодеплоя из GitHub Actions
set -euo pipefail

DOMAIN="${1:?Укажите домен: bash setup-server.sh мой-домен.ru}"
REPO="${REPO:-https://github.com/qayumovv74/techstore.git}"
APP_DIR=/home/deploy/techstore

if [ "$(id -u)" -ne 0 ]; then echo "Запустите от root"; exit 1; fi
# без ключа в authorized_keys после выключения паролей на сервер будет не войти
if [ ! -s /root/.ssh/authorized_keys ]; then
  echo "У root нет SSH-ключа (/root/.ssh/authorized_keys). Добавьте публичный ключ в панели хостинга и запустите снова."
  exit 1
fi

echo "== 1. Обновления"
export DEBIAN_FRONTEND=noninteractive
apt-get update -q
apt-get -yq upgrade
apt-get install -yq ca-certificates curl git ufw fail2ban unattended-upgrades openssl
dpkg-reconfigure -f noninteractive unattended-upgrades

echo "== 2. Swap"
if ! swapon --show | grep -q /swapfile; then
  fallocate -l 2G /swapfile && chmod 600 /swapfile && mkswap /swapfile && swapon /swapfile
  echo '/swapfile none swap sw 0 0' >> /etc/fstab
fi

echo "== 3. Docker"
command -v docker >/dev/null || curl -fsSL https://get.docker.com | sh

echo "== 4. Пользователь deploy и SSH"
id deploy >/dev/null 2>&1 || adduser --disabled-password --gecos "" deploy
usermod -aG docker deploy
install -d -m 700 -o deploy -g deploy /home/deploy/.ssh
install -m 600 -o deploy -g deploy /root/.ssh/authorized_keys /home/deploy/.ssh/authorized_keys
cat > /etc/ssh/sshd_config.d/99-techstore.conf <<'SSHD'
PermitRootLogin no
PasswordAuthentication no
KbdInteractiveAuthentication no
PubkeyAuthentication yes
MaxAuthTries 3
LoginGraceTime 30
AllowUsers deploy
SSHD
sshd -t
systemctl reload ssh 2>/dev/null || systemctl reload sshd

echo "== 5. Firewall"
ufw default deny incoming
ufw default allow outgoing
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable

echo "== 6. fail2ban"
cat > /etc/fail2ban/jail.d/sshd.local <<'F2B'
[sshd]
enabled = true
maxretry = 5
findtime = 10m
bantime = 1h
F2B
systemctl enable --now fail2ban
systemctl restart fail2ban

echo "== 7. Проект и ключи"
[ -d "$APP_DIR/.git" ] || sudo -u deploy git clone "$REPO" "$APP_DIR"
cd "$APP_DIR"
if [ ! -f .env.production ]; then
  cp .env.production.example .env.production
  set_env() { sed -i "s|^$1=.*|$1=$2|" .env.production; }
  set_env DOMAIN "$DOMAIN"
  set_env APP_URL "https://$DOMAIN"
  set_env POSTGRES_PASSWORD "$(openssl rand -hex 24)"
  set_env APP_DB_PASSWORD "$(openssl rand -hex 24)"
  set_env SESSION_SECRET "$(openssl rand -hex 32)"
  set_env PASSWORD_PEPPER "$(openssl rand -hex 48)"
  set_env PAYMENT_WEBHOOK_SECRET "$(openssl rand -hex 32)"
  set_env CRON_SECRET "$(openssl rand -hex 32)"
  chown deploy:deploy .env.production
  chmod 600 .env.production
fi

echo "== 8. Ключ для автодеплоя"
if [ ! -f /home/deploy/.ssh/github_deploy ]; then
  sudo -u deploy ssh-keygen -q -t ed25519 -N "" -C "github-actions-deploy" -f /home/deploy/.ssh/github_deploy
  cat /home/deploy/.ssh/github_deploy.pub >> /home/deploy/.ssh/authorized_keys
fi

cat <<DONE

Готово. Дальше:
  1. Заполните почту (SMTP_*) и, если нужно, Google в $APP_DIR/.env.production:
       sudo -u deploy nano $APP_DIR/.env.production
  2. Запустите сайт:
       cd $APP_DIR && sudo -u deploy docker compose -f docker-compose.prod.yml --env-file .env.production up -d --build
  3. Заведите админа и задайте пароль по ссылке:
       sudo -u deploy docker compose -f docker-compose.prod.yml exec app node scripts/staff.mjs create admin@$DOMAIN ADMIN
  4. Автодеплой: в GitHub → Settings → Secrets and variables → Actions добавьте
       VPS_HOST = IP этого сервера, VPS_USER = deploy,
       VPS_SSH_KEY = содержимое файла ниже (целиком, вместе с BEGIN/END),
     и переменные DEPLOY_ENABLED = true, DEPLOY_URL = https://$DOMAIN
       sudo cat /home/deploy/.ssh/github_deploy
  С этого момента входить на сервер: ssh deploy@IP (root и пароли выключены).
DONE

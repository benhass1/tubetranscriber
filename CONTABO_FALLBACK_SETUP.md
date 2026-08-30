# TubeTranscriber — secours Contabo

## Architecture

Render reste le backend principal. Le navigateur tente ensuite son extraction de secours. Après deux clics sur « Try again » et si les deux premiers chemins échouent, Render appelle la procédure `transcript.localFallback`, qui relaie la requête vers le VPS Contabo. Le secret partagé reste uniquement dans les variables d’environnement de Render et de Contabo.

## 1. Préparer le VPS

Utiliser un serveur Ubuntu récent et se connecter avec une clé SSH, jamais avec un mot de passe transmis dans le chat.

```bash
ssh root@VPS_IP
apt update && apt -y upgrade
apt install -y ca-certificates curl git ufw
curl -fsSL https://get.docker.com | sh
systemctl enable --now docker
ufw allow OpenSSH
ufw allow 80/tcp
ufw allow 443/tcp
ufw --force enable
```

## 2. Copier le projet

Sur le VPS :

```bash
git clone https://github.com/benhass1/tubetranscriber /opt/tubetranscriber
cd /opt/tubetranscriber
```

Copier dans ce dossier les fichiers modifiés de cette version, ou pousser un commit dédié avant le déploiement. Ne jamais copier `.env` vers GitHub.

## 3. Configurer les secrets

Créer `/opt/tubetranscriber/.env.contabo` avec des valeurs réelles uniquement sur le VPS :

```dotenv
LOCAL_FALLBACK_SHARED_SECRET=GENERATE_A_LONG_RANDOM_SECRET
PORT=3000
NODE_ENV=production
WARP_ENABLED=false
WARP_REQUIRED=false
PO_TOKEN_ENABLED=false
```

Le même secret doit être ajouté dans Render comme `LOCAL_FALLBACK_SHARED_SECRET`. Ajouter également l’URL HTTPS publique du tunnel ou du reverse proxy comme `LOCAL_FALLBACK_URL`, par exemple `https://fallback.tubetranscriber.com`.

```bash
chmod 600 /opt/tubetranscriber/.env.contabo
```

## 4. Démarrer le conteneur

```bash
docker compose -f docker-compose.contabo.yml up -d --build
docker compose -f docker-compose.contabo.yml ps
docker compose -f docker-compose.contabo.yml logs --tail=80
```

Le service écoute uniquement sur `127.0.0.1:3000`. Ne pas publier directement le port 3000 sur Internet.

## 5. HTTPS

Utiliser Cloudflare Tunnel ou Caddy avec un certificat HTTPS. Le hostname public doit transmettre uniquement vers `http://127.0.0.1:3000`. Le relais exige l’en-tête `x-local-fallback-token`, et toute requête sans cet en-tête doit retourner HTTP 401.

## 6. Validation

Tester depuis le VPS :

```bash
curl -i http://127.0.0.1:3000/
curl -i -X POST 'http://127.0.0.1:3000/api/trpc/transcript.lookup?batch=1' \
  -H 'Content-Type: application/json' \
  --data '{"0":{"json":{"url":"https://www.youtube.com/watch?v=dQw4w9WgXcQ"}}}'
```

Le second appel doit retourner HTTP 401 sans secret. Tester ensuite avec l’en-tête secret depuis un terminal local sécurisé. Ne pas afficher le secret dans les logs.

## Important

Ne pas modifier l’URL principale de Render avant plusieurs tests réussis. Le VPS n’est pas un failover si Docker est arrêté, si le PC administrateur est hors ligne, ou si le tunnel HTTPS est indisponible. Le service doit être surveillé et redémarré automatiquement par Docker Compose.

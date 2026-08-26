# Cloudflare Worker proxy — guide de déploiement TubeTranscriber

Ce guide configure le Worker `tubetranscriber-transcript-proxy` déjà présent dans ce dossier. Le Worker ne doit accepter que les requêtes HTTPS vers YouTube et doit utiliser un secret séparé pour empêcher son utilisation publique.

## Option recommandée : connexion interactive Wrangler

Cette option évite de créer ou de partager un token API. Depuis le dossier `cloudflare-worker`, lancez :

```bash
npx wrangler login
npx wrangler deploy
```

Le navigateur Cloudflare s’ouvre. Connectez-vous manuellement au compte qui possède `tubetranscriber.com`, puis autorisez Wrangler. Cette méthode convient à un déploiement ponctuel.

## Option avec token API limité

Utilisez cette méthode pour une exécution non interactive ou si le déploiement doit être fait avec un token limité.

### 1. Ouvrir la page de création

Dans Cloudflare, ouvrez **My Profile → API Tokens → Create Token**. Pour un token de compte, ouvrez **Manage Account → API Tokens → Create Token**.

### 2. Choisir une permission Worker

Sélectionnez le modèle officiel **Edit Cloudflare Workers**. Si vous choisissez **Custom**, ajoutez uniquement la permission de compte nécessaire au déploiement des scripts Workers, puis limitez la ressource au compte Cloudflare qui contient TubeTranscriber. Ne sélectionnez pas les permissions DNS, Billing, User, Access, ou API Tokens.

### 3. Limiter et expirer le token

Nommez-le `TubeTranscriber Worker Deploy`, ajoutez une date d’expiration courte et, si possible, limitez l’adresse IP cliente. Vérifiez le résumé, créez le token, puis copiez-le immédiatement : Cloudflare ne l’affiche qu’une seule fois.

Ne partagez jamais le token, votre mot de passe, votre Global API Key ou votre adresse e-mail avec une capture d’écran. Le token doit rester dans une variable d’environnement locale ou dans un gestionnaire de secrets.

### 4. Déployer avec Wrangler

Récupérez l’Account ID dans le tableau de bord Cloudflare ou dans l’URL du compte. Depuis ce dossier, utilisez une saisie masquée pour le token :

```bash
cd cloudflare-worker
read -s CLOUDFLARE_API_TOKEN
export CLOUDFLARE_API_TOKEN
export CLOUDFLARE_ACCOUNT_ID="VOTRE_ACCOUNT_ID"
npx wrangler deploy
```

La commande doit afficher l’URL `workers.dev` du Worker. Le token API est utilisé uniquement par Wrangler et n’est pas ajouté au dépôt.

### 5. Vérifier le token avant le déploiement si nécessaire

```bash
curl "https://api.cloudflare.com/client/v4/user/tokens/verify" \
  --header "Authorization: Bearer $CLOUDFLARE_API_TOKEN"
```

Le résultat attendu contient `"status": "active"`.

## 6. Créer le secret du Worker

Générez une valeur aléatoire longue :

```bash
openssl rand -hex 32
```

Copiez la valeur affichée, puis lancez :

```bash
npx wrangler secret put WORKER_AUTH_TOKEN
```

Collez la valeur lorsque Wrangler la demande. Ce secret est stocké chiffré par Cloudflare et ne doit pas être placé dans `worker.js`, `wrangler.toml`, GitHub ou une URL.

## 7. Configurer Render

Dans le service Render de TubeTranscriber, ouvrez **Environment** et ajoutez :

```text
CF_WORKER_PROXY=https://NOM_DU_WORKER.VOTRE_COMPTE.workers.dev
CF_WORKER_AUTH_TOKEN=LA_MEME_VALEUR_QUE_WORKER_AUTH_TOKEN
```

Conservez les variables WARP existantes si elles sont encore nécessaires. Déclenchez ensuite un nouveau déploiement Render.

Le code TubeTranscriber utilise le Worker pour les requêtes de page YouTube, d’InnerTube et de pistes de captions lorsque `CF_WORKER_PROXY` est défini. Si cette variable est absente, il revient au chemin direct/WARP existant.

## 8. Vérification fonctionnelle

Sans le header secret, le Worker doit répondre `401`. Une URL cible non autorisée doit répondre `403`. Une fois les variables Render configurées, testez une vidéo publique qui expose des captions. Une réponse YouTube `429` doit rester visible comme erreur amont ; le Worker ne peut pas garantir que YouTube supprimera ses limites de débit.

## 9. Révoquer le token de déploiement

Après le déploiement, révoquez le token API temporaire depuis **My Profile → API Tokens** ou **Manage Account → API Tokens**. Le Worker et son secret continueront de fonctionner, car le token Wrangler n’est pas utilisé lors des requêtes de production.

## Références officielles

1. [Cloudflare — Create API token](https://developers.cloudflare.com/fundamentals/api/get-started/create-token/)
2. [Cloudflare — API token permissions](https://developers.cloudflare.com/fundamentals/api/reference/permissions/)
3. [Cloudflare — GitHub Actions and Workers authentication](https://developers.cloudflare.com/workers/ci-cd/external-cicd/github-actions/)

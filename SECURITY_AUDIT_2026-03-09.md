# Rapport d'Audit de Sécurité - 09 Mars 2026

## 🛡️ Synthèse du Diagnostic

### 1. État du Service
L'application rencontre actuellement des erreurs **500 Internal Server Error** sur les appels à l'API de news.
- **Cause racine :** L'API Perplexity renvoie une erreur **401 Unauthorized**.
- **Signification :** La clé API configurée dans le fichier `.env` est invalide. Elle a probablement été révoquée ou le compte ne dispose plus de crédits suffisants (certaines API renvoient 401 au lieu de 402/429 dans ce cas).

### 2. Analyse de la Consommation des Crédits
L'audit de la base de données de production (`infomap.db`) et des logs du serveur révèle :
- **Volume total de requêtes réussies :** Seulement **29 appels** depuis le déploiement (22 janvier 2026).
- **Consommation financière :** Sur le modèle `sonar-pro`, cela représente environ **0,45 $**.
- **Conclusion :** L'épuisement de vos crédits **ne provient pas** de l'utilisation normale de l'application InfoMap. La consommation a eu lieu via un autre projet utilisant la même clé ou suite à une fuite de clé en dehors de cet environnement.

---

## 🔍 Vulnérabilités Identifiées

| Risque | Description | Impact | Statut |
|:---|:---|:---|:---|
| **Fausse Positivité Nginx** | Le serveur renvoie `200 OK` (contenu `index.html`) pour toute requête vers un fichier inexistant (ex: `/.env`). | Attire les scanners de vulnérabilités et masque les erreurs 404 réelles. | ⚠️ À corriger |
| **Race Condition Quota** | L'incrémentation du quota journalier se fait *après* l'appel API réussi. | Possibilité de dépasser légèrement la limite via des requêtes simultanées. | ℹ️ Faible |
| **Absence de Cache Global** | Chaque utilisateur déclenche un nouvel appel API pour un même pays, même si la donnée est récente. | Consommation inutile de crédits API. | ⚠️ À optimiser |

---

## 📋 Recommandations et Plan d'Action

### Actions Immédiates (Action Utilisateur)
1. **Renouvellement de la clé :** Révoquer la clé `PERPLEXITY_API_KEY` actuelle sur le dashboard Perplexity.
2. **Génération d'une nouvelle clé :** Créer une nouvelle clé et mettre à jour le fichier `.env`.
3. **Investigation :** Consulter l'historique d'utilisation détaillé sur le compte Perplexity pour identifier la source réelle de la consommation des crédits.

### Améliorations Techniques (Proposées)
1. **Correction Nginx :** Modifier `nginx/default.conf` et `frontend/nginx.conf` pour bloquer explicitement l'accès aux fichiers sensibles et renvoyer de vraies erreurs 404.
2. **Implémentation d'un Cache Global :** Stocker les résultats de l'IA dans une table de cache partagée (avec expiration de 4h) pour que tous les utilisateurs profitent d'un appel déjà effectué.
3. **Sécurisation du Quota :** Passer à un système d'incrémentation "optimiste" (vérifier et réserver le quota *avant* l'appel API).

---
*Rapport généré par Gemini CLI suite à l'audit du 09/03/2026.*

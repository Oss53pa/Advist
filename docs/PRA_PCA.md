# Plan de Reprise d'Activite (PRA) et Plan de Continuite d'Activite (PCA)

## ADVIST - Document de Reference

**Version:** 1.0
**Date:** 10/01/2026
**Classification:** Confidentiel

---

## Table des Matieres

1. [Introduction](#1-introduction)
2. [Objectifs RPO/RTO](#2-objectifs-rporto)
3. [Architecture de Haute Disponibilite](#3-architecture-de-haute-disponibilite)
4. [Procedures de Sauvegarde](#4-procedures-de-sauvegarde)
5. [Procedures de Restauration](#5-procedures-de-restauration)
6. [Plan de Continuite d'Activite](#6-plan-de-continuite-dactivite)
7. [Plan de Reprise d'Activite](#7-plan-de-reprise-dactivite)
8. [Communication de Crise](#8-communication-de-crise)
9. [Tests et Validation](#9-tests-et-validation)
10. [Contacts d'Urgence](#10-contacts-durgence)

---

## 1. Introduction

Ce document definit les procedures de continuite et de reprise d'activite pour la plateforme ADVIST. Il couvre les scenarios de pannes, les procedures de basculement, et les objectifs de disponibilite.

### 1.1 Perimetre

- Application web ADVIST (frontend React)
- API Backend (Django REST Framework)
- Base de donnees PostgreSQL
- Cache Redis
- Workers Celery
- Stockage S3/MinIO

### 1.2 Classification des Incidents

| Niveau | Description | Exemples |
|--------|-------------|----------|
| P1 - Critique | Service completement indisponible | Panne base de donnees, API down |
| P2 - Majeur | Fonctionnalites majeures degradees | Signatures indisponibles, webhooks en echec |
| P3 - Mineur | Impact limite | Lenteurs, erreurs isolees |
| P4 - Faible | Aucun impact utilisateur | Alertes monitoring, logs d'erreur |

---

## 2. Objectifs RPO/RTO

### 2.1 Definitions

- **RPO (Recovery Point Objective)**: Perte de donnees maximale acceptable
- **RTO (Recovery Time Objective)**: Temps maximal d'indisponibilite acceptable

### 2.2 Objectifs par Service

| Service | RPO | RTO | Criticite |
|---------|-----|-----|-----------|
| Base de donnees | 1 heure | 4 heures | Critique |
| Application API | N/A | 15 minutes | Critique |
| Frontend | N/A | 5 minutes | Haute |
| Cache Redis | N/A | 5 minutes | Moyenne |
| Stockage S3 | 24 heures | 1 heure | Haute |
| Workers Celery | N/A | 30 minutes | Moyenne |

---

## 3. Architecture de Haute Disponibilite

### 3.1 Configuration Multi-Zone

```
                    ┌─────────────────┐
                    │   Load Balancer │
                    │   (HAProxy/ALB) │
                    └────────┬────────┘
                             │
              ┌──────────────┴──────────────┐
              │                             │
       ┌──────▼──────┐              ┌──────▼──────┐
       │   Zone A    │              │   Zone B    │
       │  (Primary)  │              │  (Standby)  │
       └──────┬──────┘              └──────┬──────┘
              │                             │
       ┌──────▼──────┐              ┌──────▼──────┐
       │  Frontend   │              │  Frontend   │
       │   (nginx)   │              │   (nginx)   │
       └──────┬──────┘              └──────┬──────┘
              │                             │
       ┌──────▼──────┐              ┌──────▼──────┐
       │   Backend   │              │   Backend   │
       │  (Django)   │              │  (Django)   │
       └──────┬──────┘              └──────┬──────┘
              │                             │
       ┌──────▼──────┐              ┌──────▼──────┐
       │  PostgreSQL │◄────────────►│  PostgreSQL │
       │   Primary   │  Streaming   │   Replica   │
       └─────────────┘  Replication └─────────────┘
```

### 3.2 Composants

#### 3.2.1 Load Balancer
- Health checks toutes les 10 secondes
- Failover automatique < 30 secondes
- SSL termination

#### 3.2.2 Application Servers
- Minimum 2 instances par zone
- Auto-scaling base sur CPU/memoire
- Deploiement Blue/Green

#### 3.2.3 Base de Donnees
- PostgreSQL 16 avec streaming replication
- Failover automatique via Patroni
- Replicas en lecture seule

#### 3.2.4 Cache
- Redis Cluster avec sentinelles
- Failover automatique

---

## 4. Procedures de Sauvegarde

### 4.1 Sauvegardes Base de Donnees

#### 4.1.1 Sauvegarde Complete (Daily)
```bash
# Execution: 02:00 UTC quotidiennement
pg_dump -h db -U advist -d advist -F c -f /backup/advist_$(date +%Y%m%d_%H%M%S).dump

# Retention: 30 jours
find /backup -name "*.dump" -mtime +30 -delete
```

#### 4.1.2 WAL Archiving (Continuous)
```bash
# Configuration postgresql.conf
archive_mode = on
archive_command = 'aws s3 cp %p s3://advist-backup/wal/%f'
```

#### 4.1.3 Verification des Sauvegardes
```bash
# Execution hebdomadaire
pg_restore --list /backup/latest.dump > /dev/null
echo "Backup verification: $?"
```

### 4.2 Sauvegardes Fichiers

#### 4.2.1 Documents S3
- Replication cross-region activee
- Versioning S3 active
- Lifecycle policy: 90 jours -> Glacier

#### 4.2.2 Configuration Application
- Git repository: `git@github.com:advist/advist.git`
- Secrets: AWS Secrets Manager / HashiCorp Vault
- Infrastructure: Terraform state dans S3

---

## 5. Procedures de Restauration

### 5.1 Restauration Base de Donnees

#### 5.1.1 Restauration Complete
```bash
# 1. Arreter l'application
docker-compose stop backend celery-worker celery-beat

# 2. Restaurer la base
pg_restore -h db -U advist -d advist -c /backup/advist_YYYYMMDD.dump

# 3. Redemarrer l'application
docker-compose start backend celery-worker celery-beat

# 4. Verifier l'integrite
python manage.py check
python manage.py dbshell -c "SELECT COUNT(*) FROM documents_document;"
```

#### 5.1.2 Point-in-Time Recovery
```bash
# 1. Arreter PostgreSQL
pg_ctl stop -D /var/lib/postgresql/data

# 2. Restaurer base + WAL jusqu'a un point precis
recovery_target_time = '2026-01-10 14:30:00 UTC'

# 3. Redemarrer PostgreSQL
pg_ctl start -D /var/lib/postgresql/data
```

### 5.2 Restauration Application

```bash
# 1. Deployer depuis le tag Git
git checkout v1.0.0

# 2. Reconstruire les images
docker-compose -f docker-compose.prod.yml build

# 3. Deployer
docker-compose -f docker-compose.prod.yml up -d

# 4. Appliquer les migrations
docker-compose exec backend python manage.py migrate

# 5. Verifier
docker-compose exec backend python manage.py check
```

---

## 6. Plan de Continuite d'Activite (PCA)

### 6.1 Scenarios Couverts

| Scenario | Impact | Procedure |
|----------|--------|-----------|
| Panne serveur unique | Faible | Failover automatique |
| Panne zone complete | Moyen | Basculement zone B |
| Panne provider cloud | Eleve | Migration cloud secondaire |
| Attaque DDoS | Moyen | Activation CDN/WAF |
| Corruption donnees | Eleve | Restauration backup |

### 6.2 Mode Degrade

En cas de degradation partielle, prioriser:

1. **Critique**: Authentification, acces documents existants
2. **Haute**: Workflows en cours, signatures
3. **Moyenne**: Nouveaux documents, notifications
4. **Basse**: Analytics, rapports, marketing

### 6.3 Procedures de Basculement

#### 6.3.1 Basculement Base de Donnees
```bash
# Via Patroni
patronictl failover --candidate db-replica

# Verification
patronictl list
```

#### 6.3.2 Basculement Application
```bash
# Modifier le load balancer
aws elb modify-target-group --target-group-arn $ARN --health-check-path /health

# Drainer les connexions zone A
kubectl drain node-zone-a --ignore-daemonsets

# Activer zone B
kubectl uncordon node-zone-b
```

---

## 7. Plan de Reprise d'Activite (PRA)

### 7.1 Declenchement du PRA

Le PRA est declenche si:
- Indisponibilite > 30 minutes (P1)
- Perte de donnees detectee
- Compromission de securite confirmee

### 7.2 Etapes de Reprise

#### Phase 1: Evaluation (0-15 min)
1. Identifier la cause
2. Evaluer l'impact
3. Notifier l'equipe d'astreinte
4. Decider du niveau de reponse

#### Phase 2: Containment (15-60 min)
1. Isoler les systemes affectes
2. Preserver les logs et evidences
3. Activer le mode degrade si possible

#### Phase 3: Restauration (1-4 heures)
1. Restaurer depuis les backups
2. Verifier l'integrite des donnees
3. Tester les fonctionnalites critiques
4. Revalider la securite

#### Phase 4: Retour a la Normale (4-24 heures)
1. Reactiver tous les services
2. Monitorer intensivement
3. Communiquer aux utilisateurs
4. Documenter l'incident

### 7.3 Checklist PRA

- [ ] Backups verifies et accessibles
- [ ] Credentials disponibles (Vault/Secrets Manager)
- [ ] Acces infrastructure confirme
- [ ] Equipe technique disponible
- [ ] Communication prete (email, status page)
- [ ] Client notifie si necessaire
- [ ] Logs preserves pour analyse

---

## 8. Communication de Crise

### 8.1 Canaux de Communication

| Audience | Canal | Responsable |
|----------|-------|-------------|
| Equipe technique | Slack #incident | On-call |
| Direction | Email + Telephone | CTO |
| Clients | Status page + Email | Support |
| Partenaires | Email direct | Account Manager |

### 8.2 Templates de Communication

#### 8.2.1 Incident Detecte
```
[ADVIST] Incident en cours - [TYPE]

Nous avons detecte un incident affectant [SERVICE].
Impact: [DESCRIPTION]
Statut: Investigation en cours
Prochaine mise a jour: [HEURE]
```

#### 8.2.2 Incident Resolu
```
[ADVIST] Incident resolu - [TYPE]

L'incident affectant [SERVICE] est maintenant resolu.
Duree: [DUREE]
Cause: [CAUSE]
Actions: [ACTIONS PRISES]
Mesures preventives: [MESURES]
```

### 8.3 Status Page

URL: https://status.advist.io

Niveaux:
- Operationnel (vert)
- Performance degradee (jaune)
- Panne partielle (orange)
- Panne majeure (rouge)

---

## 9. Tests et Validation

### 9.1 Calendrier des Tests

| Test | Frequence | Responsable |
|------|-----------|-------------|
| Restauration backup | Mensuel | DBA |
| Failover base de donnees | Trimestriel | DevOps |
| Basculement zone | Semestriel | SRE |
| PRA complet | Annuel | CTO |

### 9.2 Procedure de Test

#### 9.2.1 Test de Restauration
```bash
# 1. Creer environnement de test
docker-compose -f docker-compose.test.yml up -d

# 2. Restaurer le dernier backup
pg_restore -h test-db -U advist -d advist /backup/latest.dump

# 3. Verifier les donnees
python manage.py check
python manage.py test --tag=smoke

# 4. Documenter les resultats
echo "Test restauration: SUCCESS" >> /var/log/pra-tests.log
```

#### 9.2.2 Rapport de Test
Chaque test doit produire un rapport incluant:
- Date et heure
- Participants
- Scenario teste
- Resultats (succes/echec)
- Temps de restauration mesure
- Actions correctives si necessaire

---

## 10. Contacts d'Urgence

### 10.1 Equipe Interne

| Role | Nom | Telephone | Email |
|------|-----|-----------|-------|
| On-call primaire | [Rotation] | +225 XX XX XX XX | oncall@advist.io |
| On-call secondaire | [Rotation] | +225 XX XX XX XX | oncall@advist.io |
| CTO | [Nom] | +225 XX XX XX XX | cto@advist.io |
| CEO | [Nom] | +225 XX XX XX XX | ceo@advist.io |

### 10.2 Fournisseurs Externes

| Service | Fournisseur | Support | SLA |
|---------|-------------|---------|-----|
| Cloud (AWS) | Amazon | aws.amazon.com/support | 99.99% |
| CDN | Cloudflare | support.cloudflare.com | 99.99% |
| Email | SendGrid | support.sendgrid.com | 99.95% |
| Mobile Money | PayDunya | support@paydunya.com | 99.9% |

### 10.3 Escalation

1. **Niveau 1** (0-15 min): On-call primaire
2. **Niveau 2** (15-30 min): On-call secondaire + Lead Dev
3. **Niveau 3** (30-60 min): CTO + Equipe complete
4. **Niveau 4** (>1h): CEO + Communication clients

---

## Annexes

### A. Scripts de Recuperation

Voir: `/scripts/recovery/`

### B. Runbooks Detailles

Voir: `/docs/runbooks/`

### C. Historique des Incidents

Voir: `/docs/incidents/`

---

**Document revise le:** 10/01/2026
**Prochaine revision:** 10/04/2026
**Approuve par:** CTO

-- ============================================================================
-- Migration 00035 : Correctif BLOQUANT
-- Supprime le trigger de quota documentaire cassé qui empêche toute création
-- de document en production.
--
-- CONTEXTE
-- Le trigger `check_document_quota` (BEFORE INSERT sur documents) appelle
-- `check_org_document_quota()`, qui lit `organizations.max_documents`. Cette
-- colonne a été supprimée lors du passage de la facturation/quotas à Atlas
-- Studio, mais le trigger d'enforcement est resté. Résultat : chaque INSERT
-- de document échoue avec `ERROR 42703: column o.max_documents does not exist`.
-- La table `documents` était donc restée vide — la création de documents était
-- 100 % cassée.
--
-- CORRECTIF
-- L'enforcement de quota documentaire n'a plus lieu d'être côté base (les
-- quotas sont gérés par Atlas Studio). On supprime le trigger et sa fonction
-- orpheline. Suppression stricte d'un mécanisme déjà non fonctionnel : cela ne
-- fait que restaurer la création de documents.
-- ============================================================================

DROP TRIGGER IF EXISTS check_document_quota ON public.documents;
DROP FUNCTION IF EXISTS public.check_org_document_quota();

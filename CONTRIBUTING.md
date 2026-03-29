# Guide de Contribution - ADVIST

Merci de votre interet pour contribuer a ADVIST ! Ce document decrit les conventions et processus a suivre.

## Table des Matieres

1. [Code de Conduite](#code-de-conduite)
2. [Configuration de l'Environnement](#configuration-de-lenvironnement)
3. [Workflow de Developpement](#workflow-de-developpement)
4. [Standards de Code](#standards-de-code)
5. [Tests](#tests)
6. [Commits et Pull Requests](#commits-et-pull-requests)
7. [Release Process](#release-process)

---

## Code de Conduite

Nous nous engageons a maintenir un environnement accueillant et respectueux pour tous les contributeurs.

- Utilisez un langage accueillant et inclusif
- Respectez les points de vue differents
- Acceptez les critiques constructives avec grace
- Concentrez-vous sur ce qui est le mieux pour la communaute

---

## Configuration de l'Environnement

### Prerequisites

- Node.js 20+
- Python 3.12+
- PostgreSQL 16+
- Redis 7+
- Docker & Docker Compose (optionnel)

### Installation Frontend

```bash
# Cloner le repository
git clone https://github.com/votre-org/advist.git
cd advist

# Installer les dependances
npm install

# Copier le fichier d'environnement
cp .env.example .env

# Lancer le serveur de developpement
npm run dev
```

### Installation Backend

```bash
cd backend

# Creer un environnement virtuel
python -m venv venv
source venv/bin/activate  # Linux/Mac
.\venv\Scripts\activate   # Windows

# Installer les dependances
pip install -r requirements/development.txt

# Appliquer les migrations
python manage.py migrate

# Lancer le serveur
python manage.py runserver
```

### Avec Docker

```bash
# Lancer tous les services
docker-compose up -d

# Voir les logs
docker-compose logs -f
```

---

## Workflow de Developpement

### Branches

- `main` - Branche de production, toujours stable
- `develop` - Branche de developpement principal
- `feature/*` - Nouvelles fonctionnalites
- `fix/*` - Corrections de bugs
- `hotfix/*` - Corrections urgentes pour production

### Processus

1. Creer une branche depuis `develop`
   ```bash
   git checkout develop
   git pull origin develop
   git checkout -b feature/ma-fonctionnalite
   ```

2. Developper et commiter regulierement

3. Pousser et creer une Pull Request vers `develop`

4. Attendre la review et les tests CI

5. Merger apres approbation

---

## Standards de Code

### Frontend (TypeScript/React)

- **Linting**: ESLint avec configuration stricte
- **Formatage**: Prettier
- **Types**: TypeScript strict mode

```bash
# Verifier le linting
npm run lint

# Corriger automatiquement
npm run lint:fix

# Verifier le formatage
npm run format:check

# Formater le code
npm run format

# Verifier les types
npm run typecheck
```

### Conventions de Nommage

- **Fichiers composants**: PascalCase (`MyComponent.tsx`)
- **Fichiers utilitaires**: camelCase (`myUtility.ts`)
- **Constantes**: SCREAMING_SNAKE_CASE
- **Fonctions/Variables**: camelCase
- **Types/Interfaces**: PascalCase

### Structure des Composants

```tsx
// Imports externes
import React from 'react';

// Imports internes
import { useAuth } from '@/hooks/useAuth';

// Types
interface Props {
  title: string;
  onAction: () => void;
}

// Composant
export function MyComponent({ title, onAction }: Props) {
  // Hooks
  const { user } = useAuth();

  // Handlers
  const handleClick = () => {
    onAction();
  };

  // Render
  return (
    <div>
      <h1>{title}</h1>
      <button onClick={handleClick}>Action</button>
    </div>
  );
}
```

### Backend (Python/Django)

- **Linting**: Flake8 + Black
- **Types**: mypy (optionnel)
- **Docstrings**: Google style

```bash
# Verifier le linting
flake8

# Formater le code
black .

# Verifier les imports
isort --check .
```

---

## Tests

### Frontend

```bash
# Lancer les tests
npm test

# Avec couverture
npm run test:coverage

# Mode watch
npm run test:ui
```

### Ecrire un Test

```tsx
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MyComponent } from './MyComponent';

describe('MyComponent', () => {
  it('should render the title', () => {
    render(<MyComponent title="Hello" onAction={() => {}} />);
    expect(screen.getByText('Hello')).toBeInTheDocument();
  });

  it('should call onAction when button is clicked', async () => {
    const onAction = vi.fn();
    render(<MyComponent title="Hello" onAction={onAction} />);

    await userEvent.click(screen.getByRole('button'));

    expect(onAction).toHaveBeenCalled();
  });
});
```

### Tests E2E (Playwright)

```bash
# Lancer les tests E2E
npx playwright test

# Mode UI
npx playwright test --ui

# Generer un rapport
npx playwright show-report
```

### Backend

```bash
cd backend

# Lancer les tests
pytest

# Avec couverture
pytest --cov

# Tests specifiques
pytest apps/documents/tests/
```

---

## Commits et Pull Requests

### Format des Commits

Nous suivons [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nouvelle fonctionnalite
- `fix`: Correction de bug
- `docs`: Documentation
- `style`: Formatage (pas de changement de code)
- `refactor`: Refactoring
- `test`: Ajout/modification de tests
- `chore`: Maintenance

**Exemples:**
```
feat(documents): add document versioning
fix(auth): resolve token refresh issue
docs(readme): update installation instructions
```

### Pull Requests

1. Titre clair et descriptif
2. Description avec:
   - Contexte du changement
   - Solution implementee
   - Tests effectues
   - Screenshots si UI
3. Lier les issues concernees
4. S'assurer que CI passe

**Template PR:**
```markdown
## Description
[Description des changements]

## Type de changement
- [ ] Nouvelle fonctionnalite
- [ ] Correction de bug
- [ ] Breaking change
- [ ] Documentation

## Checklist
- [ ] Tests ajoutes
- [ ] Documentation mise a jour
- [ ] Lint/Format OK
- [ ] Review demandee
```

---

## Release Process

### Versioning

Nous utilisons [Semantic Versioning](https://semver.org/):
- **MAJOR**: Changements breaking
- **MINOR**: Nouvelles fonctionnalites
- **PATCH**: Corrections de bugs

### Processus de Release

1. Merger `develop` dans `main`
2. Creer un tag de version
3. Generer le changelog
4. Deployer en production

```bash
# Creer une release
git checkout main
git merge develop
git tag -a v1.2.0 -m "Release v1.2.0"
git push origin main --tags
```

---

## Contact

- **Issues**: GitHub Issues
- **Email**: dev@advist.io
- **Slack**: #advist-dev

---

Merci de contribuer a ADVIST !

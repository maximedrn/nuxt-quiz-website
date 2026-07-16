# Nuxt Quiz Website

Multiple-choice quiz app - sessions, progress tracking, and syntax-highlighted code snippets.

> _Built to support my preparation for the [Solidity Smart Contract Developer Certification (SSCD+)](https://updraft.cyfrin.io/certifications/solidity-certification), this resource is aligned with the official study guide to help focus on what matters most._

> [!NOTE]
> Access to the seed data [here](data/solidity-evm-quiz-seed.sql) (encrypted for copyright reasons).

## Compatibility

| OS                 | Status |
| ------------------ | ------ |
| macOS              | ✅     |
| Linux              | ✅     |
| Windows (via WSL2) | ✅     |
| Native Windows     | ✅     |

## Prerequisites

- [Bun](https://bun.sh)
- [Docker](https://www.docker.com)
- [git-crypt](https://github.com/AGWA/git-crypt) to decrypt the seed data (optional)

## Installation

```bash
bun run dependencies:install
cp .env.example .env
docker compose up -d
```

## Usage

### Development

```bash
bun run dev
```

### Build

```bash
bun run build
```

## Seed data

The file `data/solidity-evm-quiz-seed.sql` is encrypted. To decrypt it, you need the key file.

```bash
git-crypt unlock <PATH_TO_KEY_FILE>
```

Then load the data into the database:

```bash
psql \
  -h <DATABASE_HOST> \
  -U <DATABASE_USER> \
  -d <DATABASE_NAME> \
  -f data/solidity-evm-quiz-seed.sql
```

## How to add a new quiz?

### `quizzes` schema

Contains the metadata for each quiz.

| Column        | Type         | Notes                |
| ------------- | ------------ | -------------------- |
| `id`          | serial PK    |                      |
| `slug`        | text unique  |                      |
| `title`       | text         |                      |
| `description` | text         | nullable             |
| `created_at`  | timestamp tz | defaults to `now()`  |

### `questions` schema

Contains the questions for each quiz.

| Column          | Type       | Notes                              |
| --------------- | ---------- | ---------------------------------- |
| `id`            | serial PK  |                                    |
| `number`        | int unique | display order                      |
| `quiz_id`       | int FK     | references `quizzes.id`            |
| `title`         | text       | short label                        |
| `question`      | text       | full question text                 |
| `code`          | text       | nullable, syntax-highlighted block |
| `options`       | text[]     | answer choices (A, B, C, D…)       |
| `correct_index` | int        | 0-based index into `options`       |
| `explanation`   | text       | shown after answering              |

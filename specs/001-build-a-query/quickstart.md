# Quickstart: Query Execution UI

## Prerequisites
- Node.js >= 18
- pnpm or npm
- Google Cloud project with BigQuery enabled

## Setup
1. Initialize a new Vite project (if starting from scratch):
	```sh
	pnpm create vite@latest my-app -- --template vue-ts
	cd my-app
	```
	Or, if using an existing repository, clone it:
	```sh
	git clone https://github.com/dion-ricky/smolquery.git
	cd smolquery
	```
2. Install required libraries:
	```sh
	pnpm install
	pnpm add vue@3 @vueuse/core tailwindcss postcss autoprefixer @shadcn/ui monaco-editor
	# Or use npm if preferred
	# npm install vue@3 @vueuse/core tailwindcss postcss autoprefixer @shadcn/ui monaco-editor
	```
3. Initialize Tailwind CSS:
	```sh
	npx tailwindcss init -p
	```
	Then configure `tailwind.config.js` and add Tailwind to your CSS entrypoint as per the Tailwind docs.
4. Set up shadcn UI components (optional, for accessible UI):
	```sh
	npx shadcn-ui@latest init
	```
5. Set up Google OAuth credentials for local development (see Google Cloud docs).
6. Run the development server:
	```sh
	pnpm dev
	# or
	npm run dev
	```

## Usage
- Open the app in your browser
- Authenticate with your Google account
- Write and execute SQL queries against BigQuery
- Use keyboard shortcuts to toggle panels and run queries
- Switch between light and dark mode

## Notes
- For production, configure OAuth and API keys securely

## Contract Tests

To run contract tests:

```
pnpm install vitest --filter "./specs/001-build-a-query/contracts"
pnpm vitest run --dir ./specs/001-build-a-query/contracts
```

All contract tests must fail (RED) before implementation begins, per constitution.

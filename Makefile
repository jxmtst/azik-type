.PHONY: dev build preview lint test typecheck ci clean

dev: ## 開発サーバー起動
	npx vite

build: ## プロダクションビルド
	npx tsc -b && npx vite build

preview: ## ビルド済みアプリのプレビュー
	npx vite preview

lint: ## ESLint実行
	npx eslint .

test: ## テスト実行
	npx vitest run

test-watch: ## テスト(watchモード)
	npx vitest

typecheck: ## 型チェック
	npx tsc --noEmit

ci: typecheck lint test ## CI用: 型チェック + lint + テスト

clean: ## ビルド成果物削除
	rm -rf dist

help: ## コマンド一覧表示
	@grep -E '^[a-zA-Z_-]+:.*?## .*$$' $(MAKEFILE_LIST) | awk 'BEGIN {FS = ":.*?## "}; {printf "  \033[36m%-12s\033[0m %s\n", $$1, $$2}'

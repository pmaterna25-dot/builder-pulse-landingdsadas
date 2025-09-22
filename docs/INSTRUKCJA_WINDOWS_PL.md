Instrukcja przygotowania instalatora Windows (PL)

Wymagania wstępne

- Node.js (zalecane: v18+ lub v20)
- npm lub pnpm
- Środowisko Windows do generowania instalatora (lokalnie lub w CI)

Krok 1 — instalacja zależności

1. Otwórz terminal w katalogu projektu.
2. Zainstaluj zależności:

   npm ci

(Lub: pnpm install jeśli używasz pnpm.)

Krok 2 — budowa aplikacji (client + server)

Uruchom proces budowy aplikacji webowej, który wygeneruje statyczne pliki w dist/spa:

   npm run build

Krok 3 — zbudowanie instalatora Windows (Electron + electron-builder)

Po zakończeniu kroku 2 uruchom skrypt budujący instalator Windows:

   npm run electron:build

Co zrobi skrypt:
- Wykona komendę build (
  czyli npm run build:client && npm run build:server) — w projekcie już skonfigurowano tę sekwencję.
- Uruchomi electron-builder, który spakuje aplikację do formatu NSIS (.exe instalator). Wynik znajdziesz w katalogu dist_electron (konfiguracja w package.json).

Pliki i ikony

- W konfiguracji electron-builder wskazany jest plik z ikoną: build/icon.ico. Jeśli chcesz użyć własnej ikony, umieść plik pod tą ścieżką lub zaktualizuj konfigurację w package.json.
- Artykuły wyjściowe (instalatory) znajdziesz w dist_electron/** po pomyślnym zbudowaniu.

Uruchamianie lokalne (dev)

Aktualnie projekt używa Vite do developmentu i Electron do pakowania. Najprostszy sposób lokalnego testu interfejsu:

1. Uruchom web dev server:

   npm run dev

2. Otwórz aplikację w przeglądarce pod adresem podanym przez Vite (np. http://localhost:5173)

(Uruchamianie Electron bez budowania wymaga lekkiej modyfikacji main.js, aby ładował URL dev servera; jeśli chcesz, dodam skrypt electron:dev i odpowiednie zmiany.)

CI / GitHub Actions

W repo został dodany workflow .github/workflows/electron-build-windows.yml, który:
- uruchamia się przy pushu do gałęzi main lub ręcznie (workflow_dispatch),
- instaluje zależności,
- buduje aplikację i generuje instalator Windows przy użyciu windows-latest,
- zapisuje artefakty w job artifact (dist_electron/**).

Dodatkowe uwagi

- Jeżeli chcesz, aby instalator był podpisywany (code signing), trzeba dodać certyfikat i odpowiednie ustawienia do electron-builder (CI secrets z certyfikatem i hasłem).
- Jeśli chcesz, by instalator był innego typu (np. portable EXE, msi lub ZIP), mogę zaktualizować konfigurację electron-builder.
- Aby zawsze uruchamiać Electron w trybie developerskim (i ładować dev server zamiast pliku), mogę dodać script electron:dev i odpowiednią logikę w electron/main.js.

Masz ochotę, żebym:
- dodał skrypt electron:dev i instrukcję jak uruchamiać Electron podczas developmentu?
- dodał instrukcję krok po kroku z obrazkami lub gotowy plik .bat dla Windows, który automatycznie wykona build i pokaże lokalne artefakty?

Napisz, którą z tych opcji chcesz, a wprowadzę zmiany i dopiszę instrukcje.

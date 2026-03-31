# App icon & splash (Kuremedi)

Replace these with your Kuremedi branding for store builds.

| File | Purpose | Recommended size |
|------|---------|------------------|
| `images/icon.png` | App icon (iOS/Android) | **1024×1024** px |
| `images/favicon.png` | Web favicon | 48×48 or 32×32 |
| `images/splash-icon.png` | Splash screen center image | ~200–400 px width, transparent or on brand bg |
| `images/android-icon-foreground.png` | Android adaptive icon (foreground) | 1024×1024, safe zone ~66% center |
| `images/android-icon-background.png` | Android adaptive icon (background) | 1024×1024 |
| `images/android-icon-monochrome.png` | Android themed icon (optional) | 1024×1024, single color |

**Source:** Use the logo from `website/public/Kure.png` (Kuremedi logo). Export a square crop of the pill icon (or icon + “Kure”) at 1024×1024 for `icon.png` and Android foreground.

**app.json** already points to these paths; replace the files and run `npx expo prebuild --clean` if you change adaptive icons.

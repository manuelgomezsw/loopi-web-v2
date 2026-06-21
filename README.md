# Loopi Web v2

Frontend Angular del proyecto Loopi v2.

## Configuración local

### Pre-requisitos (una sola vez por máquina)

**1. Instalar Node.js LTS via nvm**

```bash
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.3/install.sh | bash
source ~/.zshrc          # o ~/.bashrc según tu shell
nvm install --lts
node --version           # debe mostrar v22.x.x
```

**2. Instalar Angular CLI**

```bash
npm install -g @angular/cli
```

**3. (Solo FydeOS / Linux container) Instalar Chromium**

```bash
sudo apt update && sudo apt install -y chromium
```

### Instalar dependencias del proyecto

```bash
npm install
```

### Variables de entorno

No se requiere archivo `.env`. La URL del backend se configura en [`src/proxy.conf.json`](src/proxy.conf.json):

```json
{
  "/api": {
    "target": "http://localhost:8080",
    "secure": false,
    "changeOrigin": true
  }
}
```

Ajusta `target` si el backend corre en un puerto distinto.

### Levantar el servidor de desarrollo

```bash
npm start
```

Cuando la terminal muestre `Local: http://localhost:4200/` el servidor está listo. Abre el browser en esa URL.

**Desde VSCode** (panel Run & Debug `Ctrl+Shift+D`):

| Configuración | Descripción |
|---|---|
| Ejecutar (ng serve) | Abre Chromium sin breakpoints |
| Debug (ng serve) | Abre Chromium con soporte de breakpoints (`F9` / `F5`) |
| Tests (ng test) | Corre los tests con Karma en Chromium |

### Gates — ejecutar antes de cada commit o PR

```bash
ng build                        # compila con TypeScript estricto
npm audit --audit-level=high    # CVEs en dependencias
ng test --watch=false           # tests unitarios
```

## Comandos útiles

```bash
npm start                       # servidor de desarrollo
npm test                        # tests unitarios (watch mode)
ng test --watch=false           # tests unitarios (una sola pasada)
ng build                        # build de producción → dist/
ng lint                         # lint del código
```

## Recursos

- [Angular CLI](https://angular.dev/tools/cli)
- [Tailwind CSS v4](https://tailwindcss.com/docs)

### [C-07] PDF через dxpdf (без LibreOffice / без облака)
- **Зона:** Doc Engine
- **Факт:** PDF зависел от LibreOffice sidecar.
- **Ожидание:** In-process `dxpdf` (MIT, GitHub nerdy-pro/dxpdf); compose без libreoffice; `POST /generate/pdf` отдаёт PDF на localhost.
- **Приоритет:** P0
- **Зона:** Doc Engine | Backend

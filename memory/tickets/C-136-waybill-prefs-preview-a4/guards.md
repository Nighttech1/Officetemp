# Guards C-136

- [x] preferences-card: rows `rounded-lg border`; ChevronLeft/Right `h-[1.3125rem] w-[1.3125rem]` in 9×9 center box
- [x] WaybillLivePreview: CDN docx-preview@0.4.1 + `renderHeaders/Footers: true`
- [x] A4 frame: `.docx-a4-frame` + `aspect-[210/297]` + `overflow-x-hidden` CSS for tables/images

Regression: open Накладная → шаг Данные — три блока с рамкой; превью без горизонтального скролла; колонтитулы видны после загрузки шаблона с картинками.

# Guards C-92 — штамп 56-0321-ОК-1-2-КЖ6.2.pdf

## Автоматические

```text
cd backend
python -m pytest tests/test_iul_stamp.py::test_analyze_kj62_stamp_designation_and_normocontrol -q
```

Ожидание:
- `doc_designation == 56-0321-ОК-1-2-КЖ6.2` (хвост КЖ6.2 не отрезан)
- `doc_name` содержит «Общие данные»
- подписи: Разработал / Проверил / Н. контр.=Романов / ГИП и др.

## Ручная

Загрузить PDF в мастер ИУЛ → шаг «Данные» / подписи заполнены из штампа, шифр полный.

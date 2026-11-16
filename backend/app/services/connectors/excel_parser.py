"""Parse Excel (.xlsx) and CSV bytes into list[dict] for Doc Engine."""

from __future__ import annotations

import csv
import io
from datetime import date, datetime
from decimal import Decimal
from typing import Any

import pandas as pd

from app.services.connectors.errors import ParseError, RowLimitExceeded


def _normalize_header(name: Any, index: int) -> str:
    text = "" if name is None else str(name).strip()
    if not text or text.lower().startswith("unnamed"):
        return f"column_{index}"
    return text


def _cell_to_jsonable(value: Any) -> Any:
    if value is None:
        return None
    if isinstance(value, float) and pd.isna(value):
        return None
    # pandas / numpy NA
    try:
        if pd.isna(value):
            return None
    except (TypeError, ValueError):
        pass
    if isinstance(value, (datetime, date)):
        return value.isoformat()
    if isinstance(value, pd.Timestamp):
        return value.isoformat()
    if isinstance(value, Decimal):
        return float(value)
    if hasattr(value, "item") and callable(value.item):
        try:
            return value.item()
        except (ValueError, AttributeError):
            pass
    if isinstance(value, bytes):
        return value.decode("utf-8", errors="replace")
    return value


def _rows_from_dataframe(df: pd.DataFrame, *, max_rows: int) -> list[dict[str, Any]]:
    if df.empty:
        return []

    columns = [_normalize_header(c, i) for i, c in enumerate(df.columns)]
    # Drop trailing empty rows (all-null)
    if len(df):
        mask = ~df.isna().all(axis=1)
        # Keep leading empty rows that appear mid-sheet? Spec: drop trailing only.
        if mask.any():
            last_idx = mask[mask].index[-1]
            df = df.loc[:last_idx]
        else:
            df = df.iloc[0:0]

    if len(df) > max_rows:
        raise RowLimitExceeded(
            f"Row count {len(df)} exceeds data_max_rows={max_rows}"
        )

    records: list[dict[str, Any]] = []
    for _, series in df.iterrows():
        row: dict[str, Any] = {}
        for col, raw in zip(columns, series.tolist(), strict=True):
            row[col] = _cell_to_jsonable(raw)
        records.append(row)
    return records


def _decode_csv_bytes(data: bytes) -> str:
    if data.startswith(b"\xef\xbb\xbf"):
        return data.decode("utf-8-sig")
    for encoding in ("utf-8", "cp1251"):
        try:
            return data.decode(encoding)
        except UnicodeDecodeError:
            continue
    return data.decode("utf-8", errors="replace")


def parse_csv_bytes(data: bytes, *, max_rows: int = 5000) -> list[dict[str, Any]]:
    if not data:
        raise ParseError("CSV file is empty")
    text = _decode_csv_bytes(data)
    sample = text[:4096]
    try:
        dialect = csv.Sniffer().sniff(sample, delimiters=",;\t")
    except csv.Error:
        dialect = csv.excel
    reader = csv.reader(io.StringIO(text), dialect)
    rows_raw = list(reader)
    if not rows_raw:
        return []
    headers = [_normalize_header(h, i) for i, h in enumerate(rows_raw[0])]
    body = rows_raw[1:]
    # Drop trailing empty rows
    while body and all(not (cell or "").strip() for cell in body[-1]):
        body.pop()
    if len(body) > max_rows:
        raise RowLimitExceeded(
            f"Row count {len(body)} exceeds data_max_rows={max_rows}"
        )
    result: list[dict[str, Any]] = []
    for line in body:
        padded = list(line) + [""] * max(0, len(headers) - len(line))
        row = {
            headers[i]: (padded[i].strip() if isinstance(padded[i], str) else padded[i])
            for i in range(len(headers))
        }
        result.append(row)
    return result


def list_xlsx_sheet_names(data: bytes) -> list[str]:
    """Return sheet names from an .xlsx/.xlsm workbook (read_only, fast)."""
    if not data:
        raise ParseError("Excel file is empty")
    try:
        from openpyxl import load_workbook

        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        try:
            names = [str(n) for n in (wb.sheetnames or [])]
        finally:
            wb.close()
    except Exception as exc:  # noqa: BLE001
        raise ParseError(f"Failed to open Excel: {exc}") from exc
    if not names:
        raise ParseError("Excel workbook has no sheets")
    return names


def _rows_from_matrix(
    matrix: list[list[Any]], *, max_rows: int
) -> list[dict[str, Any]]:
    """Header detection + row dicts from a raw value matrix."""
    if not matrix:
        return []
    limit = min(20, len(matrix))
    best_i = 0
    best_score = _header_row_score(list(matrix[0]))
    for i in range(1, limit):
        s = _header_row_score(list(matrix[i]))
        if s > best_score:
            best_score = s
            best_i = i
    headers = [_normalize_header(v, i) for i, v in enumerate(matrix[best_i])]
    body = matrix[best_i + 1 :]
    # drop trailing empty
    while body and all(
        v is None or v == "" or (isinstance(v, float) and pd.isna(v)) for v in body[-1]
    ):
        body.pop()
    if len(body) > max_rows:
        raise RowLimitExceeded(
            f"Row count {len(body)} exceeds data_max_rows={max_rows}"
        )
    records: list[dict[str, Any]] = []
    for line in body:
        padded = list(line) + [None] * max(0, len(headers) - len(line))
        row = {
            headers[i]: _cell_to_jsonable(padded[i]) for i in range(len(headers))
        }
        records.append(row)
    return records


def _headers_from_sample_matrix(matrix: list[list[Any]]) -> list[str]:
    """Column names from a small matrix sample (header row detection)."""
    if not matrix:
        return []
    try:
        rows = _rows_from_matrix(matrix, max_rows=1)
    except RowLimitExceeded:
        return []
    if not rows:
        # header-only sheet
        limit = min(20, len(matrix))
        best_i = 0
        best_score = _header_row_score(list(matrix[0]))
        for i in range(1, limit):
            s = _header_row_score(list(matrix[i]))
            if s > best_score:
                best_score = s
                best_i = i
        return [_normalize_header(v, i) for i, v in enumerate(matrix[best_i])]
    return list(rows[0].keys())


def parse_xlsx_fast(
    data: bytes,
    *,
    max_rows: int = 5000,
    sheet_name: str | None = None,
) -> tuple[list[str], str, list[dict[str, Any]], list[str]]:
    """Fast read_only path: list sheets, pick best, parse rows.

    Also collects column names from **all** sheets (for mapping dropdowns).

    openpyxl read_only allows only one iteration per sheet — so we sample in
    pass 1, then reopen for the chosen sheet (still far faster than pandas×3).
    """
    if not data:
        raise ParseError("Excel file is empty")
    try:
        from openpyxl import load_workbook
    except ImportError as exc:
        raise ParseError("openpyxl is required to parse Excel") from exc

    def _open():
        try:
            return load_workbook(io.BytesIO(data), read_only=True, data_only=True)
        except Exception as exc:  # noqa: BLE001
            raise ParseError(f"Failed to open Excel: {exc}") from exc

    all_columns: list[str] = []
    seen_cols: set[str] = set()

    wb = _open()
    try:
        sheets = [str(n) for n in (wb.sheetnames or [])]
        if not sheets:
            raise ParseError("Excel workbook has no sheets")

        if sheet_name and sheet_name in sheets:
            chosen = sheet_name
        elif len(sheets) == 1:
            chosen = sheets[0]
        else:
            best_name = sheets[0]
            best_score = -1.0
            for name in sheets:
                ws = wb[name]
                sample: list[list[Any]] = []
                for i, row in enumerate(ws.iter_rows(max_row=20, values_only=True)):
                    sample.append(list(row))
                    if i >= 19:
                        break
                for h in _headers_from_sample_matrix(sample):
                    if h and h not in seen_cols:
                        seen_cols.add(h)
                        all_columns.append(h)
                s = _score_sheet_sample(sample)
                if s > best_score:
                    best_score = s
                    best_name = name
            chosen = best_name
            # If single-pass already filled all_columns for multi-sheet, done.
        # Single sheet or explicit name: still sample headers from every tab.
        if len(sheets) == 1 or (sheet_name and sheet_name in sheets):
            for name in sheets:
                ws = wb[name]
                sample: list[list[Any]] = []
                for i, row in enumerate(ws.iter_rows(max_row=20, values_only=True)):
                    sample.append(list(row))
                    if i >= 19:
                        break
                for h in _headers_from_sample_matrix(sample):
                    if h and h not in seen_cols:
                        seen_cols.add(h)
                        all_columns.append(h)
    finally:
        wb.close()

    # Second open: read chosen sheet (first pass consumed iterators).
    wb2 = _open()
    try:
        ws = wb2[chosen]
        matrix: list[list[Any]] = []
        hard_cap = max_rows + 40
        for i, row in enumerate(ws.iter_rows(values_only=True)):
            matrix.append(list(row))
            if i + 1 >= hard_cap:
                break
        rows = _rows_from_matrix(matrix, max_rows=max_rows)
        for h in _columns_from_rows_local(rows):
            if h and h not in seen_cols:
                seen_cols.add(h)
                all_columns.append(h)
        return sheets, chosen, rows, all_columns
    finally:
        wb2.close()


def _columns_from_rows_local(rows: list[dict[str, Any]]) -> list[str]:
    seen: list[str] = []
    for row in rows:
        for key in row.keys():
            if key not in seen:
                seen.append(key)
    return seen


def _header_row_score(values: list[Any]) -> float:
    """Higher = more likely a real column header row (not a title banner)."""
    score = 0.0
    seen: set[str] = set()
    non_empty = 0
    for raw in values:
        if raw is None or (isinstance(raw, float) and pd.isna(raw)):
            continue
        text = str(raw).strip()
        if not text:
            continue
        non_empty += 1
        # Long titles / addresses are weak header signals.
        if len(text) > 80:
            score -= 2.0
            continue
        key = text.casefold()
        if key in seen:
            score -= 0.5
        else:
            seen.add(key)
            score += 2.0
        if text.startswith("column_"):
            score -= 1.0
    if non_empty < 2:
        return -10.0
    return score + min(non_empty, 12) * 0.25


def _dataframe_with_detected_header(
    xl: pd.ExcelFile,
    sheet: str,
    *,
    max_rows: int = 5000,
) -> pd.DataFrame:
    """Read sheet; if first row looks like a title, pick a better header row.

    Cap read at max_rows+header window so huge Google exports don't hang.
    """
    raw = pd.read_excel(
        xl,
        sheet_name=sheet,
        engine="openpyxl",
        dtype=object,
        header=None,
        nrows=max(max_rows + 30, 50),
    )
    if raw.empty:
        return raw
    limit = min(20, len(raw))
    best_i = 0
    best_score = _header_row_score(list(raw.iloc[0].tolist()))
    for i in range(1, limit):
        s = _header_row_score(list(raw.iloc[i].tolist()))
        if s > best_score:
            best_score = s
            best_i = i
    headers = [_normalize_header(v, i) for i, v in enumerate(raw.iloc[best_i].tolist())]
    body = raw.iloc[best_i + 1 :].copy()
    body.columns = headers
    body.reset_index(drop=True, inplace=True)
    return body


def score_sheet_for_mapping(rows: list[dict[str, Any]]) -> float:
    """Prefer sheets with real column names and filled cells (for auto-pick)."""
    if not rows:
        return -1.0
    cols = list(rows[0].keys())
    named = sum(1 for c in cols if not str(c).startswith("column_"))
    sample = rows[: min(8, len(rows))]
    filled = 0
    for row in sample:
        for v in row.values():
            if v is None or v == "":
                continue
            filled += 1
    return named * 3.0 + filled * 0.15 + min(len(rows), 50) * 0.02


def _score_sheet_sample(values_rows: list[list[Any]]) -> float:
    """Lightweight score from first rows (no full workbook re-parse)."""
    if not values_rows:
        return -1.0
    best_header_i = 0
    best_header_score = _header_row_score(list(values_rows[0]))
    limit = min(12, len(values_rows))
    for i in range(1, limit):
        s = _header_row_score(list(values_rows[i]))
        if s > best_header_score:
            best_header_score = s
            best_header_i = i
    headers = [
        _normalize_header(v, i)
        for i, v in enumerate(values_rows[best_header_i])
    ]
    named = sum(1 for c in headers if not str(c).startswith("column_"))
    body = values_rows[best_header_i + 1 : best_header_i + 9]
    filled = 0
    for row in body:
        for v in row:
            if v is None or v == "":
                continue
            if isinstance(v, float) and pd.isna(v):
                continue
            filled += 1
    return named * 3.0 + filled * 0.15 + min(len(body), 50) * 0.02


def pick_best_sheet_name(
    data: bytes,
    *,
    max_rows: int = 5000,
    preferred: str | None = None,
) -> str:
    """Choose workbook tab richest for mapping when user did not pick one.

    Uses openpyxl read_only sampling (first ~20 rows) — full parse of every
    sheet on a multi‑MB Google export previously hung the /from-url request.
    """
    del max_rows  # kept for API compatibility; sampling uses fixed window
    names = list_xlsx_sheet_names(data)
    if preferred and preferred in names:
        return preferred
    if len(names) == 1:
        return names[0]

    try:
        from openpyxl import load_workbook
    except ImportError:
        # Fallback: previous (slower) path
        best_name = names[0]
        best_score = -1.0
        for name in names:
            try:
                rows = parse_xlsx_bytes(data, max_rows=50, sheet_name=name)
            except (ParseError, RowLimitExceeded):
                continue
            s = score_sheet_for_mapping(rows)
            if s > best_score:
                best_score = s
                best_name = name
        return best_name

    best_name = names[0]
    best_score = -1.0
    try:
        wb = load_workbook(io.BytesIO(data), read_only=True, data_only=True)
    except Exception as exc:  # noqa: BLE001
        raise ParseError(f"Failed to open Excel: {exc}") from exc
    try:
        for name in names:
            try:
                ws = wb[name]
            except KeyError:
                continue
            sample: list[list[Any]] = []
            for i, row in enumerate(ws.iter_rows(max_row=20, values_only=True)):
                sample.append(list(row))
                if i >= 19:
                    break
            s = _score_sheet_sample(sample)
            if s > best_score:
                best_score = s
                best_name = name
    finally:
        wb.close()
    return best_name


def parse_xlsx_bytes(
    data: bytes,
    *,
    max_rows: int = 5000,
    sheet_name: str | None = None,
) -> list[dict[str, Any]]:
    if not data:
        raise ParseError("Excel file is empty")
    try:
        xl = pd.ExcelFile(io.BytesIO(data), engine="openpyxl")
        names = [str(n) for n in (xl.sheet_names or [])]
        if not names:
            raise ParseError("Excel workbook has no sheets")
        chosen = sheet_name if sheet_name and sheet_name in names else names[0]
        df = _dataframe_with_detected_header(xl, chosen, max_rows=max_rows)
    except ParseError:
        raise
    except Exception as exc:  # noqa: BLE001
        raise ParseError(f"Failed to parse Excel: {exc}") from exc
    return _rows_from_dataframe(df, max_rows=max_rows)


def parse_excel_or_csv(
    data: bytes,
    *,
    filename: str | None = None,
    max_rows: int = 5000,
    sheet_name: str | None = None,
) -> list[dict[str, Any]]:
    """Parse xlsx or csv bytes → list[dict] with normalized headers."""
    name = (filename or "").lower()
    if name.endswith(".csv"):
        return parse_csv_bytes(data, max_rows=max_rows)
    if name.endswith(".xlsx") or name.endswith(".xlsm"):
        return parse_xlsx_bytes(data, max_rows=max_rows, sheet_name=sheet_name)
    # Sniff by magic / content
    if data[:2] == b"PK":
        return parse_xlsx_bytes(data, max_rows=max_rows, sheet_name=sheet_name)
    return parse_csv_bytes(data, max_rows=max_rows)

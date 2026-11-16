"""Data source connectors: Excel/CSV, Google Sheets, Yandex Tables."""

from app.services.connectors.aggregator import Dataset, aggregate
from app.services.connectors.excel_parser import parse_excel_or_csv

__all__ = ["Dataset", "aggregate", "parse_excel_or_csv"]

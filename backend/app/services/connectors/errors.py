"""Shared connector errors."""


class ConfigError(RuntimeError):
    """Missing or invalid connector credentials / configuration."""


class ParseError(ValueError):
    """Spreadsheet / CSV content could not be parsed."""


class RowLimitExceeded(ValueError):
    """Dataset exceeds configured data_max_rows."""

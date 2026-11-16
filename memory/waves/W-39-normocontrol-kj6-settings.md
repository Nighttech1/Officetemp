# W-39 — нормоконтроль, КЖ6.2, сохранение настроек

- tickets: C-91, C-92, C-93
- status: ready_for_client
- done:
  - Backend `iul_stamp.py`: fuzzy Н.контр без захвата фамилии; полный шифр КЖ6.2; Общие данные; Романов
  - Frontend: roleFamily normocontrol → имя из настроек; workspace-sync preserve settingsUseful
  - Next `middlewareClientMaxBodySize: 50mb` (PDF ~12MB раньше обрезался)
  - Tests green + API/proxy analyze-pdf OK

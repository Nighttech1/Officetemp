# Architect spec — W-39 (C-91 / C-92 / C-93)

## Root causes
1. **Нормоконтроль:** ROLE_PATTERNS узкие; нет fuzzy; FE матчит роли только exact → overflow.
2. **КЖ6.2:** шифр в PDF двумя токенами `56-0321-ОК-1-2-` + `КЖ6.2`; pick берёт короткий; filename hint полный перезаписывается; «Общие данные» в одной строке со штампом.
3. **Настройки:** `workspace-sync` / SnapshotProject без `iulSignSettings` → pull затирает.

## Fixes
- Backend: expand + fuzzy normocontrol; merge adjacent designation tokens; prefer longer fn designation; detect «Общие данные» substring.
- Frontend: alias-map ролей (нормоконтроль/ГИП) на fixedRoles из настроек.
- Sync: поле `iulSignSettings` в snapshot + JSON на проекте; merge local on pull если remote пустой.

## Chain
Backend → Frontend → Tester → Fixer → Deployer → Client

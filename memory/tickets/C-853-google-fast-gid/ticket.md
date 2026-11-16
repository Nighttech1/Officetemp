# C-853 — Google connect: CSV by gid + TTL, без xlsx

Priority: P0  
Wave: W-85

## Проблема
ISE / 15–30 с при подключении книги `1vI8fUt1…` (лист «Журнал выдачи ПД 2026», gid 124580750).

## Ожидание
`export?format=csv&gid=124580750`, без полного xlsx; TTL cache 45s; цель повторного ответа &lt; 800ms.

# Guards C-24 / C-25 / C-26

## Visual
- [x] login-1440 card center ≈ RGB(20,20,23) dark (not ~190 light)
- [x] Aurora teal/cyan + grid visible on login/register screenshots
- [x] Mobile 390/412: no light milky card; CTA visible

## Regression
- Glass styles live in `globals.css` `.glass-card` (not only Tailwind arbitrary rgba)
- `prefers-reduced-motion` pauses aurora-blob / aurora-beam / shimmer
- App shell uses `AuroraBackground intensity="soft"`

## Screens
`memory/waves/W-08-dark-premium/screens/`

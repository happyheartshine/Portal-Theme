# Portal-Theme Project Structure Analysis

## Current Structure (After Phase 0)

```
Portal-Theme/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (admin)/            # Admin route group
│   │   ├── (dashboard)/        # Employee dashboard route group
│   │   ├── (full-width-pages)/ # Auth and error pages
│   │   ├── admin/              # Admin pages
│   │   ├── manager/            # Manager pages
│   │   ├── layout.tsx          # Root layout
│   │   └── ...
│   ├── components/             # React components
│   │   ├── auth/               # Auth components
│   │   ├── guards/             # Route guards (to be created)
│   │   ├── ui/                 # UI components
│   │   └── ...
│   ├── context/                # Context providers (SidebarContext, ThemeContext)
│   ├── contexts/               # Empty - will add AuthContext here
│   ├── lib/                    # Empty - will add API client here
│   ├── layout/                 # Layout components (AppHeader, AppSidebar)
│   ├── utils/                  # Utility functions
│   └── icons/                  # SVG icons
├── .env.local                  # Environment variables (created)
├── .env.example                # Environment template (created)
└── package.json                # Dependencies updated
```

## Comparison with Portal-Website

### Portal-Website Structure
```
Portal-Website/
├── src/
│   ├── app/
│   │   ├── (auth)/             # Auth route group
│   │   ├── (dashboard)/        # Employee dashboard route group
│   │   ├── admin/              # Admin pages
│   │   ├── manager/            # Manager pages
│   │   └── ...
│   ├── components/
│   │   └── guards/             # RouteGuard.jsx
│   ├── contexts/
│   │   └── AuthContext.jsx     # Auth context
│   ├── lib/
│   │   ├── apiClient.js         # Axios instance + API functions
│   │   ├── auth.js              # Auth helper functions
│   │   └── toast.js             # Toast notifications
│   └── menu-items/             # Navigation menu configs
```

## Key Differences

1. **Route Groups**:
   - Portal-Website: `(auth)` for login
   - Portal-Theme: `(full-width-pages)/(auth)` for signin/signup

2. **Context Location**:
   - Portal-Website: `src/contexts/`
   - Portal-Theme: `src/context/` (existing) + `src/contexts/` (for AuthContext)

3. **Icons**:
   - Portal-Website: May use Phosphor icons or custom
   - Portal-Theme: SVG icons in `src/icons/`

4. **Layout Components**:
   - Portal-Theme has `AppHeader` and `AppSidebar` components
   - Portal-Website may have different layout structure

## Migration Mapping

| Portal-Website | Portal-Theme |
|----------------|--------------|
| `src/lib/apiClient.js` | `src/lib/apiClient.ts` |
| `src/lib/auth.js` | `src/lib/auth.ts` |
| `src/lib/toast.js` | `src/lib/toast.ts` |
| `src/contexts/AuthContext.jsx` | `src/contexts/AuthContext.tsx` |
| `src/components/guards/RouteGuard.jsx` | `src/components/guards/RouteGuard.tsx` |
| `src/app/(auth)/login/page.jsx` | `src/app/(full-width-pages)/(auth)/signin/page.tsx` |
| `src/app/(dashboard)/dashboard/page.jsx` | `src/app/(dashboard)/dashboard/page.tsx` |
| `src/menu-items/*.jsx` | `src/menu-items/*.tsx` (to be created) |

## Dependencies Status

✅ **Installed**:
- `axios` - HTTP client for API calls
- `swr` - Data fetching library (optional, used in Portal-Website)

✅ **Already Present**:
- `next` - 16.0.10
- `react` - 19.2.0
- `typescript` - 5.9.3
- `tailwindcss` - 4.1.17
- `apexcharts` - 4.7.0 (for charts)
- `react-apexcharts` - 1.8.0

## Next Steps (Phase 1)

1. Create `src/lib/apiClient.ts` - Convert from JS to TS
2. Create `src/lib/auth.ts` - Convert from JS to TS
3. Create `src/lib/toast.ts` - Convert from JS to TS
4. Create `src/contexts/AuthContext.tsx` - Convert from JSX to TSX
5. Create `src/components/guards/RouteGuard.tsx` - Convert from JSX to TSX
6. Update login page to use authentication


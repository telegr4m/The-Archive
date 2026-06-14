# Public Release Checklist

Before publishing this repository:

- Review whether the active personal CSV files in `data/imports/` should be public.
- Review whether personal ratings, favorites, featured flags, and favorite
  characters should be public.
- Confirm every cover image may be redistributed publicly and deployed to
  Vercel.
- Confirm `.env` files and API keys are ignored by git.
- Confirm `/admin/health` returns `404` in a production build.
- Run `npm run archive:export` and keep the resulting backup somewhere private.
- Run `npm test`, `npm run lint`, and `npm run build`.

This checklist does not remove or anonymize personal archive data automatically.

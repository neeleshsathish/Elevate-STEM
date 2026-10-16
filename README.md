# Elevate STEM website

The site for [elevatestemfoundation.org](https://elevatestemfoundation.org). React + Vite, hosted on GitHub Pages.

## Editing content

Almost everything you'd want to change is in `src/data.js`: stats, guides, team, partners, the homepage cards, and the Discord, Instagram and donate links.

- **Add a guide:** put the PDF in `public/guides/<slug>.pdf`, a cover image in `public/covers/<slug>.webp`, and add an entry to `GUIDES`.
- **Add a team photo:** put it in `public/team/` and set `photo: "team/<file>"` on that person.

## Running it

```
npm install
npm run dev      # local preview at http://localhost:5173
npm run build    # builds the site into /docs
```

## Publishing

GitHub Pages serves the `/docs` folder on the `main` branch (Settings → Pages → Deploy from a branch → `main` / `/docs`).
Run `npm run build`, commit, and push.

The build uses relative paths and `#/` links (like `/#/team`), so it works as-is at the
`github.io` address and on any custom domain, with no rebuild.

### Custom domain

1. At your domain registrar, add four **A** records for `@` pointing to `185.199.108.153`, `185.199.109.153`,
   `185.199.110.153`, `185.199.111.153`, and a **CNAME** record for `www` pointing to `<your-username>.github.io`.
2. In Settings → Pages, enter the domain under **Custom domain**, save, then tick **Enforce HTTPS** once it's offered.
3. Copy the `CNAME` file GitHub adds to `docs/` into `public/` too, so the next build keeps it.

A domain can only be attached to one repository at a time, so remove it from any old repo first.

# structmill-site

Marketing site for Struct-Mill at [structmill.com](https://structmill.com).

Static HTML/CSS, no build step, deployed via GitHub Pages.

## Local preview

```sh
python3 -m http.server 8000
# then open http://localhost:8000
```

## Deploy

1. Push `main` to `github.com/<your-account>/structmill-site`.
2. In **Settings → Pages**, set source to `main` branch, root folder.
3. Under **Custom domain**, enter `structmill.com`. GitHub will detect the
   `CNAME` file already in the repo.
4. At your domain registrar, add the DNS records:
   - **Apex (`structmill.com`)** → `A` records to GitHub Pages IPs:
     `185.199.108.153`, `185.199.109.153`, `185.199.110.153`, `185.199.111.153`
   - **`www`** → `CNAME` to `<your-account>.github.io`
5. Wait for DNS propagation (usually <1 hour), then enable
   **Enforce HTTPS** in Pages settings.

## Email

The site links to `joseph@structmill.com`. Set up a forwarder from your
domain registrar (or Cloudflare Email Routing) to your real inbox.

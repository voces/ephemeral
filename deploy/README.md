# Deploying ephemeral on the EC2 cohost

ephemeral runs as a long-lived Deno process on the shared EC2 box (beside
blocktol, w3mmd, w3xio, …), behind nginx + certbot, at `ephemeral.w3x.io`.

- **Serving:** `ephemeral.service` (systemd) runs `deno task start` on
  `127.0.0.1:3060`; nginx (`ephemeral.nginx.conf`) terminates TLS, rate-limits
  writes per IP (`ephemeral-ratelimit.conf`) and reverse-proxies to it.
- **Storage:** Deno KV in a local SQLite file, `data/kv.sqlite3` (`KV_PATH`).
  Every resource expires within 24 hours, so there is nothing to back up.
- **Deploy:** a push to `master` runs `.github/workflows/deploy.yml`, which
  checks the code and POSTs `{app:"ephemeral", version:<sha>}` to w3xio's
  `/deploy`. That does `git fetch origin master` → `git checkout <sha>` →
  `deno install` → `systemctl restart ephemeral`, and posts the result to the
  admin Discord channel.

`deploy/ephemeral.service`, `deploy/ephemeral.nginx.conf` and
`deploy/ephemeral-ratelimit.conf` are **reference templates**; the live copies
are `/etc/systemd/system/ephemeral.service`,
`/etc/nginx/sites-enabled/ephemeral.conf` and
`/etc/nginx/conf.d/ephemeral-ratelimit.conf`. Keep them in sync.

## Box facts

- Service account `ubuntu`, checkout `/home/ubuntu/ephemeral`, deno at
  `/home/ubuntu/.deno/bin/deno`.
- **Port 3060.** Taken on this box: 3017 (st2mr), 3020 (w3xio/dapi), 3030
  (emoji-sheep-tag), 3040 (blocktol), 3050 (w3mmd), 3626 (w3x.io + `/sql`), 3627
  (katma). Confirm it is still free first: `sudo ss -ltnp | grep 3060` prints
  nothing.

## One-time setup

1. **Clone** as `ubuntu`, and fetch the npm dependencies into deno's cache:
   ```bash
   git clone https://github.com/voces/ephemeral /home/ubuntu/ephemeral
   cd /home/ubuntu/ephemeral && deno install
   ```
2. **systemd:**
   ```bash
   sudo cp deploy/ephemeral.service /etc/systemd/system/
   sudo systemctl daemon-reload
   sudo systemctl enable --now ephemeral
   curl -s localhost:3060/ | head -c 100     # the page
   ```
3. **nginx:** copy `deploy/ephemeral-ratelimit.conf` to
   `/etc/nginx/conf.d/ephemeral-ratelimit.conf` and
   `deploy/ephemeral.nginx.conf` to `/etc/nginx/sites-enabled/ephemeral.conf`,
   then `sudo nginx -t && sudo systemctl reload nginx`. Once certbot has edited
   the live vhost, merge later changes into it by hand rather than copying over
   it.
4. **DNS + TLS:** add an A record for `ephemeral.w3x.io` pointing at the box (it
   is IPv4-only, so no AAAA), then `sudo certbot --nginx -d ephemeral.w3x.io`.
5. **sudoers:** let w3xio restart the unit without a password, mirroring the
   other apps' rules. As the user w3xio runs under:
   ```
   <w3xio-user> ALL=(ALL) NOPASSWD: /usr/bin/systemctl restart ephemeral
   ```
   The checkout must be writable by that user, since it runs `git checkout`
   there; if w3xio doesn't run as `ubuntu`, set `EPHEMERAL_DIR` in its
   environment to wherever the checkout lives (default
   `/home/ubuntu/ephemeral`).
6. **Workflow:** `deploy/deploy-workflow.yml` is the workflow, kept out of
   `.github/workflows/` only because the session that wrote it couldn't push
   there. Install it once:
   `git mv deploy/deploy-workflow.yml .github/workflows/deploy.yml`.
7. **GitHub secret:** set this repo's `DEPLOY_WEBHOOK_URL` to the same
   `https://dapi.w3x.io/deploy?token=<DEPLOY_SECRET>` the other apps use. Until
   it is set, the workflow only checks the code.

## Cutover

1. Check `https://ephemeral.w3x.io`: the page loads, and a post then a get
   round-trips
   (`curl -d hi https://ephemeral.w3x.io/test && curl
   https://ephemeral.w3x.io/test`).
2. Point anything that uses the Deno Deploy URL at `ephemeral.w3x.io`. Nothing
   is copied over: resources on Deno Deploy expire there.
3. Delete the project on Deno Deploy (or disconnect its GitHub integration) so a
   push doesn't deploy in two places.

## Operating

- Logs: `journalctl -u ephemeral -f`
- Manual deploy (if the webhook is down). The webhook leaves the checkout on a
  detached SHA, so fetch and check out rather than `git pull`:
  `git fetch origin master && git checkout origin/master && deno install`, then
  `sudo systemctl restart ephemeral`.
- Rollback: `git -C /home/ubuntu/ephemeral checkout <sha>` then restart.
- Wipe every resource: stop the service, `rm data/kv.sqlite3*`, start it.

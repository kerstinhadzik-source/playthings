# Point myplaythings.com (GoDaddy) to Vercel

When you **keep GoDaddy nameservers**, you manage DNS in GoDaddy and point the domain to Vercel with the records below.

## 1. In Vercel (do this first)

1. Open [Vercel Dashboard](https://vercel.com/dashboard) → your **playthings** project.
2. Go to **Settings** → **Domains**.
3. Add:
   - `myplaythings.com` (root/apex)
   - `www.myplaythings.com` (optional)
4. Vercel will show you which DNS records it expects. Use the values below in GoDaddy.

## 2. In GoDaddy DNS

1. Sign in to [GoDaddy](https://www.godaddy.com) → **My Products**.
2. Click **DNS** (or **Manage DNS**) for **myplaythings.com**.
3. Remove or avoid conflicts:
   - If there’s an **A** record for `@` pointing to a GoDaddy parking IP, **delete it** or replace it with the record below.
   - If there’s a **CNAME** for `www` pointing to something else, **delete it** or replace it.

### Records to add (or edit)

| Type  | Name | Value                 | TTL  |
|-------|------|------------------------|------|
| **A** | `@`  | `76.76.21.21`          | 600  |
| **CNAME** | `www` | `cname.vercel-dns.com` | 600  |

- **A record (`@`)**  
  - Name: `@` (or leave “Host” empty if GoDaddy uses that for root).  
  - Value: `76.76.21.21`  
  - This points **myplaythings.com** to Vercel.

- **CNAME record (`www`)**  
  - Name: `www`  
  - Value: `cname.vercel-dns.com`  
  - This points **www.myplaythings.com** to Vercel (only if you added this domain in Vercel).

Save the records and wait **5–60 minutes** (sometimes up to 24–48 hours) for DNS to propagate.

## 3. Check that it’s working

- **Root:**  
  `https://myplaythings.com` should open your Vercel app (and not a GoDaddy parking page).
- **www (if you use it):**  
  `https://www.myplaythings.com` should also open your Vercel app.

If it still shows the old page or “site can’t be reached”:

1. Confirm in GoDaddy that the **A** record for `@` is **76.76.21.21** and the **CNAME** for `www` is **cname.vercel-dns.com**.
2. In Vercel → **Domains**, confirm **myplaythings.com** (and **www** if used) are added and show as **Valid** (no warning).
3. Try in an incognito/private window or another device; DNS can be cached.
4. Use [whatsmydns.net](https://www.whatsmydns.net) for **myplaythings.com**: you should see **76.76.21.21** for the A record.

## 4. If you prefer Vercel nameservers instead

Then you don’t manage DNS in GoDaddy; Vercel does:

1. In Vercel → **Domains** → your domain → use the option to **Use Vercel Nameservers**.
2. In GoDaddy, change the domain’s **Nameservers** to **Custom** and set:
   - `ns1.vercel-dns.com`
   - `ns2.vercel-dns.com`
3. Save and wait for propagation. After that, all DNS is managed in Vercel and the records above are created for you.

---

**Summary:** With GoDaddy nameservers, add **A `@` → 76.76.21.21** and **CNAME `www` → cname.vercel-dns.com** in GoDaddy DNS, and add the same domains in Vercel **Domains** so the app and SSL work.

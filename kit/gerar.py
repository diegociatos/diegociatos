import json, os, sys
from PIL import Image, ImageDraw, ImageFont, ImageFilter, ImageEnhance

F = "/tmp/fonts/fontsource-%s-5.3.0/package/files/%s-latin-%d-normal.woff"
import os as _os
KIT=_os.path.dirname(_os.path.abspath(__file__))
PG = _os.path.join(KIT,"fonts","texgyrepagella-%s.otf")
def font(fam, w, s):
    # padrão da marca: Book Antiqua -> equivalente livre TeX Gyre Pagella (Palatino)
    return ImageFont.truetype(PG % ("bold" if w >= 600 else "regular"), int(s * 1.08))

W, H = 1080, 1350
GOLD = (214, 174, 96); DARK = (22, 18, 14); WHITE = (255, 255, 255)
INK = (20, 20, 20); GRAY = (110, 110, 110); CARD = (244, 241, 235)

FOTO = Image.open(_os.path.join(KIT,"foto1.png")).convert("RGB")

def wrap(draw, text, fnt, maxw):
    words, lines, cur = text.split(), [], ""
    for w in words:
        t = (cur + " " + w).strip()
        if draw.textlength(t, font=fnt) <= maxw: cur = t
        else: lines.append(cur); cur = w
    if cur: lines.append(cur)
    return lines

LOGO = _os.path.join(KIT,"logo.jpg")
def wordmark(img, y):
    from PIL import ImageChops
    if os.path.exists(LOGO):
        lg = Image.open(LOGO).convert("RGB"); lw = 560
        lg = lg.resize((lw, int(lg.height * lw / lg.width)), Image.LANCZOS)
        pos = ((W - lw) // 2, y - 20); reg = img.crop((pos[0], pos[1], pos[0] + lg.width, pos[1] + lg.height))
        mask = lg.convert("L").point(lambda v: 0 if v < 45 else min(255, (v - 45) * 3))
        img.paste(lg, pos, mask); return
    d = ImageDraw.Draw(img); f = font("montserrat", 800, 34); t = "DIEGOCIATOS"
    sp = 8; w = sum(d.textlength(c, font=f) for c in t) + sp * (len(t) - 1)
    x = (W - w) / 2
    for c in t:
        d.text((x, y), c, font=f, fill=WHITE); x += d.textlength(c, font=f) + sp
    d.line([((W - w) / 2, y + 50), ((W + w) / 2, y + 50)], fill=GOLD, width=3)

def capa(selo, titulo, faixa, out, ref=None):
    bg = FOTO.copy()
    s = W / bg.width; bg = bg.resize((W, int(bg.height * s)))
    if bg.height < H: bg = bg.resize((int(W * H / bg.height), H)); bg = bg.crop(((bg.width - W)//2, 0, (bg.width - W)//2 + W, H))
    else: bg = bg.crop((0, 0, W, H))
    bg = bg.filter(ImageFilter.GaussianBlur(16))
    bg = ImageEnhance.Color(ImageEnhance.Brightness(bg).enhance(0.38)).enhance(0.6)
    img = bg; d = ImageDraw.Draw(img); X = 80; maxw = W - 2 * X
    size = 96
    while True:
        hf = font("montserrat", 900, size); tl = wrap(d, titulo, hf, maxw)
        if len(tl) <= 4 or size <= 60: break
        size -= 4
    bf = font("montserrat", 800, 46); fl = wrap(d, faixa, bf, maxw - 30)
    lh = int(size * 1.15); blh = 70
    total = 60 + len(tl) * lh + 30 + len(fl) * blh
    y = int(H * 0.47 - total / 2)
    kf = font("montserrat", 700, 32); x = X
    for ch in selo:
        d.text((x, y), ch, font=kf, fill=GOLD); x += d.textlength(ch, font=kf) + 6
    y += 50
    if ref:
        d.text((X, y), ref, font=font("montserrat", 600, 28), fill=(225, 225, 225)); y += 56
    for l in tl: d.text((X, y), l, font=hf, fill=WHITE); y += lh
    y += 30
    for l in fl:
        bb = bf.getbbox(l); w = d.textlength(l, font=bf)
        d.rectangle([X - 14, y + bb[1] - 12, X + w + 16, y + bb[3] + 12], fill=GOLD)
        d.text((X, y), l, font=bf, fill=DARK); y += blh
    wordmark(img, H - 150)
    img.save(out, quality=94)

AV = _os.path.join(KIT,"avatar.jpg")
def avatar(size):
    if os.path.exists(AV):
        face = Image.open(AV).convert("RGB").crop((55, 15, 279, 239)).resize((size, size), Image.LANCZOS)
    else:
        cx, cy, r = 565, 370, 250
        face = FOTO.crop((cx - r, cy - r, cx + r, cy + r)).resize((size, size), Image.LANCZOS)
    m = Image.new("L", (size * 4, size * 4), 0); ImageDraw.Draw(m).ellipse([0, 0, size * 4, size * 4], fill=255)
    face.putalpha(m.resize((size, size), Image.LANCZOS)); return face

def rich_lines(d, text, maxw, size):
    # **negrito** dentro do texto
    reg = font("inter", 400, size); bold = font("inter", 700, size)
    toks = []
    for i, part in enumerate(text.split("**")):
        for w in part.split(): toks.append((w, i % 2 == 1))
    lines, cur, curw = [], [], 0
    sp = d.textlength(" ", font=reg)
    for w, b in toks:
        ww = d.textlength(w, font=bold if b else reg)
        glue = w[0] in ".,;:!?)"
        if cur and not glue and curw + sp + ww > maxw: lines.append(cur); cur, curw = [], 0
        curw += (0 if (glue or not cur) else sp) + ww; cur.append((w, b, glue))
    if cur: lines.append(cur)
    return lines, reg, bold, sp

def tweet(n, total, titulo, paras, out, fonte=None, rodape=None):
    img = Image.new("RGB", (W, H), WHITE); d = ImageDraw.Draw(img); X = 80; maxw = W - 2 * X
    # contador
    cf = font("inter", 600, 28); ct = f"{n}/{total}"; cw = d.textlength(ct, font=cf)
    d.rounded_rectangle([W - 80 - cw - 36, 50, W - 80, 100], radius=25, fill=(235, 235, 235))
    d.text((W - 80 - cw - 18, 58), ct, font=cf, fill=GRAY)
    # bloco de conteúdo — calcula altura para centralizar
    tf = font("inter", 800, 50); tl = wrap(d, titulo, tf, maxw - 40)
    blocks = []; bsize = 40
    for p in paras: blocks.append(rich_lines(d, p, maxw, bsize))
    h = 150 + 50 + len(tl) * 62 + 30
    for lines, *_ in blocks: h += len(lines) * 56 + 28
    if fonte: h += 120 + len(fonte.get("ficha", [])) * 46 + 44 * 2
    y = max(150, int((H - h) / 2) - 20)
    av = avatar(150); img.paste(av, (X, y), av)
    d.text((X + 180, y + 30), "Diego Ciatos", font=font("inter", 800, 44), fill=INK)
    d.text((X + 180, y + 86), "@diegociatos", font=font("inter", 400, 36), fill=GRAY)
    y += 150 + 50
    d.rectangle([X, y + 8, X + 14, y + 8 + len(tl) * 62 - 16], fill=GOLD)
    for l in tl: d.text((X + 34, y), l, font=tf, fill=INK); y += 62
    y += 30
    for lines, reg, bold, sp in blocks:
        for line in lines:
            x = X
            for i, (w, b, glue) in enumerate(line):
                f = bold if b else reg
                if glue and i: x -= sp
                d.text((x, y), w, font=f, fill=INK); x += d.textlength(w, font=f) + sp
            y += 56
        y += 28
    if fonte:
        y += 10; sf = font("inter", 700, 26); hf = font("inter", 800, 34)
        lf = font("inter", 600, 30); vf = font("inter", 500, 30)
        hl = wrap(d, fonte["manchete"], hf, maxw - 60) if fonte.get("manchete") else []
        ficha = fonte.get("ficha", [])
        ch = 64 + len(hl) * 44 + (16 if hl else 0) + len(ficha) * 46 + 20
        d.rounded_rectangle([X, y, W - X, y + ch], radius=24, fill=CARD, outline=(220, 214, 200), width=2)
        d.text((X + 30, y + 22), fonte["veiculo"].upper(), font=sf, fill=(160, 120, 50))
        yy = y + 62
        for l in hl: d.text((X + 30, yy), l, font=hf, fill=INK); yy += 44
        if hl: yy += 16
        for lab, val in ficha:
            d.text((X + 30, yy), lab, font=lf, fill=GRAY)
            d.text((X + 260, yy), val, font=vf, fill=INK); yy += 46
    if rodape:
        d.text((X, H - 90), rodape, font=font("inter", 600, 28), fill=GRAY)
    img.save(out, quality=94)

def capa2(selo, gancho, destaque, apoio, out):
    # você nítido no topo, degradê escuro embaixo
    bg = FOTO.resize((W, int(FOTO.height * W / FOTO.width)), Image.LANCZOS).crop((0, 0, W, H))
    bg = ImageEnhance.Brightness(bg).enhance(0.9)
    grad = Image.new("L", (1, H))
    for y in range(H):
        t = max(0, (y - H * 0.18) / (H * 0.5)); grad.putpixel((0, y), int(min(1, t) * 245))
    dark = Image.new("RGB", (W, H), (10, 9, 8))
    img = Image.composite(dark, bg, grad.resize((W, H)))
    d = ImageDraw.Draw(img); X = 70; maxw = W - 2 * X
    # selo em pílula
    sf = font("inter", 700, 30); sw = d.textlength(selo, font=sf)
    y = 600
    d.rounded_rectangle([X, y, X + sw + 44, y + 58], radius=29, fill=GOLD)
    d.text((X + 22, y + 9), selo, font=sf, fill=DARK); y += 90
    size = 104
    while True:
        hf = font("inter", 700, size); gl = wrap(d, gancho, hf, maxw)
        if len(gl) <= 3 or size < 70: break
        size -= 6
    for l in gl: d.text((X, y), l, font=hf, fill=WHITE); y += int(size * 1.12)
    y += 10
    bf = font("inter", 700, 58); bl = wrap(d, destaque, bf, maxw - 30)
    for l in bl:
        bb = bf.getbbox(l); w = d.textlength(l, font=bf)
        d.rectangle([X - 12, y + bb[1] - 10, X + w + 14, y + bb[3] + 12], fill=GOLD)
        d.text((X, y), l, font=bf, fill=DARK); y += 78
    y += 18
    af = font("inter", 400, 40)
    for l in wrap(d, apoio, af, maxw): d.text((X, y), l, font=af, fill=(230, 230, 230)); y += 52
    wordmark(img, H - 120)
    img.save(out, quality=94)

def fit(im, w, h):
    s = max(w / im.width, h / im.height); im = im.resize((int(im.width*s)+1, int(im.height*s)+1), Image.LANCZOS)
    return im.crop(((im.width-w)//2, 0, (im.width-w)//2+w, h))
def capa3(tema, foto, selo, gancho, destaque, apoio, out, lado="dir", crop=None):
    bg = ImageEnhance.Brightness(fit(Image.open(tema).convert("RGB"), W, H)).enhance(0.75)
    p = Image.open(foto).convert("RGB")
    if crop: p = p.crop(tuple(crop))
    pw = int(W * 0.66); ph = int(p.height * pw / p.width); p = p.resize((pw, ph), Image.LANCZOS).crop((0, 0, pw, min(ph, int(H*0.66))))
    # máscara: some nas laterais e embaixo
    m = Image.new("L", p.size, 255); md = m.load()
    for x in range(p.width):
        fx = min(1, x / (p.width*0.28)) if lado=="dir" else min(1, (p.width - x) / (p.width*0.28))
        for y in range(p.height):
            fy = min(1, (p.height - y) / (p.height*0.35))
            md[x, y] = int(255 * fx * fy)
    x0 = W - pw if lado=="dir" else 0
    img = bg.copy(); img.paste(p, (x0, 0), m)
    # degradê para o texto
    g = Image.new("L", (1, H))
    for y in range(H): g.putpixel((0, y), int(min(1, max(0, (y - H*0.38)/(H*0.3))) * 240))
    img = Image.composite(Image.new("RGB", (W, H), (10, 9, 8)), img, g.resize((W, H)))
    d = ImageDraw.Draw(img); X = 70; maxw = W - 2*X
    sf = font("inter", 700, 30); sw = d.textlength(selo, font=sf)
    _hf = font("inter", 700, 104); _gl = wrap(d, gancho, _hf, maxw)
    _s = 104
    while len(_gl) > 3 and _s >= 70: _s -= 6; _hf = font("inter", 700, _s); _gl = wrap(d, gancho, _hf, maxw)
    _bl = wrap(d, destaque, font("inter", 700, 58), maxw - 30); _al = wrap(d, apoio, font("inter", 400, 40), maxw)
    _h = 90 + len(_gl) * int(_s * 1.12) + 10 + len(_bl) * 78 + 18 + len(_al) * 52
    y = min(640, H - 190 - _h)
    d.rounded_rectangle([X, y, X+sw+44, y+58], radius=29, fill=GOLD); d.text((X+22, y+9), selo, font=sf, fill=DARK); y += 90
    size = 104
    while True:
        hf = font("inter", 700, size); gl = wrap(d, gancho, hf, maxw)
        if len(gl) <= 3 or size < 70: break
        size -= 6
    for l in gl: d.text((X, y), l, font=hf, fill=WHITE); y += int(size*1.12)
    y += 10; bf = font("inter", 700, 58)
    for l in wrap(d, destaque, bf, maxw-30):
        bb = bf.getbbox(l); w = d.textlength(l, font=bf)
        d.rectangle([X-12, y+bb[1]-10, X+w+14, y+bb[3]+12], fill=GOLD); d.text((X, y), l, font=bf, fill=DARK); y += 78
    y += 18; af = font("inter", 400, 40)
    for l in wrap(d, apoio, af, maxw): d.text((X, y), l, font=af, fill=(230,230,230)); y += 52
    wordmark(img, H-120); img.save(out, quality=94)

def capa_tweet(gancho, apoio, out, total=6):
    img = Image.new("RGB", (W, H), WHITE); d = ImageDraw.Draw(img); X = 80; maxw = W - 2 * X
    cf = font("inter", 600, 28); ct = f"1/{total}"; cw = d.textlength(ct, font=cf)
    d.rounded_rectangle([W - 80 - cw - 36, 50, W - 80, 100], radius=25, fill=(235, 235, 235))
    d.text((W - 80 - cw - 18, 58), ct, font=cf, fill=GRAY)
    size = 78
    while True:
        hf = font("inter", 800, size); gl = wrap(d, gancho, hf, maxw)
        if len(gl) <= 6 or size < 56: break
        size -= 4
    af = font("inter", 400, 44); al = wrap(d, apoio, af, maxw)
    h = 150 + 60 + len(gl) * int(size * 1.15) + 40 + len(al) * 58 + 90
    y = max(140, (H - h) // 2)
    av = avatar(150); img.paste(av, (X, y), av)
    d.text((X + 180, y + 30), "Diego Ciatos", font=font("inter", 800, 44), fill=INK)
    d.text((X + 180, y + 86), "@diegociatos", font=font("inter", 400, 36), fill=GRAY)
    y += 150 + 60
    for l in gl: d.text((X, y), l, font=hf, fill=INK); y += int(size * 1.15)
    y += 40
    for l in al: d.text((X, y), l, font=af, fill=(60, 60, 60)); y += 58
    y += 40
    d.text((X, y), "Arrasta para o lado  →", font=font("inter", 700, 36), fill=(160, 120, 50))
    img.save(out, quality=94)

if __name__ == "__main__":
    data = json.load(open(sys.argv[1]))
    os.makedirs("saida", exist_ok=True)
    for c in data:
        k = c["id"]; total = 1 + len(c["slides"])
        if c.get("abertura"): capa_tweet(c["abertura"], c["abertura_apoio"], f"saida/{k}_01.jpg", total)
        elif c.get("tema"): capa3(c["tema"], c["foto"], c["selo"], c["gancho"], c["destaque"], c["apoio"], f"saida/{k}_01.jpg", c.get("lado","dir"), c.get("crop"))
        elif c.get("gancho"): capa2(c["selo"], c["gancho"], c["destaque"], c["apoio"], f"saida/{k}_01.jpg")
        else: capa(c["selo"], c["titulo"], c["faixa"], f"saida/{k}_01.jpg", c.get("ref"))
        for i, s in enumerate(c["slides"], start=2):
            tweet(i, total, s["titulo"], s["paras"], f"saida/{k}_{i:02d}.jpg", s.get("fonte"), s.get("rodape"))
    print("ok", sorted(os.listdir("saida")))

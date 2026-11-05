"""Kit de lâminas 1080x1350 do Grupo Ciatos (fundo ônix, champanhe, creme)."""
from PIL import Image, ImageDraw, ImageFont

W, H = 1080, 1350
ONIX = (10, 10, 10)
CHAMP = (201, 169, 106)
CREME = (244, 238, 226)
CINZA = (190, 182, 168)
VINHO = (142, 27, 37)
import os
_D = os.path.dirname(os.path.abspath(__file__))
TG = _D + "/fonts/"
LOGO_SRC = _D + "/logo_grupo_ciatos.png"


# Palatino (TeX Gyre Pagella) = mesmo desenho da Book Antiqua
def f_title(s):
    return ImageFont.truetype(TG + "texgyrepagella-bold.otf", s)


def f_body(s, bold=False):
    return ImageFont.truetype(TG + ("texgyrepagella-bold.otf" if bold else "texgyrepagella-regular.otf"), s)


def f_italic(s):
    return ImageFont.truetype(TG + "texgyrepagella-italic.otf", s)


def f_kicker(s):
    return ImageFont.truetype(TG + "texgyrepagella-regular.otf", s)


_logo = None


def logo(width):
    global _logo
    if _logo is None:
        im = Image.open(LOGO_SRC).convert("RGB").crop((250, 185, 1286, 700))
        px = im.load()
        a = Image.new("L", im.size)
        ap = a.load()
        for y in range(im.size[1]):
            for x in range(im.size[0]):
                r, g, b = px[x, y]
                ap[x, y] = min(255, max(r, g, b) * 3)
        im = im.convert("RGBA")
        im.putalpha(a)
        _logo = im
    h = int(_logo.size[1] * width / _logo.size[0])
    return _logo.resize((width, h), Image.LANCZOS)


def wrap(d, text, font, maxw):
    out = []
    for par in text.split("\n"):
        words, line = par.split(" "), ""
        for w in words:
            t = (line + " " + w).strip()
            if d.textlength(t, font=font) <= maxw:
                line = t
            else:
                out.append(line)
                line = w
        out.append(line)
    return out


def text_block(d, xy, text, font, fill, maxw, gap=1.25):
    x, y = xy
    for ln in wrap(d, text, font, maxw):
        d.text((x, y), ln, font=font, fill=fill)
        y += int(font.size * gap)
    return y


def base(kicker, page, total):
    im = Image.new("RGB", (W, H), ONIX)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 10], fill=CHAMP)
    d.text((90, 90), kicker.upper(), font=f_kicker(30), fill=CHAMP)
    d.line([90, 140, 230, 140], fill=VINHO, width=3)
    d.text((W - 90, 90), f"{page}/{total}", font=f_kicker(28), fill=CINZA, anchor="ra")
    lg = logo(260)
    im.paste(lg, ((W - lg.size[0]) // 2, H - lg.size[1] - 55), lg)
    d.line([90, H - 200, W - 90, H - 200], fill=(60, 55, 48), width=1)
    return im, d


def slide(kicker, page, total, title, body, title_size=74, body_size=44,
          footnote=None, highlight=None, hl_after=False):
    im, d = base(kicker, page, total)
    y = text_block(d, (90, 200), title, f_title(title_size), CREME, W - 180, 1.12)
    y += 40
    if highlight and not hl_after:
        y = text_block(d, (90, y), highlight, f_body(body_size, True), CHAMP, W - 180, 1.35)
        y += 25
    if body:
        y = text_block(d, (90, y), body, f_body(body_size), CINZA, W - 180, 1.42)
    if highlight and hl_after:
        y += 35
        y = text_block(d, (90, y), highlight, f_body(body_size + 2, True), CHAMP, W - 180, 1.35)
    if footnote:
        text_block(d, (90, H - 320), footnote, f_body(25), (150, 143, 130), W - 180, 1.3)
    return im


FOTOS = os.path.join(_D, "..", "..", "kit", "fotos") + "/"


def photo_slide(kicker, page, total, foto, title, sub=None, credit=True, shift=330,
                title_size=82, colw=560, top=230, cta=None):
    """Capa/convite com foto de autoridade à direita e degradê ônix à esquerda."""
    im = Image.new("RGB", (W, H), ONIX)
    ph = Image.open(FOTOS + foto).convert("RGB")
    sc = H / ph.size[1]
    ph = ph.resize((int(ph.size[0] * sc), H), Image.LANCZOS)
    x0 = W - ph.size[0] + shift
    im.paste(ph, (x0, 0))
    # degradê horizontal (esquerda opaca) + vertical na base
    g = Image.new("L", (W, H), 0)
    gp = g.load()
    for x in range(W):
        a = 255 if x < 380 else max(0, int(255 * (1 - (x - 380) / 420)))
        for y in range(H):
            b = max(0, int(255 * (y - 950) / 400)) if y > 950 else 0
            gp[x, y] = max(a, b)
    im = Image.composite(Image.new("RGB", (W, H), ONIX), im, g)
    d = ImageDraw.Draw(im)
    d.rectangle([0, 0, W, 10], fill=CHAMP)
    d.text((90, 90), kicker.upper(), font=f_kicker(30), fill=CHAMP)
    d.line([90, 140, 230, 140], fill=VINHO, width=3)
    d.text((W - 90, 90), f"{page}/{total}", font=f_kicker(28), fill=CREME, anchor="ra")
    y = text_block(d, (90, top), title, f_title(title_size), CREME, colw, 1.1) + 30
    d.line([90, y, 190, y], fill=CHAMP, width=3)
    y += 35
    if sub:
        y = text_block(d, (90, y), sub, f_body(38), CREME if cta else CHAMP, colw - 20, 1.3)
    if cta:
        y = text_block(d, (90, y + 30), cta, f_body(40, True), CHAMP, colw - 20, 1.3)
    if credit:
        d.text((90, H - 300), "Diego Garcia", font=f_title(36), fill=CREME)
        d.text((90, H - 255), "Advogado tributarista · OAB/MG 104.770", font=f_italic(27), fill=CINZA)
        d.text((90, H - 220), "Fundador do Grupo Ciatos", font=f_italic(27), fill=CINZA)
    lg = logo(240)
    im.paste(lg, (W - lg.size[0] - 70, H - lg.size[1] - 55), lg)
    return im

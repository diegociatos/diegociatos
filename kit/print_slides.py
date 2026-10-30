# Slides com print real de matéria (o print vem do Diego)
from PIL import Image, ImageDraw, ImageFilter, ImageEnhance, ImageOps
from gerar import font, wrap, wordmark, avatar, W, H, GOLD, DARK, WHITE, INK, GRAY

def _framed(src, crop, hl=None, maxw=900, maxh=700, rot=-2):
    im = Image.open(src).convert("RGB").crop(crop)
    if hl:  # destaque dourado (coords relativas ao crop)
        d = ImageDraw.Draw(im); x0,y0,x1,y1 = hl
        d.rectangle([x0,y0,x1,y1], outline=GOLD, width=max(6, im.width//150))
    s = min(maxw/im.width, maxh/im.height); im = im.resize((int(im.width*s), int(im.height*s)), Image.LANCZOS)
    im = ImageOps.expand(im, border=14, fill=WHITE)
    sh = Image.new("RGBA", (im.width+60, im.height+60), (0,0,0,0)); ImageDraw.Draw(sh).rectangle([30,40,im.width+30,im.height+40], fill=(0,0,0,150))
    sh = sh.filter(ImageFilter.GaussianBlur(16)); sh.paste(im, (30,30))
    return sh.rotate(rot, resample=Image.BICUBIC, expand=True)

def capa_print(src, crop, gancho, apoio, out, selo="SAIU NO JORNAL", hl=None, fonte_txt=None, total=7):
    bg = Image.open(src).convert("RGB"); s = max(W/bg.width, H/bg.height)
    bg = bg.resize((int(bg.width*s)+2, int(bg.height*s)+2)).crop((0,0,W,H)).filter(ImageFilter.GaussianBlur(14))
    img = ImageEnhance.Brightness(bg).enhance(0.28); d = ImageDraw.Draw(img)
    cf = font("inter",600,28); ct=f"1/{total}"; cw=d.textlength(ct,font=cf)
    d.rounded_rectangle([W-80-cw-36,50,W-80,100],radius=25,fill=(255,255,255)); d.text((W-80-cw-18,58),ct,font=cf,fill=GRAY)
    pf = font("inter",800,30); pw = d.textlength(selo,font=pf)
    d.rounded_rectangle([80,50,80+pw+48,104],radius=27,fill=GOLD); d.text((104,60),selo,font=pf,fill=DARK)
    fr = _framed(src, crop, hl, maxh=620); img.paste(fr, ((W-fr.width)//2, 125), fr)
    y = 125 + fr.height - 10
    if fonte_txt: d.text((W-80-d.textlength(fonte_txt,font=font("inter",500,24)),y),fonte_txt,font=font("inter",500,24),fill=(200,200,200))
    y += 44
    size = 78
    while True:
        gf = font("inter",800,size); gl = wrap(d,gancho,gf,W-160)
        if len(gl) <= 3 or size <= 56: break
        size -= 4
    for l in gl: d.text((80,y),l,font=gf,fill=WHITE); y += int(size*1.12)
    y += 10
    for l in wrap(d,apoio,font("inter",500,38),W-160): d.text((80,y),l,font=font("inter",500,38),fill=GOLD); y += 50
    wordmark(img, H-110)
    img.save(out, quality=94)

def tweet_print(n, total, titulo, texto, src, crop, out, hl=None, fonte_txt=None):
    img = Image.new("RGB",(W,H),WHITE); d = ImageDraw.Draw(img); X=80
    cf = font("inter",600,28); ct=f"{n}/{total}"; cw=d.textlength(ct,font=cf)
    d.rounded_rectangle([W-80-cw-36,50,W-80,100],radius=25,fill=(235,235,235)); d.text((W-80-cw-18,58),ct,font=cf,fill=GRAY)
    y = 110; av = avatar(110); img.paste(av,(X,y),av)
    d.text((X+135,y+18),"Diego Ciatos",font=font("inter",800,40),fill=INK); d.text((X+135,y+66),"@diegociatos",font=font("inter",400,32),fill=GRAY)
    y += 140; tf = font("inter",800,48); tl = wrap(d,titulo,tf,W-2*X-40)
    d.rectangle([X,y+8,X+14,y+8+len(tl)*58-14],fill=GOLD)
    for l in tl: d.text((X+34,y),l,font=tf,fill=INK); y += 58
    y += 16; bf = font("inter",400,38)
    for l in wrap(d,texto,bf,W-2*X): d.text((X,y),l,font=bf,fill=INK); y += 50
    fr = _framed(src, crop, hl, maxw=920, maxh=H-y-170, rot=0)
    img.paste(fr, ((W-fr.width)//2, y), fr)
    if fonte_txt: d.text((X,H-80),fonte_txt,font=font("inter",500,26),fill=GRAY)
    img.save(out, quality=94)

if __name__ == "__main__":
    V = "/root/.claude/uploads/fa689c64-3864-58b1-b7b7-fff7aee7ebb4/ab4d9b3a-image.jpg"
    capa_print(V,(95,640,1345,1220),"O SENADO ACABOU COM A 6X1. QUEM VAI PAGAR ESSA CONTA?","A padaria da Dona Marta vai sentir primeiro.","teste_capa_print.jpg",selo="SAIU ONTEM",fonte_txt="Fonte: Valor Econômico, 15/10/2026")
    tweet_print(5,7,"A INDÚSTRIA JÁ AVISOU","A CNI soltou nota no mesmo dia: perdas, demissões e inflação.",V,(930,1570,1340,1735),"teste_tweet_print.jpg",fonte_txt="Fonte: Valor Econômico, 15/10/2026, p. 1")

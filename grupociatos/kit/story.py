import sys; sys.path.insert(0,'.')
from kit import *
def story(src, top, bottom, out):
    im=Image.new('RGB',(1080,1920),ONIX); d=ImageDraw.Draw(im)
    s=Image.open(src).resize((918,1148)); im.paste(s,(81,330))
    d.text((540,190),top,font=f_title(64),fill=CREME,anchor='mm')
    d.line([440,250,640,250],fill=CHAMP,width=3)
    text_block(d,(110,1530),bottom,f_body(46,True),CHAMP,860,1.3)
    im.save(out,quality=92)

import sys, os
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))
from kit import *
OUT = "saida_selic"; os.makedirs(OUT, exist_ok=True)
K = "Juros e crédito"; T = 7; s = []

s.append(photo_slide(K, 1, T, "terno_azul.png",
    "O Banco Central parou de cortar os juros. E agora?",
    sub="O que a Selic de 13,75% muda no caixa da sua empresa.", title_size=80))

s.append(slide(K, 2, T,
    "O que aconteceu",
    "Em 4 de novembro, o Copom manteve a Selic em 13,75% ao ano, por unanimidade, e interrompeu uma sequência de cinco cortes que tinha começado em 15%.\n\n"
    "O motivo: a inflação e as expectativas seguem acima da meta de 3%.",
    footnote="Fontes: Banco Central, comunicado da 282ª reunião do Copom (04/11/2026). O boletim Focus projeta IPCA de 5,2% em 2026."))

im = slide(K, 3, T,
    "A Selic é o piso. O banco cobra muito mais.",
    "Em setembro, o juro médio cobrado das empresas no crédito livre foi de 24,4% ao ano, segundo o Banco Central.",
    footnote="Fonte: Banco Central, estatísticas de crédito de setembro/2026 (divulgadas em 29/10). Exemplo ilustrativo, juros simples, sem tarifas e IOF.")
d = ImageDraw.Draw(im)
d.text((90, 640), "R$ 24 mil", font=f_title(130), fill=CHAMP)
text_block(d, (90, 800), "por ano em juros para cada R$ 100 mil emprestados. Cerca de R$ 2 mil por mês.",
           f_body(42), CINZA, W - 180, 1.4)
s.append(im)

s.append(slide(K, 4, T,
    "Quando a dívida cresce mais rápido que o lucro",
    "Uma empresa que rola R$ 300 mil a 24,4% ao ano, sem amortizar, chega a cerca de R$ 464 mil em dois anos.\n\n"
    "Se a margem do negócio é menor que o juro da dívida, cada mês de espera deixa a conta maior.",
    highlight="O problema não é ter dívida. É ter dívida mais cara do que o negócio consegue pagar.",
    hl_after=True, body_size=38,
    footnote="Exemplo ilustrativo: juros compostos anuais, sem pagamentos no período."))

s.append(slide(K, 5, T,
    "E a proposta de cortar os juros mais rápido?",
    "O economista André Lara Resende propõe levar a Selic a 7,5% em cerca de 12 meses, para aliviar a dívida pública. "
    "Críticos apontam risco de mais inflação e de alta do dólar. O ministro da Fazenda afirmou que a proposta não está em discussão.",
    highlight="Para a sua empresa, a lição é a mesma: não planeje o caixa contando com juros baixos.",
    hl_after=True, body_size=40,
    footnote="Fontes: Nexo (03/11/2026), Seu Dinheiro (02/11/2026), Valor Econômico (05/11/2026)."))

s.append(slide(K, 6, T,
    "O que fazer agora",
    "1. Liste todas as dívidas com taxa, prazo, garantia e custo efetivo total (CET).\n\n"
    "2. Troque a dívida mais cara pela mais barata e alongue prazos: renegociar antes de atrasar dá mais poder na mesa.\n\n"
    "3. Projete o caixa das próximas 13 semanas e corte o que não gira.",
    body_size=40,
    footnote="Conteúdo informativo. Não é recomendação financeira."))

s.append(photo_slide(K, 7, T, "cafe_camisa_branca.png",
    "Sua empresa está pagando juros demais?",
    sub="A Ciatos Soluções, do Grupo Ciatos, organiza o passivo, define prioridades e estrutura o plano de caixa e de negociação.",
    cta="Comente JUROS ou chame no WhatsApp (31) 99712-9789", credit=False, shift=680, title_size=70))
d = ImageDraw.Draw(s[-1])
text_block(d, (90, H - 330), "Conteúdo informativo. Cada caso exige análise individual.", f_italic(26), CINZA, 560, 1.3)

for i, im in enumerate(s, 1):
    im.save(f"{OUT}/selic_{i:02d}.jpg", quality=92)
c = Image.new('RGB', (360 * 4, 900), 'white')
for i in range(7):
    c.paste(s[i].resize((360, 450)), ((i % 4) * 360, (i // 4) * 450))
c.save(f"{OUT}/contato.jpg")
print("ok")

import sys; import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from gerar import tweet, capa_tweet
T=7; o='tema843/t843'
capa_tweet('O Estado deu um incentivo para a fábrica da Dona Helena continuar aberta. A Receita chamou o incentivo de faturamento e cobrou PIS e Cofins em cima dele.','O STF acabou de dizer que não pode. Tema 843 · 7 a 4.','%s_01.jpg'%o,T)
S=[
("QUEM É A DONA HELENA",["Ela tem uma indústria de laticínios no interior de Minas. São **80 funcionários**, quase todos da mesma cidade.","Para manter a fábrica ali, o Estado concedeu um **crédito presumido de ICMS**: na prática, um desconto no imposto.","(História ilustrativa.)"],None,None),
("ELA FEZ TUDO CERTO",["O benefício está previsto em **lei estadual**.","Ela usou para segurar os empregos e manter o preço do queijo competitivo.","Nenhum dinheiro novo entrou no caixa. É **imposto que ela deixou de pagar**."],None,None),
("A CONTA QUE VEIO",["Para a Receita, esse desconto era **receita**. E receita paga **PIS e Cofins**: 9,25% no lucro real.","Se o crédito é de **R$ 1 milhão por ano**, são **R$ 92.500 por ano** de PIS/Cofins.","Em 5 anos, **R$ 462.500**. (Conta ilustrativa.)"],None,None),
("O QUE O STF DECIDIU",["Em **07/10/2026**, o Plenário fechou a questão a favor das empresas:"],{"veiculo":"Tema 843 · RE 835.818","manchete":"\"Surge incompatível, com a Constituição Federal, a inclusão de créditos presumidos do ICMS na base de cálculo da Cofins e da contribuição ao PIS.\"","ficha":[["Tribunal","STF · Plenário"],["Placar","7 a 4"],["Relator","Min. Marco Aurélio (aposentado)"],["Data","07/10/2026"]]},"Julgamento iniciado em 2021: há votos de ministros já aposentados."),
("GANHOU. AGORA, ATENÇÃO",["• O acórdão **ainda não foi publicado**.","• A Fazenda pode pedir **modulação** nos embargos. Quem não tiver ação pode ficar sem o passado.","• Ainda não está claro se vale para a regra da **Lei 14.789/2023** (desde 2024).","• Recuperação: em regra, **últimos 5 anos**."],None,"Cada caso exige análise individual."),
("SUA EMPRESA TEM INCENTIVO DE ICMS?",["Indústria, atacado, agro, importação com benefício estadual...","Comenta **\"843\"** que eu te mostro como levantar quanto você pagou a mais.","WhatsApp (31) 99110-0349"],None,None),
]
for i,(t,p,f,r) in enumerate(S,start=2): tweet(i,T,t,p,'%s_%02d.jpg'%(o,i),f,r)
ims=[Image.open('%s_%02d.jpg'%(o,i)).convert('RGB') for i in range(1,T+1)]
for i,im in enumerate(ims,1): im.save('%s_%02d.jpg'%(o,i),quality=88)
c=Image.new('RGB',(1440,900),'white')
for j,im in enumerate(ims): c.paste(im.resize((360,450)),((j%4)*360,(j//4)*450))
c.save('tema843/prev.jpg')

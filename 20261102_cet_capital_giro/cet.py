import sys; import os; sys.path.insert(0,os.path.dirname(os.path.abspath(__file__)))
from PIL import Image
from gerar import tweet, capa_tweet
T=7; o='cet/cet'
capa_tweet('A Selic caiu cinco vezes seguidas este ano. O Marcos abriu o extrato do capital de giro da empresa e a taxa dele não tinha caído nada.','Ele esperou o banco baixar sozinho. Esse foi o erro.','%s_01.jpg'%o,T)
S=[
("QUEM É O MARCOS",["Ele tem uma distribuidora em BH, com **R$ 500 mil** de capital de giro no banco.","Quando ouviu que a Selic estava caindo, pensou: \"Agora meus juros vão cair também.\"","(História ilustrativa.)"],None,None),
("O QUE ELE FEZ",["Nada. Renovou o giro **no automático**, olhando só se a parcela cabia no caixa.","Não pediu o **CET** por escrito.","Não cotou em outra instituição.","Não levou números da empresa para a mesa."],None,None),
("O RESULTADO",["Entre mar/2026 e set/2026, a Selic caiu de **15% para 13,75%**.","Mas o juro médio do crédito livre para empresas fechou setembro em **24,4% ao ano**: **0,2 ponto acima** de um ano antes (Banco Central).","Em R$ 500 mil, a **24,4%** dão cerca de **R$ 122 mil de juros por ano**. Cada 1 ponto a menos vale **R$ 5 mil/ano**. (Conta ilustrativa.)"],None,None),
("O QUE ELE PODERIA TER FEITO",["Entender que o juro do banco é **Selic + spread**. O spread é o preço do **risco que o banco enxerga** em você. A Selic cai sozinha; o spread, não."],{"veiculo":"Banco Central · dados de set/2026","manchete":"Selic em 13,75% desde 17/09/2026. Juro médio do crédito livre PJ: 24,4% a.a. O giro acima de 1 ano subiu 1,4 ponto no mês.","ficha":[["Selic","13,75% a.a. (Copom 16/09/2026)"],["Juro PJ livre","24,4% a.a. (set/2026)"],["Divulgação","BC · 29/10/2026"],["Próx. Copom","3 e 4/11/2026"]]},None),
("O QUE VOCÊ FAZ AMANHÃ",["**1.** Peça o **CET por escrito** (juros + tarifas + IOF + seguros) e compare em **3 instituições**, incluindo cooperativa.","**2.** Mostre menos risco: balanço e fluxo de caixa em dia, **recebíveis** como garantia.","**3.** Leve a melhor proposta ao seu banco e peça para cobrir.","Limite: a taxa depende do risco da sua empresa. Aval pessoal do sócio tem custo: pense antes de dar."],None,"Cada caso exige análise individual."),
("VOCÊ SABE QUANTO PAGA HOJE?",["Se eu te perguntar agora o **CET** do seu capital de giro, você responde de cabeça?","Comenta **\"CET\"** que eu te mostro como chegar preparado na mesa do banco.","WhatsApp (31) 99110-0349"],None,None),
]
for i,(t,p,f,r) in enumerate(S,start=2): tweet(i,T,t,p,'%s_%02d.jpg'%(o,i),f,r)
ims=[Image.open('%s_%02d.jpg'%(o,i)).convert('RGB') for i in range(1,T+1)]
for i,im in enumerate(ims,1): im.save('%s_%02d.jpg'%(o,i),quality=88)
c=Image.new('RGB',(1440,900),'white')
for j,im in enumerate(ims): c.paste(im.resize((360,450)),((j%4)*360,(j//4)*450))
c.save('cet/prev.jpg')

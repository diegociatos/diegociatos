import sys,os; sys.path.insert(0,'/home/claude/midia_repo/kit')
from PIL import Image
from gerar import tweet, capa3
T=7; o='so'
capa3('fundo.jpg','/home/claude/midia_repo/kit/fotos/terno_azul.png','STJ · TEMA 1.379',
 'Ele pagou o melhor diretor com ações da empresa. A Receita mandou a conta do INSS.',
 'O STJ decidiu: não pode. Unânime.','Stock options · julgado em 14/10/2026','%s_01.jpg'%o)
S=[
("QUEM É O MARCOS",["Ele é sócio de uma empresa de software em BH, com **60 funcionários**, organizada como **S.A.**","Precisava segurar o diretor de tecnologia, disputado pelo mercado, mas **não tinha caixa** para um salário de multinacional.","A saída: um **plano de opção de compra de ações** (stock options).","(História ilustrativa.)"],None,None),
("ELE FEZ TUDO CERTO",["O plano foi **aprovado em assembleia**, dentro do capital autorizado, como manda o **art. 168, § 3º, da Lei 6.404/1976**.","O diretor só podia comprar depois de **3 anos** na empresa e **pagava o preço** das ações com o próprio dinheiro.","Se a empresa não crescesse, a opção não valeria nada. **Risco real.**"],None,None),
("A CONTA QUE VEIO",["Na hora em que o diretor exerceu a opção, a Receita entendeu que aquilo era **salário disfarçado**.","Ganho no exercício: **R$ 500 mil**.","Cobrança: **R$ 129 mil** (20% patronal + 5,8% de terceiros, por exemplo), fora multa e juros.","(Conta ilustrativa.)"],None,None),
("O QUE O STJ DECIDIU",["Em **14/10/2026**, a Primeira Seção julgou o tema como **repetitivo**:"],{"veiculo":"Tema 1.379 · REsp 2.199.631/SP e 2.070.059/SP","manchete":"\"No regime do stock option plan previsto no art. 168, § 3º, da Lei n. 6.404/1976\" (...), não incidem contribuição patronal nem contribuições a terceiros no exercício da opção. (síntese)","ficha":[["Tribunal","STJ · 1ª Seção"],["Placar","Unânime"],["Relator","Min. Sérgio Kukina"],["Data","14/10/2026"]]},"Base: natureza mercantil, já reconhecida no Tema 1.226."),
("O QUE MUDA PARA VOCÊ",["• Plano de stock options **bem desenhado** não é folha: sem INSS patronal e terceiros no exercício.","• O imposto de renda do beneficiário fica para a **venda das ações com lucro** (Tema 1.226).","• **Limites:** a tese é para o plano do art. 168 (S.A.). Plano sem risco, sem pagamento ou com cara de bônus pode ficar de fora.","• Pagou no passado? Em regra, dá para discutir os **últimos 5 anos**."],None,"Cada caso exige análise individual."),
("VOCÊ QUER SEGURAR UM TALENTO SEM ESTOURAR A FOLHA?",["Transformar seu melhor profissional em sócio pode ser a melhor decisão do ano, se o plano for feito do jeito certo.","Comenta **\"SÓCIO\"** que eu te mostro o caminho.","WhatsApp (31) 99110-0349"],None,None),
]
for i,(t,p,f,r) in enumerate(S,start=2): tweet(i,T,t,p,'%s_%02d.jpg'%(o,i),f,r)
ims=[Image.open('%s_%02d.jpg'%(o,i)).convert('RGB') for i in range(1,T+1)]
for i,im in enumerate(ims,1): im.save('%s_%02d.jpg'%(o,i),quality=88)
c=Image.new('RGB',(1440,900),'white')
for j,im in enumerate(ims): c.paste(im.resize((360,450)),((j%4)*360,(j//4)*450))
c.save('/tmp/claude-0/-home-claude-diegociatos/96bb7e0a-efdb-595d-b850-8d28a0173904/scratchpad/prev_so.jpg')

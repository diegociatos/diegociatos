# Kit de artes — Grupo Ciatos (padrão desde 05/11/2026)

- `kit.py`: lâminas 1080×1350. `slide()` = lâmina de texto (fundo ônix, título creme, destaque champanhe, logo no rodapé). `photo_slide()` = capa/convite com foto do Diego à direita, degradê ônix à esquerda, crédito "Diego Garcia · Advogado tributarista · OAB/MG 104.770 · Fundador do Grupo Ciatos" e logo no canto.
- Fonte: Palatino (TeX Gyre Pagella, em `fonts/`) = mesmo desenho da Book Antiqua, preferência do Diego.
- Fotos do Diego: `../../kit/fotos/` (terno_marinho, terno_azul, escritorio_gesto, sentado_escritorio, cafe_camisa_branca, cafe_explicando, viagem_casual). Alterne; não repita a mesma foto em dias seguidos. Use `shift` para tirar o rosto de baixo do texto.
- `story.py`: `story(lamina, topo, rodape, saida)` monta o story 9:16 a partir de uma lâmina.
- Modelo completo: `exemplo_selic.py` (rode de dentro da pasta kit).
- Sempre abrir cada lâmina com Read e conferir letra por letra antes de publicar.

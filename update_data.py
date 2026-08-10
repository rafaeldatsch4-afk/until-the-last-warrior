import re

with open('game/data.ts', 'r') as f:
    content = f.read()

descriptions = {
    "goku": "Um guerreiro Saiyajin criado na Terra. Famoso por sua fome e por ficar mais forte após cada batalha.",
    "vegeta": "O príncipe da raça Saiyajin. Extremamente orgulhoso e rival declarado de Goku.",
    "gohan": "Filho de Goku. Tem um potencial oculto tremendo, especialmente quando provocado.",
    "piccolo": "Um guerreiro Namekuseijin sábio e mestre de táticas em combate.",
    "madara": "Lenda do clã Uchiha, cujo nome causa terror em seus inimigos.",
    "cell": "A criação suprema, absorve seus inimigos para alcançar a perfeição.",
    "leonardo": "O líder das tartarugas. Combate com honra empunhando duas katanas.",
    "naruto": "O ninja número um hiperativo e cabeça oca, com uma reserva de chakra imensa.",
    "sasuke": "Sobrevivente do clã Uchiha, mestre em jutsus de fogo e relâmpago.",
    "spiderman": "Um herói ágil de Nova York, usa teias para se mover rapidamente e prender inimigos.",
    "thukuna": "O Rei das Maldições. Desencadeia ataques cortantes impiedosos.",
    "cyberninja": "Assassino do futuro. Velocidade extrema e ataques de plasma.",
    "obito": "Ninja mascarado com poderes oculares que manipulam o espaço-tempo.",
    "itachi": "Gênio pacifista que sacrificou tudo. Utiliza ilusões genjutsu mortais.",
    "jotaro": "Usuário de stand frio e calculista, com golpes extremamente rápidos.",
    "saitama": "Um herói por diversão. Capaz de derrotar qualquer inimigo com um único soco."
}

def replacer(match):
    key = match.group(1)
    desc = descriptions.get(key, "Um poderoso lutador pronto para a batalha.")
    return f'key: "{key}",\n    description: "{desc}",'

content = re.sub(r'key:\s*"([^"]+)",', replacer, content)

with open('game/data.ts', 'w') as f:
    f.write(content)
print("Updated data.ts descriptions")

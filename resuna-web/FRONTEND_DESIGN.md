# Guia de Estilos e Design Frontend — Resuna

## 1. Princípios de Design (Vintage Mac / System 7)
- **Inspirado no Classic Mac OS (1984-1999)**: Interface tátil, nostálgica, com elementos que parecem botões físicos e janelas de computador antigas.
- **Brutalismo Elegante**: Uso de bordas duras (1px solid black), sombras projetadas sólidas (sem blur) e fundos cinza/bege.
- **Tom e Voz**: Direto, como um sistema operacional clássico, mas mantendo a funcionalidade moderna.

## 2. Tipografia
- **Família Principal**: `Chicago`, `Geneva`, ou fontes pixeladas modernas como `VT323` ou `Press Start 2P` para títulos, combinadas com uma sans-serif muito básica (como Arial ou Helvetica) para o texto corrido, simulando a renderização antiga.
- **Mono (Dados/Tags)**: `Courier` ou `VT323`.

## 3. Paleta de Cores
- **Fundos (Desktop Pattern)**: 
  - Background Principal: `#E5E5E5` (Cinza clássico do Mac) ou um padrão de xadrez sutil (dither pattern).
  - Janelas e Cards: `#FFFFFF` (Branco puro) com barras de título listradas.
- **Texto**: 
  - Principal: `#000000` (Preto puro).
  - Secundário: `#333333`.
- **Ação e Destaque**: 
  - Azul Clássico (`#0000AA`) para seleções e botões primários, ou manter o Terracota (`#F97316`) como um toque moderno no design retrô.
- **Bordas e Sombras**:
  - `#000000` para bordas externas.
  - `#FFFFFF` e `#888888` para criar o efeito de chanfro (bevel) 3D.

## 4. Elementos de Interface (UI Components)
- **Botões**: 
  - Estilo "Bevel": Bordas superior/esquerda brancas, inferior/direita cinza escuro, fundo cinza claro. Quando clicado (active), as cores se invertem para dar a sensação de afundar.
  - Texto em negrito, centralizado.
- **Cards (Janelas)**: 
  - Borda preta de 1px ou 2px.
  - Barra de título no topo (com listras horizontais e um botão de fechar quadrado no canto).
  - Sombra sólida (ex: `box-shadow: 4px 4px 0px #000000`).
- **Inputs**: Fundo branco, borda "inset" (afundada), texto preto.

## 5. Sombras, Texturas e Profundidade
- **Zero Blur**: Nenhuma sombra deve ter desfoque. Tudo é sólido (hard shadows).
- **Dithering**: Uso de padrões de pixels alternados em vez de gradientes ou transparências (alpha).
- **Profundidade**: Criada estritamente através de bordas de alto contraste (branco vs cinza escuro) para simular luz e sombra diretas.

## 6. Padrões de Código CSS/Tailwind
- **Variáveis CSS**: Cores base definidas no `globals.css` e mapeadas no `tailwind.config.ts`.
- **Utilitários Tailwind**: Criar plugins ou classes utilitárias no `globals.css` para os efeitos de chanfro (`.btn-vintage`, `.window-vintage`), pois o Tailwind padrão não tem utilitários fáceis para bordas 3D clássicas.
- **Animações**: Nenhuma animação de transição suave. As mudanças de estado (hover, active) devem ser instantâneas, como nos computadores antigos.

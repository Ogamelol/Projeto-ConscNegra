const CONFIG = {
  largura: 640,
  altura: 480,
  fundo: "assets/fundo.png",     
  corFundo: "#9ccf8a",
  raioAtivacao: 40,            
  distanciaMinimaPontos: 60,    
  posicoesAleatorias: true,    
};

// acima são as configurações gerais do mapa e os poppups.

const JOGADOR = {
  x: 100,                       
  y: 100,
  velocidade: 4,                
  largura: 64,
  altura: 64,
  olhaPara: "direita",          
};
// Aqui em cima, é as questões do jogador. Não vou me extender, é simples.

/* Aqui em baixo, eu reutilizei a ideia dos portraits na visual novel do outro projeto,
 * já a ideia de troca de sprite é a mesma, então não valia a pena trocar, mas com um
 * porém, já que agora funciona como uma animação. Não significa que vou fazer uma complexa. Bruh.*/
 
const ANIMACOES = {
  parado: {
    frames: ["assets/parado1.png", "assets/parado2.png"],
    fps: 2,
  },
  andando: {
    frames: ["assets/andando1.png", "assets/andando2.png"],
    fps: 4,
  },
};

/* Aqui são onde as entidades dos pontos são concebidas, e tambem de onde o HTMl tira o texto do poppup */
const PONTOS = [
  { x: 150, y: 200, visitado: false, titulo: "História do dia da consciência negra", descricao: "O dia da consciência negra é celebrado em todo o país durante o dia 20 de novembro, data essa que marca a morte de Zumbi dos Palmares." },
  { x: 480, y: 90,  visitado: false, titulo: "Pré-Criação", descricao: "Em 1971, universitários se juntaram para criar o grupo palmares, em Porto Alegre (RS). O grupo tinha como objetivo protestar contra um certo veto e discutir a situação do negro." },
  { x: 540, y: 330, visitado: false, titulo: "Criação", descricao: "Mas então, foi-se discutido a criação de um data para celebrar a cultura negra. O dia 13 de Maio era usado para este fim, mas muitas pessoas não se sentiam representadas pelo contexto." },
  { x: 300, y: 400, visitado: false, titulo: "Criação", descricao: "Ao ouvirem sobre a história do quilombo de Palmares e seu líder, zumbi, foi decidido usar a data de sua morte para a celebração. E então, em 1978, a data é proposta pelo MNU." },
  { x: 320, y: 180, visitado: false, titulo: "Criação", descricao: "O processo foi exageradamente lento, mas em 2011, o dia da consciência negra foi instituido em todo o Brasil, sendo celebrado no calendário escolar desde 2003." },
  { x: 80,  y: 390, visitado: false, titulo: "A partir disso...", descricao: "E por isso, no dia 18 de Novembro de 2026, a escola técnica Etec Antônio Furlan estará celebrando a data em um super-projeto!" },
];

/* O de fim... mesma coisa, mas ele só ativa quando todos os pontos são coletados */
const FINAL = {
  titulo: "Fim",
  descricao: "Você encontrou todos os pontos, acabou!",
};

/* Aqui já é as funções. Essa primeira serve pra colocar uma distância minima entre os pontos */

function distancia(a, b) {
  return Math.hypot(a.x - b.x, a.y - b.y);
}

// essa segunda avalia se a posição tá valida (dentro da tela e longe de outros pontos) ou não.

function posicaoValida(novoPonto, pontos) {
  return pontos.every(ponto =>
    distancia(novoPonto, ponto) > CONFIG.distanciaMinimaPontos
  );
}

// Aqui é onde checa se o ponto foi visitado

function proximoPonto() {
  return PONTOS.find(p => !p.visitado);
}

function verificarPontos() {
  const ponto = proximoPonto();
  if (!ponto) return; // todos já foram visitados

  if (distancia(JOGADOR, ponto) < CONFIG.raioAtivacao) {
    abrirPopup(ponto.titulo, ponto.descricao, ponto);
  }
}

/* Aqui é o motor. Inclusive, não expliquei direito ele na ultima né? basicamente... funciona como um motor!
 * (ava) a tela atualiza 60 vezes por segundo, e toda vez, esse motor é lido e "redesenha" a tela, ele sempre tá rodando
 * resumidamente. Eu não vi apresentar erros até agora, então... */
 

const canvas = document.getElementById("tela");
const ctx = canvas.getContext("2d");
canvas.width = CONFIG.largura;
canvas.height = CONFIG.altura;
ctx.imageSmoothingEnabled = false; // já que é com pixel art, vi recomendarem usar isso aqui pra manter bem pixelado

const popupEl = document.getElementById("popup");
const tituloEl = document.getElementById("titulo");
const descricaoEl = document.getElementById("descricao");
const continuarEl = document.getElementById("continuar");

/* Aqui é só as imagens, não fiz nada de especial dessa vez. É só ler e você
 * vai perceber que eu só tô puxando lá de cima. */
 

function carregarImagem(src) {
  const img = new Image();
  img.src = src;
  return img;
}

function pronta(img) {
  return img && img.complete && img.naturalWidth > 0;
}

const fundoImg = carregarImagem(CONFIG.fundo);
for (const anim of Object.values(ANIMACOES)) {
  anim.imgs = anim.frames.map(carregarImagem);
}

/* Isso são os controles. Já que é pra funcionar no pc e celular.
 * Pontua o alvo pro touch, e o que delimita a opção de se mexer, vulgo poppup */
 

const teclas = new Set();
let alvo = null;               
let popupAberto = false;
let finalMostrado = false;
let viradoEsquerda = false;
let estadoAnim = "parado";
let tempoAnim = 0;

/* config das teclas */

const MAPA_TECLAS = {
  w: "cima", arrowup: "cima",
  s: "baixo", arrowdown: "baixo",
  a: "esq", arrowleft: "esq",
  d: "dir", arrowright: "dir",
};

document.addEventListener("keydown", (e) => {
  if (popupAberto) {
    if (e.key === "Enter" || e.key === "Escape" || e.key === " ") {
      e.preventDefault();
      fecharPopup();
    }
    return;
  }
  const direcao = MAPA_TECLAS[e.key.toLowerCase()];
  if (direcao) {
    e.preventDefault();
    teclas.add(direcao);
    alvo = null; // Eu vou explicar isso pq parece sem sentido aqui, mas tem sentido sim. É pro teclado cancelar o touch!
  }              // agora pra que? missclicks.
});

document.addEventListener("keyup", (e) => {
  const direcao = MAPA_TECLAS[e.key.toLowerCase()];
  if (direcao) teclas.delete(direcao);
});

window.addEventListener("blur", () => teclas.clear());

/* Aqui usa do pointer down pros controles do touch. Só isso de interessante. */

canvas.addEventListener("pointerdown", (e) => {
  if (popupAberto) return;
  const r = canvas.getBoundingClientRect();
  alvo = {
    x: (e.clientX - r.left) * (canvas.width / r.width),
    y: (e.clientY - r.top) * (canvas.height / r.height),
  };
});

/* Aqui são os poppups, pode-se dizer que eles tecnicamente funcionam parecido com
 * as caixas de texto do outro projeto, mas... Inclusive, reutilizei a hud de lá kkkkkkk */
 

function abrirPopup(titulo, descricao, ponto) {
  if (ponto) ponto.visitado = true;
  popupAberto = true;
  teclas.clear();
  alvo = null;
  tituloEl.textContent = titulo;
  descricaoEl.textContent = descricao;
  popupEl.hidden = false;
  continuarEl.focus({ preventScroll: true });
}

function fecharPopup() {
  popupEl.hidden = true;
  popupAberto = false;

  if (FINAL && !finalMostrado && PONTOS.every(p => p.visitado)) {
    finalMostrado = true;
    abrirPopup(FINAL.titulo, FINAL.descricao);
  }
}

continuarEl.addEventListener("click", fecharPopup);

/* Aqui são as posições dos pontos. nao só entre pontos, mas tambem entre o jogador e bordas */

function sortearPosicoes() {
  const margem = 40;
  const colocados = [JOGADOR]; 
  for (const ponto of PONTOS) {
    let tentativas = 0;
    do {
      ponto.x = margem + Math.random() * (CONFIG.largura - margem * 2);
      ponto.y = margem + Math.random() * (CONFIG.altura - margem * 2);
      tentativas++;
    } while (!posicaoValida(ponto, colocados) && tentativas < 500);
    colocados.push(ponto);
  }
}

function validarPontos() {
  PONTOS.forEach((ponto, i) => {
    if (!posicaoValida(ponto, PONTOS.slice(0, i))) {
      console.warn(`Ponto ${i + 1} está perto demais de outro ponto.`);
    }
  });
}

/* ... Basicmente, o melhor amigo do motor. aqui vai ser a logica, e tambem o que vai
 * gerenciar a atualização do motor, pra literalmente quase tudo que atualiza na tela. */
 

function atualizar(dt) {
  tempoAnim += dt;
  if (popupAberto) return;

  const passo = JOGADOR.velocidade * dt * 60;
  let dx = 0;
  let dy = 0;

  if (teclas.has("esq")) dx -= 1;
  if (teclas.has("dir")) dx += 1;
  if (teclas.has("cima")) dy -= 1;
  if (teclas.has("baixo")) dy += 1;

  if (!dx && !dy && alvo) {
    const vx = alvo.x - JOGADOR.x;
    const vy = alvo.y - JOGADOR.y;
    const dist = Math.hypot(vx, vy);
    if (dist <= passo) {
      JOGADOR.x = alvo.x;
      JOGADOR.y = alvo.y;
      alvo = null;
    } else {
      dx = vx / dist;
      dy = vy / dist;
    }
  }

  const tamanho = Math.hypot(dx, dy);
  const andando = tamanho > 0;

  if (andando) {
    JOGADOR.x += (dx / tamanho) * passo;
    JOGADOR.y += (dy / tamanho) * passo;
    if (dx < 0) viradoEsquerda = true;
    else if (dx > 0) viradoEsquerda = false;
  }

  // aqui em baixo é a colisão. Você provacelmente não ouviu do termo em desenvolvimento de jogos, mas
  // isso aqui é o que impede o jogador de só andar pra fora da tela. é uma parede invisivel.
  JOGADOR.x = Math.max(JOGADOR.largura / 2, Math.min(CONFIG.largura - JOGADOR.largura / 2, JOGADOR.x));
  JOGADOR.y = Math.max(JOGADOR.altura / 2, Math.min(CONFIG.altura - JOGADOR.altura / 2, JOGADOR.y));

  // Isso é para trocar os frames da animação.
  const novoEstado = andando ? "andando" : "parado";
  if (novoEstado !== estadoAnim) {
    estadoAnim = novoEstado;
    tempoAnim = 0;
  }

  verificarPontos();
}

/* funcões para desenhar não só o jogo e pontos como o jogador também. literalmente, se você
 * tirar as imagens, ainda vai ter um quadrado vermelho que pisca representando o jogador. Isso
 * é hiper comum em game dev pois deixa você trabalhar no código antes de trabalhar nas sprites.
 * Só vi em jogo com pixel art por outro lado, em jogos 3d se usam formas simples.*/
 

function desenharPontos(t) {
  const proximo = proximoPonto();

  PONTOS.forEach((ponto, i) => {
    const ehProximo = ponto === proximo;
    if (!ponto.visitado && !ehProximo && !CONFIG.mostrarPontosFuturos) return;

    ctx.beginPath();
    if (ponto.visitado) {
      ctx.fillStyle = "#b9b9b9";
      ctx.arc(ponto.x, ponto.y, 8, 0, Math.PI * 2);
      ctx.fill();
    } else if (ehProximo) {
      const pulso = 4 * Math.sin(t * 4);
      ctx.strokeStyle = "#fff0d9";
      ctx.lineWidth = 3;
      ctx.arc(ponto.x, ponto.y, 14 + pulso, 0, Math.PI * 2);
      ctx.stroke();
      ctx.beginPath();
      ctx.fillStyle = "#ffd34d";
      ctx.arc(ponto.x, ponto.y, 9, 0, Math.PI * 2);
      ctx.fill();
    } else {
      ctx.globalAlpha = 0.45; 
      ctx.fillStyle = "#ffd34d";
      ctx.arc(ponto.x, ponto.y, 9, 0, Math.PI * 2);
      ctx.fill();
      ctx.globalAlpha = 1;
    }

    
    ctx.save();
    ctx.fillStyle = "#5a3622";
    ctx.font = "bold 12px Georgia, serif";
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.restore();
  });
}

function desenharJogador() {
  const anim = ANIMACOES[estadoAnim];
  const indice = Math.floor(tempoAnim * anim.fps) % anim.imgs.length;
  const img = anim.imgs[indice];
  const w = JOGADOR.largura;
  const h = JOGADOR.altura;
  const inverter = JOGADOR.olhaPara === "direita" ? viradoEsquerda : !viradoEsquerda;

  ctx.save();
  ctx.translate(Math.round(JOGADOR.x), Math.round(JOGADOR.y));
  if (inverter) ctx.scale(-1, 1);

  if (pronta(img)) {
    ctx.drawImage(img, -w / 2, -h / 2, w, h);
  } else {
    
    ctx.fillStyle = indice % 2 ? "#d9534f" : "#a94442";
    ctx.fillRect(-w / 2, -h / 2, w, h);
    ctx.fillStyle = "#fff";
    ctx.fillRect(4, -6, 6, 6); // isso aqui é o mini quadradinho branco pra saber a direção do quadrado pq eu não tava percebendo pra onde ele tava "olhando"
  }
  ctx.restore();
}

function desenhar(t) {
  if (pronta(fundoImg)) {
    ctx.drawImage(fundoImg, 0, 0, CONFIG.largura, CONFIG.altura);
  } else {
    ctx.fillStyle = CONFIG.corFundo;
    ctx.fillRect(0, 0, CONFIG.largura, CONFIG.altura);
  }

  desenharPontos(t);

  if (alvo) {
    ctx.strokeStyle = "rgb(255 255 255 / 70%)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(alvo.x, alvo.y, 6, 0, Math.PI * 2);
    ctx.stroke();
  }

  desenharJogador();

  // HUd do contador. Nao tem o pq explicar.
  const total = PONTOS.length;
  const visitados = PONTOS.filter(p => p.visitado).length;
  ctx.font = "bold 18px Georgia, serif";
  ctx.textBaseline = "top";
  ctx.lineWidth = 4;
  ctx.strokeStyle = "#5a3622";
  ctx.fillStyle = "#fff0d9";
  ctx.strokeText(`Pontos: ${visitados}/${total}`, 12, 10);
  ctx.fillText(`Pontos: ${visitados}/${total}`, 12, 10);
}

/* o pai do motor, é isso que vai fazer ele rodar a 60 frames por segundo */

let ultimo = performance.now();

function loop(agora) {
  const dt = Math.min((agora - ultimo) / 1000, 0.05); 
  ultimo = agora;
  atualizar(dt);
  desenhar(agora / 1000);
  requestAnimationFrame(loop);
}

if (CONFIG.posicoesAleatorias) sortearPosicoes();
else validarPontos();

requestAnimationFrame(loop);

// ACABOOOOOOOOOOOOOOOOOOOUUUUUUUUUU AHHAHAHAHAHAHAHAHAHAHAHAHAHAHAHAHHAHAHAHAHAHAHHAHAHHA
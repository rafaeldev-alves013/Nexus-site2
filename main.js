/* ==========================================================================
   Nexus v2 — interações
   GSAP + ScrollTrigger + Lenis + Lucide (via CDN). Tudo degrada bem:
   se uma biblioteca não carregar ou se o usuário preferir menos movimento,
   o conteúdo continua visível e funcional.
   ========================================================================== */

(function () {
  'use strict';

  // ---------- Contexto ----------
  const reduzMov = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const ponteiroFino = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  const ehMobile = () => window.matchMedia('(max-width: 767px)').matches;
  const temGsap = !!(window.gsap && window.ScrollTrigger);
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => Array.from(el.querySelectorAll(s));

  if (temGsap) gsap.registerPlugin(ScrollTrigger);

  // ---------- Ícones Lucide ----------
  if (window.lucide) lucide.createIcons({ attrs: { 'aria-hidden': 'true' } });

  // Ano do rodapé
  const ano = $('#ano');
  if (ano) ano.textContent = new Date().getFullYear();

  // ---------- Rolagem suave (Lenis) ----------
  let lenis = null;
  if (!reduzMov && window.Lenis) {
    lenis = new Lenis({ lerp: 0.1, smoothWheel: true });
    if (temGsap) {
      lenis.on('scroll', ScrollTrigger.update);
      gsap.ticker.add((t) => lenis.raf(t * 1000));
      gsap.ticker.lagSmoothing(0);
    } else {
      const raf = (t) => { lenis.raf(t); requestAnimationFrame(raf); };
      requestAnimationFrame(raf);
    }
  }

  // ---------- Header que encolhe ----------
  const header = $('#header');
  const atualizarHeader = () => header.classList.toggle('header--compacto', window.scrollY > 40);
  window.addEventListener('scroll', atualizarHeader, { passive: true });
  atualizarHeader();

  // ---------- Menu mobile ----------
  const menuBtn = $('#menuBtn');
  const menuMobile = $('#menuMobile');
  function alternarMenu(abrir) {
    const aberto = typeof abrir === 'boolean' ? abrir : !document.body.classList.contains('menu-aberto');
    document.body.classList.toggle('menu-aberto', aberto);
    menuBtn.setAttribute('aria-expanded', String(aberto));
    menuBtn.setAttribute('aria-label', aberto ? 'Fechar menu' : 'Abrir menu');
    menuMobile.setAttribute('aria-hidden', String(!aberto));
    document.body.style.overflow = aberto ? 'hidden' : '';
    if (lenis) aberto ? lenis.stop() : lenis.start();
  }
  menuBtn.addEventListener('click', () => alternarMenu());
  document.addEventListener('keydown', (e) => { if (e.key === 'Escape') alternarMenu(false); });

  // ---------- Âncoras internas ----------
  $$('a[href^="#"]').forEach((link) => {
    link.addEventListener('click', (e) => {
      const id = link.getAttribute('href');
      if (id.length < 2) return; // links "#" (políticas) seguem o padrão
      const alvo = $(id);
      if (!alvo) return;
      e.preventDefault();
      alternarMenu(false);
      if (lenis) lenis.scrollTo(alvo, { offset: -70, duration: 1.4 });
      else alvo.scrollIntoView({ behavior: reduzMov ? 'auto' : 'smooth' });
    });
  });

  // ---------- Hero: rede de conexões em canvas ----------
  (function redeDeConexoes() {
    const canvas = $('#rede');
    const hero = $('.hero');
    if (!canvas || !canvas.getContext) return;
    const ctx = canvas.getContext('2d');
    let w = 0, h = 0, pontos = [], rodando = false, ultimo = 0;
    const mouse = { x: -9999, y: -9999 };
    let mobile = ehMobile();

    function dimensionar() {
      mobile = ehMobile();
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = hero.clientWidth; h = hero.clientHeight;
      canvas.width = w * dpr; canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      const qtd = Math.min(60, Math.round((w * h) / (mobile ? 12000 : 20000)));
      pontos = Array.from({ length: qtd }, () => ({
        x: Math.random() * w,
        y: Math.random() * h,
        vx: (Math.random() - 0.5) * 0.35,
        vy: (Math.random() - 0.5) * 0.35,
        r: Math.random() * 1.6 + 1.3
      }));
    }

    function desenhar() {
      const alcance = mobile ? 110 : 150;
      ctx.clearRect(0, 0, w, h);

      // Movimento + leve repulsão do cursor
      for (const p of pontos) {
        if (!reduzMov) {
          p.x += p.vx; p.y += p.vy;
          if (p.x < 0 || p.x > w) p.vx *= -1;
          if (p.y < 0 || p.y > h) p.vy *= -1;
          const dx = p.x - mouse.x, dy = p.y - mouse.y, d = Math.hypot(dx, dy);
          if (d < 120 && d > 0) { p.x += (dx / d) * 0.9; p.y += (dy / d) * 0.9; }
        }
      }

      // Linhas entre pontos próximos
      ctx.lineWidth = 1;
      for (let i = 0; i < pontos.length; i++) {
        for (let j = i + 1; j < pontos.length; j++) {
          const a = pontos[i], b = pontos[j];
          const d = Math.hypot(a.x - b.x, a.y - b.y);
          if (d < alcance) {
            ctx.strokeStyle = `rgba(124,196,242,${(1 - d / alcance) * 0.55})`;
            ctx.beginPath(); ctx.moveTo(a.x, a.y); ctx.lineTo(b.x, b.y); ctx.stroke();
          }
        }
        // Linhas até o cursor
        const p = pontos[i];
        const dm = Math.hypot(p.x - mouse.x, p.y - mouse.y);
        if (dm < 190) {
          ctx.strokeStyle = `rgba(31,111,178,${(1 - dm / 190) * 0.35})`;
          ctx.beginPath(); ctx.moveTo(p.x, p.y); ctx.lineTo(mouse.x, mouse.y); ctx.stroke();
        }
      }

      // Nós
      for (const p of pontos) {
        ctx.fillStyle = 'rgba(220,238,252,1)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r + 2, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = 'rgba(124,196,242,.95)';
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2); ctx.fill();
      }
    }

    function loop(t) {
      if (!rodando) return;
      requestAnimationFrame(loop);
      // No mobile, limita a 30 fps
      if (mobile && t - ultimo < 1000 / 30) return;
      ultimo = t;
      desenhar();
    }

    function ligar(estado) {
      const antes = rodando;
      rodando = estado && !document.hidden && !reduzMov;
      if (rodando && !antes) requestAnimationFrame(loop);
    }

    dimensionar();
    desenhar(); // primeiro quadro (e único, se houver movimento reduzido)

    // Pausa quando o hero sai da tela ou a aba fica oculta
    let heroVisivel = true;
    new IntersectionObserver(([e]) => { heroVisivel = e.isIntersecting; ligar(heroVisivel); }).observe(hero);
    document.addEventListener('visibilitychange', () => ligar(heroVisivel));

    let tempoResize;
    window.addEventListener('resize', () => {
      clearTimeout(tempoResize);
      tempoResize = setTimeout(() => { dimensionar(); desenhar(); }, 200);
    });

    if (ponteiroFino) {
      hero.addEventListener('pointermove', (e) => {
        const r = hero.getBoundingClientRect();
        mouse.x = e.clientX - r.left; mouse.y = e.clientY - r.top;
      });
      hero.addEventListener('pointerleave', () => { mouse.x = -9999; mouse.y = -9999; });
    }
  })();

  // ---------- Palavra rotativa ----------
  (function palavraRotativa() {
    const itens = $$('#rotativo .rotativo__item');
    if (itens.length < 2 || reduzMov) return;
    let atual = 0;
    setInterval(() => {
      const sai = itens[atual];
      atual = (atual + 1) % itens.length;
      const entra = itens[atual];
      sai.classList.remove('is-ativo');
      sai.classList.add('is-saindo');
      sai.setAttribute('aria-hidden', 'true');
      entra.classList.add('is-ativo');
      entra.removeAttribute('aria-hidden');
      // Depois de sair, volta para baixo sem transição (pronta para entrar de novo)
      setTimeout(() => {
        sai.style.transition = 'none';
        sai.classList.remove('is-saindo');
        void sai.offsetWidth;
        sai.style.transition = '';
      }, 900);
    }, 2800);
  })();

  // ---------- Etapas do FlakeDesk (acendem os hotspots) ----------
  (function storytellingFlakeDesk() {
    const passos = $$('.passo');
    const hotspots = $$('.hotspot');
    if (!passos.length) return;

    function ativar(i) {
      passos.forEach((p) => p.classList.toggle('ativo', p.dataset.passo === String(i)));
      hotspots.forEach((h) => h.classList.toggle('ativo', h.dataset.passo === String(i)));
    }
    ativar(0);

    // Faixa de leitura: no mobile fica mais abaixo, porque o print ocupa o topo
    const faixa = ehMobile() ? '-70% 0px -29% 0px' : '-52% 0px -47% 0px';
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => { if (e.isIntersecting) ativar(e.target.dataset.passo); });
    }, { rootMargin: faixa });
    passos.forEach((p) => obs.observe(p));
  })();

  // ---------- Contadores (apenas números reais do produto) ----------
  (function contadores() {
    const nums = $$('[data-contar]');
    if (!nums.length || reduzMov) return;
    const obs = new IntersectionObserver((entradas) => {
      entradas.forEach((e) => {
        if (!e.isIntersecting) return;
        obs.unobserve(e.target);
        const el = e.target;
        const alvo = Number(el.dataset.contar);
        const duracao = 1400;
        const inicio = performance.now();
        const passo = (t) => {
          const p = Math.min((t - inicio) / duracao, 1);
          el.textContent = Math.round(alvo * (1 - Math.pow(1 - p, 3)));
          if (p < 1) requestAnimationFrame(passo);
        };
        el.textContent = '0';
        requestAnimationFrame(passo);
      });
    }, { threshold: 0.6 });
    nums.forEach((n) => obs.observe(n));
  })();

  // ---------- Simulação de conversa (nomes fictícios) ----------
  (function simulacaoConversa() {
    const chat = $('#chat');
    const corpo = $('#chatCorpo');
    const status = $('#chatStatus');
    const repetir = $('#chatRepetir');
    if (!chat) return;

    const roteiro = [
      { tipo: 'paciente', nome: 'Carla', texto: 'Boa tarde! Vocês têm horário com a Dra. Helena na próxima semana?' },
      { tipo: 'bot', nome: 'Assistente virtual', texto: 'Boa tarde, Carla! A Dra. Helena atende às terças e quintas. Quer que a recepção confirme um horário para você?' },
      { tipo: 'paciente', nome: 'Carla', texto: 'Quero sim, de preferência pela manhã.' },
      { tipo: 'sistema', texto: 'Juliana, da recepção, assumiu a conversa' },
      { tipo: 'recepcao', nome: 'Juliana · Recepção', texto: 'Oi, Carla! Tenho quinta-feira às 9h30. Posso reservar para você?' },
      { tipo: 'paciente', nome: 'Carla', texto: 'Perfeito, pode reservar. Obrigada!' }
    ];

    let execucao = 0;
    const esperar = (ms) => new Promise((r) => setTimeout(r, ms));

    function criarMsg(m) {
      const el = document.createElement('div');
      el.className = `msg msg--${m.tipo}`;
      if (m.tipo === 'sistema') el.textContent = m.texto;
      else {
        const nome = document.createElement('small');
        nome.textContent = m.nome;
        el.append(nome, document.createTextNode(m.texto));
      }
      return el;
    }

    function definirStatus(humano) {
      status.textContent = humano ? 'Recepção atendendo' : 'Bot atendendo';
      status.classList.toggle('humano', humano);
    }

    async function tocar() {
      const id = ++execucao;
      corpo.innerHTML = '';
      definirStatus(false);
      repetir.classList.remove('visivel');

      if (reduzMov) {
        roteiro.forEach((m) => corpo.append(criarMsg(m)));
        definirStatus(true);
        return;
      }

      for (const m of roteiro) {
        if (id !== execucao) return; // reiniciada
        if (m.tipo === 'sistema') {
          await esperar(700);
          if (id !== execucao) return;
          corpo.append(criarMsg(m));
          definirStatus(true);
          continue;
        }
        await esperar(m.tipo === 'paciente' ? 500 : 350);
        if (id !== execucao) return;
        // Indicador "digitando…" do lado de quem vai escrever
        const dig = document.createElement('div');
        dig.className = `msg msg--${m.tipo} digitando`;
        dig.setAttribute('aria-label', 'digitando');
        dig.innerHTML = '<i></i><i></i><i></i>';
        corpo.append(dig);
        await esperar(m.tipo === 'paciente' ? 1100 : 1500);
        if (id !== execucao) return;
        dig.replaceWith(criarMsg(m));
      }
      repetir.classList.add('visivel');
    }

    new IntersectionObserver(([e], obs) => {
      if (e.isIntersecting) { obs.disconnect(); tocar(); }
    }, { threshold: 0.35 }).observe(chat);

    repetir.addEventListener('click', tocar);
  })();

  // ---------- Tilt 3D com brilho que segue o mouse ----------
  if (ponteiroFino && !reduzMov) {
    $$('.tilt').forEach((card) => {
      card.addEventListener('pointerenter', () => { card.style.transition = 'transform .15s ease-out'; });
      card.addEventListener('pointermove', (e) => {
        const r = card.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width;
        const py = (e.clientY - r.top) / r.height;
        card.style.setProperty('--mx', `${px * 100}%`);
        card.style.setProperty('--my', `${py * 100}%`);
        card.style.transform = `perspective(900px) rotateX(${(0.5 - py) * 7}deg) rotateY(${(px - 0.5) * 9}deg)`;
      });
      card.addEventListener('pointerleave', () => {
        card.style.transition = 'transform .7s cubic-bezier(.22,.8,.24,1)';
        card.style.transform = '';
      });
    });
  }

  // ---------- Botão magnético ----------
  if (ponteiroFino && !reduzMov && temGsap) {
    const botoes = $$('.magnetico');
    let pendente = false, ultimoEvento = null;
    window.addEventListener('pointermove', (e) => {
      ultimoEvento = e;
      if (pendente) return;
      pendente = true;
      requestAnimationFrame(() => {
        pendente = false;
        botoes.forEach((b) => {
          const r = b.getBoundingClientRect();
          const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
          const dx = ultimoEvento.clientX - cx, dy = ultimoEvento.clientY - cy;
          const raio = Math.max(r.width, r.height) / 2 + 70;
          if (Math.hypot(dx, dy) < raio) gsap.to(b, { x: dx * 0.28, y: dy * 0.38, duration: 0.4, ease: 'power3.out' });
          else gsap.to(b, { x: 0, y: 0, duration: 0.8, ease: 'elastic.out(1, .45)' });
        });
      });
    }, { passive: true });
  }

  // ---------- Formulário → WhatsApp ----------
  (function formulario() {
    const form = $('#formContato');
    const erro = $('#formErro');
    if (!form) return;
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const d = Object.fromEntries(new FormData(form).entries());
      const obrigatorios = ['nome', 'especialidade', 'whatsapp'];
      let invalido = null;
      obrigatorios.forEach((n) => {
        const campo = form.elements[n];
        let ok = campo.value.trim().length > 1;
        if (n === 'whatsapp') ok = campo.value.replace(/\D/g, '').length >= 10;
        campo.setAttribute('aria-invalid', String(!ok));
        if (!ok && !invalido) invalido = campo;
      });
      if (invalido) {
        erro.textContent = 'Preencha nome, especialidade e um WhatsApp com DDD.';
        invalido.focus();
        return;
      }
      erro.textContent = '';
      const linhas = [
        'Olá, Nexus! Vim pelo site e gostaria de conversar.',
        '',
        `Nome: ${d.nome.trim()}`,
        `Especialidade: ${d.especialidade.trim()}`,
        d.clinica.trim() ? `Clínica: ${d.clinica.trim()}` : null,
        `WhatsApp: ${d.whatsapp.trim()}`,
        `Solução de interesse: ${d.solucao}`
      ].filter((l) => l !== null);
      const url = `https://wa.me/553191351242?text=${encodeURIComponent(linhas.join('\n'))}`;
      window.open(url, '_blank', 'noopener');
    });
  })();

  // ---------- Dica do botão flutuante (uma vez) ----------
  if (ponteiroFino) {
    const wa = $('.wa-flutuante');
    setTimeout(() => { wa.classList.add('dica'); setTimeout(() => wa.classList.remove('dica'), 3500); }, 4000);
  }

  // ======================================================================
  // Animações de scroll (GSAP). Sem GSAP ou com movimento reduzido,
  // aplicamos o estado final para nada ficar escondido.
  // ======================================================================
  if (!temGsap || reduzMov) {
    $$('.no, .etapa').forEach((el) => el.classList.add(el.classList.contains('no') ? 'ativo' : 'ativa'));
    return;
  }

  // ---------- Entrada do hero (palavra por palavra) ----------
  const tlHero = gsap.timeline({ defaults: { ease: 'power4.out' }, delay: 0.1 });
  tlHero
    .from('.hero__selo', { y: 20, opacity: 0, duration: 0.8 })
    .from('.hero__titulo .palavra', { yPercent: 115, duration: 1.1, stagger: 0.09 }, '-=0.5')
    .from('.hero__sub', { y: 24, opacity: 0, duration: 0.9 }, '-=0.7')
    .from('.hero__ctas > *', { y: 24, opacity: 0, duration: 0.8, stagger: 0.1, clearProps: 'transform' }, '-=0.6')
    .from('.canais', { opacity: 0, duration: 1 }, '-=0.5');

  const mm = gsap.matchMedia();

  // ---------- Soluções: pin + scroll horizontal (desktop) ----------
  mm.add('(min-width: 1024px)', () => {
    const secao = $('.solucoes');
    const trilho = $('#trilhoSolucoes');
    secao.classList.add('solucoes--pin');
    const distancia = () => Math.max(0, trilho.scrollWidth - window.innerWidth);
    const tween = gsap.to(trilho, {
      x: () => -distancia(),
      ease: 'none',
      scrollTrigger: {
        trigger: secao,
        start: 'top top',
        end: () => '+=' + distancia(),
        pin: true,
        scrub: 0.8,
        invalidateOnRefresh: true,
        refreshPriority: 1
      }
    });
    return () => { tween.kill(); secao.classList.remove('solucoes--pin'); gsap.set(trilho, { clearProps: 'transform' }); };
  });

  // ---------- Revelações genéricas ----------
  gsap.set('.revelar', { opacity: 0, y: 32 });
  ScrollTrigger.batch('.revelar', {
    start: 'top 88%',
    once: true,
    onEnter: (els) => gsap.to(els, {
      opacity: 1, y: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09, overwrite: true, clearProps: 'transform'
    })
  });

  // ---------- Conexões: a linha se desenha e acende os nós ----------
  const trilha = $('#trilha');
  mm.add('(min-width: 900px)', () => {
    const comp = trilha.getTotalLength();
    gsap.set(trilha, { strokeDasharray: comp, strokeDashoffset: comp });
    const t = gsap.to(trilha, {
      strokeDashoffset: 0, ease: 'none',
      scrollTrigger: { trigger: '.conexoes__mapa', start: 'top 80%', end: 'top 30%', scrub: 0.8 }
    });
    return () => t.kill();
  });
  $$('.no').forEach((no) => {
    ScrollTrigger.create({
      trigger: no, start: 'top 72%',
      onEnter: () => no.classList.add('ativo'),
      onLeaveBack: () => no.classList.remove('ativo')
    });
  });

  // ---------- FlakeDesk: print entra inclinado e se endireita ----------
  gsap.fromTo('#navegador',
    { rotateX: 25, scale: 0.85, y: 30, opacity: 0.6 },
    {
      rotateX: 0, scale: 1, y: 0, opacity: 1, ease: 'none',
      scrollTrigger: { trigger: '#fdStory', start: 'top 95%', end: 'top 35%', scrub: 0.6 }
    }
  );

  // ---------- Jornada do paciente ----------
  gsap.fromTo('.jornada__progresso', { scaleY: 0 }, {
    scaleY: 1, ease: 'none',
    scrollTrigger: { trigger: '#jornada', start: 'top 70%', end: 'bottom 55%', scrub: 0.6 }
  });
  $$('.etapa').forEach((et) => {
    ScrollTrigger.create({
      trigger: et, start: 'top 66%',
      onEnter: () => et.classList.add('ativa'),
      onLeaveBack: () => et.classList.remove('ativa')
    });
  });

  // ---------- Pilares em chips animados ----------
  const pilares = $$('.pilar');
  pilares.forEach((p, i) => p.style.setProperty('--i', i));
  gsap.from(pilares, {
    y: 40, opacity: 0, scale: 0.9, duration: 0.8, ease: 'back.out(1.6)', stagger: 0.1,
    scrollTrigger: { trigger: '#pilares', start: 'top 85%', once: true },
    onComplete: () => pilares.forEach((p) => { gsap.set(p, { clearProps: 'transform' }); p.classList.add('flutuando'); })
  });

  // Ordena os gatilhos pela posição na página e recalcula quando as imagens carregarem
  ScrollTrigger.sort();
  window.addEventListener('load', () => ScrollTrigger.refresh());
})();

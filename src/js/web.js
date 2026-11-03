(function () {
  // Menú móvil
  var mb = document.querySelector(".menu-boton"), menu = document.getElementById("menu");
  if (mb) mb.addEventListener("click", function () {
    var a = menu.classList.toggle("abierto"); mb.setAttribute("aria-expanded", a);
  });

  // Reproductor fijo: una sola charla suena a la vez
  var rp = document.getElementById("reproductor"), au = document.getElementById("rp-audio");
  document.addEventListener("click", function (e) {
    var b = e.target.closest(".boton-escuchar");
    if (!b) return;
    document.getElementById("rp-titulo").textContent = b.dataset.titulo;
    document.getElementById("rp-img").src = b.dataset.img;
    au.src = b.dataset.audio; rp.hidden = false; au.play();
  });
  var cerrar = document.getElementById("rp-cerrar");
  if (cerrar) cerrar.addEventListener("click", function () { au.pause(); rp.hidden = true; });
  document.addEventListener("play", function (e) {
    document.querySelectorAll("audio").forEach(function (a) { if (a !== e.target) a.pause(); });
  }, true);

  // Buscador de charlas
  var q = document.getElementById("buscar");
  if (q) {
    var items = document.querySelectorAll(".mes .charla"), res = document.getElementById("buscar-resultado");
    var norm = function (s) { return s.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, ""); };
    items.forEach(function (it) { it._t = norm(it.dataset.texto); });
    q.addEventListener("input", function () {
      var t = norm(q.value.trim()), n = 0;
      items.forEach(function (it) { var ok = !t || it._t.indexOf(t) > -1; it.hidden = !ok; if (ok) n++; });
      document.querySelectorAll(".mes").forEach(function (m) { m.hidden = !m.querySelector(".charla:not([hidden])"); });
      document.querySelector(".indice-meses").hidden = !!t;
      res.textContent = t ? (n === 1 ? "1 charla encontrada" : n + " charlas encontradas") : "";
    });
  }

  // Vídeos de YouTube: se cargan al pulsar
  document.addEventListener("click", function (e) {
    var a = e.target.closest("[data-youtube]");
    if (!a || !a.dataset.youtube) return;
    e.preventDefault();
    a.innerHTML = '<iframe src="https://www.youtube-nocookie.com/embed/' + a.dataset.youtube + '?autoplay=1" allow="autoplay; encrypted-media; fullscreen" allowfullscreen title="Vídeo"></iframe>';
  });

  // Copiar número de cuenta
  document.querySelectorAll("[data-copiar]").forEach(function (b) {
    b.addEventListener("click", function () {
      var txt = document.getElementById(b.dataset.copiar).textContent.trim();
      navigator.clipboard.writeText(txt).then(function () { b.textContent = "¡Copiado!"; });
    });
  });
})();

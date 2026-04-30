const C = 0.4,
  BETA = 0.7;

let cwnd = 1,
  ssthresh = 32,
  wMax = 32,
  K = 0;
let phase = "Slow Start";
let tick = 0,
  t0 = 0,
  losses = 0;
let timer = null;

const chart = new Chart(document.getElementById("chart"), {
  type: "line",
  data: {
    labels: [],
    datasets: [
      {
        label: "cwnd",
        data: [],
        borderColor: "#2563eb",
        fill: false,
        pointRadius: 0,
        borderWidth: 2,
      },
      {
        label: "ssthresh",
        data: [],
        borderColor: "#dc2626",
        borderDash: [5, 4],
        fill: false,
        pointRadius: 0,
        borderWidth: 1.5,
      },
    ],
  },
  options: {
    responsive: true,
    animation: false,
    scales: {
      x: { title: { display: true, text: "tick" } },
      y: { title: { display: true, text: "MSS" }, min: 0 },
    },
  },
});

function step() {
  const rtt = +document.getElementById("rtt").value;
  const loss = +document.getElementById("loss").value / 100;

  if (Math.random() < loss * 0.15) forceLoss();

  tick++;
  const t = ((tick - t0) * rtt) / 1000;

  if (phase === "recovery") {
    phase = "Slow Start";
  } else if (phase === "Slow Start") {
    cwnd = Math.min(cwnd * 2, ssthresh);
    if (cwnd >= ssthresh) phase = "Cubic";
  } else {
    cwnd = Math.max(1, Math.round(C * Math.pow(t - K, 3) + wMax));
  }

  chart.data.labels.push(tick);
  chart.data.datasets[0].data.push(cwnd);
  chart.data.datasets[1].data.push(ssthresh);
  if (chart.data.labels.length > 80) {
    chart.data.labels.shift();
    chart.data.datasets.forEach((d) => d.data.shift());
  }
  chart.update("none");

  document.getElementById("s-cwnd").textContent = cwnd;
  document.getElementById("s-phase").textContent = phase;
  document.getElementById("s-loss").textContent = losses;
}

function forceLoss() {
  wMax = cwnd;
  ssthresh = Math.max(2, Math.floor(cwnd * BETA));
  cwnd = 1;
  phase = "recovery";
  K = Math.pow((wMax * (1 - BETA)) / C, 1 / 3);
  t0 = tick;
  losses++;
}

function start() {
  clearInterval(timer);
  timer = setInterval(step, +document.getElementById("speed").value);
}

function pause() {
  clearInterval(timer);
  timer = null;
}

function reset() {
  pause();
  cwnd = 1;
  ssthresh = 32;
  wMax = 32;
  K = 0;
  phase = "Slow Start";
  tick = 0;
  t0 = 0;
  losses = 0;
  chart.data.labels = [];
  chart.data.datasets.forEach((d) => (d.data = []));
  chart.update();
  document.getElementById("s-cwnd").textContent = 1;
  document.getElementById("s-phase").textContent = "Slow Start";
  document.getElementById("s-loss").textContent = 0;
}

["rtt", "loss", "speed"].forEach((id) => {
  document.getElementById(id).oninput = function () {
    document.getElementById(id + "-v").textContent = this.value;
    if (id === "speed" && timer) start();
  };
});
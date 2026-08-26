import "./style.css";
import * as Plot from "@observablehq/plot";
import * as d3 from "d3";
import fuzzysort from "fuzzysort";
import eloCsvRaw from "../../data/llm-pricing/elo.csv?raw";
import narrative from "../../data/llm-pricing/narrative.json";

// Stand-ins for @gramex/ui's num/num0 helpers the source repo pulled from a CDN.
const num0 = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 0 }).format(value);
const num = (value: number) =>
  new Intl.NumberFormat("en-US", { maximumFractionDigits: 2 }).format(value);

let quality = new URLSearchParams(window.location.search).get("quality") || "overall";
const $quality = document.querySelector<HTMLSelectElement>("#quality")!;
$quality.value = quality;
$quality.addEventListener("change", () => {
  location.search = "?quality=" + $quality.value;
});

const $infoBtn = document.querySelector<HTMLButtonElement>("#info-btn")!;
const $infoPopover = document.querySelector<HTMLElement>("#info-popover")!;
$infoBtn.addEventListener("click", (e) => {
  e.stopPropagation();
  $infoPopover.hidden = !$infoPopover.hidden;
});
document.addEventListener("click", () => {
  $infoPopover.hidden = true;
});
$infoPopover.addEventListener("click", (e) => e.stopPropagation());

type EloRow = Record<string, string>;
type Model = EloRow & { cost: number; elo: number; optimal?: string; node?: Element };

const data = d3.csvParse(eloCsvRaw) as unknown as EloRow[];
const hasEloScore = (row: EloRow, field: string) =>
  row[field]?.trim() !== "" && Number.isFinite(+row[field]);
const models: Model[] = data
  .filter((d) => Number.isFinite(+d.cpmi) && +d.cpmi > 0 && hasEloScore(d, quality))
  .map((d) => ({ ...d, cost: +d.cpmi, elo: +d[quality] } as Model));

let scrollyHighlights = new Set<string>();
let scrollyActive = false;

const $chartArea = document.querySelector<HTMLElement>("#chart-area")!;
const MIN_CHART_WIDTH = 560;

const dates = Array.from(new Set(models.map((d) => d.launch))).sort();
const $date = document.querySelector<HTMLInputElement>("#date")!;
$date.setAttribute("max", String(dates.length - 1));
$date.value = String(dates.length - 1);

const xScale = d3.scaleLog().domain(d3.extent(models, (d) => d.cost) as [number, number]).range([0, 1000]);
const yScale = d3.scaleLinear().domain(d3.extent(models, (d) => d.elo) as [number, number]).range([500, 0]);

const eloAnnotations = [
  { elo: 1000, label: "🧒 Middle schooler" },
  { elo: 1100, label: "🎒 HS freshman" },
  { elo: 1200, label: "🎓 HS graduate" },
  { elo: 1300, label: "📚 College junior" },
  { elo: 1350, label: "🏫 College grad" },
  { elo: 1400, label: "🎓 Master's student" },
  { elo: 1450, label: "🔬 PhD candidate" },
  { elo: 1480, label: "🏛 Tenured professor" },
];

const updateOptimalStatus = (filteredModels: Model[]) => {
  filteredModels.forEach((model) => {
    model.optimal = filteredModels.every(
      (other) => other === model || other.elo < model.elo || other.cost > model.cost
    )
      ? "best"
      : filteredModels.every(
          (other) => other === model || other.elo >= model.elo || other.cost <= model.cost
        )
      ? "worst"
      : "";
  });
};

const renderPlot = (filteredModels: Model[]) => {
  const highlighted = (d: Model) => scrollyHighlights.has(d.model);
  const dimmed = (d: Model) => scrollyActive && scrollyHighlights.size > 0 && !highlighted(d);

  const w = Math.max($chartArea.clientWidth, MIN_CHART_WIDTH);
  const h = Math.min(Math.max($chartArea.clientHeight, 400), Math.round(w * 0.62));

  const plot = Plot.plot({
    marginLeft: 50,
    x: { type: "log", grid: true, domain: xScale.domain() },
    y: { grid: true, domain: yScale.domain() },
    width: w,
    height: h,
    marks: [
      Plot.ruleY(eloAnnotations, {
        y: "elo",
        stroke: "var(--muted)",
        strokeOpacity: 0.3,
        strokeDasharray: "4,4",
      }),
      Plot.text(eloAnnotations, {
        y: "elo",
        text: "label",
        frameAnchor: "right",
        textAnchor: "end",
        fontSize: 10,
        fill: "var(--muted)",
        dx: -4,
        dy: -5,
      }),
      Plot.dot(filteredModels, {
        x: "cost",
        y: "elo",
        r: 8,
        fill: (d: Model) => {
          if (highlighted(d)) return "var(--accent)";
          if (d.optimal === "best") return "lime";
          if (d.optimal === "worst") return "red";
          return "rgba(var(--border-rgb), 0.35)";
        },
        fillOpacity: (d: Model) => (dimmed(d) ? 0.3 : 1),
        stroke: (d: Model) => {
          if (highlighted(d)) return "var(--bg)";
          if (d.optimal) return "var(--fg)";
          return "rgba(var(--border-rgb), 0.35)";
        },
        strokeWidth: (d: Model) => (highlighted(d) ? 1.5 : 0.5),
        strokeOpacity: (d: Model) => (dimmed(d) ? 0.2 : 1),
        channels: { model: "model" },
        tip: {
          fill: "var(--bg)",
          format: {
            fill: false,
            fillOpacity: false,
            strokeOpacity: false,
            strokeWidth: false,
            model: (d: string) => d,
            x: (d: number) => `$${num(d)} / MTok`,
            y: (d: number) => num0(d),
          },
        },
      }),
      Plot.text(
        filteredModels.filter((d) => d.optimal || highlighted(d)),
        {
          x: "cost",
          y: "elo",
          text: (d: Model) => d.model,
          fillOpacity: (d: Model) => (dimmed(d) ? 0.25 : 1),
          dy: -10,
          lineAnchor: "bottom",
        }
      ),
      Plot.axisX({ label: "Cost per million input tokens" }),
      Plot.axisY({ label: "ELO score", tickSpacing: 100 }),
    ],
  });
  document.querySelector("#llm-cost")!.replaceChildren(plot);

  const circles = document.querySelectorAll("#llm-cost circle");
  models.forEach((model, i) => {
    if (circles[i]) model.node = circles[i];
  });
};

const update = () => {
  const date = dates[+$date.value];
  document.querySelector("#date-label")!.textContent = d3.timeFormat("%b %Y")(d3.timeParse("%Y-%m")(date.replace(/\?$/, ""))!);

  const search = document.querySelector<HTMLInputElement>("#model")!.value.trim();
  const matches = new Set(
    fuzzysort.go(search, models.map((m) => m.model), { threshold: -20 }).map((r) => r.target)
  );

  const filteredModels = models.filter(
    (d) => d.launch <= date && (d.end ? d.end > date : true) && (search ? matches.has(d.model) : true)
  );
  updateOptimalStatus(filteredModels);
  renderPlot(filteredModels);
};

$date.addEventListener("input", update);
document.querySelector<HTMLInputElement>("#model")!.addEventListener("input", update);
update();
new ResizeObserver(update).observe($chartArea);

// ── Scrollytelling (kept for if/when re-enabled; hidden via #scrolly-section { display: none } in style.css) ──

type NarrativeCard = {
  position: string;
  vertical?: string;
  title: string;
  body: string;
  links?: { url: string; text: string }[];
  highlight: string[];
  date?: string;
};

const scrollySection = document.querySelector<HTMLElement>("#scrolly-section")!;
const cardEls: HTMLElement[] = [];

(narrative.cards as NarrativeCard[]).forEach((card, i, cards) => {
  const linksHtml = card.links?.length
    ? `<div class="card-links">${card.links
        .map((l) => `<a href="${l.url}" target="_blank" rel="noopener">${l.text}</a>`)
        .join("")}</div>`
    : "";

  const cardEl = document.createElement("div");
  cardEl.className = `scrolly-card pos-${card.position}${card.vertical === "top" ? " vert-top" : ""}`;
  cardEl.innerHTML = `<h6>${card.title}</h6>${card.body}${linksHtml}`;

  const step = document.createElement("div");
  step.className = "scrolly-step";
  step.dataset.step = String(i);
  step.appendChild(cardEl);
  scrollySection.appendChild(step);
  cardEls.push(cardEl);

  if (i < cards.length - 1) {
    const gap = document.createElement("div");
    gap.className = "scrolly-gap";
    scrollySection.appendChild(gap);
  }
});

const trailing = document.createElement("div");
trailing.style.height = "140vh";
scrollySection.appendChild(trailing);

const endSentinel = document.createElement("div");
trailing.prepend(endSentinel);

const activateCard = (cardData: NarrativeCard) => {
  scrollyActive = true;
  scrollyHighlights = new Set(cardData.highlight);
  if (cardData.date) {
    const targetIdx = dates.indexOf(cardData.date);
    if (targetIdx !== -1) animateToMonth(targetIdx);
  } else {
    update();
  }
};
void activateCard; // kept for parity with the source; wired up once scrolly is re-enabled

const deactivateScrolly = () => {
  scrollyActive = false;
  scrollyHighlights.clear();
  update();
};

const endObserver = new IntersectionObserver(
  ([entry]) => {
    if (entry.isIntersecting) deactivateScrolly();
  },
  { threshold: 0 }
);
endObserver.observe(endSentinel);

let monthAnimFrame: number | null = null;
const animateToMonth = (targetIdx: number) => {
  if (monthAnimFrame) cancelAnimationFrame(monthAnimFrame);
  const startIdx = +$date.value;
  if (startIdx === targetIdx) return;
  const duration = 700;
  const startTime = performance.now();

  const tick = (now: number) => {
    const t = Math.min((now - startTime) / duration, 1);
    const eased = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
    const cur = Math.round(startIdx + (targetIdx - startIdx) * eased);
    if (+$date.value !== cur) {
      $date.value = String(cur);
      update();
    }
    if (t < 1) monthAnimFrame = requestAnimationFrame(tick);
  };
  monthAnimFrame = requestAnimationFrame(tick);
};

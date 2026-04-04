import { useEffect, useMemo, useState } from "react";
import {
  CartesianGrid,
  Cell,
  Label,
  ReferenceLine,
  ResponsiveContainer,
  Scatter,
  ScatterChart,
  Tooltip,
  XAxis,
  YAxis,
  ZAxis,
} from "recharts";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import gapminderData from "@/lib/gapminder_processed.json";

/**
 * Design philosophy for this file:
 * Editorial modernism + soft archival atlas. The page must feel like a carefully
 * typeset evidence spread, not a generic dashboard. Comparison comes before spectacle.
 * Motion is optional and subdued. Decorative textures should never compete with the data.
 */

type GapminderRecord = {
  country: string;
  continent: string;
  year: number;
  lifeExp: number;
  pop: number;
  gdpPercap: number;
  iso_alpha: string;
  iso_num: string;
};

type GapminderPayload = {
  metadata: {
    years: number[];
    continents: string[];
    selected_years: number[];
    suggested_countries: string[];
    country_count: number;
    row_count: number;
    sampling_note: string;
  };
  records: GapminderRecord[];
};

const dataset = gapminderData as GapminderPayload;
const years = dataset.metadata.years;
const selectedYears = dataset.metadata.selected_years;
const suggestedCountries = dataset.metadata.suggested_countries;

const continentColors: Record<string, string> = {
  Africa: "#7b8b5a",
  Americas: "#6f8fa4",
  Asia: "#c57c60",
  Europe: "#46545b",
  Oceania: "#8da8a3",
};

const continentLabels: Record<string, string> = {
  Africa: "Africa",
  Americas: "Americas",
  Asia: "Asia",
  Europe: "Europe",
  Oceania: "Oceania",
};

const comparisonYearLabels: Record<number, string> = {
  1952: "1952",
  1972: "1972",
  1992: "1992",
  2007: "2007",
};

function formatIncome(value: number) {
  if (value >= 1000) return `$${Math.round(value / 1000)}k`;
  return `$${Math.round(value)}`;
}

function formatPopulation(value: number) {
  if (value >= 1_000_000_000) return `${(value / 1_000_000_000).toFixed(1)}B`;
  if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(0)}M`;
  return `${value}`;
}

function bubbleRadius(pop: number) {
  const minPop = 60_000;
  const maxPop = 1_320_000_000;
  const minRadius = 5;
  const maxRadius = 38;
  const normalized = (Math.sqrt(pop) - Math.sqrt(minPop)) / (Math.sqrt(maxPop) - Math.sqrt(minPop));
  return minRadius + Math.max(0, normalized) * (maxRadius - minRadius);
}

function log10(value: number) {
  return Math.log10(value);
}

function incomeTicks(mode: "log" | "linear") {
  return mode === "log"
    ? [300, 1000, 3000, 10000, 30000, 100000].map((v) => log10(v))
    : [0, 10000, 20000, 40000, 80000, 120000];
}

function chartRowsForYear(records: GapminderRecord[], year: number, mode: "log" | "linear") {
  return records
    .filter((record) => record.year === year)
    .map((record) => ({
      ...record,
      xValue: mode === "log" ? log10(record.gdpPercap) : record.gdpPercap,
      bubbleSize: bubbleRadius(record.pop),
      fill: continentColors[record.continent] ?? "#7b7465",
    }));
}

function atlasPaperStyle(backgroundImage?: string) {
  return {
    backgroundImage: backgroundImage
      ? `linear-gradient(rgba(250,246,236,0.92), rgba(250,246,236,0.92)), url(${backgroundImage})`
      : "linear-gradient(180deg, rgba(251,248,239,0.98), rgba(247,242,230,0.98))",
    backgroundSize: "cover",
    backgroundPosition: "center",
  } as const;
}

function CountryTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const record = payload[0].payload;
  return (
    <div className="max-w-xs rounded-none border border-stone-500/25 bg-[#faf6ea]/96 px-4 py-3 shadow-[0_18px_40px_rgba(46,39,29,0.14)] backdrop-blur-sm">
      <p className="font-serif text-base text-stone-900">{record.country}</p>
      <p className="mt-1 text-xs uppercase tracking-[0.18em] text-stone-500">{continentLabels[record.continent]}</p>
      <div className="mt-3 space-y-1 text-sm text-stone-700">
        <p><span className="text-stone-500">Life expectancy:</span> {record.lifeExp.toFixed(1)} years</p>
        <p><span className="text-stone-500">Income per person:</span> {record.gdpPercap.toLocaleString()}</p>
        <p><span className="text-stone-500">Population:</span> {record.pop.toLocaleString()}</p>
        <p><span className="text-stone-500">Year:</span> {record.year}</p>
      </div>
    </div>
  );
}

function ScatterPanel({
  title,
  year,
  mode,
  rows,
  selectedCountries,
  onSelectCountry,
}: {
  title: string;
  year: number;
  mode: "log" | "linear";
  rows: ReturnType<typeof chartRowsForYear>;
  selectedCountries: string[];
  onSelectCountry: (country: string) => void;
}) {
  const xDomain = mode === "log" ? [log10(250), log10(130000)] : [0, 130000];
  const yDomain = [20, 88];

  return (
    <section className="rounded-[1.45rem] border border-stone-600/15 bg-[#fbf8ee]/92 p-3.5 shadow-[0_15px_34px_rgba(72,55,41,0.07)] backdrop-blur-sm md:p-4">
      <div className="mb-2.5 flex items-end justify-between gap-3 border-b border-stone-700/10 pb-2.5">
        <div>
          <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Comparison frame</p>
          <h3 className="font-serif text-[1.18rem] leading-tight text-stone-900">{title}</h3>
        </div>
        <div className="text-right">
          <p className="font-serif text-[1.55rem] leading-none text-stone-700">{comparisonYearLabels[year] ?? year}</p>
          <p className="mt-1 text-[10px] uppercase tracking-[0.24em] text-stone-400">Discrete historical state</p>
        </div>
      </div>
      <div className="h-[220px] md:h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <ScatterChart margin={{ top: 10, right: 18, bottom: 28, left: 6 }}>
            <CartesianGrid stroke="rgba(70,84,91,0.14)" strokeDasharray="2 6" />
            <ReferenceLine y={50} stroke="rgba(98,78,62,0.22)" strokeDasharray="4 4" />
            <XAxis
              type="number"
              dataKey="xValue"
              domain={xDomain}
              ticks={incomeTicks(mode)}
              tickFormatter={(value) => formatIncome(mode === "log" ? 10 ** value : value)}
              stroke="#7f7362"
              tick={{ fill: "#6b6256", fontSize: 11 }}
            >
              <Label
                value={mode === "log" ? "Income per person (log scale)" : "Income per person (linear scale)"}
                position="insideBottom"
                offset={-16}
                style={{ fill: "#6b6256", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
              />
            </XAxis>
            <YAxis
              type="number"
              dataKey="lifeExp"
              domain={yDomain}
              stroke="#7f7362"
              tick={{ fill: "#6b6256", fontSize: 11 }}
              ticks={[20, 35, 50, 65, 80]}
            >
              <Label
                value="Life expectancy"
                angle={-90}
                position="insideLeft"
                style={{ fill: "#6b6256", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
              />
            </YAxis>
            <ZAxis type="number" dataKey="bubbleSize" range={[40, 1500]} />
            <Tooltip cursor={{ strokeDasharray: "4 4", stroke: "rgba(59,47,38,0.2)" }} content={<CountryTooltip />} />
            <Scatter data={rows} shape={(props: any) => {
              const { cx, cy, payload } = props;
              const isSelected = selectedCountries.includes(payload.country);
              const radius = payload.bubbleSize;
              return (
                <g onClick={() => onSelectCountry(payload.country)} style={{ cursor: "pointer" }}>
                  <circle
                    cx={cx}
                    cy={cy}
                    r={radius}
                    fill={payload.fill}
                    fillOpacity={isSelected ? 0.62 : 0.34}
                    stroke={isSelected ? "#2f241a" : "rgba(56,46,38,0.34)"}
                    strokeWidth={isSelected ? 1.8 : 0.9}
                  />
                  {isSelected ? (
                    <circle cx={cx} cy={cy} r={radius + 3} fill="none" stroke="rgba(47,36,26,0.46)" strokeDasharray="3 4" />
                  ) : null}
                </g>
              );
            }}>
              {rows.map((entry) => (
                <Cell key={`${entry.country}-${entry.year}`} fill={entry.fill} />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </div>
    </section>
  );
}

export default function Home() {
  const [scaleMode, setScaleMode] = useState<"log" | "linear">("log");
  const [currentYear, setCurrentYear] = useState<number>(2007);
  const [showTrails, setShowTrails] = useState(true);
  const [selectedCountries, setSelectedCountries] = useState<string[]>(["China", "India", "United States"]);
  const [autoPlay, setAutoPlay] = useState(false);

  useEffect(() => {
    if (!autoPlay) return;
    const interval = window.setInterval(() => {
      setCurrentYear((previous) => {
        const index = years.indexOf(previous);
        return years[(index + 1) % years.length];
      });
    }, 1500);
    return () => window.clearInterval(interval);
  }, [autoPlay]);

  const allRows = dataset.records;

  const comparisonPanels = useMemo(
    () => selectedYears.map((year) => ({ year, rows: chartRowsForYear(allRows, year, scaleMode) })),
    [allRows, scaleMode],
  );

  const focusYearRows = useMemo(() => chartRowsForYear(allRows, currentYear, scaleMode), [allRows, currentYear, scaleMode]);

  const selectedCountryTrails = useMemo(() => {
    return selectedCountries.map((country) => {
      const trail = allRows
        .filter((record) => record.country === country)
        .map((record) => ({
          ...record,
          xValue: scaleMode === "log" ? log10(record.gdpPercap) : record.gdpPercap,
          bubbleSize: bubbleRadius(record.pop),
        }));
      return { country, trail };
    });
  }, [allRows, scaleMode, selectedCountries]);

  const selectedSnapshot = useMemo(() => {
    return selectedCountries
      .map((country) => focusYearRows.find((row) => row.country === country))
      .filter(Boolean) as ReturnType<typeof chartRowsForYear>;
  }, [focusYearRows, selectedCountries]);

  const toggleCountry = (country: string) => {
    setSelectedCountries((previous) => {
      if (previous.includes(country)) return previous.filter((item) => item !== country);
      if (previous.length >= 5) return [...previous.slice(1), country];
      return [...previous, country];
    });
  };

  return (
    <div className="min-h-screen overflow-hidden bg-[#f4efe2] text-stone-800">
      <div className="fixed inset-0 opacity-[0.42]" style={atlasPaperStyle("https://d2xsxph8kpxj0f.cloudfront.net/310519663314917268/VDVk9gwfEg2iTdYnA2vAni/gapminder-annotation-texture-HfC6JKB4dWFoJ9ySBorodd.webp")} />
      <div className="fixed inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.55),transparent_45%),radial-gradient(circle_at_bottom_right,rgba(66,83,92,0.08),transparent_34%)]" />

      <main className="relative z-10">
        <section className="relative border-b border-stone-700/10 px-5 pb-4 pt-5 md:px-10 lg:px-14 lg:pb-6 lg:pt-6">
          <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[1.08fr_0.92fr] lg:items-stretch">
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.7 }}
              className="relative overflow-hidden rounded-[1.8rem] border border-stone-700/15 bg-[#f8f3e8]/88 p-4 shadow-[0_20px_40px_rgba(62,47,34,0.09)] backdrop-blur-sm md:p-5"
              style={atlasPaperStyle("https://d2xsxph8kpxj0f.cloudfront.net/310519663314917268/VDVk9gwfEg2iTdYnA2vAni/gapminder-methodology-panel-6CuSekNho65UnYaEmQeV9s.webp")}
            >
              <div className="absolute inset-0 bg-[linear-gradient(130deg,rgba(251,248,240,0.94),rgba(251,248,240,0.68))]" />
              <div className="relative z-10">
                <p className="text-[10px] uppercase tracking-[0.33em] text-stone-500">Information Visualization / Assignment 2 / Case B</p>
                <h1 className="mt-2 max-w-none font-serif text-[2.55rem] leading-[0.93] text-stone-900 md:text-[3.05rem] lg:text-[3.45rem]">
                  Gapminder, slowed down into an evidence atlas.
                </h1>
                <p className="mt-3 max-w-2xl text-[14px] leading-6 text-stone-700 md:text-[15px]">
                  This redesign replaces persuasive motion with deliberate comparison. Instead of asking viewers to trust a smooth historical animation, it foregrounds four fixed comparison years, exposes the scale choice, and lets selected country paths be read as discrete evidence.
                </p>

                <div className="mt-4 grid gap-2.5 md:grid-cols-2">
                  <div className="border border-stone-700/10 bg-[#fbf8ef]/75 p-3.5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Bias repaired</p>
                    <p className="mt-1.5 font-serif text-[1.35rem] leading-tight text-stone-900">Animation-first narrative</p>
                    <p className="mt-1.5 text-[13px] leading-5 text-stone-700">The default reading mode is small multiples, not autoplay. Time becomes comparable, not cinematic.</p>
                  </div>
                  <div className="border border-stone-700/10 bg-[#fbf8ef]/75 p-3.5">
                    <p className="text-[10px] uppercase tracking-[0.24em] text-stone-500">Bias exposed</p>
                    <p className="mt-1.5 font-serif text-[1.35rem] leading-tight text-stone-900">Log scale compression</p>
                    <p className="mt-1.5 text-[13px] leading-5 text-stone-700">A direct log/linear switch makes the rhetorical effect of scale visible instead of hidden in the default.</p>
                  </div>
                </div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, delay: 0.08 }}
              className="relative min-h-[220px] overflow-hidden rounded-[1.8rem] border border-stone-700/15 bg-[#f8f2e7] shadow-[0_20px_44px_rgba(62,47,34,0.1)] lg:min-h-[238px]"
              style={atlasPaperStyle("https://d2xsxph8kpxj0f.cloudfront.net/310519663314917268/VDVk9gwfEg2iTdYnA2vAni/gapminder-hero-atlas-8sRcNeve8fZqCnhk7tKEzh.webp")}
            >
              <div className="absolute inset-0 bg-[linear-gradient(90deg,rgba(249,245,236,0.94)_8%,rgba(249,245,236,0.55)_40%,rgba(249,245,236,0.16)_100%)]" />
              <div className="relative z-10 flex h-full flex-col justify-between p-4 md:p-5 lg:p-5.5">
                <div className="max-w-md border border-stone-700/10 bg-[#faf6eb]/82 p-3 backdrop-blur-[2px]">
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Method note</p>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    The dataset remains faithful to the core Gapminder variables: income, life expectancy, population, region, and year. The redesign changes the visual argument, not the underlying topic.
                  </p>
                </div>
                <div className="grid gap-2 md:grid-cols-3">
                  <div className="border border-stone-700/10 bg-[#faf6eb]/84 p-3 backdrop-blur-[2px]">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Countries</p>
                    <p className="mt-1 font-serif text-[1.8rem] text-stone-900">{dataset.metadata.country_count}</p>
                  </div>
                  <div className="border border-stone-700/10 bg-[#faf6eb]/84 p-3 backdrop-blur-[2px]">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Recorded years</p>
                    <p className="mt-1 font-serif text-[1.8rem] text-stone-900">{dataset.metadata.years.length}</p>
                  </div>
                  <div className="border border-stone-700/10 bg-[#faf6eb]/84 p-3 backdrop-blur-[2px]">
                    <p className="text-[10px] uppercase tracking-[0.22em] text-stone-500">Sampling style</p>
                    <p className="mt-1 font-serif text-lg text-stone-900">Five-year snapshots</p>
                  </div>
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        <section className="px-5 py-4 md:px-10 lg:px-14 lg:py-5">
          <div className="mx-auto grid max-w-[1440px] gap-4 lg:grid-cols-[292px_1fr]">
            <aside
              className="rounded-[1.7rem] border border-stone-700/15 bg-[#f8f4e9]/92 p-4 shadow-[0_18px_38px_rgba(62,47,34,0.07)]"
              style={atlasPaperStyle("https://d2xsxph8kpxj0f.cloudfront.net/310519663314917268/VDVk9gwfEg2iTdYnA2vAni/gapminder-methodology-panel-6CuSekNho65UnYaEmQeV9s.webp")}
            >
              <div className="space-y-5">
                <section>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Scale comparison</p>
                  <h2 className="mt-2 font-serif text-2xl text-stone-900">Expose the encoding choice</h2>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    The original hides a major interpretive decision inside the x-axis. Here, viewers can switch between log and linear income scales and immediately see how the global pattern changes.
                  </p>
                  <div className="mt-4 flex gap-2">
                    <Button
                      variant="outline"
                      className={`rounded-none border-stone-600/30 px-4 ${scaleMode === "log" ? "bg-stone-800 text-stone-50 hover:bg-stone-700" : "bg-[#faf6eb]/80 text-stone-800 hover:bg-stone-100"}`}
                      onClick={() => setScaleMode("log")}
                    >
                      Log scale
                    </Button>
                    <Button
                      variant="outline"
                      className={`rounded-none border-stone-600/30 px-4 ${scaleMode === "linear" ? "bg-stone-800 text-stone-50 hover:bg-stone-700" : "bg-[#faf6eb]/80 text-stone-800 hover:bg-stone-100"}`}
                      onClick={() => setScaleMode("linear")}
                    >
                      Linear scale
                    </Button>
                  </div>
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Country reading</p>
                  <h3 className="mt-2 font-serif text-xl text-stone-900">Select up to five countries</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Selection reveals path lines and comparison notes. This turns vague motion into a trackable, inspectable history.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    {suggestedCountries.map((country) => {
                      const active = selectedCountries.includes(country);
                      return (
                        <button
                          key={country}
                          onClick={() => toggleCountry(country)}
                          className={`border px-3 py-2 text-xs uppercase tracking-[0.18em] transition ${active ? "border-stone-800 bg-stone-800 text-stone-50" : "border-stone-700/20 bg-[#faf6eb]/82 text-stone-700 hover:border-stone-700/45"}`}
                        >
                          {country}
                        </button>
                      );
                    })}
                  </div>
                </section>

                <section>
                  <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Historical playback</p>
                  <h3 className="mt-2 font-serif text-xl text-stone-900">Optional motion, not the default</h3>
                  <p className="mt-2 text-sm leading-6 text-stone-700">
                    Motion is still available for inspection, but it is demoted beneath the comparison view and kept slow enough to be read critically.
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Button
                      variant="outline"
                      className={`rounded-none border-stone-600/30 px-4 ${showTrails ? "bg-stone-800 text-stone-50 hover:bg-stone-700" : "bg-[#faf6eb]/80 text-stone-800 hover:bg-stone-100"}`}
                      onClick={() => setShowTrails((previous) => !previous)}
                    >
                      {showTrails ? "Hide trails" : "Show trails"}
                    </Button>
                    <Button
                      variant="outline"
                      className={`rounded-none border-stone-600/30 px-4 ${autoPlay ? "bg-stone-800 text-stone-50 hover:bg-stone-700" : "bg-[#faf6eb]/80 text-stone-800 hover:bg-stone-100"}`}
                      onClick={() => setAutoPlay((previous) => !previous)}
                    >
                      {autoPlay ? "Pause motion" : "Play motion"}
                    </Button>
                  </div>
                </section>

                <section className="border border-stone-700/10 bg-[#fbf8ee]/74 p-4">
                  <p className="text-[10px] uppercase tracking-[0.28em] text-stone-500">Data caution</p>
                  <p className="mt-3 text-sm leading-6 text-stone-700">{dataset.metadata.sampling_note}</p>
                </section>
              </div>
            </aside>

            <div className="space-y-6">
              <section
                className="rounded-[1.7rem] border border-stone-700/15 p-4 shadow-[0_20px_40px_rgba(62,47,34,0.07)]"
                style={atlasPaperStyle("https://d2xsxph8kpxj0f.cloudfront.net/310519663314917268/VDVk9gwfEg2iTdYnA2vAni/gapminder-comparison-field-LfqfoGstcAkwGkuQDdtbqo.webp")}
              >
                <div className="mb-4 flex flex-col gap-2 border-b border-stone-700/10 pb-3 md:flex-row md:items-end md:justify-between">
                  <div>
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Primary redesign view</p>
                    <h2 className="mt-1.5 max-w-[10ch] font-serif text-[2.2rem] leading-[0.98] text-stone-900">Small multiples replace autoplay as the first reading.</h2>
                  </div>
                  <p className="max-w-md text-[13px] leading-5 text-stone-700">
                    Each panel is a fixed historical state. This reduces change blindness and lowers the burden of tracking many moving bubbles at once.
                  </p>
                </div>

                <div className="grid gap-4 xl:grid-cols-2">
                  {comparisonPanels.map((panel) => (
                    <ScatterPanel
                      key={panel.year}
                      title={`Life expectancy vs income`}
                      year={panel.year}
                      mode={scaleMode}
                      rows={panel.rows}
                      selectedCountries={selectedCountries}
                      onSelectCountry={toggleCountry}
                    />
                  ))}
                </div>
              </section>

              <section className="grid gap-6 xl:grid-cols-[1.15fr_0.85fr]">
                <div className="rounded-[1.8rem] border border-stone-700/15 bg-[#faf6eb]/92 p-5 shadow-[0_22px_48px_rgba(62,47,34,0.08)]">
                  <div className="flex flex-col gap-2 border-b border-stone-700/10 pb-4 md:flex-row md:items-end md:justify-between">
                    <div>
                      <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Secondary reading</p>
                      <h2 className="mt-2 font-serif text-3xl text-stone-900">Focused year inspection</h2>
                    </div>
                    <div className="min-w-[220px]">
                      <label className="mb-2 block text-[10px] uppercase tracking-[0.24em] text-stone-500">Selected year: {currentYear}</label>
                      <input
                        type="range"
                        min={0}
                        max={years.length - 1}
                        step={1}
                        value={years.indexOf(currentYear)}
                        onChange={(event) => setCurrentYear(years[Number(event.target.value)])}
                        className="w-full accent-stone-800"
                      />
                    </div>
                  </div>

                  <div className="mt-4 h-[400px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <ScatterChart margin={{ top: 12, right: 22, bottom: 34, left: 8 }}>
                        <CartesianGrid stroke="rgba(70,84,91,0.14)" strokeDasharray="2 6" />
                        <XAxis
                          type="number"
                          dataKey="xValue"
                          domain={scaleMode === "log" ? [log10(250), log10(130000)] : [0, 130000]}
                          ticks={incomeTicks(scaleMode)}
                          tickFormatter={(value) => formatIncome(scaleMode === "log" ? 10 ** value : value)}
                          stroke="#7f7362"
                          tick={{ fill: "#6b6256", fontSize: 11 }}
                        >
                          <Label
                            value={scaleMode === "log" ? "Income per person (log scale)" : "Income per person (linear scale)"}
                            position="insideBottom"
                            offset={-15}
                            style={{ fill: "#6b6256", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                          />
                        </XAxis>
                        <YAxis type="number" dataKey="lifeExp" domain={[20, 88]} stroke="#7f7362" tick={{ fill: "#6b6256", fontSize: 11 }}>
                          <Label
                            value="Life expectancy"
                            angle={-90}
                            position="insideLeft"
                            style={{ fill: "#6b6256", fontSize: 11, letterSpacing: "0.08em", textTransform: "uppercase" }}
                          />
                        </YAxis>
                        <ZAxis type="number" dataKey="bubbleSize" range={[40, 1700]} />
                        <Tooltip cursor={{ strokeDasharray: "4 4", stroke: "rgba(59,47,38,0.2)" }} content={<CountryTooltip />} />

                        {showTrails
                          ? selectedCountryTrails.map(({ country, trail }) => (
                              <Scatter
                                key={country}
                                data={trail}
                                line={{ stroke: "rgba(59,47,38,0.38)", strokeDasharray: "5 5", strokeWidth: 1.5 }}
                                fill="rgba(0,0,0,0)"
                                shape={() => <></>}
                              />
                            ))
                          : null}

                        <Scatter data={focusYearRows} shape={(props: any) => {
                          const { cx, cy, payload } = props;
                          const isSelected = selectedCountries.includes(payload.country);
                          return (
                            <g onClick={() => toggleCountry(payload.country)} style={{ cursor: "pointer" }}>
                              <circle
                                cx={cx}
                                cy={cy}
                                r={payload.bubbleSize}
                                fill={payload.fill}
                                fillOpacity={isSelected ? 0.66 : 0.3}
                                stroke={isSelected ? "#2f241a" : "rgba(56,46,38,0.35)"}
                                strokeWidth={isSelected ? 2 : 1}
                              />
                              {isSelected ? <circle cx={cx} cy={cy} r={payload.bubbleSize + 4} fill="none" stroke="rgba(47,36,26,0.42)" strokeDasharray="4 5" /> : null}
                            </g>
                          );
                        }}>
                          {focusYearRows.map((entry) => (
                            <Cell key={`${entry.country}-${entry.year}`} fill={entry.fill} />
                          ))}
                        </Scatter>
                      </ScatterChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="space-y-6">
                  <section className="rounded-[1.8rem] border border-stone-700/15 bg-[#faf6eb]/92 p-5 shadow-[0_22px_48px_rgba(62,47,34,0.08)]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Selected countries</p>
                    <h3 className="mt-2 font-serif text-2xl text-stone-900">Discrete snapshots, not implied continuity.</h3>
                    <div className="mt-4 space-y-4">
                      {selectedSnapshot.map((record) => (
                        <div key={record.country} className="border border-stone-700/10 bg-[#fbf8ef]/84 p-4">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <p className="font-serif text-xl text-stone-900">{record.country}</p>
                              <p className="mt-1 text-[10px] uppercase tracking-[0.22em] text-stone-500">{continentLabels[record.continent]}</p>
                            </div>
                            <span className="h-4 w-4 rounded-full" style={{ backgroundColor: continentColors[record.continent] }} />
                          </div>
                          <div className="mt-4 grid grid-cols-3 gap-3 text-sm text-stone-700">
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Life</p>
                              <p className="mt-1 font-serif text-lg text-stone-900">{record.lifeExp.toFixed(1)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Income</p>
                              <p className="mt-1 font-serif text-lg text-stone-900">{formatIncome(record.gdpPercap)}</p>
                            </div>
                            <div>
                              <p className="text-[10px] uppercase tracking-[0.2em] text-stone-500">Population</p>
                              <p className="mt-1 font-serif text-lg text-stone-900">{formatPopulation(record.pop)}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </section>

                  <section className="rounded-[1.8rem] border border-stone-700/15 bg-[#faf6eb]/92 p-5 shadow-[0_22px_48px_rgba(62,47,34,0.08)]">
                    <p className="text-[10px] uppercase tracking-[0.3em] text-stone-500">Legend and reading guide</p>
                    <h3 className="mt-2 font-serif text-2xl text-stone-900">How to read this redesign</h3>
                    <div className="mt-4 space-y-4 text-sm leading-6 text-stone-700">
                      <p>
                        <span className="font-semibold text-stone-900">Bubble position</span> shows income and life expectancy. <span className="font-semibold text-stone-900">Bubble area</span> still represents population, but selection outlines help prevent the largest countries from dominating the reading completely.
                      </p>
                      <p>
                        The comparison view uses four discrete years to reduce change blindness. The focused year view preserves interaction, but it makes motion optional and slows it down.
                      </p>
                      <div className="mt-3 flex flex-wrap gap-3">
                        {Object.entries(continentColors).map(([continent, color]) => (
                          <div key={continent} className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-stone-600">
                            <span className="h-3.5 w-3.5 rounded-full border border-stone-700/20" style={{ backgroundColor: color }} />
                            {continentLabels[continent]}
                          </div>
                        ))}
                      </div>
                    </div>
                  </section>
                </div>
              </section>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}

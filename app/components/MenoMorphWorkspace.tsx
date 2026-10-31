"use client";

import React, { useMemo, useState } from "react";

type SkinMetrics = {
  moisture: number;
  redness: number;
  texture: number;
  wrinkles: number;
  radiance: number;
  skinAge: number;
};

type AnalysisResponse = {
  moisture: number;
  redness: number;
  texture: number;
  wrinkles: number;
  radiance: number;
  skinAge: number;
  overallScore: number;
  masks: {
    moisture?: string;
    redness?: string;
    texture?: string;
    wrinkles?: string;
    radiance?: string;
  };
};

type WellnessLog = {
  id: string;
  timestamp: string;
  hotFlashIntensity: "None" | "Mild" | "Moderate" | "Severe";
  sleepQuality: "Good" | "Restless" | "Poor";
  notes: string;
  skinSnapshot: SkinMetrics;
};

type Product = {
  id: string;
  name: string;
  brand: string;
  category: "Cleanser" | "Moisturizer" | "Serum" | "Sunscreen" | "Makeup";
  price: number;
  imageEmoji: string;
  ingredients: string[];
  concerns: string[];
  vtoEnabled?: boolean;
  vtoSku?: string;
};

type ProductRisk = {
  product: Product;
  status: "recommended" | "caution" | "blocked";
  reasons: string[];
  matchScore: number;
};

const INITIAL_METRICS: SkinMetrics = {
  moisture: 48,
  redness: 42,
  texture: 51,
  wrinkles: 46,
  radiance: 58,
  skinAge: 49,
};

const CONTRAINDICATIONS = [
  "Alcohol Denat",
  "High-percentage Retinol",
  "Sodium Lauryl Sulfate",
  "Fragrance",
];

const PRODUCTS: Product[] = [
  {
    id: "p1",
    name: "Barrier Rescue Ceramide Cream",
    brand: "MenoMorph Lab",
    category: "Moisturizer",
    price: 42,
    imageEmoji: "🧴",
    ingredients: ["Ceramide NP", "Glycerin", "Squalane", "Panthenol"],
    concerns: ["Dryness", "Barrier repair", "Redness"],
  },
  {
    id: "p2",
    name: "Phyto-Calm Centella Serum",
    brand: "MenoMorph Lab",
    category: "Serum",
    price: 38,
    imageEmoji: "🌿",
    ingredients: ["Centella Asiatica", "Panthenol", "Madecassoside"],
    concerns: ["Redness", "Sensitivity", "Barrier repair"],
  },
  {
    id: "p3",
    name: "Gentle Lipid Cleanser",
    brand: "MenoMorph Lab",
    category: "Cleanser",
    price: 26,
    imageEmoji: "🫧",
    ingredients: ["Glycerin", "Oat Extract", "Coco-Glucoside"],
    concerns: ["Dryness", "Sensitivity"],
  },
  {
    id: "p4",
    name: "Mineral Defense SPF 50",
    brand: "ShieldPro",
    category: "Sunscreen",
    price: 34,
    imageEmoji: "☀️",
    ingredients: ["Zinc Oxide", "Squalane", "Niacinamide"],
    concerns: ["Photoaging", "Redness", "Dark spots"],
  },
  {
    id: "p5",
    name: "Overnight Renewal Retinol 1%",
    brand: "DermActive",
    category: "Serum",
    price: 58,
    imageEmoji: "🌙",
    ingredients: ["High-percentage Retinol", "Alcohol Denat"],
    concerns: ["Wrinkles", "Texture"],
  },
  {
    id: "p6",
    name: "Clarifying SLS Foaming Cleanser",
    brand: "ClearSkin",
    category: "Cleanser",
    price: 18,
    imageEmoji: "🧼",
    ingredients: ["Sodium Lauryl Sulfate", "Fragrance"],
    concerns: ["Oiliness"],
  },
  {
    id: "p7",
    name: "Luminous Skin Tint",
    brand: "GlowStudio",
    category: "Makeup",
    price: 39,
    imageEmoji: "💄",
    ingredients: ["Niacinamide", "Hyaluronic Acid", "Iron Oxides"],
    concerns: ["Dullness", "Uneven tone"],
    vtoEnabled: true,
    vtoSku: "GLOW-TINT-02",
  },
  {
    id: "p8",
    name: "Velvet Blush Duo",
    brand: "GlowStudio",
    category: "Makeup",
    price: 32,
    imageEmoji: "🌸",
    ingredients: ["Talc-free Powder", "Squalane", "Iron Oxides"],
    concerns: ["Dullness"],
    vtoEnabled: true,
    vtoSku: "VELVET-BLUSH-04",
  },
];

export default function MenoMorphWorkspace() {
  const [metrics, setMetrics] = useState<SkinMetrics>(INITIAL_METRICS);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [hasScanned, setHasScanned] = useState(false);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [analysisMasks, setAnalysisMasks] = useState<AnalysisResponse["masks"]>({});
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [selectedOverlay, setSelectedOverlay] = useState<
    keyof AnalysisResponse["masks"]
  >("redness");

  const [hotFlash, setHotFlash] =
    useState<WellnessLog["hotFlashIntensity"]>("None");
  const [sleep, setSleep] = useState<WellnessLog["sleepQuality"]>("Good");
  const [notes, setNotes] = useState("");
  const [logs, setLogs] = useState<WellnessLog[]>([]);

  const [activeTab, setActiveTab] = useState<"skincare" | "beauty">("skincare");
  const [routineProductIds, setRoutineProductIds] = useState<string[]>([]);
  const [routineFeedback, setRoutineFeedback] = useState<string | null>(null);

  const barrierRisk = metrics.moisture < 45 && metrics.redness > 50;
  const renewalRisk = metrics.texture > 55 && metrics.wrinkles > 55;
  const sensitivityRisk = metrics.redness > 60 || metrics.radiance < 40;
  const anyAlarm = barrierRisk || renewalRisk || sensitivityRisk;

  const overallSkinScore = useMemo(() => {
    const score =
      metrics.moisture * 0.25 +
      (100 - metrics.redness) * 0.2 +
      (100 - metrics.texture) * 0.2 +
      (100 - metrics.wrinkles) * 0.2 +
      metrics.radiance * 0.15;

    return Math.round(score);
  }, [metrics]);

  const productRisks: ProductRisk[] = useMemo(() => {
    return PRODUCTS.map((product) => {
      const reasons: string[] = [];
      let status: ProductRisk["status"] = "recommended";

      const riskyIngredients = product.ingredients.filter((ingredient) =>
        CONTRAINDICATIONS.includes(ingredient)
      );

      if (barrierRisk && riskyIngredients.length > 0) {
        status = "blocked";
        reasons.push(
          `Barrier-compromise mode: avoid ${riskyIngredients.join(", ")}.`
        );
      }

      if (
        sensitivityRisk &&
        riskyIngredients.length > 0 &&
        status !== "blocked"
      ) {
        status = "caution";
        reasons.push(
          `Sensitivity watch: use caution with ${riskyIngredients.join(", ")}.`
        );
      }

      if (renewalRisk && product.concerns.includes("Wrinkles")) {
        if (status === "recommended") {
          status = "caution";
        }
        reasons.push(
          "Renewal protocol: introduce anti-aging actives gradually."
        );
      }

      if (
        metrics.moisture < 50 &&
        (product.concerns.includes("Dryness") ||
          product.concerns.includes("Barrier repair"))
      ) {
        reasons.push("Strong match for low moisture and barrier support.");
      }

      if (
        metrics.redness > 55 &&
        (product.concerns.includes("Redness") ||
          product.concerns.includes("Sensitivity"))
      ) {
        reasons.push("Designed to calm visible redness and sensitivity.");
      }

      if (metrics.wrinkles > 55 && product.concerns.includes("Photoaging")) {
        reasons.push("Supports a photoaging-prevention routine.");
      }

      const matchScore = Math.min(
        99,
        Math.max(
          35,
          Math.round(
            (reasons.length > 0 ? 65 : 45) +
              (product.concerns.includes("Barrier repair") && barrierRisk
                ? 20
                : 0) +
              (product.concerns.includes("Redness") && metrics.redness > 55
                ? 10
                : 0) -
              (status === "blocked" ? 35 : 0)
          )
        )
      );

      return {
        product,
        status,
        reasons,
        matchScore,
      };
    }).sort((a, b) => {
      const rank = {
        recommended: 0,
        caution: 1,
        blocked: 2,
      };

      return rank[a.status] - rank[b.status] || b.matchScore - a.matchScore;
    });
  }, [metrics, barrierRisk, renewalRisk, sensitivityRisk]);

  const visibleProducts = productRisks.filter(({ product }) => {
    if (activeTab === "beauty") {
      return product.category === "Makeup";
    }

    return product.category !== "Makeup";
  });

  const routine = useMemo(() => {
    const safeProducts = productRisks
      .filter((risk) => risk.status !== "blocked")
      .map((risk) => risk.product);

    const morning = safeProducts.filter(
      (product) =>
        product.category === "Cleanser" ||
        product.category === "Moisturizer" ||
        product.category === "Sunscreen"
    );

    const evening = safeProducts.filter(
      (product) =>
        product.category === "Cleanser" ||
        product.category === "Serum" ||
        product.category === "Moisturizer"
    );

    return {
      morning,
      evening,
    };
  }, [productRisks]);

  const ingredientConflicts = useMemo(() => {
    return productRisks
      .filter((risk) => risk.status !== "recommended")
      .map((risk) => {
        const flaggedIngredients = risk.product.ingredients.filter(
          (ingredient) => CONTRAINDICATIONS.includes(ingredient)
        );

        return {
          productName: risk.product.name,
          productEmoji: risk.product.imageEmoji,
          status: risk.status,
          flaggedIngredients,
          reason:
            risk.reasons[0] ||
            "This product may not suit your current skin signals.",
        };
      });
  }, [productRisks]);

  const routineTotal = useMemo(() => {
    const selectedProducts = PRODUCTS.filter((product) =>
      routineProductIds.includes(product.id)
    );

    return selectedProducts.reduce((total, product) => total + product.price, 0);
  }, [routineProductIds]);

  const handleImageSelected = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) {
      return;
    }

    setAnalysisError(null);
    setIsAnalyzing(true);
    setHasScanned(false);
    setPreviewUrl(URL.createObjectURL(file));

    try {
      const formData = new FormData();
      formData.append("image", file);

      const response = await fetch("/api/analyze-skin", {
        method: "POST",
        body: formData,
      });

      const result = (await response.json()) as AnalysisResponse & {
        error?: string;
      };

      if (!response.ok) {
        throw new Error(result.error || "Skin analysis failed.");
      }

      setMetrics({
        moisture: result.moisture,
        redness: result.redness,
        texture: result.texture,
        wrinkles: result.wrinkles,
        radiance: result.radiance,
        skinAge: result.skinAge,
      });

      setAnalysisMasks(result.masks ?? {});
      setSelectedOverlay(result.masks?.redness ? "redness" : "moisture");
      setHasScanned(true);
    } catch (error) {
      setAnalysisError(
        error instanceof Error
          ? error.message
          : "Unable to analyze this image. Please try another selfie."
      );
    } finally {
      setIsAnalyzing(false);
      event.target.value = "";
    }
  };

  const handleLogSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    const newLog: WellnessLog = {
      id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
      timestamp: new Date().toLocaleTimeString(),
      hotFlashIntensity: hotFlash,
      sleepQuality: sleep,
      notes: notes.trim() || "No additional symptoms recorded.",
      skinSnapshot: metrics,
    };

    setLogs((previousLogs) => [newLog, ...previousLogs].slice(0, 8));
    setNotes("");
  };

  const handleAddToRoutine = (productId: string, productName: string) => {
    setRoutineProductIds((currentIds) => {
      if (currentIds.includes(productId)) {
        setRoutineFeedback(`${productName} removed from your routine.`);
        return currentIds.filter((id) => id !== productId);
      }

      setRoutineFeedback(`${productName} added to your routine.`);
      return [...currentIds, productId];
    });
  };

  const resetAnalysis = () => {
    setMetrics(INITIAL_METRICS);
    setHasScanned(false);
    setIsAnalyzing(false);
    setAnalysisError(null);
    setAnalysisMasks({});
    setPreviewUrl(null);
    setSelectedOverlay("redness");
    setHotFlash("None");
    setSleep("Good");
    setNotes("");
    setLogs([]);
    setActiveTab("skincare");
    setRoutineProductIds([]);
    setRoutineFeedback(null);
  };

  const scrollToRoutine = () => {
    setActiveTab("skincare");

    setTimeout(() => {
      document
        .getElementById("routine-section")
        ?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 100);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      <div className="mx-auto max-w-7xl px-4 pb-28 pt-8 sm:px-8 lg:pb-8">
        <header className="mb-8 rounded-3xl border border-white/10 bg-gradient-to-br from-slate-900 via-slate-900 to-teal-950 p-5 sm:p-8">
          <div className="flex flex-col gap-6 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-teal-400/30 bg-teal-400/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-teal-300 sm:text-xs">
                YouCam Skin AI × eCommerce VTO
              </div>

              <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
                🧬 MenoMorph AI
              </h1>

              <p className="mt-2 max-w-2xl text-sm text-slate-300 sm:text-base">
                A menopause-aware beauty intelligence platform that turns AI
                skin diagnostics into safer routines, smarter product matches,
                and virtual beauty discovery.
              </p>
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <span className="rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-center text-xs font-bold uppercase text-emerald-300">
                {isAnalyzing ? "Analyzing" : "Ready"}
              </span>

              <button
                type="button"
                onClick={resetAnalysis}
                className="w-full rounded-xl border border-white/15 px-4 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/5 sm:w-auto"
              >
                Reset Session
              </button>
            </div>
          </div>

          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <KpiCard
              label="Prototype Index"
              value={`${overallSkinScore}/100`}
              accent="teal"
            />

            <KpiCard
  label="Analysis Status"
  value={
    isAnalyzing
      ? "Analyzing…"
      : hasScanned
        ? "Completed"
        : "Not scanned"
  }
  accent="purple"
/>
           <KpiCard
  label="Barrier Rule"
  value={barrierRisk ? "Triggered" : "Not triggered"}
  accent={barrierRisk ? "rose" : "emerald"}
/>

            <KpiCard
              label="Routine Items"
              value={`${routineProductIds.length}`}
              accent="amber"
            />
          </div>
        </header>

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-12">
          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6 lg:col-span-5">
            <SectionTitle
              icon="📷"
              title="YouCam Skin Analysis"
              subtitle="Upload a clear selfie to generate an AI skin diagnostic."
            />

            <div className="mb-5 overflow-hidden rounded-2xl border border-dashed border-white/15 bg-slate-950/60">
              {previewUrl ? (
                <div className="relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt="Uploaded selfie preview"
                    className="h-56 w-full object-cover sm:h-64"
                  />

                  {hasScanned && analysisMasks[selectedOverlay] && (
                    <>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img
                        src={analysisMasks[selectedOverlay]}
                        alt={`${selectedOverlay} AI detection overlay`}
                        className="absolute inset-0 h-56 w-full object-cover opacity-70 mix-blend-screen sm:h-64"
                      />

                      <div className="absolute bottom-3 left-3 rounded-full bg-slate-950/80 px-3 py-1 text-xs font-bold capitalize text-teal-300">
                        AI Overlay: {selectedOverlay}
                      </div>
                    </>
                  )}
                </div>
              ) : (
                <div className="p-8 text-center">
                  <div className="text-5xl">🤳</div>

                 <p className="mt-3 text-sm text-slate-300">
  Upload a clear, front-facing selfie. Your face should fill most of the
  frame, with good lighting and no hair, masks, sunglasses, or filters
  covering it.
</p>

<p className="mt-2 text-xs text-amber-300">
  YouCam requires a clear, unobstructed face for analysis.
</p>
                </div>
              )}
            </div>

            <label
              htmlFor="skin-image-upload"
              className="block cursor-pointer rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-center text-sm font-bold text-slate-950 transition hover:opacity-90"
            >
              {isAnalyzing ? "Analyzing skin…" : "Upload Selfie & Analyze"}
            </label>

            <input
              id="skin-image-upload"
              type="file"
              accept="image/jpeg,image/jpg,image/png"
              className="hidden"
              onChange={handleImageSelected}
              disabled={isAnalyzing}
            />

            {isAnalyzing && (
              <div className="mt-4 rounded-xl border border-teal-400/20 bg-teal-400/10 p-3 text-sm text-teal-200">
                Running YouCam diagnostics: moisture, redness, texture,
                wrinkles, and radiance…
              </div>
            )}

            {analysisError && (
              <div className="mt-4 rounded-xl border border-rose-400/20 bg-rose-400/10 p-3 text-sm text-rose-200">
                {analysisError}
              </div>
            )}

            {hasScanned && !isAnalyzing && !analysisError && (
              <div className="mt-4 rounded-xl border border-amber-400/20 bg-amber-400/10 p-3 text-sm text-amber-200">
                Scan complete. MenoMorph activated personalized barrier and
                renewal protocols.
              </div>
            )}

            {hasScanned && (
              <div className="mt-4 flex flex-wrap gap-2">
                {(
                  [
                    "moisture",
                    "redness",
                    "texture",
                    "wrinkles",
                    "radiance",
                  ] as Array<keyof AnalysisResponse["masks"]>
                ).map((overlayKey) => (
                  <button
                    key={overlayKey}
                    type="button"
                    onClick={() => setSelectedOverlay(overlayKey)}
                    disabled={!analysisMasks[overlayKey]}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold capitalize transition ${
                      selectedOverlay === overlayKey
                        ? "bg-teal-500 text-slate-950"
                        : "border border-white/15 text-slate-300 hover:bg-white/5"
                    } disabled:cursor-not-allowed disabled:opacity-40`}
                  >
                    {overlayKey}
                  </button>
                ))}
              </div>
            )}

            <div className="mt-6 space-y-5">
              <MetricSlider
                label="Moisture"
                value={metrics.moisture}
                onChange={(moisture) =>
                  setMetrics((current) => ({ ...current, moisture }))
                }
                warning={metrics.moisture < 45}
                warningText="Low moisture"
              />

              <MetricSlider
                label="Redness"
                value={metrics.redness}
                onChange={(redness) =>
                  setMetrics((current) => ({ ...current, redness }))
                }
                warning={metrics.redness > 50}
                warningText="Elevated redness"
              />

              <MetricSlider
                label="Texture"
                value={metrics.texture}
                onChange={(texture) =>
                  setMetrics((current) => ({ ...current, texture }))
                }
                warning={metrics.texture > 55}
                warningText="Uneven texture"
              />

              <MetricSlider
                label="Wrinkles"
                value={metrics.wrinkles}
                onChange={(wrinkles) =>
                  setMetrics((current) => ({ ...current, wrinkles }))
                }
                warning={metrics.wrinkles > 55}
                warningText="Elevated wrinkles"
              />

              <MetricSlider
                label="Radiance"
                value={metrics.radiance}
                onChange={(radiance) =>
                  setMetrics((current) => ({ ...current, radiance }))
                }
                warning={metrics.radiance < 45}
                warningText="Dullness detected"
              />
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6 lg:col-span-3">
            <SectionTitle
              icon="📝"
              title="Wellness Logger"
              subtitle="Connect menopause symptoms to skin changes."
            />

            <form onSubmit={handleLogSubmit} className="space-y-4">
              <Field label="Hot Flash Intensity">
                <select
                  value={hotFlash}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    setHotFlash(
                      event.target.value as WellnessLog["hotFlashIntensity"]
                    );
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="None">None / stable</option>
                  <option value="Mild">Mild</option>
                  <option value="Moderate">Moderate</option>
                  <option value="Severe">Severe</option>
                </select>
              </Field>

              <Field label="Sleep Quality">
                <select
                  value={sleep}
                  onChange={(event: React.ChangeEvent<HTMLSelectElement>) => {
                    setSleep(
                      event.target.value as WellnessLog["sleepQuality"]
                    );
                  }}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                >
                  <option value="Good">Restorative</option>
                  <option value="Restless">Restless</option>
                  <option value="Poor">Severely disrupted</option>
                </select>
              </Field>

              <Field label="Observations">
                <textarea
                  value={notes}
                  onChange={(event: React.ChangeEvent<HTMLTextAreaElement>) => {
                    setNotes(event.target.value);
                  }}
                  placeholder="Tightness, flushing, dryness, product reactions…"
                  className="h-20 w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-3 py-2 text-sm"
                />
              </Field>

              <button
                type="submit"
                className="w-full rounded-xl bg-pink-500 px-4 py-3 text-sm font-bold text-white transition hover:bg-pink-400"
              >
                Save Wellness Entry
              </button>
            </form>

            <div className="mt-6 max-h-64 space-y-3 overflow-y-auto">
              {logs.length === 0 ? (
                <p className="rounded-xl border border-white/10 bg-slate-950/60 p-4 text-xs text-slate-400">
                  No wellness entries yet. Save an entry to build a symptom and
                  skin timeline.
                </p>
              ) : (
                logs.map((log) => (
                  <div
                    key={log.id}
                    className="rounded-xl border border-white/10 bg-slate-950/60 p-3 text-xs"
                  >
                    <p className="font-bold text-pink-300">[{log.timestamp}]</p>

                    <p className="mt-1 text-slate-300">
                      Hot flashes: {log.hotFlashIntensity} • Sleep:{" "}
                      {log.sleepQuality}
                    </p>

                    <p className="mt-1 italic text-slate-400">“{log.notes}”</p>
                  </div>
                ))
              )}
            </div>
          </section>

          <section className="rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6 lg:col-span-4">
            <SectionTitle
              icon="🧠"
              title="Clinical Decision Engine"
              subtitle="Real-time protocol and ingredient-risk interpretation."
            />

            <div className="space-y-3">
              <ProtocolCard
                active={barrierRisk}
                title="Barrier Compromise Alert"
                description="Low moisture combined with elevated redness."
                action="Prioritize ceramides, glycerin, squalane, and gentle cleansing."
              />

              <ProtocolCard
                active={renewalRisk}
                title="Lipid Renewal Protocol"
                description="Texture and wrinkle signals are elevated."
                action="Phase in renewal actives slowly and reinforce the moisture barrier."
              />

              <ProtocolCard
                active={sensitivityRisk}
                title="Sensitivity Watch"
                description="Redness is high or radiance is low."
                action="Avoid harsh surfactants, fragrance, and high-strength irritants."
              />
            </div>

            <div className="mt-5 rounded-2xl border border-amber-400/30 bg-amber-400/10 p-4">
              <p className="text-sm font-bold text-amber-200">
                When to seek support
              </p>

              <p className="mt-2 text-xs text-amber-100/80">
                MenoMorph provides cosmetic wellness guidance, not medical
                diagnosis. If you experience persistent redness, pain, rash,
                swelling, bleeding, or sudden skin changes, consult a qualified
                healthcare professional.
              </p>
            </div>
          </section>
        </div>

        <section
          id="routine-section"
          className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6"
        >
          <div className="mb-6">
            <h2 className="text-xl font-bold">🧴 Your Adaptive Routine</h2>

            <p className="mt-1 text-sm text-slate-400">
              MenoMorph builds a simple morning and evening routine using
              products compatible with your current skin signals.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
            <div className="rounded-2xl border border-teal-400/20 bg-teal-400/5 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-teal-300">
                ☀️ Morning Routine
              </h3>

              {routine.morning.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No compatible morning products available.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {routine.morning.map((product) => (
                    <li
                      key={`morning-${product.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3"
                    >
                      <span className="text-sm text-slate-200">
                        {product.imageEmoji} {product.name}
                      </span>

                      <span className="text-xs font-bold text-teal-300">
                        ${product.price}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-purple-400/20 bg-purple-400/5 p-5">
              <h3 className="text-sm font-bold uppercase tracking-wider text-purple-300">
                🌙 Evening Routine
              </h3>

              {routine.evening.length === 0 ? (
                <p className="mt-3 text-sm text-slate-400">
                  No compatible evening products available.
                </p>
              ) : (
                <ul className="mt-3 space-y-3">
                  {routine.evening.map((product) => (
                    <li
                      key={`evening-${product.id}`}
                      className="flex items-center justify-between gap-3 rounded-xl border border-white/10 bg-slate-950/60 p-3"
                    >
                      <span className="text-sm text-slate-200">
                        {product.imageEmoji} {product.name}
                      </span>

                      <span className="text-xs font-bold text-purple-300">
                        ${product.price}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>

          {routineFeedback && (
            <div className="mt-5 rounded-xl border border-teal-400/20 bg-teal-400/10 p-3 text-sm text-teal-200">
              {routineFeedback}
            </div>
          )}

          <div className="mt-5 rounded-2xl border border-white/10 bg-slate-950/60 p-4">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="text-xs font-bold uppercase tracking-wider text-slate-400">
                  Selected routine total
                </p>

                <p className="mt-1 text-2xl font-black text-teal-300">
                  ${routineTotal.toFixed(2)}
                </p>
              </div>

              <button
                type="button"
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 px-4 py-3 text-sm font-bold text-slate-950 transition hover:opacity-90 sm:w-auto"
              >
                Continue to Retailer Checkout
              </button>
            </div>

            <p className="mt-3 text-center text-[11px] text-slate-500 sm:text-left">
              Payment is intentionally excluded from this prototype to focus on
              AI personalization, product safety, and virtual try-on.
            </p>
          </div>
        </section>

        {ingredientConflicts.length > 0 && (
          <section className="mt-8 rounded-3xl border border-amber-400/20 bg-amber-400/5 p-5 sm:p-6">
            <h2 className="text-xl font-bold">⚠️ Ingredient Conflict Checker</h2>

            <p className="mt-1 text-sm text-slate-400">
              These products contain ingredients that may not suit your current
              skin signals.
            </p>

            <div className="mt-5 grid gap-3 md:grid-cols-2">
              {ingredientConflicts.map((conflict, index) => (
                <div
                  key={`${conflict.productName}-${index}`}
                  className={`rounded-2xl border p-4 ${
                    conflict.status === "blocked"
                      ? "border-rose-400/30 bg-rose-400/10"
                      : "border-amber-400/30 bg-amber-400/10"
                  }`}
                >
                  <div className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm font-bold">
                      {conflict.productEmoji} {conflict.productName}
                    </p>

                    <span
                      className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                        conflict.status === "blocked"
                          ? "bg-rose-500/20 text-rose-300"
                          : "bg-amber-400/20 text-amber-300"
                      }`}
                    >
                      {conflict.status}
                    </span>
                  </div>

                  {conflict.flaggedIngredients.length > 0 && (
                    <p className="mt-2 text-xs text-slate-300">
                      Watch-out ingredients:{" "}
                      <span className="font-bold text-rose-300">
                        {conflict.flaggedIngredients.join(", ")}
                      </span>
                    </p>
                  )}

                  <p className="mt-2 text-xs text-slate-400">
                    {conflict.reason}
                  </p>
                </div>
              ))}
            </div>
          </section>
        )}

        <section className="mt-8 rounded-3xl border border-white/10 bg-slate-900/70 p-5 sm:p-6">
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-xl font-bold">
                🛍️ Personalized Beauty Catalog
              </h2>

              <p className="mt-1 text-sm text-slate-400">
                Product recommendations adapt to the active skin protocols.
              </p>
            </div>

            <div className="flex w-full rounded-xl border border-white/10 bg-slate-950 p-1 sm:w-auto">
              <button
                type="button"
                onClick={() => setActiveTab("skincare")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  activeTab === "skincare"
                    ? "bg-teal-500 text-slate-950"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                Skincare
              </button>

              <button
                type="button"
                onClick={() => setActiveTab("beauty")}
                className={`flex-1 rounded-lg px-4 py-2 text-sm font-semibold transition sm:flex-none ${
                  activeTab === "beauty"
                    ? "bg-pink-500 text-white"
                    : "text-slate-300 hover:bg-white/5"
                }`}
              >
                Beauty VTO
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {visibleProducts.map(({ product, status, reasons, matchScore }) => (
              <article
                key={product.id}
                className={`flex flex-col rounded-2xl border p-4 transition ${
                  status === "blocked"
                    ? "border-rose-500/30 bg-rose-500/5"
                    : status === "caution"
                    ? "border-amber-400/30 bg-amber-400/5"
                    : "border-emerald-400/30 bg-emerald-400/5"
                }`}
              >
                <div className="flex items-start justify-between">
                  <span className="text-3xl">{product.imageEmoji}</span>

                  <span
                    className={`rounded-full px-2 py-1 text-[10px] font-black uppercase ${
                      status === "blocked"
                        ? "bg-rose-500/20 text-rose-300"
                        : status === "caution"
                        ? "bg-amber-400/20 text-amber-300"
                        : "bg-emerald-400/20 text-emerald-300"
                    }`}
                  >
                    {status}
                  </span>
                </div>

                <h3 className="mt-3 text-sm font-bold">{product.name}</h3>

                <p className="text-xs text-slate-400">
                  {product.brand} • {product.category}
                </p>

                <p className="mt-2 text-lg font-black text-teal-300">
                  ${product.price}
                </p>

                <div className="mt-3">
                  <div className="flex justify-between text-[11px] text-slate-400">
                    <span>Personal match</span>
                    <span>{matchScore}%</span>
                  </div>

                  <div className="mt-1 h-1.5 w-full rounded-full bg-white/10">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-teal-400 to-cyan-400"
                      style={{ width: `${matchScore}%` }}
                    />
                  </div>
                </div>

                {reasons.length > 0 && (
                  <ul className="mt-3 space-y-1 text-[11px] text-slate-300">
                    {reasons.slice(0, 2).map((reason, reasonIndex) => (
                      <li key={`${product.id}-reason-${reasonIndex}`}>
                        • {reason}
                      </li>
                    ))}
                  </ul>
                )}

                <div className="mt-auto pt-4">
                  {product.vtoEnabled ? (
                    <button
                      type="button"
                      className="w-full rounded-xl bg-pink-500 px-3 py-2 text-xs font-bold text-white transition hover:bg-pink-400"
                    >
                      Try On Virtually
                    </button>
                  ) : (
                    <button
                      type="button"
                      onClick={() =>
                        handleAddToRoutine(product.id, product.name)
                      }
                      disabled={status === "blocked"}
                      className={`w-full rounded-xl px-3 py-2 text-xs font-bold transition ${
                        routineProductIds.includes(product.id)
                          ? "bg-teal-500 text-slate-950"
                          : "border border-white/15 text-slate-200 hover:bg-white/5"
                      } disabled:cursor-not-allowed disabled:opacity-40`}
                    >
                      {routineProductIds.includes(product.id)
                        ? "Added to Routine"
                        : "Add to Routine"}
                    </button>
                  )}
                </div>
              </article>
            ))}
          </div>
        </section>

        <footer className="mt-8 rounded-3xl border border-white/10 bg-slate-900/60 p-6 text-center">
          <p className="text-sm text-slate-400">
            MenoMorph AI is a consumer wellness and retail discovery experience.
            It does not diagnose or treat medical conditions.
          </p>
        </footer>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 p-3 backdrop-blur lg:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3">
          <button
            type="button"
            onClick={resetAnalysis}
            className="flex-1 rounded-xl border border-white/15 px-3 py-3 text-xs font-bold text-slate-200"
          >
            Reset
          </button>

          <button
            type="button"
            onClick={scrollToRoutine}
            className="flex-1 rounded-xl bg-teal-500 px-3 py-3 text-xs font-bold text-slate-950"
          >
            View Routine ({routineProductIds.length})
          </button>
        </div>
      </div>
    </div>
  );
}

function KpiCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: string;
  accent: "teal" | "purple" | "rose" | "emerald" | "amber";
}) {
  const accentStyles: Record<
    "teal" | "purple" | "rose" | "emerald" | "amber",
    string
  > = {
    teal: "border-teal-400/20 bg-teal-400/5 text-teal-300",
    purple: "border-purple-400/20 bg-purple-400/5 text-purple-300",
    rose: "border-rose-400/20 bg-rose-400/5 text-rose-300",
    emerald: "border-emerald-400/20 bg-emerald-400/5 text-emerald-300",
    amber: "border-amber-400/20 bg-amber-400/5 text-amber-300",
  };

  return (
    <div className={`rounded-2xl border p-4 ${accentStyles[accent]}`}>
      <p className="text-[11px] font-bold uppercase tracking-wider opacity-80">
        {label}
      </p>

      <p className="mt-1 text-lg font-black sm:text-xl">{value}</p>
    </div>
  );
}

function SectionTitle({
  icon,
  title,
  subtitle,
}: {
  icon: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="mb-5">
      <h2 className="text-lg font-bold">
        {icon} {title}
      </h2>

      <p className="mt-1 text-sm text-slate-400">{subtitle}</p>
    </div>
  );
}

function MetricSlider({
  label,
  value,
  onChange,
  warning,
  warningText,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  warning: boolean;
  warningText: string;
}) {
  return (
    <div>
      <div className="mb-1 flex items-center justify-between gap-2 text-sm font-semibold">
        <label>{label}</label>

        <span className={warning ? "text-rose-400" : "text-teal-300"}>
          {value}/100 {warning ? `• ${warningText}` : ""}
        </span>
      </div>

      <input
        type="range"
        min={0}
        max={100}
        value={value}
        onChange={(event: React.ChangeEvent<HTMLInputElement>) => {
          onChange(Number(event.target.value));
        }}
        className="w-full accent-teal-400"
        aria-label={label}
      />
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="mb-1 block text-[11px] font-bold uppercase tracking-wider text-slate-400">
        {label}
      </label>

      {children}
    </div>
  );
}

function ProtocolCard({
  active,
  title,
  description,
  action,
}: {
  active: boolean;
  title: string;
  description: string;
  action: string;
}) {
  return (
    <div
      className={`rounded-2xl border p-4 ${
        active
          ? "border-rose-400/30 bg-rose-400/10"
          : "border-white/10 bg-slate-950/60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-bold">{title}</p>

        <span
          className={`rounded-full px-2 py-0.5 text-[10px] font-black uppercase ${
            active
              ? "bg-rose-500/20 text-rose-300"
              : "bg-white/10 text-slate-400"
          }`}
        >
          {active ? "Active" : "Clear"}
        </span>
      </div>

      <p className="mt-2 text-xs text-slate-400">{description}</p>

      <p className="mt-2 text-xs text-slate-200">{action}</p>
    </div>
  );
}
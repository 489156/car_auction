import { i as __toESM } from "../_runtime.mjs";
import { n as DEFAULT_TELEGRAM, t as DEFAULT_SEARCH_CONFIG } from "./config-CaI-hVHF.mjs";
import { n as require_react } from "../_libs/@radix-ui/react-compose-refs+[...].mjs";
import { n as require_jsx_runtime } from "../_libs/radix-ui__react-context+react.mjs";
import { n as Slot } from "../_libs/@radix-ui/react-primitive+[...].mjs";
import { n as TSS_SERVER_FUNCTION, r as getServerFnById, t as createServerFn } from "./ssr.mjs";
import { a as Radar, c as Gauge, d as ExternalLink, f as Activity, i as RefreshCw, l as Funnel, n as Sparkles, o as Landmark, r as ShieldAlert, s as KeyRound, u as Fuel } from "../_libs/lucide-react.mjs";
import { n as toast, t as Toaster } from "../_libs/sonner.mjs";
import { n as clsx, t as cva } from "../_libs/class-variance-authority+clsx.mjs";
import { t as twMerge } from "../_libs/tailwind-merge.mjs";
import { n as SwitchThumb, t as Switch$1 } from "../_libs/@radix-ui/react-switch+[...].mjs";
import { n as create, t as persist } from "../_libs/zustand.mjs";
//#region node_modules/.nitro/vite/services/ssr/assets/routes-CmHrcHi0.js
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_runtime = require_jsx_runtime();
function cn(...inputs) {
	return twMerge(clsx(inputs));
}
function formatWon(value) {
	if (value == null || !Number.isFinite(value) || value <= 0) return "—";
	if (value >= 1e8) {
		const eok = value / 1e8;
		return `${eok.toFixed(eok >= 10 ? 0 : 1)}억`;
	}
	if (value >= 1e4) return `${Math.round(value / 1e4).toLocaleString("ko-KR")}만`;
	return `${value.toLocaleString("ko-KR")}원`;
}
function formatKm(value) {
	if (value == null || !Number.isFinite(value)) return "미확인";
	return `${value.toLocaleString("ko-KR")} km`;
}
var badgeVariants = cva("inline-flex items-center rounded-full px-2.5 py-1 text-xs font-medium", {
	variants: { variant: {
		default: "bg-raised text-muted",
		accent: "bg-accent text-accent-fg",
		outline: "text-muted shadow-[var(--shadow-border)]",
		danger: "bg-danger/15 text-danger",
		warn: "bg-warn/15 text-warn"
	} },
	defaultVariants: { variant: "default" }
});
function Badge({ className, variant, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
		className: cn(badgeVariants({ variant }), className),
		...props
	});
}
var buttonVariants = cva("inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-[color,background-color,box-shadow,transform,opacity] duration-150 ease-out focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-40 active:not-disabled:scale-[0.96]", {
	variants: {
		variant: {
			default: "bg-accent text-accent-fg hover:opacity-90",
			secondary: "bg-raised text-fg shadow-[var(--shadow-border)] hover:bg-surface",
			ghost: "text-muted hover:bg-raised hover:text-fg",
			outline: "bg-transparent text-fg shadow-[var(--shadow-border)] hover:bg-raised",
			danger: "bg-danger text-accent-fg hover:opacity-90"
		},
		size: {
			default: "h-11 px-4",
			sm: "h-9 px-3 text-xs",
			lg: "h-12 px-5",
			icon: "size-11"
		}
	},
	defaultVariants: {
		variant: "default",
		size: "default"
	}
});
function Button({ className, variant, size, asChild = false, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(asChild ? Slot : "button", {
		className: cn(buttonVariants({
			variant,
			size
		}), className),
		...props
	});
}
var GRADE_LABEL = {
	a: "A급 알짜",
	candidate: "1차 통과",
	rejected: "제외"
};
function ListingCard({ listing, isNew }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("article", {
		className: "flex flex-col gap-4 rounded-2xl bg-surface p-4 shadow-[var(--shadow-border)] transition-opacity duration-150 hover:opacity-95",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [
						/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
							className: "flex flex-wrap items-center gap-2",
							children: [
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: listing.grade === "a" ? "accent" : listing.grade === "candidate" ? "warn" : "outline",
									children: GRADE_LABEL[listing.grade]
								}),
								/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "outline",
									children: listing.platformName
								}),
								isNew ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
									variant: "accent",
									children: "신규"
								}) : null
							]
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h3", {
							className: "mt-2 truncate font-medium leading-snug text-fg",
							children: listing.carName
						}),
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
							className: "mt-1 font-mono text-xs text-subtle",
							children: listing.caseNo
						})
					]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "text-right",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "font-mono text-sm tabular-nums text-fg",
						children: formatWon(listing.minPrice)
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
						className: "text-xs text-subtle",
						children: [
							"감정 ",
							formatWon(listing.appraisalPrice),
							listing.discountRate != null ? ` · ${listing.discountRate}%` : ""
						]
					})]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dl", {
				className: "grid grid-cols-2 gap-2 text-sm sm:grid-cols-4",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Landmark, { className: "size-3.5" }),
						label: "담당",
						value: listing.courtOrDept
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3.5" }),
						label: "연식",
						value: listing.year ? `${listing.year}년식` : "미확인"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Gauge, { className: "size-3.5" }),
						label: "주행",
						value: formatKm(listing.mileage)
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Spec, {
						icon: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Fuel, { className: "size-3.5" }),
						label: "연료",
						value: listing.fuel
					})
				]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-start gap-2 rounded-lg bg-raised px-3 py-2 text-xs text-muted",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(KeyRound, { className: "mt-0.5 size-3.5 shrink-0" }), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "min-w-0",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", { children: ["차키 ", listing.keyStatus] }), listing.rejectReasons.length > 0 ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "mt-1 text-subtle",
						children: listing.rejectReasons.join(" · ")
					}) : null]
				})]
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "flex items-center justify-between gap-3",
				children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "text-xs text-subtle",
					children: ["기일 ", listing.auctionDate || "—"]
				}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					asChild: true,
					variant: "outline",
					size: "sm",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("a", {
						href: listing.detailUrl,
						target: "_blank",
						rel: "noreferrer",
						children: ["원문", /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ExternalLink, { className: "size-3.5" })]
					})
				})]
			})
		]
	});
}
function Spec({ icon, label, value }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "rounded-lg bg-raised px-3 py-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("dt", {
			className: "flex items-center gap-1 text-xs text-subtle",
			children: [icon, label]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("dd", {
			className: "mt-0.5 truncate text-sm text-fg",
			children: value
		})]
	});
}
function Input({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("input", {
		className: cn("flex h-11 w-full rounded-md bg-raised px-3 text-sm text-fg shadow-[var(--shadow-border)] outline-none transition-[box-shadow] duration-150 placeholder:text-subtle focus-visible:ring-2 focus-visible:ring-ring", className),
		...props
	});
}
function Label({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("label", {
		className: cn("text-xs font-medium tracking-wide text-muted", className),
		...props
	});
}
function Switch({ className, ...props }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch$1, {
		className: cn("peer inline-flex h-6 w-11 shrink-0 items-center rounded-full bg-raised shadow-[var(--shadow-border)] transition-colors duration-150 data-[state=checked]:bg-accent", className),
		...props,
		children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SwitchThumb, { className: "pointer-events-none block size-5 translate-x-0.5 rounded-full bg-fg transition-transform duration-150 data-[state=checked]:translate-x-5 data-[state=checked]:bg-accent-fg" })
	});
}
var useRadarStore = create()(persist((set, get) => ({
	config: DEFAULT_SEARCH_CONFIG,
	telegram: DEFAULT_TELEGRAM,
	historyIds: [],
	lastScan: null,
	setConfig: (patch) => set({ config: {
		...get().config,
		...patch
	} }),
	setTelegram: (patch) => set({ telegram: {
		...get().telegram,
		...patch
	} }),
	rememberScan: (scan) => {
		const known = new Set(get().historyIds);
		const fresh = scan.listings.filter((row) => row.grade === "a" && !known.has(row.id)).map((row) => row.id);
		set({ lastScan: scan });
		return fresh;
	},
	markNotified: (ids) => set({ historyIds: [.../* @__PURE__ */ new Set([...get().historyIds, ...ids])] }),
	resetConfig: () => set({ config: DEFAULT_SEARCH_CONFIG })
}), {
	name: "auction-car-radar",
	partialize: (state) => ({
		config: state.config,
		telegram: state.telegram,
		historyIds: state.historyIds,
		lastScan: state.lastScan
	})
}));
function SettingsPanel() {
	const config = useRadarStore((s) => s.config);
	const telegram = useRadarStore((s) => s.telegram);
	const setConfig = useRadarStore((s) => s.setConfig);
	const setTelegram = useRadarStore((s) => s.setTelegram);
	const resetConfig = useRadarStore((s) => s.resetConfig);
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "grid gap-6 lg:grid-cols-2",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: "필터 조건"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "명세서 기본값: 2022년식↑, 5만 km↓, 하이브리드·전기, AND 조건."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 grid gap-4 sm:grid-cols-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "최소 연식",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 2015,
							max: 2030,
							value: config.minYear,
							onChange: (e) => setConfig({ minYear: Number(e.target.value) || 2022 })
						})
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
						label: "최대 주행거리 (km)",
						children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
							type: "number",
							min: 1e3,
							step: 1e3,
							value: config.maxMileage,
							onChange: (e) => setConfig({ maxMileage: Number(e.target.value) || 5e4 })
						})
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					className: "mt-4",
					label: "허용 연료 (쉼표 구분)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: config.fuelTypes.join(", "),
						onChange: (e) => setConfig({ fuelTypes: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					className: "mt-4",
					label: "필수 키워드 (차키, OR)",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: config.keywordsMustHave.join(", "),
						onChange: (e) => setConfig({ keywordsMustHave: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					className: "mt-4",
					label: "금지 키워드",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						value: config.keywordsExclude.join(", "),
						onChange: (e) => setConfig({ keywordsExclude: e.target.value.split(",").map((s) => s.trim()).filter(Boolean) })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "차키 키워드 필수"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-xs text-subtle",
						children: "끄면 연식·주행·연료만 통과한 매물도 A급으로 봅니다."
					})] }), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: config.requireKeyKeyword,
						onCheckedChange: (checked) => setConfig({ requireKeyKeyword: checked })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Button, {
					variant: "ghost",
					className: "mt-4",
					onClick: resetConfig,
					children: "기본값으로 되돌리기"
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("section", {
			className: "rounded-2xl bg-surface p-5 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("h2", {
					className: "font-display text-xl text-fg",
					children: "텔레그램 알림"
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-1 text-sm text-muted",
					children: "BotFather에서 봇을 만들고, 봇에게 말을 건 뒤 채팅 ID를 넣으세요. 토큰은 이 기기에만 저장됩니다."
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "mt-5 flex items-center justify-between gap-3 rounded-lg bg-raised px-3 py-3",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: "스캔 후 신규 A급 전송"
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Switch, {
						checked: telegram.enabled,
						onCheckedChange: (checked) => setTelegram({ enabled: checked })
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					className: "mt-4",
					label: "봇 토큰",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						type: "password",
						autoComplete: "off",
						placeholder: "123456:ABC...",
						value: telegram.botToken,
						onChange: (e) => setTelegram({ botToken: e.target.value.trim() })
					})
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Field, {
					className: "mt-4",
					label: "채팅 ID",
					children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Input, {
						placeholder: "123456789",
						value: telegram.chatId,
						onChange: (e) => setTelegram({ chatId: e.target.value.trim() })
					})
				})
			]
		})]
	});
}
function Field({ label, className, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("label", {
		className,
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Label, {
			className: "mb-1.5 block",
			children: label
		}), children]
	});
}
var createSsrRpc = (functionId) => {
	const url = "/_serverFn/" + functionId;
	const serverFnMeta = { id: functionId };
	const fn = async (...args) => {
		return (await getServerFnById(functionId, { origin: "server" }))(...args);
	};
	return Object.assign(fn, {
		url,
		serverFnMeta,
		[TSS_SERVER_FUNCTION]: true
	});
};
var runAuctionScan = createServerFn({ method: "POST" }).validator({ parse(input) {
	const data = input ?? {};
	return {
		config: {
			...DEFAULT_SEARCH_CONFIG,
			...data.config
		},
		enrich: data.enrich !== false
	};
} }).handler(createSsrRpc("93528b6dfa3de3ef3a78a0378788808ad4ea1155c8e4dabbfbfad7126a795270"));
var sendTelegramAlerts = createServerFn({ method: "POST" }).validator({ parse(input) {
	const data = input;
	return {
		telegram: data.telegram,
		listings: Array.isArray(data.listings) ? data.listings : []
	};
} }).handler(createSsrRpc("92d2355c98b380f8cb80cce32b15e5d7e3b8d474191fbbc63609bebff08597c5"));
function Home() {
	const config = useRadarStore((s) => s.config);
	const telegram = useRadarStore((s) => s.telegram);
	const lastScan = useRadarStore((s) => s.lastScan);
	const historyIds = useRadarStore((s) => s.historyIds);
	const rememberScan = useRadarStore((s) => s.rememberScan);
	const markNotified = useRadarStore((s) => s.markNotified);
	const [tab, setTab] = (0, import_react.useState)("a");
	const [scanning, setScanning] = (0, import_react.useState)(false);
	const [hydrated, setHydrated] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		setHydrated(true);
	}, []);
	const listings = hydrated ? lastScan?.listings ?? [] : [];
	const scan = hydrated ? lastScan : null;
	const visible = (0, import_react.useMemo)(() => {
		if (tab === "a") return listings.filter((row) => row.grade === "a");
		if (tab === "candidate") return listings.filter((row) => row.grade === "candidate");
		return listings;
	}, [listings, tab]);
	async function handleScan() {
		setScanning(true);
		const toastId = toast.loading("3개 플랫폼을 수집하는 중입니다…");
		try {
			const scan = await runAuctionScan({ data: {
				config,
				enrich: true
			} });
			const freshIds = rememberScan(scan);
			const fresh = scan.listings.filter((row) => freshIds.includes(row.id) && row.grade === "a");
			toast.success(`수집 ${scan.totals.fetched} · 1차 ${scan.totals.stage1} · A급 ${scan.totals.gradeA}`, { id: toastId });
			if (telegram.enabled && telegram.botToken && telegram.chatId && fresh.length) {
				const result = await sendTelegramAlerts({ data: {
					telegram,
					listings: fresh
				} });
				if (result.error) toast.error(result.error);
				else if (result.sent) {
					markNotified(fresh.map((row) => row.id));
					toast.success(`텔레그램 ${result.sent}건 전송`);
				}
			} else if (fresh.length) markNotified(fresh.map((row) => row.id));
			if (scan.totals.gradeA === 0) setTab(scan.totals.candidates ? "candidate" : "all");
			else setTab("a");
		} catch (error) {
			toast.error(error instanceof Error ? error.message : "스캔 실패", { id: toastId });
		} finally {
			setScanning(false);
		}
	}
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("main", {
		className: "mx-auto min-h-dvh max-w-6xl px-4 pb-24 pt-6 sm:px-6 sm:pt-10",
		children: [
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Toaster, {
				theme: "dark",
				position: "top-center",
				richColors: false
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Header, {
				scanning,
				onScan: handleScan
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Pipeline, {}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Stats, {
				scan,
				scanning
			}),
			/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Sources, { sources: scan?.sources }),
			/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
				className: "mt-8 flex flex-wrap gap-2",
				children: [
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
						active: tab === "a",
						onClick: () => setTab("a"),
						count: countGrade(listings, "a"),
						children: "A급 알짜"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
						active: tab === "candidate",
						onClick: () => setTab("candidate"),
						count: countGrade(listings, "candidate"),
						children: "1차 통과"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
						active: tab === "all",
						onClick: () => setTab("all"),
						count: listings.length,
						children: "전체"
					}),
					/* @__PURE__ */ (0, import_jsx_runtime.jsx)(TabBtn, {
						active: tab === "settings",
						onClick: () => setTab("settings"),
						children: "설정"
					})
				]
			}),
			tab === "settings" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
				className: "mt-6",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(SettingsPanel, {})
			}) : /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingGrid, {
				tab,
				listings: visible,
				historyIds,
				scanned: Boolean(scan),
				scanning
			})
		]
	});
}
function Header({ scanning, onScan }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("header", {
		className: "flex flex-col gap-5 sm:flex-row sm:items-end sm:justify-between",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "stagger-in",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "flex items-center gap-2 text-xs font-medium uppercase tracking-widest text-accent",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Radar, { className: cn("size-3.5", scanning && "radar-sweep") }), "AuctionCarRadar"]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("h1", {
					className: "mt-2 font-display text-4xl leading-tight tracking-tight sm:text-5xl",
					children: [
						"A급 친환경 경매차를",
						/* @__PURE__ */ (0, import_jsx_runtime.jsx)("br", {}),
						"세 플랫폼에서 걸러냅니다"
					]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-3 max-w-xl text-sm text-muted",
					children: "대법원 경매 · 온비드 공매 · 경매마당을 한 번에 수집하고, 2022년식 이후 · 5만 km 이하 · 하이브리드/전기 · 차키 · 사고 키워드를 AND로 통과한 매물만 남깁니다."
				})
			]
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)(Button, {
			size: "lg",
			onClick: onScan,
			disabled: scanning,
			className: "w-full sm:w-auto",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)(RefreshCw, { className: cn("size-4", scanning && "animate-spin") }), scanning ? "수집 중" : "지금 탐색"]
		})]
	});
}
function Pipeline() {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("ol", {
		className: "mt-8 grid grid-cols-2 gap-2 sm:grid-cols-4",
		children: [
			{
				icon: Activity,
				label: "멀티 수집"
			},
			{
				icon: Funnel,
				label: "연식·주행·연료"
			},
			{
				icon: ShieldAlert,
				label: "키·위험 키워드"
			},
			{
				icon: Sparkles,
				label: "중복 제거·알림"
			}
		].map((step, i) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("li", {
			className: "flex items-center gap-2 rounded-xl bg-surface px-3 py-3 text-sm shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
				className: "flex size-8 items-center justify-center rounded-lg bg-raised text-accent",
				children: /* @__PURE__ */ (0, import_jsx_runtime.jsx)(step.icon, { className: "size-4" })
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", { children: [/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("span", {
				className: "block text-xs text-subtle",
				children: ["0", i + 1]
			}), step.label] })]
		}, step.label))
	});
}
function Stats({ scan, scanning }) {
	const items = [
		{
			label: "수집",
			value: scan?.totals.fetched ?? 0
		},
		{
			label: "1차 통과",
			value: scan?.totals.stage1 ?? 0
		},
		{
			label: "A급",
			value: scan?.totals.gradeA ?? 0
		},
		{
			label: "소요(초)",
			value: scan ? Math.max(1, Math.round(scan.durationMs / 1e3)) : 0
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mt-6 grid grid-cols-2 gap-2 sm:grid-cols-4",
		children: items.map((item) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-2xl bg-surface px-4 py-4 shadow-[var(--shadow-border)]",
			children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: "text-xs text-subtle",
				children: item.label
			}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
				className: cn("mt-1 font-mono text-2xl tabular-nums", scanning && "opacity-50"),
				children: item.value
			})]
		}, item.label))
	});
}
function Sources({ sources }) {
	const rows = sources?.length ? sources : [
		{
			platform: "court",
			label: "대법원 법원경매",
			status: "blocked",
			fetched: 0,
			message: "탐색 전"
		},
		{
			platform: "onbid",
			label: "캠코 온비드",
			status: "empty",
			fetched: 0,
			message: "탐색 전"
		},
		{
			platform: "madang",
			label: "경매마당",
			status: "empty",
			fetched: 0,
			message: "탐색 전"
		}
	];
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("section", {
		className: "mt-4 grid gap-2 md:grid-cols-3",
		children: rows.map((row) => /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
			className: "rounded-xl bg-surface p-4 shadow-[var(--shadow-border)]",
			children: [
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
					className: "flex items-center justify-between gap-2",
					children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
						className: "text-sm font-medium",
						children: row.label
					}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Badge, {
						variant: statusVariant(row.status),
						children: statusLabel(row.status)
					})]
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
					className: "mt-2 text-xs leading-relaxed text-muted",
					children: row.message
				}),
				/* @__PURE__ */ (0, import_jsx_runtime.jsxs)("p", {
					className: "mt-2 font-mono text-xs tabular-nums text-subtle",
					children: [row.fetched, "건"]
				})
			]
		}, row.platform))
	});
}
function ListingGrid({ tab, listings, historyIds, scanned, scanning }) {
	if (!scanned && !scanning) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		title: "아직 스캔하지 않았습니다",
		body: "지금 탐색을 누르면 온비드와 경매마당을 실제 수집하고, 대법원 공식 사이트는 연결 가능 여부를 보고합니다."
	});
	if (scanning && listings.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		title: "수집 중",
		body: "플랫폼 응답을 기다리는 동안 필터 엔진은 이미 대기 상태입니다."
	});
	if (listings.length === 0) return /* @__PURE__ */ (0, import_jsx_runtime.jsx)(Empty, {
		title: tab === "a" ? "이번 스캔에서 A급이 없습니다" : "표시할 매물이 없습니다",
		body: tab === "a" ? "차키 키워드가 상세 텍스트에 없으면 A급에서 제외됩니다. 1차 통과 탭이나 설정에서 키 필수 조건을 완화해 보세요." : "필터를 완화하거나 다시 탐색해 보세요."
	});
	return /* @__PURE__ */ (0, import_jsx_runtime.jsx)("div", {
		className: "mt-6 grid gap-3 lg:grid-cols-2",
		children: listings.map((listing) => /* @__PURE__ */ (0, import_jsx_runtime.jsx)(ListingCard, {
			listing,
			isNew: !historyIds.includes(listing.id) && listing.grade === "a"
		}, listing.id))
	});
}
function Empty({ title, body }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("div", {
		className: "mt-6 rounded-2xl bg-surface px-6 py-16 text-center shadow-[var(--shadow-border)]",
		children: [/* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "font-display text-2xl",
			children: title
		}), /* @__PURE__ */ (0, import_jsx_runtime.jsx)("p", {
			className: "mx-auto mt-2 max-w-md text-sm text-muted",
			children: body
		})]
	});
}
function TabBtn({ active, onClick, count, children }) {
	return /* @__PURE__ */ (0, import_jsx_runtime.jsxs)("button", {
		type: "button",
		onClick,
		className: cn("inline-flex h-11 items-center gap-2 rounded-full px-4 text-sm transition-[background-color,color] duration-150", active ? "bg-accent text-accent-fg" : "bg-surface text-muted shadow-[var(--shadow-border)]"),
		children: [children, typeof count === "number" ? /* @__PURE__ */ (0, import_jsx_runtime.jsx)("span", {
			className: "font-mono text-xs tabular-nums",
			children: count
		}) : null]
	});
}
function countGrade(listings, grade) {
	return listings.filter((row) => row.grade === grade).length;
}
function statusLabel(status) {
	if (status === "live") return "실시간";
	if (status === "blocked") return "차단";
	if (status === "error") return "오류";
	return "대기";
}
function statusVariant(status) {
	if (status === "live") return "accent";
	if (status === "blocked" || status === "error") return "danger";
	return "outline";
}
//#endregion
export { Home as component };

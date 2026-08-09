# Graph Report - .  (2026-08-09)

## Corpus Check
- 244 files · ~224,089 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 1792 nodes · 3317 edges · 137 communities (112 shown, 25 thin omitted)
- Extraction: 97% EXTRACTED · 2% INFERRED · 0% AMBIGUOUS · INFERRED: 81 edges (avg confidence: 0.7)
- Token cost: 444,701 input · 0 output

## Community Hubs (Navigation)
- News Cron & Fantasy Ballon d'Or
- Design Tokens Starter Schema
- News Aggregation Architecture
- UI Styling Canvas Design System
- Slide Search Scripts
- Design Tokens Numeric Scale
- Fantasy Leaderboard Views
- Fantasy & Profile Components
- Sync & Notification Server Actions
- Logo Design Skill & Scripts
- Tailwind Config Generator Tests
- TypeScript Config References
- Chat Server Actions
- Fantasy Quiz Pages
- HTML Token Validator Script
- Match Poll Cron Route
- Profile Sync & Onboarding
- Actu News Page Components
- UI-UX-Pro-Max Search Core
- Banner & Brand Skill References
- Design Slides Copywriting Formulas
- Design System Dark-Mode Logic
- Fantasy & Chat Page Routes
- Upcoming Events & Calendar Export
- Design Routing & Social Photos
- Design System Report Formatting
- Live Match Detail Page
- Slide Generation Script
- Slides Skill Copywriting Formulas
- Tailwind Config Generator
- DesignSystemGenerator Class
- Live Actions & Fantasy Pitch View
- CIP Search Core Script
- Design Tokens Color Values
- Package.json Dev Dependencies
- Background Fetch Script
- UI-UX-Pro-Max Search Vocabulary
- Upcoming Page & Standings API
- Shadcn Installer Tests
- DesignSystemGenerator Search Logic
- Package.json Dependencies
- Root Layout & PWA Install
- Favorite Teams Hooks
- Banner & Icon Design References
- Icon Generation Script
- Design Tokens Starter Sizes
- Shadcn Add Script
- Mercato Transfer List Page
- CIP Deliverable Guide
- CIP Generation Script
- Tailwind Config Generator Methods
- African Players Sync Script
- Brand Color Extraction Script
- Brand Asset Validation Script
- ShadcnInstaller Class & Tests
- News Notifications & Push Subscription
- Design Tokens Component Section
- Token Validator Script
- Design Tokens Component Backgrounds
- Tailwind Config Gen Test Suite
- Tailwind Config Generation Methods
- API-Football Fixture Types
- Brand Context Injection Script
- Token Embedding Script
- Design Tokens Duration Values
- Shadcn Add Test Cases
- Dark Mode Resolution Logic
- Profile Page & Locale Picker
- CAN Qualifiers Fixtures Components
- Tailwind Config Init Methods
- Logo Generation Script
- Token Generation Script
- Design Tokens Button Component
- Device Linking & Auth
- Brand-to-Tokens Sync Script
- CIP BM25 Search Algorithm
- Token Validator Tests
- Package.json NPM Scripts
- Teams Sync Script
- Accent Theme Provider
- CIP HTML Render Script
- Design Tokens Input Component
- Design Tokens Radius & Shadow
- Mercato Sync Script
- Match Lineups Component
- Domain Detection Logic
- FIFA Ranking Sync Script
- Design Tokens Small Sizes
- UI Styling Dependencies List
- AGENTS.md Next.js Notice
- Prompt Engineering References
- Color Psychology References
- Design Tokens Border Values
- Design Tokens Radius Values
- Design Tokens Large Sizes
- MCP Server Config
- Design Tokens Padding-Y
- Design Tokens XL Sizes
- Design Tokens Medium Sizes
- Design Tokens None Values
- UX Data Validator Script
- Package.json Metadata
- Brand Sync Test
- Slide Token Validator
- Design Tokens Destructive Color
- Design Tokens Destructive Foreground
- Design Tokens Muted Color
- Design Tokens Primary Foreground
- Design Tokens Ring Color
- Design Tokens Secondary Foreground
- ShadcnInstaller Init Method
- PWA App Icon Assets
- README Boilerplate
- Proxy Middleware Config
- Shadcn Add No-Config Test
- Shadcn Add Dry-Run Test
- Shadcn List No-Config Test
- Shadcn Init Dry-Run Test
- Shadcn Add Empty-List Test
- Tailwind Add Fonts Test
- Tailwind Plugin Recommend Test
- Tailwind TS Config Test
- Tailwind Plugins Config Test
- Tailwind JS Init Test
- Tailwind Write Config Test
- Tailwind Invalid Path Test
- Tailwind TS Output Path Test
- Tailwind Vue Content Paths Test
- Tailwind Add Colors Test
- ESLint Config
- Next.js Dependency
- Next.js Config
- Tailwind-Merge Dependency
- PostCSS Config
- Service Worker Precache

## God Nodes (most connected - your core abstractions)
1. `TailwindConfigGenerator` - 58 edges
2. `cn()` - 48 edges
3. `getSupabaseAdmin()` - 43 edges
4. `TestTailwindConfigGenerator` - 35 edges
5. `ShadcnInstaller` - 34 edges
6. `Design Skill (Unified)` - 32 edges
7. `DesignSystemGenerator` - 29 edges
8. `TestShadcnInstaller` - 26 edges
9. `writeLocalStorageValue()` - 26 edges
10. `useOnboardingProfile()` - 21 edges

## Surprising Connections (you probably didn't know these)
- `cron schedule trigger (0 6 */3 * *)` --semantically_similar_to--> `translation gated on "not already stored" to conserve MyMemory quota`  [INFERRED] [semantically similar]
  .github/workflows/sync-mercato.yml → docs/news.md
- `Logo Industry Defaults` --semantically_similar_to--> `CIP Design Styles Table`  [INFERRED] [semantically similar]
  .claude/skills/design/references/logo-design.md → .claude/skills/design/references/cip-design.md
- `sync job` --shares_data_with--> `NEXT_PUBLIC_SUPABASE_URL env var`  [INFERRED]
  .github/workflows/sync-mercato.yml → docs/notifications.md
- `sync job` --shares_data_with--> `SUPABASE_SERVICE_ROLE_KEY env var`  [INFERRED]
  .github/workflows/sync-mercato.yml → docs/notifications.md
- `UI Styling Skill` --references--> `Apache License 2.0`  [AMBIGUOUS]
  .claude/skills/ui-styling/SKILL.md → .claude/skills/ui-styling/LICENSE.txt

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **Three-Layer Token Architecture (Primitive -> Semantic -> Component)** — _claude_skills_design_system_references_token_architecture_token_architecture, _claude_skills_design_system_references_primitive_tokens_primitive_tokens, _claude_skills_design_system_references_semantic_tokens_semantic_tokens, _claude_skills_design_system_references_component_tokens_component_tokens [EXTRACTED 1.00]
- **Brand Guidelines to Design Tokens Sync Workflow** — _claude_skills_brand_skill_brand, _claude_skills_brand_references_update_update, _claude_skills_design_system_skill_design_system [EXTRACTED 1.00]
- **Component Spec, Token, and State Definition System** — _claude_skills_design_system_references_component_specs_component_specs, _claude_skills_design_system_references_component_tokens_component_tokens, _claude_skills_design_system_references_states_and_variants_states_and_variants [INFERRED 0.85]
- **Complete Brand Package Workflow (Logo → CIP → Presentation)** — claude_skills_design_skill_logo_design_builtin, claude_skills_design_skill_cip_design_builtin, claude_skills_design_skill_slides_builtin [EXTRACTED 1.00]
- **CIP Generation Pipeline (brief → mockups → HTML presentation)** — claude_skills_design_scripts_cip_search, claude_skills_design_scripts_cip_generate, claude_skills_design_scripts_cip_render_html [EXTRACTED 1.00]
- **Design Skill Dependency Chain (brand → design-system → ui-styling)** — claude_skills_design_skill_brand, claude_skills_design_skill_design_system, claude_skills_design_skill_ui_styling [EXTRACTED 1.00]
- **Slides Skill Reference Knowledge Base** — claude_skills_slides_skill_slides, claude_skills_slides_references_layout_patterns_doc, claude_skills_slides_references_html_template_doc, claude_skills_slides_references_copywriting_formulas_doc, claude_skills_slides_references_slide_strategies_doc [EXTRACTED 1.00]
- **Tailwind CSS Reference Family** — claude_skills_ui_styling_references_tailwind_customization_doc, claude_skills_ui_styling_references_tailwind_responsive_doc, claude_skills_ui_styling_references_tailwind_utilities_doc [EXTRACTED 1.00]
- **shadcn/ui Component Library Stack** — claude_skills_ui_styling_references_shadcn_components_doc, claude_skills_ui_styling_references_shadcn_theming_doc, claude_skills_ui_styling_references_shadcn_accessibility_doc [EXTRACTED 1.00]
- **Shared VAPID push-notification infrastructure reused by both poll and fetch-news cron endpoints** — docs_notifications_poll_route, docs_news_fetch_news_route, docs_notifications_vapid_public_key, docs_notifications_vapid_private_key [INFERRED 0.85]
- **API quota conservation pattern across external API integrations (API-Football, MyMemory)** — github_workflows_sync_mercato_schedule_trigger, github_workflows_sync_mercato_api_football_key, docs_news_translation_gating, docs_news_mymemory_contact_email [INFERRED 0.75]
- **External scheduler workaround for Vercel free-tier cron limitation** — docs_notifications_cron_job_org, docs_notifications_github_actions_alt, docs_notifications_poll_route, docs_news_fetch_news_route [EXTRACTED 1.00]

## Communities (137 total, 25 thin omitted)

### Community 0 - "News Cron & Fantasy Ballon d'Or"
Cohesion: 0.06
Nodes (50): CountryBatch, countryLabel(), dynamic, GET(), notifySubscribers(), BallonDorPage(), PlayerRow(), BallonDorPickerSheet() (+42 more)

### Community 1 - "Design Tokens Starter Schema"
Cohesion: 0.05
Nodes (53): $type, $value, $type, $value, $type, $value, $type, $value (+45 more)

### Community 2 - "News Aggregation Architecture"
Cohesion: 0.05
Nodes (49): src/app/(app)/actu/page.tsx (Actu page), ActuPageClient (country filter pills), src/lib/data/african-nations.ts, content_url unique key dedup mechanism, src/lib/news/country-classifier.ts, src/lib/data/news.ts (getArticles), docs/news.md — Actualités news aggregation setup, GET /api/cron/fetch-news (src/app/api/cron/fetch-news/route.ts) (+41 more)

### Community 3 - "UI Styling Canvas Design System"
Cohesion: 0.05
Nodes (48): Apache License 2.0, Analog Meditation (Design Movement), Chromatic Language (Design Movement), Concrete Poetry (Design Movement), Two-Phase Design Philosophy Process, Canvas Design System, Geometric Silence (Design Movement), OKLCH Color Space (+40 more)

### Community 4 - "Slide Search Scripts"
Cohesion: 0.09
Nodes (36): format_context(), format_result(), main(), Format a single search result for display, Format contextual recommendations for display., BM25, calculate_pattern_break(), detect_domain() (+28 more)

### Community 5 - "Design Tokens Numeric Scale"
Cohesion: 0.06
Nodes (34): $type, $value, $type, $value, $type, $value, $type, $value (+26 more)

### Community 6 - "Fantasy Leaderboard Views"
Cohesion: 0.11
Nodes (23): LeaderboardView(), RANK_COLORS, QuizLeaderboardView(), RANK_COLORS, FloatingNav(), IndicatorRect, NAV_ITEMS, useIndicatorRect() (+15 more)

### Community 7 - "Fantasy & Profile Components"
Cohesion: 0.13
Nodes (28): ChatProfileSheetProps, BallonDorViewProps, FantasyView(), FantasyViewProps, PitchViewProps, saveSquadForJournee(), Badge, BADGES (+20 more)

### Community 8 - "Sync & Notification Server Actions"
Cohesion: 0.16
Nodes (25): syncBallonDorPrediction(), syncFantasySquad(), deleteClubNotificationPrefs(), deleteNewsNotificationPref(), deletePlayerNotificationPrefs(), getClubNotificationPrefs(), getNewsNotificationCountries(), getPlayerNotificationPrefs() (+17 more)

### Community 9 - "Logo Design Skill & Scripts"
Cohesion: 0.10
Nodes (23): Logo Design Reference, Logo Industry Defaults, 55+ Logo Styles, Logo Design Workflow, BM25, detect_domain(), _load_csv(), Load CSV and return list of dicts (+15 more)

### Community 10 - "Tailwind Config Generator Tests"
Cohesion: 0.07
Nodes (15): Test adding colors multiple times., Test adding full color palette., Test adding custom breakpoints., Test TailwindConfigGenerator class., Test that adding same plugin twice doesn't duplicate., Test plugin recommendations for Next.js., Test initialization with default settings., Test generating JavaScript configuration. (+7 more)

### Community 11 - "TypeScript Config References"
Cohesion: 0.07
Nodes (28): dom, dom.iterable, esnext, **/*.mts, .next/dev/types/**/*.ts, next-env.d.ts, .next/types/**/*.ts, node_modules (+20 more)

### Community 12 - "Chat Server Actions"
Cohesion: 0.15
Nodes (21): ChatMessageRow, getChatMessagesSince(), getRecentChatMessages(), ChatProfileBundle, getChatProfile(), pruneRoom(), sendChatMessage(), toChatMessage() (+13 more)

### Community 13 - "Fantasy Quiz Pages"
Cohesion: 0.15
Nodes (21): QuizLeaderboardPage(), resolveTheme(), pickAndShuffle(), QuizSessionView(), QuizSessionViewProps, shuffleChoices(), ShuffledQuestion, QuizThemePicker() (+13 more)

### Community 14 - "HTML Token Validator Script"
Cohesion: 0.14
Nodes (24): get_context(), is_allowed_exception(), is_allowed_rgba(), is_inside_block(), load_css_variables(), main(), print_result(), print_summary() (+16 more)

### Community 15 - "Match Poll Cron Route"
Cohesion: 0.12
Nodes (25): ASSIST_TEMPLATES, CARD_TEMPLATES, CLUB_GOAL_TEMPLATES, ClubPrefRow, dynamic, FINISHED_STATUSES, FULLTIME_TEMPLATES, GET() (+17 more)

### Community 16 - "Profile Sync & Onboarding"
Cohesion: 0.16
Nodes (18): getProfileByUserId(), RestoredProfile, syncUserProfile(), COUNTRIES, OnboardingPage(), POSITION_LABELS, STEPS, OnboardingGate() (+10 more)

### Community 17 - "Actu News Page Components"
Cohesion: 0.16
Nodes (15): ActuPage(), dynamic, QUICK_LINKS, ArticleCard(), Card(), CardProps, AFRICAN_NATIONS, getArticles() (+7 more)

### Community 18 - "UI-UX-Pro-Max Search Core"
Cohesion: 0.13
Nodes (16): BM25, _domain_keywords(), _get_bm25(), _load_csv(), _load_product_keywords(), _normalize(), Apply synonym substitution before tokenizing., BM25 ranking algorithm for text search (+8 more)

### Community 19 - "Banner & Brand Skill References"
Cohesion: 0.13
Nodes (23): Banner Sizes & Art Direction Styles Reference, Banner Design Skill, Asset Approval Checklist, Asset Organization Guide, Brand Guideline Template, Color Palette Management, Brand Consistency Checklist, Logo Usage Rules (+15 more)

### Community 20 - "Design Slides Copywriting Formulas"
Cohesion: 0.09
Nodes (23): AIDA Formula (Attention-Interest-Desire-Action), Before-After-Bridge Formula, Cost of Inaction Formula, Copywriting Formulas, FAB Formula (Features-Advantages-Benefits), Formula-to-Slide-Type Mapping, PAS Formula (Problem-Agitate-Solution), Slides Create Command (+15 more)

### Community 21 - "Design System Dark-Mode Logic"
Cohesion: 0.14
Nodes (10): _palette_is_dark(), WCAG relative luminance of a #RRGGBB string, or None if unparseable., True when a colors.csv row's Background is a dark surface., Pick the highest-ranked palette matching the resolved mode. Only the dark case…, _relative_luminance(), _select_palette_for_mode(), The exact reproduction from issue #428., TestEndToEndCoherence (+2 more)

### Community 22 - "Fantasy & Chat Page Routes"
Cohesion: 0.15
Nodes (14): ChatPage(), GAMES, FantasyLeaderboardPage(), FantasyXiPage(), SectionHeader(), SectionHeaderProps, getAfricanPlayers(), POSITION_CODE (+6 more)

### Community 23 - "Upcoming Events & Calendar Export"
Cohesion: 0.17
Nodes (15): KeyEventCard(), UpcomingEventsView(), useCountdown(), buildICS(), downloadEventToCalendar(), escapeICSText(), formatICSDate(), CountdownParts (+7 more)

### Community 24 - "Design Routing & Social Photos"
Cohesion: 0.16
Nodes (22): Design Routing Guide, Multi-Skill Workflows (New Project Setup, Migration, Component Creation), Skill Dependency Chain (brand → design-system → ui-styling), Social Photos Design Guide, Social Photos Platform Sizes Table, Social Photos Screenshot Export Methods, Social Photos 8-Step Workflow, ai-artist skill (related) (+14 more)

### Community 25 - "Design System Report Formatting"
Cohesion: 0.12
Nodes (20): ansi_ljust(), _detect_page_type(), format_ascii_box(), format_markdown(), format_master_md(), format_page_override_md(), _generate_intelligent_overrides(), hex_to_ansi() (+12 more)

### Community 26 - "Live Match Detail Page"
Cohesion: 0.17
Nodes (18): MatchDetailPage(), FilledSeatToken(), ApiFixture, getFixtureById(), getUpcomingFixturesForTeam(), getFixtureDetail(), getMatchLineups(), getUpcomingMatchesForTeam() (+10 more)

### Community 27 - "Slide Generation Script"
Cohesion: 0.15
Nodes (19): _e(), generate_chart_slide(), generate_cta_slide(), generate_deck(), generate_metrics_slide(), generate_problem_slide(), generate_solution_slide(), generate_testimonial_slide() (+11 more)

### Community 28 - "Slides Skill Copywriting Formulas"
Cohesion: 0.12
Nodes (20): AIDA Formula (Attention-Interest-Desire-Action), Before-After-Bridge Formula, Cost of Inaction Formula, Copywriting Formulas Reference, FAB Formula (Features-Advantages-Benefits), PAS Formula (Problem-Agitate-Solution), Create Subcommand, Chart.js (+12 more)

### Community 29 - "Tailwind Config Generator"
Cohesion: 0.10
Nodes (11): Generate Tailwind CSS configuration files., Add full color palette (50-950 shades) for a base color. Args: name: Color name…, TailwindConfigGenerator, Test adding custom spacing., Test validating config with no content paths., Test validating config with empty theme extensions., Test writing configuration to file., Test initialization with different frameworks. (+3 more)

### Community 30 - "DesignSystemGenerator Class"
Cohesion: 0.15
Nodes (11): DesignSystemGenerator, generate_design_system(), persist_design_system(), Generates design system recommendations from aggregated searches., Load reasoning rules from CSV., Find matching reasoning rule for a category., Apply reasoning rules to search results., Main entry point for design system generation. Args: query: Search query (e.g.,… (+3 more)

### Community 31 - "Live Actions & Fantasy Pitch View"
Cohesion: 0.19
Nodes (14): fetchTeamUpcomingMatches(), NextMatchState, PitchView(), opponentLabel(), OpponentState, PlayerPickerSheet(), PlayerPickerSheetProps, positionCode() (+6 more)

### Community 32 - "CIP Search Core Script"
Cohesion: 0.18
Nodes (17): detect_domain(), get_cip_brief(), _load_csv(), Load CSV and return list of dicts, Core search function using BM25, Auto-detect the most relevant domain from query, Main search function with auto-domain detection, Search across all domains and combine results (+9 more)

### Community 33 - "Design Tokens Color Values"
Cohesion: 0.11
Nodes (19): $type, $value, background, foreground, muted-foreground, primary, primary-hover, secondary (+11 more)

### Community 34 - "Package.json Dev Dependencies"
Cohesion: 0.11
Nodes (19): eslint, eslint-config-next, devDependencies, eslint, eslint-config-next, tailwindcss, @tailwindcss/postcss, @types/node (+11 more)

### Community 35 - "Background Fetch Script"
Cohesion: 0.17
Nodes (17): generate_css_for_background(), get_background_image(), get_curated_images(), get_overlay_css(), get_pexels_search_url(), load_backgrounds_config(), load_brand_colors(), main() (+9 more)

### Community 36 - "UI-UX-Pro-Max Search Vocabulary"
Cohesion: 0.14
Nodes (11): All indexed terms, for suggestion/typo-recovery purposes., Nearest known vocabulary terms for a query that returned 0 hits, so the caller…, Main search function with auto-domain detection, Search stack-specific guidelines, search(), search_stack(), _suggest_terms(), format_output() (+3 more)

### Community 37 - "Upcoming Page & Standings API"
Cohesion: 0.19
Nodes (15): formatRankingMonth(), FRENCH_MONTHS, UpcomingPage(), ApiStandingRow, CAN_2027_QUALIFIERS_LEAGUE_ID, getFixturesForRound(), getLeagueCurrentSeason(), getStandingsForSeason() (+7 more)

### Community 38 - "Shadcn Installer Tests"
Cohesion: 0.12
Nodes (10): Test ShadcnInstaller class., Test adding all components without config., Test adding all components in dry run mode., Create temporary project structure., Test listing installed components when none exist., Test listing installed components when they exist., Test checking for existing shadcn config., Test getting installed components without config. (+2 more)

### Community 39 - "DesignSystemGenerator Search Logic"
Cohesion: 0.14
Nodes (9): _filter_anti_patterns_for_mode(), Drop "avoid dark mode" advice once dark mode is the resolved answer., Execute searches across multiple domains., Select best matching result based on priority keywords., Extract results list from search result dict., Generate complete design system recommendation. variance/motion/density are…, Bucket a 1-10 dial value into its tier config. Returns None if value is None., _resolve_dial() (+1 more)

### Community 40 - "Package.json Dependencies"
Cohesion: 0.12
Nodes (17): clsx, lucide-react, dependencies, clsx, lucide-react, react, react-dom, rss-parser (+9 more)

### Community 41 - "Root Layout & PWA Install"
Cohesion: 0.18
Nodes (11): displayFont, metadata, sansFont, viewport, BeforeInstallPromptEvent, InstallPrompt(), ServiceWorkerRegister(), noSubscribe() (+3 more)

### Community 42 - "Favorite Teams Hooks"
Cohesion: 0.21
Nodes (13): TeamFavoriteButton(), addFavoriteTeam(), removeFavoriteTeam(), toggleFavoriteTeam(), useFavoriteTeamIds(), emitChange(), listeners, removeLocalStorageValue() (+5 more)

### Community 43 - "Banner & Icon Design References"
Cohesion: 0.12
Nodes (16): 22 Art Direction Banner Styles, Banner CTA Rules, Banner Sizes & Art Direction Styles Reference, Banner Print Specs, Banner Safe Zones Principle, 3-Zone Visual Hierarchy Rule, 12 Icon Categories, Icon Design Reference (+8 more)

### Community 44 - "Icon Generation Script"
Cohesion: 0.20
Nodes (15): apply_color(), apply_viewbox_size(), extract_svgs(), generate_batch(), generate_icon(), generate_sizes(), load_env(), main() (+7 more)

### Community 45 - "Design Tokens Starter Sizes"
Cohesion: 0.12
Nodes (16): $type, $value, $type, $value, $type, $value, $type, $value (+8 more)

### Community 46 - "Shadcn Add Script"
Cohesion: 0.17
Nodes (8): main(), Add all available shadcn/ui components. Args: overwrite: If True, overwrite…, List installed components. Returns: Tuple of (success, message with component…, Check if shadcn is initialized in project. Returns: True if components.json…, Get list of already installed components. Returns: List of installed component…, Read shadcn version from project package.json; fall back to a pinned default., Add shadcn/ui components. Args: components: List of component names to add…, Tests for shadcn_add.py

### Community 47 - "Mercato Transfer List Page"
Cohesion: 0.17
Nodes (10): dynamic, MercatoPage(), MercatoTransferList(), Badge(), BadgeProps, DOT_CLASSES, TONE_CLASSES, getMercatoTransfers() (+2 more)

### Community 48 - "CIP Deliverable Guide"
Cohesion: 0.23
Nodes (15): CIP Deliverable Categories (Core Identity, Stationery, Office, Apparel, Vehicle, Digital, Events), CIP Deliverable Guide, CIP Deliverable Categories Table, CIP Design Reference, CIP Gemini Models (flash vs pro), CIP Design Styles Table, CIP Mockup Prompt Engineering, CIP Negative Prompts (+7 more)

### Community 49 - "CIP Generation Script"
Cohesion: 0.21
Nodes (14): CIP Workflow (brief → mockups → HTML presentation), build_cip_prompt(), check_logo_required(), generate_cip_set(), generate_with_nano_banana(), load_env(), load_logo_image(), main() (+6 more)

### Community 50 - "Tailwind Config Generator Methods"
Cohesion: 0.13
Nodes (8): main(), Add custom font families. Args: fonts: Dict of font_type: [font_names] e.g.,…, Add custom spacing values. Args: spacing: Dict of name: value e.g., {'18':…, Add custom breakpoints. Args: breakpoints: Dict of name: width e.g., {'3xl':…, Add plugin requirements. Args: plugins: List of plugin names e.g.,…, Get plugin recommendations based on configuration. Returns: List of recommended…, Validate configuration. Returns: Tuple of (valid, message), Add custom colors to theme. Args: colors: Dict of color_name: color_value Value…

### Community 51 - "African Players Sync Script"
Cohesion: 0.23
Nodes (13): apiGet(), bestClubEntry(), CACHE_DIR, __dirname, fetchLatestTransferRecord(), fetchNationalSquad(), fetchPlayerClubDetail(), isClubStatEntry() (+5 more)

### Community 52 - "Brand Color Extraction Script"
Cohesion: 0.22
Nodes (11): calculateCompliance(), colorDistance(), displayPalette(), extractHexColors(), findNearestBrandColor(), fs, generateImageMagickCommand(), hexToRgb() (+3 more)

### Community 53 - "Brand Asset Validation Script"
Cohesion: 0.25
Nodes (13): checkManifest(), formatBytes(), formatOutput(), fs, main(), parseFilename(), path, RULES (+5 more)

### Community 54 - "ShadcnInstaller Class & Tests"
Cohesion: 0.14
Nodes (8): Handle shadcn/ui component installation., ShadcnInstaller, Test adding components that are already installed., Test initialization with default project root., Test initialization with custom project root., Test checking for non-existent shadcn config., Test getting installed components when none exist., Test getting installed components when files exist.

### Community 55 - "News Notifications & Push Subscription"
Cohesion: 0.24
Nodes (10): ALL_OPTIONS, CountryOption, GENERAL_OPTION, NewsNotificationsSection(), ensurePushSubscription(), PUSH_FAILURE_MESSAGES, PushSubscriptionResult, urlBase64ToUint8Array() (+2 more)

### Community 56 - "Design Tokens Component Section"
Cohesion: 0.15
Nodes (12): component, $type, $value, dark, semantic, $schema, $type, $value (+4 more)

### Community 57 - "Token Validator Script"
Cohesion: 0.24
Nodes (11): extensions, formatReport(), fs, getFiles(), main(), parseArgs(), path, patterns (+3 more)

### Community 58 - "Design Tokens Component Backgrounds"
Cohesion: 0.20
Nodes (12): $type, $value, bg, bg, padding, shadow, card, bg (+4 more)

### Community 59 - "Tailwind Config Gen Test Suite"
Cohesion: 0.20
Nodes (8): Tests for tailwind_config_gen.py, Reduce a generated TS/JS config to a bare assignable object so it can be handed…, Regression guard for the missing-comma bug between the ``theme`` block and…, The property preceding ``plugins`` must end with a comma (pure-Python check, so…, The emitted config parses as valid JS via ``node --check``., _strip_to_object(), TestGeneratedConfigIsValidJs, parametrize

### Community 60 - "Tailwind Config Generation Methods"
Cohesion: 0.20
Nodes (6): Generate configuration file content. Returns: Configuration file as string, Generate TypeScript configuration., Generate JavaScript configuration., Format plugins array for config. Validates each plugin name against a strict…, Add indentation to JSON string., Write configuration to file. Returns: Tuple of (success, message)

### Community 61 - "API-Football Fixture Types"
Cohesion: 0.17
Nodes (11): ApiFixtureEvent, ApiFixturePlayerStats, ApiFixtureTeam, ApiFootballEnvelope, ApiFootballResult, ApiLeagueInfo, ApiLeagueSeason, ApiLineup (+3 more)

### Community 62 - "Brand Context Injection Script"
Cohesion: 0.31
Nodes (10): extractColorsFromTable(), extractCoreAttributes(), extractHexColors(), extractImageStyle(), extractTypography(), extractVoice(), fs, generatePromptAddition() (+2 more)

### Community 63 - "Token Embedding Script"
Cohesion: 0.20
Nodes (9): args, extractTokens(), fs, minimal, MINIMAL_TOKENS, path, projectRoot, tokensPath (+1 more)

### Community 64 - "Design Tokens Duration Values"
Cohesion: 0.18
Nodes (11): fast, normal, slow, $type, $value, $type, $value, primitive (+3 more)

### Community 65 - "Shadcn Add Test Cases"
Cohesion: 0.18
Nodes (6): Test adding components with overwrite flag., Test successful component addition., Test component addition with subprocess error., Test component addition when npx is not found., Test successful addition of all components., patch

### Community 66 - "Dark Mode Resolution Logic"
Cohesion: 0.24
Nodes (7): _query_wants_dark(), True when a styles.csv row describes itself as dark-first., True when the query explicitly asks for a dark theme., Resolve the mode the rest of the output has to agree with., _resolve_color_mode(), _style_is_dark_primary(), TestModeResolution

### Community 67 - "Profile Page & Locale Picker"
Cohesion: 0.29
Nodes (8): ActuPageClient(), BadgesSection(), LocalePicker(), LOCALES, LogoutButton(), useLocalStorageValue(), useFantasyStorage(), resolveLocale()

### Community 68 - "CAN Qualifiers Fixtures Components"
Cohesion: 0.29
Nodes (8): CanQualifiersFixturesList(), ROUND_LABELS, CanQualifiersSection(), CanQualifiersSectionProps, VIEWS, CanQualifiersStandings(), CanQualifierFixture, CanQualifierGroup

### Community 69 - "Tailwind Config Init Methods"
Cohesion: 0.22
Nodes (6): Any, Path, Initialize generator. Args: typescript: If True, generate .ts config, else .js…, Determine default output path., Create base configuration structure., Get default content paths for framework.

### Community 70 - "Logo Generation Script"
Cohesion: 0.29
Nodes (9): enhance_prompt(), generate_batch(), generate_logo(), load_env(), main(), Enhance the logo prompt with style and industry modifiers, Generate a logo using Gemini models with image generation Args: aspect_ratio:…, Generate multiple logo variants with different styles (+1 more)

### Community 71 - "Token Generation Script"
Cohesion: 0.36
Nodes (9): flattenTokens(), fs, generateCSS(), generateTailwind(), main(), parseArgs(), path, resolveReference() (+1 more)

### Community 72 - "Design Tokens Button Component"
Cohesion: 0.20
Nodes (10): fg, font-size, hover-bg, button, $type, $value, $type, $value (+2 more)

### Community 73 - "Device Linking & Auth"
Cohesion: 0.33
Nodes (6): DEVICE_SCOPED_TABLES, linkDeviceData(), GET(), Actor, getAuthenticatedUserId(), getSupabaseServerClient()

### Community 74 - "Brand-to-Tokens Sync Script"
Cohesion: 0.33
Nodes (8): adjustBrightness(), { execFileSync }, extractColorsFromMarkdown(), fs, generateColorScale(), main(), path, updateDesignTokens()

### Community 75 - "CIP BM25 Search Algorithm"
Cohesion: 0.28
Nodes (5): BM25, BM25 ranking algorithm for text search, Lowercase, split, remove punctuation, filter short words, Build BM25 index from documents, Score all documents against query

### Community 76 - "Token Validator Tests"
Cohesion: 0.28
Nodes (8): Path, Regression tests for validate-tokens.cjs. The validator used to skip any line…, A hardcoded hex on the same line as a var() token is still a violation., A line that references only tokens produces no false positives., _run(), test_flags_hardcoded_hex_sharing_line_with_token(), test_token_only_line_reports_no_violation(), CompletedProcess

### Community 77 - "Package.json NPM Scripts"
Cohesion: 0.22
Nodes (9): scripts, build, dev, lint, start, sync:fifa-ranking, sync:mercato, sync:players (+1 more)

### Community 78 - "Teams Sync Script"
Cohesion: 0.31
Nodes (7): apiGet(), CACHE_DIR, currentSeasonFor(), __dirname, LEAGUES, main(), ROOT

### Community 79 - "Accent Theme Provider"
Cohesion: 0.31
Nodes (7): ACCENT_STORAGE_KEY, AccentThemeProvider(), applyAccentTheme(), accentThemes, getAccentTheme(), LEGACY_THEMES, AccentTheme

### Community 80 - "CIP HTML Render Script"
Cohesion: 0.36
Nodes (7): generate_html(), get_deliverable_info(), get_image_base64(), main(), Convert image to base64 for embedding in HTML, Extract deliverable type from filename and get info, Generate HTML presentation from CIP images

### Community 81 - "Design Tokens Input Component"
Cohesion: 0.29
Nodes (8): padding-x, input, $type, $value, focus-ring, padding-x, $type, $value

### Community 82 - "Design Tokens Radius & Shadow"
Cohesion: 0.29
Nodes (8): $type, $value, $type, $value, radius, default, full, default

### Community 83 - "Mercato Sync Script"
Cohesion: 0.36
Nodes (6): apiGet(), __dirname, fetchLatestTransferRecord(), main(), ROOT, runPool()

### Community 84 - "Match Lineups Component"
Cohesion: 0.29
Nodes (7): groupByPosition(), MatchLineups(), POSITION_LABELS, POSITION_ORDER, TeamLineup(), MatchLineup, MatchLineupPlayer

### Community 85 - "Domain Detection Logic"
Cohesion: 0.43
Nodes (3): detect_domain(), Auto-detect the most relevant domain from query. Matches are weighted by…, TestDomainDetection

### Community 86 - "FIFA Ranking Sync Script"
Cohesion: 0.38
Nodes (6): decodeHtmlEntities(), __dirname, main(), NATION_NAME_ALIASES, parseRow(), ROOT

### Community 87 - "Design Tokens Small Sizes"
Cohesion: 0.47
Nodes (6): sm, shadow, sm, sm, $type, $value

### Community 88 - "UI Styling Dependencies List"
Cohesion: 0.33
Nodes (6): UI Styling Skill Dependencies, Node.js 18+, pytest (>=8.0.0), shadcn-ui CLI, UI Styling Tests Dependencies, pytest (>=7.4.0)

### Community 89 - "AGENTS.md Next.js Notice"
Cohesion: 0.40
Nodes (5): "Not the Next.js you know" breaking-changes warning, AGENTS.md — Next.js agent rules notice, node_modules/next/dist/server/lib/generate-agent-files.js, node_modules/next/dist/docs/ (Next.js guides directory), CLAUDE.md — project instructions

### Community 90 - "Prompt Engineering References"
Cohesion: 0.40
Nodes (5): CIP Base Prompt Structure, Logo Core Prompt Structure, Logo AI Prompt Engineering, Logo Negative Prompts, Common Logo Prompt Pitfalls

### Community 91 - "Color Psychology References"
Cohesion: 0.40
Nodes (5): CIP Color Psychology Table, Logo Color Accessibility Considerations, Primary Logo Color Meanings, Logo Color Psychology, Logo Color Combinations by Industry

### Community 92 - "Design Tokens Border Values"
Cohesion: 0.60
Nodes (5): $type, $value, border, border, border

### Community 93 - "Design Tokens Radius Values"
Cohesion: 0.60
Nodes (5): radius, radius, radius, $type, $value

### Community 94 - "Design Tokens Large Sizes"
Cohesion: 0.60
Nodes (5): lg, $type, $value, lg, lg

### Community 95 - "MCP Server Config"
Cohesion: 0.40
Nodes (4): npx, 21st, graphify, @graphify/mcp-server

### Community 96 - "Design Tokens Padding-Y"
Cohesion: 0.67
Nodes (4): padding-y, padding-y, $type, $value

### Community 97 - "Design Tokens XL Sizes"
Cohesion: 0.67
Nodes (4): xl, xl, $type, $value

### Community 98 - "Design Tokens Medium Sizes"
Cohesion: 0.67
Nodes (4): $type, $value, md, md

### Community 99 - "Design Tokens None Values"
Cohesion: 0.67
Nodes (4): $type, $value, none, none

### Community 100 - "UX Data Validator Script"
Cohesion: 0.83
Nodes (3): _check_file(), main(), _read_rows()

### Community 101 - "Package.json Metadata"
Cohesion: 0.50
Nodes (3): name, private, version

### Community 104 - "Design Tokens Destructive Color"
Cohesion: 0.67
Nodes (3): destructive, $type, $value

### Community 105 - "Design Tokens Destructive Foreground"
Cohesion: 0.67
Nodes (3): destructive-foreground, $type, $value

### Community 106 - "Design Tokens Muted Color"
Cohesion: 0.67
Nodes (3): muted, $type, $value

### Community 107 - "Design Tokens Primary Foreground"
Cohesion: 0.67
Nodes (3): primary-foreground, $type, $value

### Community 108 - "Design Tokens Ring Color"
Cohesion: 0.67
Nodes (3): ring, $type, $value

### Community 109 - "Design Tokens Secondary Foreground"
Cohesion: 0.67
Nodes (3): secondary-foreground, $type, $value

### Community 111 - "PWA App Icon Assets"
Cohesion: 1.00
Nodes (3): App icon — green rounded-square PWA icon with soccer-ball motif, Maskable app icon — full-bleed variant with smaller safe-zone motif, Green/yellow color motif (possible Senegalese national-color reference)

### Community 112 - "README Boilerplate"
Cohesion: 0.67
Nodes (3): README.md — create-next-app default readme, Geist font (next/font), Vercel deployment platform

## Ambiguous Edges - Review These
- `Apache License 2.0` → `UI Styling Skill`  [AMBIGUOUS]
  .claude/skills/ui-styling/SKILL.md · relation: references
- `pytest (>=8.0.0)` → `pytest (>=7.4.0)`  [AMBIGUOUS]
  .claude/skills/ui-styling/scripts/requirements.txt · relation: shares_data_with
- `App icon — green rounded-square PWA icon with soccer-ball motif` → `Green/yellow color motif (possible Senegalese national-color reference)`  [AMBIGUOUS]
  public/icon.svg · relation: conceptually_related_to
- `Maskable app icon — full-bleed variant with smaller safe-zone motif` → `Green/yellow color motif (possible Senegalese national-color reference)`  [AMBIGUOUS]
  public/icon-maskable.svg · relation: conceptually_related_to

## Knowledge Gaps
- **392 isolated node(s):** `fs`, `path`, `fs`, `path`, `fs` (+387 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **25 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What is the exact relationship between `Apache License 2.0` and `UI Styling Skill`?**
  _Edge tagged AMBIGUOUS (relation: references) - confidence is low._
- **What is the exact relationship between `pytest (>=8.0.0)` and `pytest (>=7.4.0)`?**
  _Edge tagged AMBIGUOUS (relation: shares_data_with) - confidence is low._
- **What is the exact relationship between `App icon — green rounded-square PWA icon with soccer-ball motif` and `Green/yellow color motif (possible Senegalese national-color reference)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **What is the exact relationship between `Maskable app icon — full-bleed variant with smaller safe-zone motif` and `Green/yellow color motif (possible Senegalese national-color reference)`?**
  _Edge tagged AMBIGUOUS (relation: conceptually_related_to) - confidence is low._
- **Why does `Design Skill (Unified)` connect `Design Routing & Social Photos` to `CIP Search Core Script`, `Logo Generation Script`, `Logo Design Skill & Scripts`, `Banner & Icon Design References`, `Icon Generation Script`, `CIP Deliverable Guide`, `CIP Generation Script`, `CIP HTML Render Script`, `Design Slides Copywriting Formulas`, `Prompt Engineering References`, `Color Psychology References`?**
  _High betweenness centrality (0.021) - this node is a cross-community bridge._
- **Why does `BM25` connect `CIP BM25 Search Algorithm` to `CIP Search Core Script`, `UI-UX-Pro-Max Search Vocabulary`, `UI-UX-Pro-Max Search Core`, `Domain Detection Logic`, `DesignSystemGenerator Class`?**
  _High betweenness centrality (0.019) - this node is a cross-community bridge._
- **Why does `primitive` connect `Design Tokens Duration Values` to `Design Tokens Starter Schema`, `Design Tokens Numeric Scale`, `Design Tokens Starter Sizes`, `Design Tokens Radius & Shadow`, `Design Tokens Small Sizes`, `Design Tokens Component Section`?**
  _High betweenness centrality (0.012) - this node is a cross-community bridge._
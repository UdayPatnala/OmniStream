<USER_REQUEST>
/goal /teamwork-preview [OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL]
[TYPE=PRODUCT_RULE_UPDATE]
[PRIORITY=MANDATORY]
[SCOPE=UTUBE+CINEMORPH+SHARED_CORE]
[MODE=FREE_FIRST+LOCAL_FIRST+REAL_DATA_ONLY]

==================================================
01.RESULT_COUNT_AND_SEARCH_EXPANSION
==================================================

UTUBE_SEARCH_MUST_NOT_BE_RESTRICTED_TO_EXACTLY_THREE_RESULTS.

INITIAL_SEARCH_RESULTS SHOULD PROVIDE A SMALL,FAST,RELEVANT_RESULT SET.

DEFAULT_INITIAL_RESULT_COUNT=MOST_RELEVANT_SMALL_SET.

PROVIDE_MORE_RESULTS/LOAD_MORE_WHERE_SUPPORTED.

DO_NOT_LOAD_HUNDREDS_OF_RESULTS_AT_ONCE.

SEARCH_RESULTS_MUST_BE:

REAL
VALIDATED
DEDUPLICATED
RANKED
CACHEABLE.

MORE_RESULTS_MUST_EXTEND_THE_EXISTING_RESULT_SET,RATHER_THAN_RESTARTING_THE_SEARCH_UNNECESSARILY.

IF_PROVIDER_LIMITS_EXIST:

RESPECT_THEM.

DO_NOT_FAKE_MISSING_RESULTS.

==================================================
02.APPLICATION_OPEN_REFRESH
==================================================

EVERY_TIME_THE_USER_OPENS_OR_RETURNS_TO_THE_APPLICATION:

CHECK_FOR_AVAILABLE_NEW_CONTENT_WHERE_RELEVANT.

THIS_INCLUDES:

SUBSCRIBED_CHANNELS
RECENTLY_RELEVANT_CONTENT
NECESSARY_METADATA_REFRESH.

THE_REFRESH_MUST_NOT_BLOCK_INITIAL_UI_RENDERING.

FLOW:

APP_OPEN
→LOAD_LOCAL_STATE_IMMEDIATELY
→DISPLAY_EXISTING_VALID_CONTENT
→START_BACKGROUND_REFRESH
→FETCH_NEW_CONTENT
→VALIDATE
→DEDUPLICATE
→UPDATE_LOCAL_STATE
→UPDATE_UI_INCREMENTALLY.

DO_NOT:

SHOW_A_BLANK_SCREEN
WAIT_FOR_NETWORK_BEFORE_RENDERING
DELETE_EXISTING_DATA_BECAUSE_REFRESH_FAILED
REPEAT_UNNECESSARY_REQUESTS.

IF_NETWORK_IS_UNAVAILABLE:

USE_LAST_SUCCESSFUL_LOCAL_STATE.

==================================================
03.REFRESH_FREQUENCY
==================================================

APPLICATION_OPEN_REFRESH_IS_USER-TRIGGERED_BY_APP_OPEN.

BACKGROUND_REFRESHES MUST_REMAIN_RATE_LIMITED.

SUBSCRIPTION_REFRESH_INTERVAL:

MINIMUM_APPROXIMATELY_4_HOURS_UNLESS_USER_EXPLICITLY_REQUESTS_REFRESH.

DO_NOT_POLL_CONTINUOUSLY.

IF_CONTENT_WAS_ALREADY_REFRESHED_RECENTLY:

USE_CACHE_AND_AVOID_REDUNDANT_PROVIDER_REQUESTS.

==================================================
04.UTUBE_HOME_RANKING
==================================================

U-TUBE_HOME_MUST_PRIORITIZE_CONTENT_USING_USER_VALUE,RATHER_THAN_SIMPLY_RECENCY.

PRIMARY_RANKING_ORDER:

1.SUBSCRIBED_CHANNEL_CONTENT.
2.NEW/UNWATCHED_RELEVANT_CONTENT.
3.HALF-WATCHED_CONTENT.
4.NEW_RELEVANT_DISCOVERY.
5.FULLY_WATCHED_CONTENT.

HOWEVER:

RELEVANCE
RECENCY
USER_INTEREST
CONTENT_QUALITY_SIGNALS
SUBSCRIPTION_STATUS

MAY_ADJUST_ORDER_WITHIN_THESE_PRIORITY_GROUPS.

DO_NOT_USE_A_SINGLE_HARDCODED_SCORE_IF_A_SIMPLE_MULTI-SIGNAL_RANKER_IS_MORE_RELIABLE.

==================================================
05.WATCHED_CONTENT_PRIORITY
==================================================

FULLY_WATCHED_VIDEOS MUST_NOT_BE_DELETED_FROM_THE_USER'S_AVAILABLE_CONTENT.

THEY SHOULD_BE_PUSHED_TOWARD_THE_BOTTOM_OF_RECOMMENDATION/DISCOVERY RANKING.

FULLY_WATCHED_CONTENT MAY_REAPPEAR_IF:

USER_SEARCHES_FOR_IT
USER_OPENS_IT
IT_BECOMES_HIGHLY_RELEVANT
IT_IS_NEWLY_UPDATED
USER_REPLAYS_IT.

==================================================
06.HALF-WATCHED_CONTENT
==================================================

HALF-WATCHED_CONTENT_HAS_SECONDARY_PRIORITY.

THE_SYSTEM_SHOULD_RECOGNIZE_IT_AS:

CONTINUE-WATCHING OPPORTUNITY.

IT_MUST_NOT_BE_TREATED_AS_COMPLETELY_WATCHED.

EXAMPLE_STATE:

0-LOW_PROGRESS=UNWATCHED/NEW.

LOW_TO_HIGH_PROGRESS_BEFORE_COMPLETION=HALF-WATCHED.

NEAR_COMPLETION=ALMOST_COMPLETE.

COMPLETED=WATCHED.

USE_CONFIGURABLE_THRESHOLDS_INSTEAD_OF_HARDCODING_ARBITRARY_VALUES THROUGHOUT THE CODEBASE.

==================================================
07.RESUME_PRIORITY
==================================================

IF_A_VIDEO_HAS_MEANINGFUL_SAVED_PROGRESS:

DISPLAY_RESUME_INFORMATION.

EXAMPLE:

CONTINUE_WATCHING
XX% COMPLETE.

CLICKING_THE_VIDEO_SHOULD_RESUME_FROM_THE_SAVED_POSITION_WHERE_SUPPORTED.

DO_NOT_FORCE_RESUME_IF_THE_USER_INTENTIONALLY_RESTARTS_THE_VIDEO.

==================================================
08.SEARCH_HISTORY_AS_SIGNAL
==================================================

RECENT_SEARCHES_MAY_BE_USED_AS_LIGHTWEIGHT_RECOMMENDATION_SIGNALS.

EXTRACT:

KEYWORDS
TOPICS
ENTITIES
RECENCY
REPETITION.

DO_NOT_TREAT_EVERY_SEARCH_AS_A_PERMANENT_INTEREST.

OLDER_SEARCHES_MUST_DECAY_IN_PRIORITY.

==================================================
09.RECOMMENDATION_LIMIT
==================================================

AUTOMATIC_RECOMMENDATION_SEARCHES_MUST_BE_BOUNDED.

USE_APPROXIMATELY_SMALL_BATCHES_OF_NEW_CANDIDATES.

DO_NOT_CONTINUOUSLY_SEARCH_YOUTUBE/PROVIDERS_FOR_NEW_CONTENT.

DEDUPLICATE_BY_STABLE_VIDEO_ID_WHERE_AVAILABLE.

==================================================
10.NO_MOCK_DATA
==================================================

PRODUCTION_APPLICATION_MUST_CONTAIN:

NO_MOCK_VIDEO_DATA
NO_FAKE_CHANNELS
NO_FAKE_THUMBNAILS
NO_FAKE_VIEWS
NO_FAKE_RECOMMENDATIONS
NO_FAKE_HISTORY
NO_FAKE_SUBSCRIPTIONS
NO_FAKE_AI_RESULTS
NO_FAKE_PROCESSING
NO_FAKE_PLAYER_STATE
NO_FAKE_STATISTICS.

IF_REAL_DATA_IS_UNAVAILABLE:

DISPLAY_AN_APPROPRIATE_EMPTY/ERROR/UNAVAILABLE_STATE.

NEVER_FILL_THE_UI_WITH_FAKE_DATA_TO_MAKE_IT_LOOK_COMPLETE.

==================================================
11.NO_DEMO_MODE
==================================================

OMNISTREAM_MUST_NOT_INCLUDE_A_USER-FACING_DEMO_MODE.

DO_NOT_CREATE:

DEMO_MODE
SHOWCASE_MODE
FAKE_PLAYBACK_MODE
SIMULATED_AI_MODE
PRETEND_PROCESSING_MODE.

DEVELOPMENT/TEST FIXTURES MAY EXIST ONLY INSIDE ISOLATED TEST INFRASTRUCTURE.

THEY MUST_NOT_BE_IMPORTED_INTO_PRODUCTION_RUNTIME.

==================================================
12.TEST_FIXTURE_ISOLATION
==================================================

TEST_DATA_MUST_BE_SEPARATED_FROM:

PRODUCTION_DATA
USER_DATA
REAL_PROVIDER_DATA.

TEST_FIXTURES_MUST_NEVER_BE_USED_AS_A_FALLBACK_FOR_REAL_CONTENT.

==================================================
13.CINEMORPH_PRESENTATION_MODES
==================================================

CINEMORPH_HAS_THREE_PRIMARY_PRESENTATION_MODES:

MODE_A=IMAX_1.90:1
MODE_B=TRUE_IMAX_1.43:1
MODE_C=ORIGINAL_SOURCE_ASPECT.

OPTIONAL_4:3_PRESENTATION_MAY_EXIST_AS_A_CROP/PRESENTATION_VARIANT_ONLY_IF_ALREADY_SUPPORTED_BY_THE_PRODUCT_SPECIFICATION.

==================================================
14.DEFAULT_CINEMORPH_MODE
==================================================

DEFAULT_MODE=IMAX_1.90:1.

WHEN_CINEMORPH_PLAYBACK_BEGINS:

ENTER_IMAX_PRESENTATION.

THE_DEFAULT_IMAX_MODE_USES_THE_THEATER_PRESENTATION.

DO_NOT_REQUIRE_USER_TO_MANUALLY_ENABLE_THE_THEATER_FOR_STANDARD_CINEMORPH_PLAYBACK.

==================================================
15.TRUE_IMAX_MODE
==================================================

WHEN_USER_SELECTS:

TRUE_IMAX_1.43:1

CINEMORPH_MUST:

1.CHANGE_THE_VISIBLE_APERTURE_TO_1.43:1.
2.ENTER_BROWSER_FULLSCREEN_WHERE_SUPPORTED.
3.ENABLE_THE_THEATER_PRESENTATION.
4.APPLY_THE_1.43:1_SCREEN_GEOMETRY.
5.PRESERVE_CURRENT_PLAYBACK_POSITION.
6.PRESERVE_AUDIO_TRACK.
7.PRESERVE_SUBTITLE_TRACK.
8.PRESERVE_PLAYBACK_STATE.

DO_NOT_RESTART_THE_VIDEO.

==================================================
16.IMAX_1.90_MODE
==================================================

IMAX_1.90:1:

THEATER=ON
FULLSCREEN=OPTIONAL/CONTEXT_DEPENDENT
APERTURE=1.90:1.

THEATER_PRESENTATION_REMAINS_ACTIVE_DURING_IMAX_PLAYBACK.

==================================================
17.ORIGINAL_MODE
==================================================

WHEN_USER_SELECTS:

ORIGINAL

CINEMORPH_MUST:

1.PRESERVE_SOURCE_ASPECT_RATIO.
2.DISABLE_THEATER_DECORATIVE_PRESENTATION.
3.DISABLE_SCREEN-APERTURE_CINEMATIC_CROP.
4.RENDER_AS_A_CLEAN_VIDEO_PLAYER.
5.PRESERVE_PLAYBACK_POSITION.
6.PRESERVE_AUDIO_TRACK.
7.PRESERVE_SUBTITLE_TRACK.

ORIGINAL_MODE_IS_THE_SOURCE-FAITHFUL_PRESENTATION.

==================================================
18.MODE_SWITCHING
==================================================

MODE_SWITCHING_MUST_BE_LIVE.

IMAX
↔
TRUE_IMAX
↔
ORIGINAL

MUST_NOT:

RELOAD_THE_MEDIA_UNNECESSARILY
RESTART_PLAYBACK
RESET_AUDIO
RESET_SUBTITLES
LOSE_HISTORY
CREATE_A_NEW_SESSION_UNNECESSARILY.

THE_RENDERER_MAY_REINITIALIZE_ONLY_WHEN_TECHNICALLY_REQUIRED.

==================================================
19.FULLSCREEN_RULE
==================================================

TRUE_IMAX_SHOULD_REQUEST_BROWSER_FULLSCREEN.

DO_NOT_FAKE_FULLSCREEN_USING_ONLY_CSS.

IF_FULLSCREEN_IS_REJECTED/UNAVAILABLE:

CONTINUE_WITH_THE_BEST_SUPPORTED_1.43:1_THEATER_PRESENTATION.

DO_NOT_CRASH.

==================================================
20.CINEMORPH_INTRO
==================================================

CINEMORPH_INTRO_IS_REQUIRED_FOR_THEATER-CAPABLE_MODES.

PURPOSE:

1.CREATE_THEATER_ANTICIPATION.
2.PROVIDE_PREPARATION_TIME.
3.ALLOW_MODEL_INITIALIZATION.
4.ALLOW_INITIAL_FRAME_ANALYSIS.
5.PREPARE_RENDERING_STATE.

THE_INTRO_MUST_NOT_BE_A_FAKE_LOADING_SCREEN.

REAL_BACKGROUND_PREPARATION_MUST_OCCUR_DURING_THE_INTRO_WHERE_POSSIBLE.

==================================================
21.INTRO_TIMING
==================================================

INTRO_DURATION_MUST_BE_BOUNDED.

TARGET_APPROXIMATELY_10_SECONDS_WHERE_PRACTICAL.

DO_NOT_EXTEND_THE_INTRO_INDEFINITELY_BECAUSE_AI_IS_SLOW.

IF_MODEL_PREPARATION_FINISHES_EARLY:

DO_NOT_ARTIFICIALLY_INCREASE_PROCESSING.

IF_MODEL_PREPARATION_IS_NOT_FINISHED:

START_PLAYBACK_WITH_THE_BEST_SAFE_AVAILABLE_PRESENTATION.

==================================================
22.INTRO_ASPECT_RATIO
==================================================

THE_INTRO_MUST_NOT_IGNORE_THE_SELECTED_CINEMORPH_APERTURE.

FOR_1.90:1:

INTRO_CONTENT_MUST_BE_PRESENTED_WITHIN_THE_1.90:1_CINEMATIC_SCREEN/APERTURE.

FOR_1.43:1:

INTRO_CONTENT_MUST_BE_PRESENTED_WITHIN_THE_1.43:1_APERTURE.

DO_NOT_SHOW_THE_INTRO_AS_AN_UNCROPPED_FULL-SCREEN_RECTANGLE_WHEN_THE_SELECTED_PRESENTATION_REQUIRES_AN_APERTURE.

THE_INTRO_SHOULD_BE_RENDERED/COMPOSED_TO_MATCH_THE_SELECTED_SCREEN_GEOMETRY.

==================================================
23.INTRO_CONTENT
==================================================

THE_INTRO_MAY_INCLUDE:

CURTAIN_OPENING
SCREEN_REVEAL
THEATER_AMBIENCE
TICKET/SESSION_TRANSITION
CINEMORPH_BRANDING.

DO_NOT_USE_THE_INTRO_TO_HIDE_UNIMPLEMENTED_FUNCTIONALITY.

==================================================
24.INTRO_AND_MODEL_PREPARATION
==================================================

START_PREPARATION_BEFORE_OR_DURING_THE_TICKET_STAGE_WHERE_POSSIBLE.

PIPELINE:

MEDIA_SELECTED
→MEDIA_METADATA
→MODEL_CAPABILITY_CHECK
→MODEL_INITIALIZATION
→INITIAL_FRAME_SAMPLE
→INITIAL_ANALYSIS
→TICKET
→INTRO
→PLAYBACK.

DO_NOT_REQUIRE_FULL-MOVIE_ANALYSIS_BEFORE_PLAYBACK.

==================================================
25.LIVE_ANALYSIS
==================================================

AFTER_PLAYBACK_STARTS:

CONTINUE_ANALYSIS_INCREMENTALLY.

USE:

FRAME_SAMPLING
SCENE_DETECTION
TRACKING
SHORT_LOOKAHEAD
COMPOSITION_SCORING.

DO_NOT_PROCESS_THE_ENTIRE_MOVIE_BEFORE_PLAYBACK.

==================================================
26.FIRST_FRAME
==================================================

FIRST_PLAYABLE_FRAME_MUST_BE_SHOWN_AS_SOON_AS_REASONABLY_POSSIBLE.

AI_MUST_NOT_BLOCK_BASIC_PLAYBACK_UNNECESSARILY.

IF_SMART_FRAMING_IS_NOT_READY:

USE_SAFE_INITIAL_FRAME.

WHEN_ANALYSIS_BECOMES_READY:

TRANSITION_SMOOTHLY.

==================================================
27.SCENE_CUT
==================================================

WHEN_A_HARD_SCENE_CUT_IS_DETECTED:

DO_NOT_SMOOTHLY_INTERPOLATE_THE_OLD_SHOT_COMPOSITION_INTO_THE_NEW_SHOT_FOR_TOO_LONG.

RESET_OR_REACQUIRE_FRAME_ANALYSIS.

CHOOSE_A_NEW_VALID_COMPOSITION.

APPLY_ONLY_A_SHORT_NATURAL_TRANSITION_WHERE_APPROPRIATE.

==================================================
28.TRACKING_FAILURE
==================================================

IF_TRACKING_CONFIDENCE_DROPS:

DO_NOT_JUMP_RANDOMLY.

TEMPORARILY_HOLD_LAST_SAFE_COMPOSITION_WHERE_POSSIBLE.

REDETECT.

SELECT_NEW_COMPOSITION.

SMOOTHLY_TRANSITION.

IF_NO_VALID_COMPOSITION_EXISTS:

USE_SAFE/ORIGINAL_FRAMING.

==================================================
29.NO-SUBJECT SCENES
==================================================

IF_NO_RELIABLE_FACE/OBJECT/SALIENCY/COMPOSITION_SIGNAL_EXISTS:

DO_NOT_INVENT_A_SUBJECT.

USE:

SOURCE_COMPOSITION
OR
SAFE_CENTERED_CROP.

==================================================
30.MULTIPLE SUBJECTS
==================================================

WHEN_MULTIPLE_SUBJECTS_EXIST:

USE_PERSISTENT_SUBJECT_PRIORITY.

CONSIDER:

SIZE
CONFIDENCE
MOTION
SHOT_CONTEXT
PREVIOUS_SUBJECT
COMPOSITION
DIALOGUE/FOCUS_SIGNALS_WHERE_AVAILABLE.

DO_NOT_SWITCH_FOCUS_BETWEEN_SUBJECTS_RAPIDLY.

==================================================
31.SUBTITLE SAFETY
==================================================

WHEN_SUBTITLES_ARE_ENABLED:

THE_FRAMING_ENGINE_MUST_PROTECT_THE_SUBTITLE_REGION.

DO_NOT_CROP_AWAY_SUBTITLES.

IF_SAFE_FRAMING_IS_IMPOSSIBLE:

PRIORITIZE_SUBTITLE_VISIBILITY_AND_USE_LESS_AGGRESSIVE_CROP.

==================================================
32.CREDITS
==================================================

OPENING/CLOSING_CREDITS_SHOULD_USE_CONSERVATIVE_FRAMING.

AVOID_AGGRESSIVE_SUBJECT_TRACKING_WHEN:

TEXT/CREDITS_DOMINATE_THE_FRAME.

==================================================
33.LETTERBOX DETECTION
==================================================

DETECT_EXISTING:

BLACK_BARS
LETTERBOX
PILLARBOX.

DO_NOT_TREAT_THEM_AS_IMPORTANT_VISUAL_CONTENT.

DO_NOT_REPEATEDLY_CROP_AND_REINTRODUCE_BARS.

==================================================
34.SOURCE_TRUTH
==================================================

SMART_FRAMING_IS_AN_ENHANCEMENT.

IF_THE_ALGORITHM_IS_NOT_CONFIDENT_THAT_THE_NEW_COMPOSITION_IS_BETTER:

KEEP_THE_SOURCE_COMPOSITION.

DO_NOT_FORCE_CROPPING_FOR_THE_SAKE_OF_SHOWING_AI.

==================================================
35.IMAX CLAIM
==================================================

OMNISTREAM_MUST_NOT_CLAIM_THAT_SOFTWARE_CONVERTS_NORMAL_CONTENT_INTO_AUTHENTIC_IMAX_CAPTURE.

CINEMORPH_PROVIDES:

IMAX-INSPIRED_PRESENTATION
SMART_FRAMING
SCREEN_GEOMETRY
THEATER_PRESENTATION.

SOURCE_CONTENT_LIMITATIONS_REMAIN.

==================================================
36.RESOLUTION
==================================================

SMART_CROPPING_MUST_NOT_CLAIM_TO_CREATE_MISSING_SOURCE_DETAIL.

DO_NOT_UPSCALE_UNNECESSARILY.

PRIORITIZE:

COMPOSITION
SUBJECT_VISIBILITY
TEMPORAL_STABILITY
SOURCE_QUALITY.

==================================================
37.AUDIO_TRACK SWITCHING
==================================================

IF_MULTIPLE_AUDIO_TRACKS_EXIST:

DISPLAY_AVAILABLE_TRACKS.

WHEN_USER_SWITCHES:

PRESERVE_PLAYBACK_POSITION.

DO_NOT_RESTART_THE_MEDIA_UNNECESSARILY.

IF_SELECTED_TRACK_FAILS:

FALLBACK_TO_AVAILABLE_VALID_TRACK.

==================================================
38.SUBTITLE_TRACK SWITCHING
==================================================

SAME_RULE:

PRESERVE_POSITION.

DO_NOT_RESTART_PLAYBACK.

==================================================
39.AUDIO_ENHANCEMENT
==================================================

AUDIO_MODES:

ORIGINAL
ENHANCED_WHERE_SUPPORTED.

ORIGINAL_AUDIO_IS_ALWAYS_THE_FALLBACK.

AUDIO_PROCESSING_MUST_NOT_CREATE_NOTICEABLE_A/V_DESYNC.

DO_NOT_CLAIM_PROPRIETARY_AUDIO_FORMATS OR_THEATER_FORMATS_UNLESS_ACTUALLY_SUPPORTED.

==================================================
40.LOCAL FILE PRIORITY
==================================================

CINEMORPH_IS_LOCAL-FIRST.

LOCAL_FILES_ARE_THE_PRIMARY_SOURCE.

ONLINE_VIDEO_IS_SECONDARY.

DO_NOT_BUILD_THE_ARCHITECTURE_AROUND_CLOUD_UPLOAD_OF_LOCAL_MEDIA.

==================================================
41.LARGE_MEDIA
==================================================

A_3-HOUR_LOCAL_VIDEO_MUST_NOT_BE_FULLY_LOADED_INTO_RAM_BEFORE_PLAYBACK.

USE_STREAMING/DECODED_FRAME_PROCESSING_WHERE_PRACTICAL.

PROCESS_ONLY_REQUIRED_ANALYSIS_WINDOWS.

BOUND_MEMORY.

==================================================
42.MODEL RESOURCE MANAGEMENT
==================================================

MODEL_SELECTION_MUST_CONSIDER:

DEVICE_CAPABILITY
MEMORY
GPU
WEBGPU
CPU
CURRENT_FPS
MEDIA_COMPLEXITY.

FALLBACK:

ADVANCED_MODEL
→LIGHT_MODEL
→RULES
→ORIGINAL.

==================================================
43.AI FAILURE
==================================================

IF_AI_FAILS:

PLAYBACK_CONTINUES.

IF_MODEL_LOADING_FAILS:

USE_LIGHTER_MODEL/RULES/ORIGINAL.

NEVER:

AI_FAILURE
→BLACK_SCREEN.

==================================================
44.NO MOCK FALLBACK
==================================================

A_FALLBACK_MUST_USE_REAL:

SOURCE_MEDIA
REAL_LOCAL_DATA
REAL_PROVIDER_DATA
REAL_DETERMINISTIC_PROCESSING.

NEVER_RETURN_FAKE_CONTENT_TO_HIDE_FAILURE.

==================================================
45.NO DEMO FALLBACK
==================================================

THERE_IS_NO_USER-FACING_DEMO_MODE.

IF_REAL_CONTENT_CANNOT_BE_LOADED:

SHOW_REAL_EMPTY/ERROR_STATE.

==================================================
46.APPLICATION OPEN UX
==================================================

ON_APP_OPEN:

1.RENDER_LANDING_IMMEDIATELY.
2.LOAD_LOCAL_STATE.
3.RESTORE_VALID_USER_DATA.
4.BACKGROUND_REFRESH_WHERE_REQUIRED.
5.NEVER_BLOCK_THE_USER_WITH_A_NETWORK_LOADING_SCREEN_UNNECESSARILY.

==================================================
47.CACHE
==================================================

CACHE:

VALID_PROVIDER_METADATA
SEARCH_RESULTS
SUBSCRIPTION_REFRESH_RESULTS
LOCAL_USER_STATE.

CACHE_MUST_HAVE:

VERSION
LIMIT
INVALIDATION
CLEANUP.

==================================================
48.NO_UNNECESSARY_COST
==================================================

ALL_OF_THE_ABOVE_MUST_REMAIN_IMPLEMENTABLE_WITH:

LOCAL_PROCESSING
OPEN_SOURCE
BROWSER_NATIVE_APIS
FREE/LEGITIMATE_PROVIDER_ACCESS

WHERE_PRACTICAL.

NO_FEATURE_MAY_REQUIRE_A_PAID_SERVICE.

==================================================
49.ASSUMPTION CONTROL
==================================================

WHEN_A_REQUIREMENT_IS_UNSPECIFIED:

READ:

MASTER_VISION
FIVE_GUARDIAN_DOCUMENTS
THIS_REQUIREMENT_CLARIFICATION
EXISTING_IMPLEMENTATION.

THEN_SELECT_THE_MOST_PRODUCT-BENEFICIAL_DEFAULT.

DO_NOT_INVENT:

FAKE_DATA
FAKE_FEATURES
PAID_DEPENDENCIES
UNSAFE_SHORTCUTS
PROVIDER_BYPASSES.

==================================================
50.CHANGE VALIDATION
==================================================

BEFORE_IMPLEMENTING_ANY_CHANGE:

INSPECT_EXISTING_IMPLEMENTATION.

VERIFY_DEPENDENCIES.

IDENTIFY_REGRESSION_RISK.

IMPLEMENT_MINIMUM_REQUIRED_CHANGE.

THEN:

BUILD
TEST
VISUALLY_INSPECT
PERFORMANCE_TEST
FAILURE_TEST
REGRESSION_TEST.

==================================================
51.FINAL USER JOURNEY
==================================================

UTUBE:

OPEN_APP
→LANDING
→U-TUBE
→SEARCH
→INITIAL_RESULTS
→MORE_RESULTS_IF_NEEDED
→WATCH
→MINI_PLAYER
→HOME
→SUBSCRIPTIONS
→HISTORY
→RESUME.

CINEMORPH:

OPEN_APP
→CINEMORPH
→LOCAL_FILE/ONLINE_LINK
→MEDIA_PREPARATION
→TICKET
→IMAX_1.90_DEFAULT
→INTRO_WITHIN_1.90_APERTURE
→THEATER
→LIVE_ANALYSIS
→SMART_FRAMING
→AUDIO/SUBTITLE
→OPTIONAL_TRUE_IMAX_1.43
→FULLSCREEN_REQUEST
→ORIGINAL_MODE_IF_SELECTED
→CLEAN_SOURCE_PLAYER
→EXIT
→SAVE_SESSION
→RESUME.

==================================================
52.FINAL QUALITY GATE
==================================================

VERIFY:

NO_MOCK_DATA
NO_DEMO_MODE
NO_FAKE_PROCESSING
NO_FAKE_RECOMMENDATIONS
NO_FAKE_STATISTICS
NO_MANDATORY_PAID_DEPENDENCY
NO_PROVIDER_BYPASS
NO_UNNECESSARY_CLOUD_PROCESSING
NO_LARGE_FILE_FULL-RAM_LOADING
NO_AI_BLOCKING_PLAYBACK
NO_STALE_FRAME_APPLICATION
NO_UNCONTROLLED_MEMORY_GROWTH
NO_MODE_SWITCH_POSITION_LOSS
NO_AUDIO_TRACK RESET
NO_SUBTITLE RESET
NO_THEATER_IN_ORIGINAL_MODE
NO_FULLSCREEN_REQUIREMENT_FOR_STANDARD_IMAX
TRUE_IMAX_FULLSCREEN_WHERE_SUPPORTED
INTRO_MATCHES_SELECTED_APERTURE
INTRO_PROVIDES_REAL_PREPARATION_TIME
WATCHED_CONTENT_DEPRIORITIZED
HALF-WATCHED_CONTENT_SECOND_PRIORITY
SUBSCRIBED_CONTENT_PRIORITY
APP_OPEN_REFRESH
MORE_RESULTS_AVAILABLE
REAL_DATA_ONLY.

==================================================
53.FINAL RULE
==================================================

OMNISTREAM_MUST_ALWAYS_PREFER:

REAL_FUNCTIONALITY
OVER
VISUAL_PRETENDING.

SOURCE_TRUTH
OVER
AI_GUESSING.

PLAYBACK
OVER
ADVANCED_PROCESSING.

USER_CONTROL
OVER
AUTOMATION.

FREE_LOCAL_PROCESSING
OVER
PAID_INFRASTRUCTURE.

SIMPLE_RELIABLE_BEHAVIOR
OVER
UNNECESSARY_COMPLEXITY.

IF_THE_SYSTEM_DOES_NOT_KNOW:

IT MUST NOT INVENT.

IF_THE_MODEL_IS_NOT_CONFIDENT:

IT MUST NOT FORCE_A_CROP.

IF_THE_NETWORK_FAILS:

LOCAL_STATE_MUST_SURVIVE.

IF_AI_FAILS:

VIDEO_MUST_CONTINUE_WHERE_POSSIBLE.

IF_AN_ADVANCED_EFFECT_HURTS_PERFORMANCE:

REDUCE_OR_DISABLE_THE_EFFECT.

IF_A_FEATURE_CANNOT_BE_IMPLEMENTED_RELIABLY:

USE_THE_BEST_REAL_FALLBACK_AND_DOCUMENT_THE_LIMITATION.

[END_OMNISTREAM_FINAL_REQUIREMENT_CLARIFICATION_AND_ASSUMPTION_CONTROL]
</USER_REQUEST>
<ADDITIONAL_METADATA>
The current local time is: 2026-08-24T09:48:23+05:30.

The user has mentioned some items in the form @[ITEM]. Here is extra information about the items that were mentioned by the user, in the order that they appear:

/goal is a [Slash Command]:
The user has marked this task with /goal, indicating that this task is intended to run for a long time without user input, e.g. overnight. You should be extra thorough and only stop when you are confident the goal has been completely fulfilled. The system will force you to continue execution, prompting you to audit your work until completion. Once complete, include <!-- GOAL_COMPLETE --> in your response. If the user explicitly asked to stop or cancel this goal, include <!-- GOAL_CANCELLED --> in your response to cancel the goal.
/teamwork-preview is a [Slash Command]:
<TEAMWORK>
The user has added the 'teamwork_preview' subagent, for use in multi-agent teamwork systems.
The user wants to use the teamwork multi-agent system for a project.
Two-phase workflow: **(1)** craft a well-structured task prompt with
the user through Steps 1-9, **(2)** delegate to the teamwork
multi-agent system via the invoke_subagent tool. Both phases are required —
crafting without delegation is incomplete.

## Artifact-Based Workflow

Maintain a **prompt draft artifact** (prompt_draft.md) throughout the
process. It serves as both a live display for the user and a step
tracker for you. **Create it immediately** with this scaffold:

```markdown
# Teamwork Project Prompt — Draft

> Status: Step 1 — Eliciting project idea
> Goal: Craft prompt → get user approval → delegate to teamwork_preview
> Requested team: [none — teamwork routes from the description]

[Project description — 1-2 sentences]

Working directory: [TBD]

## Requirements

### R1. [TBD]

### R2. [TBD]

## Acceptance Criteria

### [TBD]
- [ ] [TBD]

---
*Next: when approved → delegate via invoke_subagent (see Delegation Protocol)*
```

Update the artifact after every step.

## Core Principles

| # | Principle | Rule |
|---|-----------|------|
| 1 | **Specify What, Not How** | Define requirements and acceptance criteria. Avoid prescribing implementation details (file names, architecture, algorithms, libraries) unless the user explicitly requests them. |
| 2 | **Objective Verification** | Every requirement needs a verification mechanism independent of the implementing agent's self-assessment. Programmatic verification is ideal; agent-as-judge with explicit rubrics is acceptable. |
| 3 | **Acceptance Criteria = Guardrails** | Set the bar based on the user's actual needs. Purpose: prevent self-certification of poor work. If the first run falls short, tighten criteria and re-run. |
| 4 | **Minimal Requirements** | Only specify what the user cares about. Let teamwork infer the rest. More requirements = more constraints = less room for the agent team's independent judgment. |

## Workflow

Work through Steps 1-9 interactively. **Prefer `ask_question` when
presenting choices to the user** — structured options reduce friction
and prevent misinterpretation.

**Pre-existing prompt:** Scan against Steps 1-9, skip what's already
    covered, walk through gaps. Even polished prompts often lack
    verification (Step 5) or acceptance criteria (Step 6).

**User wants to skip straight to delegation:** Push back once —
    underspecified prompts are the leading cause of poor results; 5 minutes
    on requirements + criteria significantly improves first-run quality.
    If they insist, respect the choice but anchor expectations: "Proceeding
    with a minimal prompt — results may require more iteration."

### Step 1: Elicit the Idea

Ask: What do you want to build? What is the purpose (demo, production,
    eval, exploration)? Who is the audience?

Capture in 1-2 sentences → this becomes the prompt's opening.
Update artifact: replace [Project description], set status to Step 2.

### Step 2: Identify Ambiguity

Identify points with multiple reasonable interpretations. For each,
    present concrete choices:

```
Example: "Build a search engine"

Ambiguous: What data source?
→ Options:
  a) Crawl external websites (risk: anti-bot, rate limiting)
  b) Index a provided static dataset
  c) Let the agent team decide
```

Only ask about decisions that affect scope or verification. Don't ask
    about implementation details unless the user brings them up.

Key dimensions to probe:

| Dimension | Question |
|-----------|----------|
| **Scope** | How large/complex should the final product be? |
| **Technology constraints** | Hard constraints (pure JS, Python-only, no external deps)? |
| **Infrastructure** | Need network access, remote storage, job launching? → controlled APIs |
| **Quality bar** | Polished demo or proof-of-concept? |
| **Integrity** | How strict should integrity enforcement be? (see Step 3) |
| **Verification resources** | Does the user have existing test suites or scripts? (see Step 5) |

#### Effort and scale — two opt-in choices

Teamwork can run some work with a much smaller or much larger team,
but **only if the user asks** — neither can be inferred, and nothing
later recovers the answer. If either is plausible, ask.

**One self-contained change.** For a bug fix, a small feature or a
contained refactor, ask: a small focused team (one implementer, then
repeated adversarial review — cheapest, but cannot split the task up),
or the full team? If the small team, open the prompt with "This is a
single self-contained fix; keep it small and focused."

Do not infer this from the task looking small. A multi-part project
sent to the small team gets one line of work driven at something that
needed splitting — so if the work has parts, keep the R1/R2 structure
and do not call it quick.

**Math and proofs.** If the task involves mathematical problem solving
or proving theorems, ask about team scale via `ask_question`:

- Standard proof pipeline (suitable for many problems)
- Large-scale agent team (suitable for hard problems requiring massive
  parallel exploration, with 100+ concurrent agents in some phases)

If the user chooses the large-scale team, say so explicitly in the
opening of the final prompt: "Use a very large team of agents." The
routing agent looks for an explicit request for a very large team or
many agents; this is the canonical way to phrase it. Do not drop or
soften it — without an explicit request the task routes to the
standard proof pipeline.

### Step 3: Determine Integrity Mode

Determine how strictly integrity enforcement should operate.
Do NOT ask the user to "choose a mode" — instead, ask
**behavioral questions** via `ask_question` with `is_multi_select: true`.
Present these options:

- Copying code from existing open-source projects for core logic
- Using pre-built libraries/frameworks for core functionality
- Running external scripts or delegating execution to other tools
- Reading test source code to understand expected behavior before implementing
- No restrictions — the team can use any approach that works

These options are phrased for a build task. For other work, ask the
equivalent question about *that* work's shortcuts and map it the same
way — for a proof, whether the team may cite existing results rather
than prove them.

Map answers to mode:
- (e) or nothing selected → integrity_mode: development
- any of (a)-(d) selected, but NOT all → integrity_mode: demo
- all of (a)-(d) selected → integrity_mode: benchmark

Default: development. If the project is clearly a capability
showcase, suggest demo.

### Step 4: Draft Requirements

Write 2-5 requirement blocks (R1, R2, ...).

| Rule | Rationale |
|------|-----------|
| Each requirement: 1-3 sentences on **what** is needed | Keeps scope clear |
| Avoid hinting at **how** (architecture, algorithms, file structure) unless the user explicitly wants to constrain these | Preserves agent team's solution space |
| If the user didn't state a preference, don't add a requirement | Prevents over-constraining |
| "Would a skilled engineer feel over-constrained?" → if yes, cut it | Litmus test |

### Step 5: Design Verification

> **Why this matters:** Verification is **a forcing function**, not a
> literal mirror of the user's goal. Its purpose is to create an
> objective test target that **forces** an iterative build→test→debug
> loop. Without one, agents self-certify half-baked work and stop early.
>
> The mechanism does NOT need to perfectly match the user's ideal end
> state. It is a **means** — a trick to force real debugging. Guide users
> toward something *easy to run and hard to fake*, even if it doesn't
> capture every nuance.

For each requirement, design an **objective** verification mechanism:

| Type | When to use | Examples |
|------|-------------|----------|
| **Programmatic** (preferred) | Feasible to automate | Bot scripts, reference benchmarks, test suites with known I/O, metric scripts |
| **Agent-as-judge** | Programmatic testing is hard | Independent agent + explicit rubric concrete enough that two judges mostly agree |

The examples above are build-shaped. Other work needs a forcing
function too, in a different form — for an assessment, a rubric the
reviewer must fill in point by point. Ask for whatever plays that role
here.

**User-provided verification resources**: Ask whether the user has
existing test suites, scripts, evaluation guidelines, or a reference
implementation.

If yes, include them in the prompt as a Verification Resources
section. Even partial resources (e.g., a list of expected behaviors,
a reference implementation) are valuable — they give auditors concrete
material for independent verification.

**Verification anti-patterns:**

| ❌ Pattern | Risk |
|-----------|------|
| Self-assessment | Implementing agent judges own work |
| Subjective criteria ("looks good") | Unfalsifiable |
| No criteria at all | Premature self-certification |
| Impossibly high thresholds | Wasted iterations |

### Step 6: Set Acceptance Criteria

Convert verification mechanisms into concrete, checkable criteria.
    Calibrate to purpose:

| Purpose | Bar |
|---------|-----|
| Demo | Impressive but achievable in time budget |
| Production | Match target system quality standards |
| Eval | Precise and reproducible — measurement over polish |
| Exploration | Loose — prove feasibility only |

Common user adjustments: "too easy" → tighten; "too hard" → relax or
    make optional; "too prescriptive" → remove constraining criteria.

### Step 7: Infrastructure Constraints

If the project needs controlled infrastructure, add a requirement:

| Operation | Why control it |
|-----------|---------------|
| Remote file I/O (GCS, cloud storage) | Prevent writes to arbitrary paths |
| Job launching | Prevent expensive runaway jobs |
| Network access | Prevent hitting anti-bot protections or unintended services |

Pattern: "You must use the provided controlled API for X. You write the
    logic; the execution environment is managed externally."

Skip if no infrastructure is needed — a pure HTML/JS game, or an
assessment or proof rather than a running system.

### Step 8: Choose Working Directory

Ask where project files should live. Default:
```
~/teamwork_projects/{PROJECT_NAME}
```

{PROJECT_NAME}: short, lowercase, underscore-separated (e.g.,
    c_compiler, search_engine, tetris_game).

Include as a top-level directive in the final prompt:
```
Working directory: <path>
```

### Step 9: Assemble and Validate

Ensure the artifact has this structure:

```
[1-2 sentence project description]

Working directory: <chosen path from Step 8>
Integrity mode: [development | demo | benchmark]

[Optional: reference material (paper URL, spec link)]

## Requirements

### R1. [Primary deliverable]
[What it does, not how to build it]

### R2. [Secondary requirement or constraint]
...

### R3. [Controlled infrastructure, if needed]
...

## Acceptance Criteria

### [Criterion category]
- [ ] [Objective, checkable condition]
...
```

**Validation checklist:**

- [ ] No implementation hints unless explicitly requested by the user
- [ ] Every acceptance criterion is objectively checkable without
      human judgment
- [ ] Requirements scoped by user needs, not by what the agent "should" do
- [ ] Infrastructure constraints clearly state what's controlled and why
- [ ] A skilled engineer would NOT feel over-constrained
- [ ] An agent could NOT trivially self-certify a half-baked result
- [ ] Any opt-in choice from Step 2 is stated in the prompt opening —
      a small focused team, or an explicit request for a very large team
- [ ] Any team the user asked for is in the prompt opening, in their words

Present final prompt to user. Ask for approval.
Set artifact status to: Ready for launch — awaiting user approval.

Once approved → execute the **Delegation Protocol** (final section).

## Anti-Patterns

| ❌ Anti-pattern | Why |
|----------------|-----|
| Pass artifact file path as prompt source | Artifact may change after launch; always copy text |
| Invoke the teamwork subagent before explicit user approval | User must confirm readiness |
| Skip creating the artifact | Artifact is the user's window into the prompt |
| Lose the draft on iteration | If user wants changes after Step 8, update and re-present |
| Add implementation hints by default | Narrows agent team's solution space. If user explicitly wants to constrain (e.g., "use Python"), include as a requirement but flag the trade-off |

## Iterate After First Run

Prompt crafting is iterative. If the first run falls short, tighten
    acceptance criteria or add better verification — prefer this over
    adding implementation hints. Re-run with the updated prompt.

## Where Your Prompt Will Go

teamwork_preview is not one agent. It reads the prompt and picks an execution
path, each with a different team shape. **The prompt is the only input
to that decision.**

| Team | When it runs |
|------|--------------|
| Document review | A supplied paper or document to be reviewed |
| Proof pipeline | Maths problems, formal proofs, verification |
| **Proof, very large team** | Hard proofs needing massive parallel search |
| **Small, focused team** | One self-contained fix, feature or refactor |
| Full team | Everything else: builds, research, ops |

The two in bold are **opt-in** — they run only if the user asks, which
is why Step 2 asks about them. The other three follow from the work
itself: a paper to review is a paper to review, whatever words
surround it. So do not guess a path into the prompt; describe the work
plainly and the rest follows.

### If the user asks for a particular team

That is theirs to ask, and this prompt is the only channel they have.
Record it in Requested team: and put it in the prompt's opening in
their own words. Do not soften it, and do not restate a preference as
a fact about the task.

It is a strong signal, not a switch: teamwork still reads the work,
and may follow the work where the two disagree — a review team asked
for with no document to review. Say that to the user rather than
promising a team.

Never raise this yourself — if the user has not asked, the default is
right.

### Tell the user

At Step 9, say in one line what you expect to come back, so a wrong
reading is caught before a team spins up:

> Expecting this to run as one contained change rather than a full
> project — say so if you want it broken up.

Describe the outcome, not the internal path. The user can check the
first.

## Delegation Protocol

When the user approves ("go", "looks good", "launch", "run it", or
    similar):

1. Extract the complete prompt text from prompt_draft.md.
2. Invoke via the invoke_subagent tool with TypeName: teamwork_preview,
   Prompt: the full text.
   (teamwork_preview is hidden from the subagents list but can be invoked.)

Set artifact status to: Launched.
</TEAMWORK>
</ADDITIONAL_METADATA>
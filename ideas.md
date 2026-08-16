# Nexo Jarvis — Design Directions

## Three possible directions

| Theme Name | Very Brief Intro | Probability |
| --- | --- | --- |
| Orbital Instrumentation | A cinematic control-room interface that turns the assistant into a precise, luminous instrument at the center of the user’s workspace. | 0.04 |
| Monolithic Editorial | A stark, quiet command environment inspired by contemporary industrial design, with oversized typography and a restrained signal language. | 0.08 |
| Chromatic Transit | A kinetic, transit-map-inspired interface in which commands flow along vivid pathways across a pale technical canvas. | 0.02 |

## Chosen direction: Orbital Instrumentation

### Design Movement

**Orbital Instrumentation** draws from speculative aerospace interfaces and the measurement-rich visual language of scientific instruments. It rejects a generic chat layout: Nexo Jarvis is presented as a spatial command system that the user observes, speaks to, and steers.

### Core Principles

1. **The core is the interface.** The holographic nucleus is the visual and interactional anchor; every state is readable through its motion, color, and surrounding telemetry.
2. **Information earns its density.** Fine technical details and dense system labels form a peripheral field, while active language remains deliberate, human, and easy to scan.
3. **Precision over decoration.** Lines, glows, rings, and marks must communicate state, depth, or hierarchy; no effects exist merely as ornament.
4. **Calm authority.** The interface remains dark and high-contrast, but avoids frantic motion and visual noise. Jarvis should feel capable before it feels flashy.

### Color Philosophy

The base is near-black graphite with a blue undertone, creating the perception of depth rather than a flat black screen. A saturated **Nexo Cyan** provides the language of interaction, listening, and system health; its cool precision makes it feel instrument-like. Controlled amber is reserved for attention and active processing, so the user immediately senses a state transition. Off-white dialogue prevents the system from becoming cold or hard to read.

### Layout Paradigm

The page uses a **radial command bay** rather than a centered dashboard grid. The assistant nucleus occupies a large central field that is offset subtly to the right; navigation forms a narrow vertical rail on the left, status sits in a top instrument strip, and contextual panels attach to the perimeter like modules around an observatory console. The layout compresses into stacked, clearly sequenced regions on smaller screens.

### Signature Elements

1. **Concentric orbital rings** with small numerical ticks and segmented arcs that change behavior by assistant state.
2. **Signal traces**—fine cyan paths, audio-style bars, and framed coordinates—linking the outer panels to the central core.
3. **The Nexo Prism**, a compact three-lobed, glass-like cyan symbol used in the rail, mobile control, and favicon.

### Interaction Philosophy

Every interaction should confirm the user’s agency within 160–240 ms. The microphone activates a concrete listening state; sending text leaves a visible transcript in the command stream; module switches move contextual information without disorienting the central nucleus. Keyboard command entry is immediate and should never be slowed by theatrical animation.

### Animation

The core breathes slowly in idle mode, expands into segmented rotations while listening, tightens into a faster amber pulse while processing, and enters smooth radial waves while speaking. Peripheral panels use transform-and-opacity transitions with a strong ease-out curve. Scanlines, grain, and particles remain extremely subtle. All nonessential motion respects `prefers-reduced-motion`.

### Typography System

**Space Grotesk** carries dialogue, headings, and actionable labels with a calm, engineered character. **IBM Plex Mono** renders telemetry, timestamps, controls, and terminal-like data. Headings use compact tracking and moderate weight rather than oversized display type; mono labels remain uppercase with wide letter spacing to distinguish the system layer from human conversation.

### Brand Essence

**Nexo Jarvis is a voice-first command environment for people who want a capable, composed personal AI at the center of their digital day.**

Personality: **precise, composed, quietly witty**.

### Brand Voice

Headlines are declarative and operational; CTAs are concise imperatives; microcopy explains status without apologizing or over-selling.

> “Good evening. Your workspace is ready.”

> “Hold to speak. I am listening.”

### Wordmark & Logo

The wordmark uses a custom-spaced, angular treatment of “NEXO” beside a tiny mono “JARVIS” descriptor. The mark is the **Nexo Prism**: three offset cyan facets forming an open hexagonal aperture, suggesting a lens, a portal, and layered intelligence without relying on literal robotics.

### Signature Brand Color

**Nexo Cyan — #26E4FF**. It is reserved for live interaction, active states, and the brand mark.

## Style Decisions

- Peripheral modules attach to the nucleus through visible signal routes, coordinate frames, and orbital alignment cues; they must not read as independent dashboard cards.
- **Nexo Cyan #26E4FF** remains the only live-system color. Amber is restricted to processing, alerts, and state transition.
- Utility language stays operational and composed: “Workspace ready,” “Signal nominal,” and “Awaiting command” are preferable to generic SaaS labels.

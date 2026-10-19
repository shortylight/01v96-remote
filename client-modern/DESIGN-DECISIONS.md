# Lightweight channel-strip client: design decisions

This note records the decisions made for the first version of the separate
channel-strip client. Treat the existing client and mixer protocol as the
behavioral reference when extending it.

## Product scope

- The new client is a focused, touch-first channel-strip surface, not a
  replacement for the existing client.
- The existing client stays on port `1337`; this client is served on port
  `1339`. Both use the existing WebSocket service on port `1338`.
- The initial surface contains the 32 input channels. Broader mixer navigation
  and non-channel controls are out of scope for this first pass.
- The target device is a 9th-generation iPad running Safari. The layout
  supports both orientations and uses a horizontally scrollable channel bank
  rather than shrinking all 32 strips to fit at once.
- The **MIXER** control opens connection settings. It lists supported
  connection modes and detected 01V96 MIDI input/output pairs; the server
  persists the confirmed choice for later launches.

## Technology and compatibility

- Use plain JavaScript, HTML, and CSS, without a framework, client build step,
  or additional runtime dependency. This keeps the static client small and
  compatible with the existing Node static-file server.
- Use browser-native controls and APIs supported by iPad Safari: buttons,
  range inputs, WebSocket, DOM events, and CSS flexbox.
- Keep CSS self-contained in `css/main.css`; avoid external fonts, icon
  services, and remotely loaded assets.
- Provide touch-sized buttons, native slider interaction, safe-area padding,
  momentum scrolling, and a dark, high-contrast mixer-inspired appearance.

## Channel-strip composition

Each strip is a reusable DOM component rendered by `makeChannelStrip()`.
Controls stay in this vertical order:

1. **CONFIG** — opens channel routing and mode parameters from the legacy
   client's `main` effect group (Phase, Stereo, Direct, FollowPan, and Bus 1-8).
2. **GATE** — opens its channel parameters.
3. **COMP** — opens its channel parameters.
4. **EQ** — opens its channel parameters.
5. **DELAY** — opens its channel parameters.
6. **Pan** — compact visual position marker with a centered reference line;
   tapping it opens a modal horizontal range control from `-63` (left) through
   `0` (center) to `63` (right). Center moves the popup slider to zero; Done
   applies the value.
7. **ON**
8. **Fader** — vertical range from `0` to `255`, with labeled dB tick marks.
9. **Channel name**

Gate, Comp, EQ, and Delay share one popup shell. The effect On/Off switch is
in the top-right of the header; Done remains at the bottom right. Config hides
the effect switch. Binary Off/On parameters use touch-friendly switches, and
Type is the first setting for Gate and Comp. Other two- or three-choice
settings use a connected segmented mode switch. Selection labels are shown
only in their control, without a duplicate selected-value readout. Config
keeps the common parameter controls and presents Bus 1-8 as numbered routing
buttons under a shared **Bus routing** heading.

EQ begins with a Mode and Attenuator row, followed by four band columns: Low,
Low-mid, High-mid, and High. The Attenuator ranges from -96.0 dB to +12.0 dB.
Each band's Q, Frequency, and Gain sliders have labels
without separate row headers. The HPF and LPF buttons are placed in their Low
and High band columns. EQ gain readouts use dB values from -18.0 dB to
+18.0 dB. Q ranges from 10.0 to 0.10; one additional slider step selects the
corresponding Low or High shelf, encoded as the mixer's `LowQ` value 41 or
`HiQ` value 42. Enabling HPF or LPF disables the associated outer band's Q and
Gain sliders while preserving its Q/shelf setting. The Gate Key source keeps
its bordered group box and heading in the right column beside the gate
settings. Inside, the KeyIn segmented switch has no separate field wrapper or
visible label; it reveals only the relevant number selector, labeled Channel
or Aux.

Gate KeyCh intentionally offers 1-12 only: this follows the legacy client's
documented value choices and the protocol's `kGateKeyCh` range of 0-11 (the
displayed channels are one-based). It is a mixer parameter limit, not a
restriction applied to the number of channel strips.

Effect property ranges, discrete choices, and EQ filter side-effects follow
the legacy client. Channel names are edited by tapping the displayed name at
the bottom of its strip; the modal editor caps names at eight characters.

## Mixer state and messages

- Reuse the existing message protocol; do not introduce a second server-side
  mixer or WebSocket path.
- Request `sync` after WebSocket connection and use the returned state for
  fader position, ON state, name, pan, pair state, and effect-button state.
- Send fader and ON changes as existing `fader` and `on` messages for target
  `channel`. When a channel is paired, mirror fader and ON changes in the
  partner strip while sending only the changed channel to the mixer. Pair
  state is taken from the mixer, requested sequentially during sync, and
  checked on both channels of each adjacent pair. The separate `kPairMS`
  parameter is not the channel-pair enabled flag.
- Send pan and Gate/Comp/EQ/Delay On changes as existing `faderEffect`
  messages. Gate, Comp, EQ, and Delay popups expose the properties, ranges,
  choices, and special EQ filter side-effects defined by the legacy client.
  After setting pan, request the console's pan values for both paired channels.
  Each strip uses its own reported value; do not derive the partner's pan.
- Send channel renames as `faderName` messages. Update the displayed strip
  immediately, while accepting later server state as authoritative.
- Keep fader updates lightweight: while dragging, send only when the value
  changes by at least three units (or reaches an endpoint); send the final
  value on release.
- Show connection state, and retry the WebSocket connection after disconnect.
- Request connection status and available ports after each WebSocket
  reconnect. Treat server-confirmed connection state as authoritative.

Connection setup uses two additional client messages:

- `connection_info` requests supported modes, detected MIDI port pairs, and
  the active connection.
- `connection_select` submits a mode and, for MIDI, a detected port name. A
  successful selection is persisted by the server and broadcast as a
  `connection` message. Close the connection dialog after a successful
  selection; leave it open and show the error if selection fails.

## Layout and interaction details

- Keep each strip a readable, fixed-width unit. Allow horizontal scrolling of
  the bank with native touch momentum instead of adding custom paging.
- Let the fader occupy the available vertical space; size its rotated native
  range control from the strip's measured height and recalculate on resize or
  orientation change.
- Keep names and the popup's numeric pan readout as text. The strip pan
  indicator shows its position relative to a center mark.
- Keep the pan Center action as an uncommitted slider adjustment until Done is
  pressed.
- Put a visible horizontal centerline across the fader handle and align the dB
  ticks to the actual handle-center travel, accounting for the handle's
  half-width at each endpoint. Keep the native thumb a solid color and draw
  the horizontal centerline as a separate overlay positioned from the fader
  value, so the slider's rotation cannot rotate the line.
- Offset the fader axis and place tick labels in the adjacent gutter, fully
  outside the native range's hit area. Style the thumb in the same dark,
  muted palette as the channel-strip controls, with a cyan centerline.
- Derive fader tick positions from 0-255 values. The labeled marks use the
  existing input-channel conversion: -∞ at 0; -50 at 11; -40 at 23; -30 at
  43; -20 at 79; -15 at 105; -10 at 143; -5 at 179; 0 at 207; +5 at 231;
  and +10 at 255.

## Boundaries for future work

- Make additional strip kinds or navigation explicit additions; the current
  client assumes 32 input channels.
- Before adding effect parameter editors, verify property names, units, ranges,
  and encodings against the existing client and Yamaha references.
- Keep browser state in step with incoming WebSocket updates, including
  reconnect and synchronization behavior.
- Test on the actual target iPad/Safari when available. Automated viewport
  checks are useful, but do not replace physical touch and device validation.

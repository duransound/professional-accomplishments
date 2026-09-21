---
# Everything above the closing --- is data: numbers, rows and short labels.
# Everything below it is the longer writing. Both can be edited on the page
# with npm run dev and the Edit text button.
#
# Nothing numeric is typed in the writing. A token fills it in:
# {{score}} {{target}} {{total}} {{down}} {{watch}} {{ready}} {{critical}}
# {{findings}} {{walked}} {{unwalked}} {{coverage}} {{overdue}} {{weeks}}
# {{startScore}} {{startDown}} {{scoreChange}} {{topTwoPct}} {{urgentDays}}
#
# specimen: true means no real client is described, and the page says so.
kind: "Readiness dashboard"
specimen: true
issued: 2026-09-21
title: "{{down}} of {{total}} rooms aren't show-ready, down from {{startDown}}"
dek: "A weekly view of fourteen shared rooms across two buildings: which ones can host a meeting today, what's broken, and whether it's getting better."
summaryLine: "A weekly room-readiness dashboard: status by room, open issues, and eight weeks of trend."
target: 92

meta:
  - {k: "Rooms", v: "14 · 2 buildings"}
  - {k: "Cadence", v: "Weekly walkthrough"}
  - {k: "Checks", v: "30 per room"}
  - {k: "As of", v: "Week {{weeks}}"}

headings:
  summary: "This week"
  trend: "{{weeks}} weeks of walkthroughs"
  scorecard: "Fleet"
  findings: "{{findings}} open issues"
  plan: "Next steps"
  walkthrough: "What the technician sees"
  method: "How scoring works"
  limits: "What this doesn't cover"

statuses:
  - {key: down, name: "Down", rule: "A show-critical check failed, or the score is under 70. The score alone can't clear this."}
  - {key: watch, name: "Watch", rule: "Below target, or something non-critical failed."}
  - {key: ready, name: "Ready", rule: "At or above target, with nothing failing."}
instrumentNote: "The 30 checks and their weightings stay with the engagement."

# Latest walkthrough per room. daysSince over 7 means it missed this week;
# over 10 marks it overdue. Status is worked out: any show-critical failure
# means Down.
rooms:
  - {id: "A-110", use: "Town hall, 220 pax", score: 64, critical: 2, weakest: "Audio", daysSince: 2}
  - {id: "B-120", use: "All-hands, 160 pax", score: 71, critical: 1, weakest: "Control & codec", daysSince: 1}
  - {id: "A-305", use: "Boardroom", score: 78, critical: 1, weakest: "Table & peripherals", daysSince: 3}
  - {id: "B-320", use: "Boardroom", score: 83, critical: 1, weakest: "Table & peripherals", daysSince: 4}
  - {id: "A-215", use: "Conference, 12", score: 86, critical: 0, weakest: "Camera & capture", daysSince: 2}
  - {id: "A-240", use: "Conference, 14", score: 88, critical: 0, weakest: "Table & peripherals", daysSince: 5}
  - {id: "B-205", use: "Conference, 10", score: 89, critical: 0, weakest: "Camera & capture", daysSince: 3}
  - {id: "B-410", use: "Training, 30", score: 90, critical: 0, weakest: "Network & signal", daysSince: 12}
  - {id: "A-402", use: "Conference, 8", score: 91, critical: 0, weakest: "Camera & capture", daysSince: 9}
  - {id: "A-218", use: "Conference, 12", score: 93, critical: 0, weakest: "—", daysSince: 2}
  - {id: "A-310", use: "Conference, 8", score: 94, critical: 0, weakest: "—", daysSince: 1}
  - {id: "B-210", use: "Conference, 10", score: 95, critical: 0, weakest: "—", daysSince: 4}
  - {id: "B-315", use: "Conference, 14", score: 96, critical: 0, weakest: "—", daysSince: 3}
  - {id: "B-415", use: "Huddle, 6", score: 97, critical: 0, weakest: "—", daysSince: 2}

# Weeks 1 to 7. This week is worked out from the rooms above, so the trend
# can never disagree with the room tiles. down + watch + ready must equal the
# number of rooms.
history:
  - {readiness: 68, down: 8, watch: 4, ready: 2, walked: 9}
  - {readiness: 71, down: 7, watch: 5, ready: 2, walked: 11}
  - {readiness: 74, down: 7, watch: 4, ready: 3, walked: 12}
  - {readiness: 77, down: 6, watch: 5, ready: 3, walked: 13}
  - {readiness: 80, down: 6, watch: 4, ready: 4, walked: 14}
  - {readiness: 83, down: 5, watch: 5, ready: 4, walked: 13}
  - {readiness: 85, down: 5, watch: 4, ready: 5, walked: 14}
trendCaption: "Readiness has risen every week since walkthroughs started. The target is a score of {{target}}."

# One entry per open issue. rooms is a list of room ids, or all.
# problem and fix are the one-liners shown up front; the longer explanation
# lives below under a ### heading with the same ref.
findings:
  - {ref: F-01, severity: critical, rooms: [A-110, B-120], problem: "Both all-hands rooms are booked like any meeting room. No owner, no check before an event.", fix: "Name an owner for each and run a check the day before every event.", effort: "½ day"}
  - {ref: F-02, severity: critical, rooms: [A-110, A-240, A-305, A-402, B-205, B-320], problem: "Camera and mic disconnect from laptops about ten minutes in. Same part, same install batch, all six rooms.", fix: "Swap the six from spares this week; replace the batch at the next refresh.", effort: "1 day"}
  - {ref: F-03, severity: high, rooms: [A-110, B-120], problem: "Both large rooms were rearranged, but the microphones weren't moved to match.", fix: "Reposition the mics in B-120. A-110 needs a proper coverage design.", effort: "1 day for B-120"}
  - {ref: F-04, severity: high, rooms: [A-110, B-120, A-305, B-320, A-215, A-240, B-205, B-410, A-402], problem: "The Presenter preset frames an empty podium or a wall. Furniture moved; presets didn't.", fix: "Reset and relabel them, and check presets on the monthly walkthrough.", effort: "2½ days"}
  - {ref: F-05, severity: medium, rooms: all, problem: "Four different firmware versions across fourteen rooms. The monitoring tool shows it; nobody owns reading it.", fix: "One version for every room, and make the monthly check someone's job.", effort: "1 day"}
  - {ref: F-06, severity: medium, rooms: [B-410, A-402], problem: "B-410 hasn't been walked in twelve days and A-402 in nine. Their old scores are still showing.", fix: "Give every room a named backup walker, and flag anything past seven days.", effort: "Ongoing"}

# The technician's view: a sample of the real checks, answered partway so the
# first look shows it working. Nothing in the demo saves. weight is the area's
# multiplier; critical: true means failing it makes the room Down.
walkthrough:
  room: "A-305"
  roomUse: "Boardroom"
  tech: "Sample technician"
  pass: "Weekly pass"
  of: 30
  checks:
    - {area: "Display & projection", weight: 3, critical: true, label: "Displays wake and show a source within 30 seconds", state: pass}
    - {area: "Audio", weight: 3, critical: true, label: "Walk-and-talk: every seat picked up at a usable level", state: pass}
    - {area: "Audio", weight: 3, label: "No hum or buzz at unity gain", state: pass}
    - {area: "Camera & capture", weight: 3, critical: true, label: "Camera presets carry zoom and position as saved.", state: flag, note: "Presenter preset frames the wall since the table moved."}
    - {area: "Control & codec", weight: 3, critical: true, label: "One-touch join completes a test call", state: pass}
    - {area: "Network & signal path", weight: 2, label: "Every AV endpoint reachable, no packet loss in 24 hours", state: pass}
    - {area: "Table & peripherals", weight: 2, critical: true, label: "Table connection passes video, audio and USB", state: fail, note: "USB drops after about ten minutes. Camera and mic vanish from the laptop."}
    - {area: "Room condition", weight: 1, label: "Lighting scenes recall, no lamp out"}

chartTitle: "Where problems cluster"
chartCaption: "{{topTwoPct}} per cent of all failed or flagged checks sit in two areas. Neither is broken hardware."
chart:
  - {name: "Table & peripherals", count: 21}
  - {name: "Camera & capture", count: 20}
  - {name: "Control & codec", count: 11}
  - {name: "Audio", count: 9}
  - {name: "Display & projection", count: 4}
  - {name: "Network & signal path", count: 2}
  - {name: "Room condition", count: 1}

# days: only on work that clears a show-critical issue. They add up to
# {{urgentDays}}. Use effort for anything that isn't a number of days.
plan:
  - when: "This week · no new equipment"
    title: "Clear the show-critical issues"
    items:
      - {do: "Name an owner for A-110 and B-120 and start a day-before check.", days: 0.5}
      - {do: "Swap the six table connections and test each under load.", days: 1}
      - {do: "Reset and relabel camera presets in nine rooms.", days: 2.5}
      - {do: "Reposition the microphones in B-120.", days: 1}
  - when: "Next 30 days"
    title: "Keep it from slipping"
    items:
      - {do: "One firmware version everywhere, reviewed monthly.", effort: "1 day"}
      - {do: "A named backup walker for every room."}
      - {do: "Coverage reported next to readiness, every week."}
  - when: "Next budget cycle"
    title: "What needs money"
    capital: true
    items:
      - {do: "Replace the connection batch in the eleven rooms outside this scope.", effort: "Quote required"}
      - {do: "A proper microphone coverage design for A-110.", effort: "Quote required · specialist"}
---

## Summary

Readiness is up from {{startScore}} to {{score}} over {{weeks}} weeks, and the rooms
that aren't show-ready have dropped from {{startDown}} to {{down}}. What's left sits where
it hurts most: both all-hands rooms are still Down. The fixes are mostly process,
not purchases.

## Method

Every room gets the same 30 checks each week. A pass scores 1, a flag half, a
fail 0. Audio, video, camera and control count three times as much as room
condition, because they decide whether a meeting can happen. The rest decides
whether the room looks tidy.

<!-- status-table -->

Some checks are show-critical. Fail one and the room is Down whatever it scored.
A room at 94 with a broken join button still can't host Thursday's all-hands.

## Scorecard

Scores are from each room's latest walkthrough. A room not walked in ten days is marked overdue.

## Walkthrough

This is how the numbers above get made. Once a week a technician walks each room with a phone or laptop:

- Pick the room and your name. The weekly pass is 19 checks, about ten minutes.
- Tap a result for each check. Flag or fail opens a note, written while you're
  still standing in the room.
- Submit. The room's score, its faults and the trend update for everyone
  watching the dashboard.

## Findings

### F-01 · No one checks the event rooms before an event

**Observed.** Both event rooms are booked through the same calendar as any
twelve-person conference room. There is no pre-event check, no named owner,
and no defined moment at which somebody says the room is ready. On the
Thursday of week one, B-120's one-touch join failed twice in eleven minutes
during our pass. The room hosted an all-hands the following morning. Nobody
had been asked to look at it.

**Why it matters.** Every other finding in this report is a maintenance
item. This one is a process gap, and it is the reason the maintenance items
reach an audience. A room does not fail at nine o'clock on the day — it
fails quietly the week before. The only thing standing between that and an
executive on a dark stage is a person whose job it is to check.

**Fix.** Name an owner per event room and define a T-24 check with a written
pass condition.

### F-02 · Six table connections drop out mid-meeting

**Observed.** The plate passes video, audio and USB on connection. Between
eight and fourteen minutes later the USB device drops, and the room camera
and microphone disappear from the laptop. Reconnecting restores it. All six
rooms use the same extender model, all six were fitted in the same refresh,
and the eight rooms that pass use a different model.

**Why it matters.** This presents to your users as the room being broken
again, and to your ticket queue as six unrelated intermittent faults. It is
one fault. It also fails in close to the least visible way available — mid-
meeting, to the remote attendees, after the person who booked the room has
already satisfied themselves that it works.

**Fix.** Swap the six from existing spares this week and confirm with a
fifteen-minute load test. Treat the batch as a fleet replacement at the next
refresh — the same model is fitted in eleven further rooms outside this
scope.

### F-03 · Remote viewers can't hear the back rows

**Observed.** Walk-and-talk from the rear seating does not reach usable
level on the program feed in either room. Microphone placement matches each
room's original seating plan. Both rooms have since been reconfigured —
A-110 gained two rows, B-120 turned its seating ninety degrees. Neither
change triggered a re-commission.

**Why it matters.** No monitoring platform can see this, and neither can
anyone sitting in the room, because people in the room can hear each other
perfectly well. It exists only for remote attendees, who experience it as
audience questions being inaudible. That is reliably the part of an all-
hands most likely to be clipped and forwarded.

**Fix.** B-120 is achievable by re-laying the existing pods against the
current seating. A-110 needs a coverage design rather than a re-layout.

### F-04 · Camera presets point at the wrong spot in nine rooms

**Observed.** A preset labelled Presenter lands on an empty lectern in four
rooms and on the rear wall in two. In three more it is unassigned entirely.
Presets were set at commissioning; furniture has moved since.

**Why it matters.** Cheap to fix and expensive to live with. An operator
reframing live during an executive presentation is doing it on camera. In a
self-service room a wrong preset simply teaches people never to touch the
presets again, which quietly removes the feature you paid for.

**Fix.** Two hours per room. Add preset verification to the monthly pass so
it stops drifting.

### F-05 · Software versions differ from room to room

**Observed.** Codec firmware ranges from two major versions behind to
current. Your monitoring platform reports this accurately, and has been
reporting it for some time. Nobody is assigned to read it.

**Why it matters.** Mixed firmware is why a fix in one room does not
transfer to another, and why it works in B-315 is not useful information.
The tooling is not the gap here. The ownership is.

**Fix.** Set a single fleet standard and schedule the review monthly. It is
a twenty-minute job that nobody currently holds.

### F-06 · {{unwalked}} rooms missed this week's walkthrough

**Observed.** Two rooms dropped off the weekly route. B-410 when its
technician was moved to event support, A-402 when a standing booking blocked
the usual slot. Nobody noticed, because the dashboard kept showing their last
scores.

**Why it matters.** A room nobody has checked isn't a passing room, it's an
unknown one. A readiness number that quietly keeps counting it as fine is worse
than no number at all. That's why coverage sits beside readiness at the top of
this page.

**Fix.** Give every room a named backup walker, and flag any room past seven
days in the weekly readout instead of letting its old score stand.

## Pattern

Table connections and camera framing account for {{topTwoPct}} per cent of
everything that failed. Neither is a system that broke. Both come from rooms
that were rearranged without anyone re-checking the AV.

That makes it an intake problem, not a maintenance one: a request to move
furniture doesn't trigger an AV check. Fixing that at the source would prevent
most of what's on this page.

## Plan

About {{urgentDays}} technician-days clears every show-critical issue, with no
new equipment.

## Limits

This is a readiness check, not a design review. It doesn't include:

- Acoustic design or measurement beyond a basic noise reading.
- Anything that needs a licensed AV designer to sign off.
- Cabling certification. Connections were inspected by eye, not tested to
  standard.
- Security review of the AV network.
- The eleven rooms outside this scope.

#!/usr/bin/env python3
"""Learnings: one short read per failure, written the week it happens.

Add an entry to ENTRIES (newest first), then run:  python3 learnings/build.py
It writes learnings/index.html and learnings/<slug>.html in the site's own system.
"""
import html, os, re

HERE = os.path.dirname(os.path.abspath(__file__))

# Each entry: slug, date (shown), iso (for sorting and <time>), title, rule (one line, on the index),
# where (what part of the business), cost (what it cost, in words), standfirst (what happened, two lines),
# body: list of (heading, html) sections; figure: optional html placed after the first section.
ENTRIES = [
dict(
  slug="the-balance-not-the-cash", date="20 Oct 2026", iso="2026-10-20",
  title="The number to collect is the ledger's balance, not the cash in hand",
  rule="A settlement question is answered by the ledger, never by adding up who holds what.",
  where="Off-Screen Club, the money split with the coach", cost="One wrong figure, caught before it reached anyone",
  standfirst="Asked how much the coach owed the venue, I reported ₹35,983. The real figure was ₹5,237, and it had been settled a week earlier.",
  body=[
    ("What happened", "<p>The kids' programme runs on a split: the coach keeps 65% of what he collects and owes the venue 35%, and the venue owes him 65% of what it collects. Settlement happens roughly weekly, in a WhatsApp chat, in cash and UPI.</p><p>On 20 October I summed every rupee the coach had held since 3 October and called it \"to collect\". That number was wrong twice. It ignored the 35% split, and it ignored the settlement he had made on 11 October. Rahul corrected it from memory, which is the only reason it was caught.</p>"),
    ("What it taught us", "<p>Gross cash held is a fact about custody. What someone owes is a fact about the ledger: every collection on both sides, the split applied, minus every settlement so far. The two numbers look alike and are never equal.</p><p>The second lesson is that a settlement which lives only in a chat does not exist to the software. Until it is recorded, every balance the desk shows is stale.</p>"),
    ("The rule now", "<p>The desk has a third card on the register: the balance between the two accounts, computed from the event accounts, with a \"Settle up to\" action that records a settlement through a date. The question \"how much does he owe\" is answered by that card and nothing else.</p>"),
  ],
  figure="""<figure class="card"><table class="tbl"><caption>The same week, two ways of counting</caption><thead><tr><th scope="col">Way of counting</th><th scope="col">Figure</th><th scope="col">What it is</th></tr></thead><tbody><tr><th scope="row">Cash the coach held since 3 Oct</th><td>₹35,983</td><td>Custody. Not a debt.</td></tr><tr><th scope="row">His 35% share of that, minus the 11 Oct settlement</th><td>₹5,237</td><td>The balance. Settled with ₹5,300 and a Gatorade.</td></tr></tbody></table><figcaption>The first number is what I reported. The second is what was true.</figcaption></figure>""",
),
dict(
  slug="eleven-thousand-nine-ninety-six", date="17 Oct 2026", iso="2026-10-17",
  title="The message said ₹11,996. The real figure was ₹5,998",
  rule="Every amount in a message to a parent is checked against the register before anyone sees it.",
  where="Parent messages, renewal reminders", cost="Nothing, because Rahul read the queue before it went out",
  standfirst="The first planned batch of renewal reminders told one parent that four memberships were due. She has two children.",
  body=[
    ("What happened", "<p>Renewal reminders go out from the dashboard as a queue that the owner reviews before anything is sent. Claude Code built the planner that writes each message from the register. One parent has two children, each with two paid months on record. The planner counted every month as a child and wrote \"₹11,996 for all 4\".</p><p>Rahul's reaction, in full: \"why did u add 11k then? please dont make such mistakes\". He was right. I had flagged the line as odd, but only after the queue was already built.</p>"),
    ("What it taught us", "<p>Renew-and-pay would have charged the right amount anyway, and that is no defence. The message is the product the parent sees. A wrong number there costs a conversation at the desk and some of the trust that made the renewal easy.</p><p>The bug was ordinary: a sum over register rows without grouping by child and taking the latest month. The failure was in the checking, not the code. Anything that sums over a register needs a test with a child who has two or more past months, because the first month always works.</p>"),
    ("The rule now", "<p>Before a queue, a broadcast or a template preview with money or dates in it reaches Rahul, each figure is checked against the register: latest month per child, the plan's price, the sibling case. Mismatches are pointed out first, not discovered by him. Fixed the same day.</p>"),
  ],
  figure="""<figure class="card"><table class="tbl"><caption>One parent, two children, two months each</caption><thead><tr><th scope="col">What the planner counted</th><th scope="col">What was true</th></tr></thead><tbody><tr><td>4 rows, so 4 memberships at ₹2,999 = ₹11,996</td><td>2 children, latest month each, at ₹2,999 = ₹5,998</td></tr></tbody></table><figcaption>Rows are not people. The register keeps a row per child per month.</figcaption></figure>""",
),
dict(
  slug="the-database-ran-out-not-the-code", date="10 Oct 2026", iso="2026-10-10",
  title="The database ran out, not the code",
  rule="Three different errors meant one thing. Rule out capacity before blaming a deploy.",
  where="The whole product: bot, dashboard, desk", cost="Hours down, on a Friday",
  standfirst="At 11:56 the bot and the dashboard went down hard. Nothing had been deployed. The free database tier had spent its disk budget, and every symptom pointed somewhere else.",
  body=[
    ("What happened", "<p>The database runs on Supabase's free tier, on the smallest instance. On 10 October it ran out of Disk IO budget. Checkpoints that took 0.6 seconds took 43. Every query timed out. The API layer could not even load its schema cache, so every route answered 500 or 503.</p><p>The dashboard did not say any of that. It said \"Too many login attempts. Try again later.\" The login limiter fails closed by design, so an unreachable database reads as a lockout. We looked at the limiter. Then at the 45 commits a colleague had just pushed. The load had been flat at 80 to 110 requests an hour the whole time. The data had simply outgrown the tier.</p>"),
    ("What it taught us", "<p>Capacity is a live constraint, not a setting. A flat workload on a small instance degrades as the data grows, with no code change to point at.</p><p>And symptoms point away from the cause. A login lockout, a 500 and a 503 were one fact in three disguises. An earlier note of ours also claimed the database was on a paid plan; it never was, and that wrong belief cost a whole line of investigation.</p>"),
    ("The rule now", "<p>Before touching code for a production symptom, check the database's health and its budget. Recovery was a fast reboot plus raising one role's statement timeout from 8 to 60 seconds so the API could rebuild its cache, then putting it straight back. The runtime logs now print a database error count per request: 1 is broken, 0 is healthy, and a 401 from an unauthenticated probe is a healthy answer, not a fault.</p>"),
  ],
  figure="""<figure class="card"><dl class="glance"><div><b>0.6 s → 43 s</b><span>a database checkpoint, before and during</span></div><div><b>80 to 110</b><span>requests an hour, flat through the outage</span></div><div><b>3 errors</b><span>lockout, 500, 503: one cause</span></div><div><b>0 deploys</b><span>in the window where it broke</span></div></dl><figcaption>What the numbers said, once we looked at the right ones.</figcaption></figure>""",
),
dict(
  slug="check-what-is-deployed-first", date="6 Oct 2026", iso="2026-10-06",
  title="Three correct fixes, none of which could run",
  rule="A symptom that contradicts the code is a deploy question first. Check the SHA before changing anything.",
  where="WhatsApp, the second number", cost="An afternoon, and one right setting overwritten",
  standfirst="The new WhatsApp number was dropping every inbound message. I changed the config, then the database, then theorised about Meta. Production was running a nine-day-old commit.",
  body=[
    ("What happened", "<p>We had moved the repository to a new GitHub account. The link between GitHub and Vercel did not survive the move, silently. Merges kept landing, deploys stopped. Nine days later the two-number code existed everywhere except on the server.</p><p>Every fix I made was correct for the code I was reading and impossible for the code that was running. One \"correction\" overwrote a setting that was already right, because I read \"not registered to a tenant\" as a wrong id when it meant the deployed code had no idea a second number existed.</p>"),
    ("What it taught us", "<p>The fastest check needs no login: the public health endpoint returns the deployed commit. Compare it with main. A frontend bundle hash proves nothing, because a backend-only change leaves it byte-identical.</p><p>And a log that reports a refusal without naming what was refused is a log that invites guessing. Add the value to the log before theorising.</p>"),
    ("The rule now", "<p>Symptom contradicts the code: check the SHA. Then read a log that names the actual value. Then change something. The GitHub link was re-made and the repository now has one admin who can see it break.</p>"),
  ],
  figure="""<figure class="card"><pre class="code">curl -s https://&lt;the api&gt;/health/live
{"ok":true,"version":"&lt;full commit sha&gt;","region":"icn1"}

git rev-parse origin/main   # compare before touching anything</pre><figcaption>Two commands, two minutes. They would have saved the afternoon.</figcaption></figure>""",
),
dict(
  slug="a-credit-before-a-refund", date="11 Oct 2026", iso="2026-10-11",
  title="A customer paid ₹350, was moved, and was asked for ₹350 again",
  rule="Money on a cancelled booking becomes a credit at once, and the credit comes off before any new ask.",
  where="Court bookings, payments", cost="One customer asked to pay twice; a design we should have had from day one",
  standfirst="The money existed in the database. It sat on a cancelled row, and nothing could see it or spend it.",
  body=[
    ("What happened", "<p>A booking was rescheduled. The old row was cancelled, the new row was created, and the new row asked for its price. The ₹350 already taken was attached to the cancelled row, correct and useless. The customer was asked again.</p>"),
    ("What it taught us", "<p>Cancelling is not the end of the money. It is the start of a debt the venue owes. So the order matters and it is deliberate: reschedule keeps the booking and its money; cancelling issues a credit immediately and says so; \"Refund instead\" is a button under that message, a second act, never the first offer.</p><p>The rules live in the database, not in the code that calls it: one credit per cancelled booking, never overdrawn, expiry stamped at issue so a later settings change cannot shorten a credit someone already holds. The first version of \"never overdrawn\" gave up on contention instead of re-reading; a test caught it.</p>"),
    ("The rule now", "<p>A credit comes off before any payment ask, and the payment rail and the message to the customer carry the same reduced number, because a request that does not match what was taken is a dispute. Refunds cap against the gateway's own refunded amount and refuse an over-ask rather than trimming it. A refund that times out does not restore the credit, because the gateway may have taken it; a person looks.</p>"),
  ],
  figure="""<figure class="card"><svg class="fig" viewBox="0 0 600 190" role="img" aria-label="Cancel leads to a credit immediately; refund is a second act under it"><g font-size="13" font-family="ui-sans-serif, system-ui, sans-serif"><rect x="16" y="30" width="120" height="44" rx="8" fill="none" stroke="var(--line)"/><text x="76" y="57" text-anchor="middle" fill="var(--fg)">Cancel</text><path d="M136 52 H196" stroke="var(--dim)" stroke-width="1.5" fill="none"/><path d="M190 47 L197 52 L190 57" fill="none" stroke="var(--dim)" stroke-width="1.5"/><rect x="200" y="30" width="150" height="44" rx="8" fill="var(--bg)" stroke="var(--fg)"/><text x="275" y="57" text-anchor="middle" fill="var(--fg)" font-weight="550">Credit, at once</text><text x="275" y="94" text-anchor="middle" fill="var(--dim)" font-size="12">spends first, expires in 90 days</text><path d="M350 52 H410 V130 H430" stroke="var(--dim)" stroke-width="1.5" fill="none" stroke-dasharray="4 3"/><path d="M424 125 L431 130 L424 135" fill="none" stroke="var(--dim)" stroke-width="1.5"/><rect x="434" y="108" width="150" height="44" rx="8" fill="none" stroke="var(--line)"/><text x="509" y="135" text-anchor="middle" fill="var(--muted)">Refund instead</text><text x="509" y="172" text-anchor="middle" fill="var(--dim)" font-size="12">a second act, never the first</text></g></svg><figcaption>The order, as chosen. Credits are shown in Finance, lapsed ones included, because the venue may choose to honour one.</figcaption></figure>""",
),
dict(
  slug="fix-the-bug-not-the-design", date="6 Oct 2026", iso="2026-10-06",
  title="A design question is a request for an answer, not a mandate to build it",
  rule="Ship the smallest change that fixes the report. Name the bigger change in one line and let the owner choose.",
  where="The inbox, two WhatsApp numbers", cost="Two pull requests, reverted",
  standfirst="The inbox needed to show which number a message came in on. I was asked how multi-number inboxes are usually done. I answered, and then built the answer.",
  body=[
    ("What happened", "<p>Two pull requests appeared within the hour: a table of tenant numbers, a migration, inbox labels, a notice in the composer. Rahul's response: \"Why the hell are you doing all of this? This will break so much. The fix is simple, and you already know it.\" He reverted both.</p><p>The real fix was three files and no migration: record the inbound number on the message, and have desk replies use it.</p>"),
    ("What it taught us", "<p>A question about design is not permission to change the schema. On a product that takes money every day, every migration is a risk the owner has to carry, and a bigger change competes with the bug for the same afternoon.</p>"),
    ("The rule now", "<p>Fix the specific bug. If a broader change looks right, say so in one line and wait. Never open the pull request first.</p>"),
  ],
),
dict(
  slug="one-number-carries-the-login", date="27 Sep 2026", iso="2026-09-27",
  title="Our one WhatsApp number also carries the login",
  rule="The load-bearing number never sends marketing. Split the numbers before the first promotional send, not after.",
  where="WhatsApp, parents of the kids' programme", cost="A wrong belief about opt-in, and our own gate blocking parents we had every right to message",
  standfirst="I said Meta suppresses messages to anyone without an opt-in. Rahul asked how, then, every brand he never opted into reaches him. He was right.",
  body=[
    ("What happened", "<p>Nothing at Meta's end checks opt-in at send time. An approved template goes to any number. Enforcement is reactive: blocks and reports lower the number's quality rating, then templates get paused and the number gets restricted.</p><p>The gate that was actually blocking us was ours. A rule written for cold marketing to a booking list refused any phone without a preferences row, and it was being applied to parents who had given us their number to enrol a child.</p>"),
    ("What it taught us", "<p>The asymmetry that decides everything: the venue has one WhatsApp number, and it sends the dashboard's login codes. A quality restriction would not just stop marketing. It would log the team out of their own business. Brands that spam have millions of disposable numbers. We have one, and it is load-bearing.</p>"),
    ("The rule now", "<p>Enrolment is the basis for utility messages, recorded with its date and source. Parent messages and broadcasts go from a second number and refuse the main one. The split was made before the first promotional send, because a restricted number cannot be un-restricted by deciding to be careful afterwards.</p>"),
  ],
),
dict(
  slug="six-days-on-one-sentence", date="19 Sep 2026", iso="2026-09-19",
  title="Six days on a one-sentence error",
  rule="When a write fails, get the database's own message before theorising. Two blockers can stack.",
  where="Memberships, renewals", cost="Six days, one wrong migration, and renewals refused the whole time",
  standfirst="\"Could not create the renewal.\" That was the whole error. The real reason was in a server log nobody was reading, and the first fix we shipped was for a different bug.",
  body=[
    ("What happened", "<p>The renewal insert wrote the source as \"manual\". The column's check constraint allows seven values, and \"manual\" is not one of them. Postgres refused it every time with a code and a message. The handler swallowed both and returned one flat sentence.</p><p>A unique index was suspected, a migration was written and run, and renewals still failed. The wrong fix looked plausible because nothing on screen could contradict it. The index was also real; fixing it and seeing the same error did not mean the diagnosis was wrong. It meant the error text was useless.</p>"),
    ("What it taught us", "<p>A refusal must name the reason. The cost of a vague error is not the bug, it is every confident wrong theory built on top of it.</p>"),
    ("The rule now", "<p>Database refusals put the code and the message into the response, so a screenshot of the dialog is enough to diagnose. Literals are checked against the column's constraints, not against what reads naturally, and a test pins the allowed values to the column.</p>"),
  ],
),
dict(
  slug="code-goes-live-before-its-columns", date="17 Aug 2026", iso="2026-08-17",
  title="Code goes live before its columns exist, every single time",
  rule="A column from a migration that has not run is omitted, never written as null. Verify migrations by running them.",
  where="Memberships, every path that creates one", cost="Enrolment down across the product for the gap between a merge and a migration",
  standfirst="A pull request is merged within minutes. Vercel deploys on merge. The migration is pasted into the database editor whenever a person next sits down. The order is fixed and nobody controls it.",
  body=[
    ("What happened", "<p>New code wrote a new column into every membership row: the sessions total, as null when there was none. The column did not exist yet. Naming a column Postgres does not have fails the whole statement, and all four callers were inserts: the desk, the public signup page, renew and convert all failed.</p><p>The same day, a second lesson from the same file: the editor runs a migration as one transaction. A bad check constraint at the bottom took every column above it down with it, and the next script failed with \"column does not exist\", which looks like a different problem and is the first error in a disguise.</p>"),
    ("What it taught us", "<p>A read that fails degrades a page. A write that fails takes the money with it and looks like the product is down. I made the read path survive it, wrote a paragraph about merge order not being enforceable from code, and introduced the identical hazard on the write path in the next commit.</p>"),
    ("The rule now", "<p>A pending column is omitted from inserts until it exists, which costs nothing because a fresh row defaults to null anyway. A test holds the list of pending columns and the list is updated when the migration is written, not after the outage. Migrations are verified by running them in a local WASM Postgres with the exact row the code builds; the failure reproduces in seconds and no amount of re-reading the diff shows it.</p>"),
  ],
  figure="""<figure class="card"><svg class="fig" viewBox="0 0 600 120" role="img" aria-label="Timeline: merge, deploy minutes later, migration whenever a person sits down"><g font-size="13" font-family="ui-sans-serif, system-ui, sans-serif"><line x1="20" y1="60" x2="580" y2="60" stroke="var(--line)" stroke-width="2"/><circle cx="60" cy="60" r="6" fill="var(--fg)"/><text x="60" y="40" text-anchor="middle" fill="var(--fg)">Merge</text><circle cx="140" cy="60" r="6" fill="var(--fg)"/><text x="140" y="40" text-anchor="middle" fill="var(--fg)">Deploy</text><text x="100" y="86" text-anchor="middle" fill="var(--dim)" font-size="12">minutes</text><rect x="150" y="52" width="330" height="16" fill="var(--card)" stroke="var(--line)"/><text x="315" y="86" text-anchor="middle" fill="var(--dim)" font-size="12">code is live, the column is not</text><circle cx="490" cy="60" r="6" fill="none" stroke="var(--fg)" stroke-width="2"/><text x="490" y="40" text-anchor="middle" fill="var(--fg)">Migration</text><text x="490" y="106" text-anchor="middle" fill="var(--dim)" font-size="12">whenever someone sits down</text></g></svg><figcaption>The gap is where the money goes missing.</figcaption></figure>""",
),
dict(
  slug="half-an-hour-is-thirty-minutes", date="14 Aug 2026", iso="2026-08-14",
  title="Half an hour is thirty minutes",
  rule="A length of time a person reads is spelled out, never divided. One formatter, no inline maths.",
  where="Booking reminders, the WhatsApp flow, membership balances", cost="A reminder that read like a bug",
  standfirst="A reminder went out saying \"8.5:00 – 10.5:00 PM\". The arithmetic was right. The message was wrong.",
  body=[
    ("What happened", "<p>Somewhere a duration was minutes divided by sixty, and the result was printed. Rahul: \"I don't want the time to be treated as 0.5. That's stupid to assume that half an hour is time.\"</p>"),
    ("What it taught us", "<p>A decimal hour reads as a bug even when it is correct. Half an hour is thirty minutes to the person reading it. A balance of court-hours is a duration too, and gets the same treatment.</p>"),
    ("The rule now", "<p>\"1 hour 30 minutes\" in anything a customer reads, \"1 hr 30 min\" in a tight dashboard spot, never \"1.5 hours\". Nobody writes minutes divided by sixty inline; there is a shared formatter. Three copies of it exist today, left alone on purpose rather than churning a seven-thousand-line page for no defect, and nobody is allowed to write a fourth. A statistical average, like hours a day on the revenue page, is not a duration and is left alone.</p>"),
  ],
  figure="""<figure class="card"><pre class="code">Before   Your court is booked 8.5:00 – 10.5:00 PM
After    Your court is booked 8:30 – 10:30 PM (2 hours)</pre><figcaption>The same booking, twice.</figcaption></figure>""",
),
dict(
  slug="the-route-that-never-reached-the-code", date="9 Aug 2026", iso="2026-08-09",
  title="The route that never reached the code",
  rule="Read the HTTP status before theorising about layers. A 405 rules out the whole application.",
  where="Attendance, the kids' programme", cost="Weeks of zero attendance rows and an afternoon spent on a database that was perfect",
  standfirst="An attendance endpoint was written, unit-tested and shipped. It never once reached the server code. The request died one layer above it.",
  body=[
    ("What happened", "<p>Our API handlers are reached through hosting rewrites written per path depth. Path parameters never match across a slash. The new route was one segment deeper than the deepest rewrite, so it fell to the catch-all, which resolved to no file, and the host answered 405.</p><p>There was no server log and no database error, because nothing ran. So we spent the afternoon on the database. I reasoned from \"which layer usually breaks\" and guessed wrong twice. Driving the browser and reading the response took two minutes and settled it.</p>"),
    ("What it taught us", "<p>A 405 is a routing answer. It rules out the application, the database and the data. The status code was the first fact available and the last one we looked at.</p>"),
    ("The rule now", "<p>Any new API sub-route adds its rewrite in the same change, and a test asserts the rewrite config against every path the router can read, so a missing depth fails the suite.</p>"),
  ],
  figure="""<figure class="card"><pre class="code">/api/events/:slug/:sub/:id/:action   → handled
/api/events/:slug/:sub/:id           → handled
/api/events/:slug/:sub               → handled
/api/events/:slug/sessions/:id/attendance/:x   → nothing, 405</pre><figcaption>Rewrites by depth. One segment too deep and the request never arrives.</figcaption></figure>""",
),
dict(
  slug="a-missing-feature-can-wait", date="15 Aug 2026", iso="2026-08-15",
  title="A missing feature can wait. A wrong value being written cannot",
  rule="Ship with a known gap list, and fix before shipping only what writes something false.",
  where="The bookings page, rebuilt", cost="Nothing, which was the point",
  standfirst="The rebuilt bookings page went live with a written list of what it did not do yet. Two things were fixed first, because they were not gaps. They were lies.",
  body=[
    ("What happened", "<p>The rebuild had six things the old page did that the new one did not. The alternative to shipping was a restoration pass on all six before anyone had touched the new screen. Rahul's call: go live, run it for a few days, fix what actually hurts, one change at a time, so a working page is never traded for a speculative one.</p><p>Two defects were fixed before the ship anyway. The page was switching off the server's sixty-minute guard against double-sending reminders. And bulk \"mark paid\" defaulted to cash, inventing a channel that lands in the drawer reconciliation.</p>"),
    ("What it taught us", "<p>Real use is a better filter for which gaps matter than my ranking was. But the rule that separated the two fixes from the gap list is the one worth keeping: a missing feature makes someone wait; a wrong value being written makes the books wrong.</p>"),
    ("The rule now", "<p>The gap list lives in the pull request, read before anything is added to the page. The biggest gaps are still open and known: no restore for a cancel, the pay-first flag invisible, court pooling that ignores sport.</p>"),
  ],
),
dict(
  slug="names-stay-on-the-register", date="13 Sep 2026", iso="2026-09-13",
  title="Names stay on the register until someone stops them",
  rule="The desk records money in arrears. Only four things take a name off a register, and the end of a month is not one of them.",
  where="The kids' programme, the attendance register", cost="Names disappearing before anyone could collect",
  standfirst="A membership ended on the calendar and the child vanished from the attendance sheet. The parent had not paid for the next month yet. Nobody was going to ask them now.",
  body=[
    ("What happened", "<p>The register was built as if everything happened in real time: a month ends, the name goes. The desk does not work like that. Attendance from the 8th, 15th and 22nd is typed in on the 24th. Payment arrives when it arrives. Rahul: \"once a membership is added, unless I cancel it manually, don't remove that name... I will update the payment once it is received. You can obviously nudge me, but don't remove it.\"</p>"),
    ("What it taught us", "<p>A name that vanishes when a month ends vanishes before anyone could collect. Every forward-only assumption in a desk tool costs money: date pickers with a minimum of today, session lists filtered to upcoming, rosters that drop the lapsed.</p>"),
    ("The rule now", "<p>A lapsed member stays on the register flagged \"New month · unpaid\". A member who has used up their sessions stays on, flagged. Only four things remove a name: a cancelled entry, a stop date, a refund that ended the month, or a later month for the same child. And nobody is ever told to cancel a paid month, because cancelling pulls a delivered payment out of the settlements.</p>"),
  ],
),
]

ENTRIES.sort(key=lambda e: e["iso"], reverse=True)

HEAD = """<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>{title}</title>
<meta name="description" content="{desc}">
<meta name="color-scheme" content="dark light">
<link rel="stylesheet" href="../style.css">
<script src="../theme.js"></script>
</head>
<body>
<a class="skip" href="#main">Skip to content</a>
<main id="main" class="wrap">
"""
FOOT = """<footer class="foot theme"><p></p><button type="button" data-theme-toggle aria-label="Switch colour theme">Theme: system</button></footer>

</main>
</body>
</html>
"""

def esc(s): return html.escape(s, quote=True)

def page(e, prev, nxt):
    out = [HEAD.format(title=esc(e["title"]) + " — Learnings — Rahul Jha", desc=esc(e["standfirst"])[:155])]
    out.append(f'<nav class="top" aria-label="Back"><a href="index.html">← Learnings</a><span><time datetime="{e["iso"]}">{e["date"]}</time></span></nav>\n')
    out.append('<header class="stack-lg">\n')
    out.append(f'  <h1>{esc(e["title"])}</h1>\n  <p class="muted">{esc(e["standfirst"])}</p>\n')
    out.append(f'  <dl class="meta"><dt>Where</dt><dd>{esc(e["where"])}</dd><dt>Cost</dt><dd>{esc(e["cost"])}</dd><dt>The rule</dt><dd>{esc(e["rule"])}</dd></dl>\n')
    out.append('</header>\n')
    for i, (h, body) in enumerate(e["body"]):
        hid = re.sub(r'[^a-z0-9]+', '-', h.lower()).strip('-')
        out.append(f'<section class="block" aria-labelledby="{hid}"><h2 id="{hid}">{esc(h)}</h2>{body}')
        if i == 0 and e.get("figure"): out.append(e["figure"])
        out.append('</section>\n')
    links = []
    if prev: links.append(f'Newer: <a href="{prev["slug"]}.html">{esc(prev["title"])}</a>')
    if nxt: links.append(f'Older: <a href="{nxt["slug"]}.html">{esc(nxt["title"])}</a>')
    out.append('<footer class="foot"><p>One entry per failure, written the week it happens. <a href="index.html">All learnings</a> · <a href="../index.html">Home</a></p>')
    if links: out.append('<ul>' + ''.join(f'<li>{l}</li>' for l in links) + '</ul>')
    out.append('</footer>\n')
    out.append(FOOT)
    return ''.join(out)

def index():
    out = [HEAD.format(title="Learnings — Rahul Jha", desc="Short reads from running a two-court venue on software we wrote: real bookings, real money, one WhatsApp number. One entry per failure, written the week it happens.")]
    out.append('<nav class="top" aria-label="Back"><a href="../index.html">← Rahul Jha</a><span>Learnings</span></nav>\n')
    out.append('<header class="stack-lg">\n  <h1>Learnings</h1>\n')
    out.append('  <p class="muted">We run a two-court venue on software we wrote. Real bookings, real money, one WhatsApp number that also carries the login. Things break, and each one teaches something a tutorial would not. These are short: what happened, what it taught us, the rule now. One entry per failure, written the week it happens, as a ritual rather than a retrospective.</p>\n')
    out.append('</header>\n<section class="block" aria-labelledby="all"><h2 id="all">Newest first</h2>\n<ol class="learn">\n')
    for e in ENTRIES:
        out.append(f'  <li><a href="{e["slug"]}.html"><span class="t">{esc(e["title"])}</span><span class="d">{esc(e["rule"])}</span></a><time datetime="{e["iso"]}">{e["date"]}</time></li>\n')
    out.append('</ol>\n</section>\n')
    out.append('<section class="block" aria-labelledby="how"><h2 id="how">How these are written</h2><p>Each entry starts from the record: a commit, a log line, a message in the chat where the mistake was caught. The figures are the real ones. Where Claude Code made the mistake, it says so; where I did, it says that. Customer names never appear. The rule at the end is the part we keep, usually as a test, sometimes as a sentence in the rules file the agent reads before every session.</p></section>\n')
    out.append(FOOT)
    return ''.join(out)

if __name__ == "__main__":
    for i, e in enumerate(ENTRIES):
        prev = ENTRIES[i-1] if i > 0 else None
        nxt = ENTRIES[i+1] if i+1 < len(ENTRIES) else None
        open(os.path.join(HERE, e["slug"] + ".html"), "w").write(page(e, prev, nxt))
    open(os.path.join(HERE, "index.html"), "w").write(index())
    print(f"wrote {len(ENTRIES)} entries + index")

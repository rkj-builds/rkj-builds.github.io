# Learnings: the ritual

One entry per failure, written the week it happens. Not a retrospective; a habit.

How to add one:
1. Open `build.py` and add a dict to `ENTRIES`: slug, date, iso, title, the one-line rule, where, cost, standfirst, three sections (What happened, What it taught us, The rule now), and a figure if a number or a screen makes the point.
2. Run `python3 learnings/build.py` from the site root. It writes the entry page and the index, newest first.
3. Add the entry to the Learnings list on the home page (`index.html`) if it belongs in the top four.
4. Check it locally, commit, push.

Rules for the writing:
- Start from the record: the commit, the log line, the message where it was caught. Real figures.
- Say who made the mistake. Where Claude Code did, say so; where Rahul did, say that.
- No customer names, ever. "A parent", "a child", "one customer".
- Under 400 words. A reader gets the rule in the first line of the index.
- The rule at the end is the part we keep, usually as a test, sometimes as a line in the rules file.

Backlog, not yet written: the sport-first flow that broke production (6 Sep); renewal nudges sent by hand before automating (29 Aug); the second month a child could not buy (the participant index, 13 Sep); first names only (17 Oct); the inbox that showed fallback copy for template sends (20 Oct); the Vercel rewrite that answered 405 for weeks is written; dateless kids signups (23 Aug).

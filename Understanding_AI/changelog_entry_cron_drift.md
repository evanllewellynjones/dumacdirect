## 2026-08-31 — GitHub cron drift makes the schedule unusable (OPEN)

Not diagnosed to a fix yet. Recorded so the next person to look at this
does not spend an evening on the workflow files, which are correct.

### Symptom

The Daily Summary had not run by 20:30 ET on a normal trading Monday.
Sentinel had run, but at **15:56 ET against a 10:07 cron**.

### Cause

Not the crons. Both workflow files are right and neither had been edited:

| Job | Cron (UTC) | Intended ET | Actual | Drift |
|---|---|---|---|---|
| Sentinel | `7 14` | 10:07 | 15:56 | 5h49 |
| Daily Summary (Aug 28) | `30 21` | 17:30 | 23:17 | 5h47 |

Two jobs, two days, the same ~5h50. This is a **platform-wide GitHub
problem**, documented in `actions/runner` issue #4468 and community
discussion #196910: average drift on scheduled workflows has gone from a
stable ~1h40m in 2025 to over 4h through early 2026, and is still
increasing. One reporter's job scheduled at 00:40 UTC — deliberately off
peak — still drifted 4h30m; years earlier the same job started within
10–20 minutes.

**The `:07` / `:30` offsets do not help.** That was the 2026-08-28 fix for
*dropped* events and it was right for that problem. It does nothing for
drift — another user in the thread confirms moving off the top of the hour
made no difference. Do not "fix" this by moving the crons again.

### Why this is fatal rather than annoying

Daily Summary at 23:20 is late but survivable — it is a record of a day
that has already closed.

**Sentinel is dead at this drift.** A 10:07 pre-market briefing delivered
at 15:56 has missed the entire session it exists to get ahead of. There is
no version of "a bit late" that saves a morning briefing arriving after
the close.

### Options, none implemented

1. **External trigger (community-preferred).** Drop `schedule:` from both
   workflows, keep `workflow_dispatch`, add `repository_dispatch`, and have
   cron-job.org POST to the GitHub API on the real schedule. The external
   scheduler owns timing; GitHub only runs the job. Needs a fine-grained
   PAT with Actions write scoped to this repo only. Adds a third-party
   dependency and one more credential to rotate.

2. **Daily Summary back to Task Scheduler.** It is SMTP-only with no
   Windows dependencies since the COM removal, so it runs either place, and
   17:30 local is 17:30. Re-accepts the sleep / silent-hang risk that drove
   the 2026-08-27 move to Actions — but a hang noticed next morning beats
   six hours of drift daily. Sentinel is the harder case: it needs the
   machine awake and networked at 10:07 on a workday.

3. **Hybrid.** Sentinel on an external trigger because timing is
   load-bearing; Daily Summary left on GitHub cron because a late
   post-close digest still does its job.

### Verify before rebuilding the trigger

Open a delayed run and compare its **queued** and **started** timestamps on
the run summary. Queued at the cron time and started ~6h later confirms
GitHub sat on it, and the diagnosis above holds. If it was queued late,
something else is going on and this entry is wrong.

### Note for the deploy doc

`DEPLOY_GITHUB_ACTIONS.md` currently frames schedule unreliability as
*dropped events* — diagnosis by absence, re-run by hand, do not tidy the
crons to `:00`. All still true. Drift is a second, separate failure mode:
the run does arrive, hours late, green, with nothing anywhere saying it was
late. Worth adding, since "the report came but at the wrong time" does not
match anything in the current troubleshooting table.

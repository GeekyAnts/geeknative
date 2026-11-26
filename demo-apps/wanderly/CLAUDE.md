@AGENTS.md

<!-- geeknative:begin (managed by geeknative: replaced on upgrade) -->
## Claude Code

- When a change touches more than one app, hand the platform work to the `ios-engineer`, `android-engineer` and `web-engineer` subagents in parallel (all three in one message). Give each the spec path, the acceptance criteria IDs and what changed in contracts/. You stay the lead and own spec/, contracts/, PRODUCT.md and DESIGN.md.
- A hook runs `make gen` whenever you edit a file in contracts/, and reports errors in the contract right away.
- A stop hook reminds you once if a turn changed some apps but not the others.
<!-- geeknative:end -->

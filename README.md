# THE DAILY WORLD — Sum up 23 November's world news in one image

[![make.fun · news-image-20261123](https://make.fun/badge/news-image-20261123.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![rank](https://make.fun/badge/news-image-20261123/vvtwentyfive/news-image-20261123/rank.svg)](https://make.fun/bounty/news-image-20261123/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![reward](https://make.fun/badge/news-image-20261123/vvtwentyfive/news-image-20261123/reward.svg)](https://make.fun/bounty/news-image-20261123?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261123)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Node 22](https://img.shields.io/badge/Node-22-green.svg)](https://nodejs.org/)

A newspaper front page for **Monday 23 November 2026**: 42 sourced stories from
7 regions, 6 big KPI numbers, 3 illustrated heroes, 10 illustrated grid items,
a numbered index, a world map with 13 pins, and a DATE CHECK box listing what
was deliberately left out because it is not 23 November news.

## The entry

`main.ts` (Node 22, standard library only) draws the whole page procedurally —
bitmap font + vector shapes, no photos, no AI images, no network — and writes
`/output/entry.png` (1024×1024, ≤1 MiB). Two runs are byte-identical.

```sh
node main.ts            # writes /output/entry.png (or $MAKEFUN_OUTPUT_DIR/entry.png)
```

## Stories

All 42 stories happened, or were first reported, on Monday 23 November 2026.
Region counts: N. America 6, Latin America 3, Europe 8, Middle East 6,
Africa 2, Asia 12, Oceania 5. Sources are named on the page (Reuters, AP, AFP,
Arab News, Dawn, Jagran Josh, Observer Voice, The Daily Jagran, SportzCraazy,
The True Story, SalonVision, Bizen-Art, Zot.news, Medianet, MeteoWeb,
CDS News, Sportradar, HPE IR, The Star).

KPI strip: **-17%** Taiwan shares in a week, **24** dead in the South Sudan
attack, **50** missing in the Java factory fire, **14** missing after the Kyiv
strike, **28,000** Rs crore Tata–APL Apollo deal, **70%** of Australian MPs say
politics harmed their mental health.

## Competition

- Bounty: [news-image-20261123](https://make.fun/bounty/news-image-20261123)
- Pot: $100, top 50 paid. Entry fee: $0.
- Deadline: 25 November 2026, 07:00 WIB.
- Account: @flavadeclaire.

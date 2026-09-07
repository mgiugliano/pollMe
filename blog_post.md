# Why I built my own live polling system for Keynote

For years, I relied on Poll Everywhere to engage students during my university lectures. It was a great tool, but recently, their pricing policies changed in a way that just didn't make sense for my specific use case. I found myself frustrated, staring at a subscription page, wondering if there was a better way.

I wanted something truly frictionless. No student accounts. No IP logging. No tracking. Just a simple QR code on a projector screen that students could scan to instantly vote. And most importantly, I wanted it deeply integrated into my presentation software of choice: Apple Keynote.

I realized I didn't actually need a massive, database-heavy platform. So, with a bit of weekend coding (and some AI assistance!), I built **PollMe** from scratch. 

Instead of dealing with clunky Keynote plugins or switching back and forth between presentation software and a web browser, I built a tiny macOS app that sits quietly in my menu bar. It talks directly to Keynote, reading my Presenter Notes. If it sees a simple `[POLL]` tag in the notes, it instantly projects a beautiful, transparent live chart right over my slide. 

The backend is equally simple: a single PHP script with zero database requirements. It just writes votes to a tiny local file, meaning I can host it on the most basic university web host imaginable. 

It handles multiple-choice questions, donut charts, and live word clouds, and it has completely transformed my lectures. I don't have to worry about subscriptions anymore, and the students love how fast it is. I've open-sourced the whole thing here, hoping it might save another educator a bit of time and money!

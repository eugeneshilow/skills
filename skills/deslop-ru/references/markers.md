# Markers of machine-written Russian

The evidence behind the checklist. 36 markers collected from Russian editors and tools in October 2026; each carries its sources. The scanner catches the word layer; only a reader or an LLM editor catches the rhetoric and structure layers.

## Sources

- [H1] Habr 967428, vvzvlad, "Вы не сможете это развидеть: краткий гайд по определению LLM-текстов на Хабре", 18.11.2025 — https://habr.com/ru/articles/967428/
- [H2] Habr 1013632, pensiya35 — https://habr.com/ru/articles/1013632
- [TJ] T—Ж, "слоп из Threads", K. Lebedeva, 14.04.2026 — https://t-j.ru/short/ai-slop-from-threads/
- [TJ2] T—Ж, "бот или человек", 23.05.2025 — https://t-j.ru/bot-or-human/
- [S] Sostav, "10 признаков пресс-релиза от нейросети", D. Moskvin, 03.07.2025 — https://www.sostav.ru/blogs/281571/63527
- [I] iPhones.ru, "Как понять, что текст написал ИИ", 09.10.2025 — https://www.iphones.ru/iNotes/kak-ponyat-chto-tekst-napisal-ii-tire-i-spiski-bolshe-ni-o-chyom-ne-govoryat
- [HR] humanizer-ru by Ilya Utov — https://github.com/ilyautov/humanizer-ru

## Word layer (the scanner sees these)

«в современном мире», «на сегодняшний день», «с развитием технологий» [HR][H2][S] · «стоит/важно отметить», «следует учитывать» [HR][H2] · «является», «данный», «имеет важное значение» [HR][H2][I] · «играет ключевую роль» [HR] · «раскрыть потенциал», «комплексный подход», «открывает горизонты» [HR] · «таким образом», «подводя итоги» [HR][S] · frequent «это», «это позволяет» [H2] · unproven evaluations («гениальный») [I] · «Сегодня поговорим о…», «И знаете что?», «Хочешь честно?» [I][TJ] · «если откликается» [TJ] · generalisations «каждый предприниматель» [H2] · false ranges «от стартапов до корпораций» [HR].

## Syntax layer

«не просто X, а Y», «не только…, но и», «это не X, это Y» [HR][TJ][H2] · an em dash in more than 30% of sentences [HR][H2] · chopped sentences in a row [TJ][H2] · parcellation [I] · quotation marks around ordinary words [H2] · inanimate subject «исследование подчёркивает» [HR] · three times more nouns than verbs (people write about two) [HR] · calques of English word order [TJ2][HR] · logic that drifts [H1].

## Structure layer

rule-of-three lists [TJ] · every sentence its own paragraph [TJ] · headline «Событие: последствия» [S] · unnecessary lists and subheadings [S][TJ2] · emoji before list items [I][HR] · bold and italic in one sentence [S][HR] · closing moral, summary conclusion [S][HR] · the same thought repeated in other words [S] · even density without rough edges [HR] · excessive precision «3,81 мм» [H1].

## Tone layer

an empty phrase with a clever face [H1] · «сейчас начнётся самое интересное» with nothing after it [TJ] · strange metaphors [TJ][I] · no author and no addressee [TJ2] · unnamed experts, agreeing with everyone [S][I].

## What the tools do not do

Online detectors (GPTZero, ZeroGPT and the Russian ones) return a probability and no edits. humanizer-ru returns a 0–100 score, positions of each penalty across 16 groups, a noun/verb ratio and a `--before` fact lock; it does not see the rhetoric layer. A text scored 100/100 by the scanner can still read as slop; that is why the second pass exists.

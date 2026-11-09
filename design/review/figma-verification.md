# Figma verification

- Destination: https://www.figma.com/design/HB393bDmONoH9wS1w1DgOD/Untitled?node-id=14-2
- Page: fits · 글로벌 쇼핑 어시스턴트
- Nine screen/overview frames; 400 editable text layers; auto-layout retained throughout.
- Seven desktop flow screens, one overview, and one board of loading / empty / permission states.
- Two reusable navigation components, seven instances, scoped color variables, and four header typography styles.
- Nine prototype links reference existing destination frames. Starting frame: 14:2.
- Figma screenshots reviewed: full canvas, product analysis, first screen, conditions, and missing-information state. Final post-fix screenshot files: figma-conditions-final.png and figma-unknown-final.png.
- Imported Pretendard Semi Bold entries normalized to the available SemiBold style; missing fonts: 0.
- Local captures pass fixed-frame overflow checks. Independent review disposition: ship for local composition.
- Prototype wiring verified structurally; interactive playback was not exercised in a browser.
- Product facts, scores, prices, and supported marketplace examples are illustrative mock data. No real extension installation or purchase takes place.


## Conversation and English revision

The current file has 10 boards and 375 editable text layers. Frames 14:2, 15:2 and 32:218 implement a minimal chat flow: request, purpose and budget, then up to four criteria in the conversation. The store flow follows from the criteria reply. All visible UI is English, and the illustrative budget is $150. Product total $143 includes the $129 item and $14 shipping/import fees.

All 10 English boards were visually checked. Conversation row heights and internal clipping were corrected, with passing post-fix screenshots en-15-2.png and en-32-218.png. Structural verification found no Korean text, no missing fonts, and valid destinations for the chat-to-store prototype links. This revision supersedes the earlier frame count and input-form descriptions above.


## Inline marketplace revision

Store selection now lives in the criteria reply on frame 32:218. The separate chooser (16:2) was removed. Amazon navigates straight to the existing Amazon + active extension mockup (18:2). AliExpress, eBay, and Rakuten have direct marketplace search URL actions. Extension-missing setup was rebuilt inside the same chat shell on 17:2 and has its own prototype entry point; its check-and-continue action leads directly to 18:2. No published extension listing is available, so the Add to Chrome control remains a mockup control.

Both changed compositions passed visual review. There are 9 boards and 310 editable text layers; no missing fonts, no remaining Korean copy, and no broken internal prototype targets. Chat content ends at y=738, above the composer at y=824. Passing screenshots: inline-store-32-218.png and inline-store-17-2.png.

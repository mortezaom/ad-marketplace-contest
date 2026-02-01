# Ad Marketplace Contest Overview

## Contest Details
- **Reward**: $15,000+ $BUILD grant to make the product production-ready.  
  (Note: The final prize can be more than $15k as a starting point. Extra prizes may be added during judging.)
- **Deadline**: February 12
- **Goal**: Build an MVP Telegram Mini App for an ads marketplace that connects channel owners and advertisers, using an escrow-style deal flow.

## High-Level Requirements
- Marketplace connecting advertisers and channel owners.
- Two-sided flow: channel listings and advertiser requests.
- Verified channel data from Telegram.
- Escrow deals with automated posting.

## Tech Guidelines
- Build with any tech stack.
- Focus on backend.
- Keep the code clean and ready for open source.

## Clarifications from Organizer
- **MVP vs Production-ready**: The contest deliverable is an MVP (a working end-to-end prototype), not a production-ready system. For the MVP, it is sufficient to have one coherent flow working: offers catalog → deal creation → approvals → payment/escrow hold → auto-posting → delivery confirmation → release/refund. Some scope items may be implemented in a simplified way for demo purposes, or provided as a documented design/roadmap, as long as you clearly state what is implemented vs. planned. Judging takes both quality and completeness into account: the more scope items you implement end-to-end, the higher your score, but strong architecture and execution quality are equally important.
- **What "prod-ready" means**: The post-contest stage (funded by the grant) is where we harden the system for real users and real funds: security and key management, monitoring/logging, reconciliation, dispute/edge cases, reliability/performance, and completing remaining scope items to a production standard.
- **Grant = Paid Work**: The grant is a paid build budget. The winner will receive milestone-based compensation to continue development with us. We remain the product owner and cover everything except engineering; revenue-share is negotiable.
- **Ownership**: The project is intended to be a real product maintained by us. IP/licensing terms for the winner's continuation work will be agreed in the grant engagement (and shared with the winner before starting post-contest work).
- **Winner(s)**: Current plan is one winner (solo or team) for the full prize starting from $15k. If you don't win, but your submission is strong and demonstrates the right level, we may still reach out to discuss working together on other products.

# Detailed MVP Scope

## 1) Marketplace Model (Both Sides Must Be Supported)
### Channel Owner Listings
- Channel owner lists their channel, sets pricing, and adds a bot as an admin (for stats verification and future auto-posting).

**Extra Considerations**
- Think about PR manager flow and ability to add 1+ users to manage a channel.
- Example: Fetch admins of the channel with selected rights.
- You must re-check if a user is still an admin during financial and other important operations.

### Advertiser Requests
- Advertiser creates a request/campaign brief; channel owners (influencers) can apply.

### Unified Workflow Requirement
- Both entry points must converge into a single unified workflow for:
  - Negotiation
  - Approvals
  - Escrow
  - Auto-posting
- **Messaging**: Use a text bot for messaging. Don't create a chat inside the mini-app.
- **Filters**: Implement practical filters for both offer types (e.g., pricing, subscribers, views, etc.).

## 2) Verified Channel Stats (from Telegram)
Automatically fetch and display verified channel stats available via Telegram, including (at minimum):
- Subscribers
- Average views / reach
- Language charts
- Telegram Premium stats
- Any other metrics exposed by Telegram channel analytics

## 3) Ad Formats and Pricing
- Support setting prices for different ad formats within a single channel, e.g.:
  - Post
  - Forward/repost
  - Story
  - Other formats you deem suitable
- For MVP, only **post** is OK.
- Notes: This should be a free format rather than a strict ad type.

## 4) Escrow Deal Flow
Implement an escrow-style flow:
1. Payment by advertiser
2. Funds held by us
3. Auto-posting confirms delivery
4. Release or refund

**Security Notes**
- Recommended: Use a new address/wallet for each deal or for each user (except for a hot wallet).

**Lifecycle Controls**
- Auto-cancel / timeout if the deal stalls (no activity for X time)
- Clear deal statuses and transitions

## 5) Creative Approval Workflow
A clear approval loop must exist:
1. Advertiser submits preferences / brief
2. Channel owner accepts or rejects
3. If accepted, channel owner drafts the post and submits it for review
4. Advertiser approves or requests edits
5. Once approved, the post is auto-published at the agreed time

## 6) Auto-Posting
- Auto-post the approved creative to the channel.
- Verify it's not deleted/edited/etc.
- Verify the creative is delivered and stays in the channel for enough time before releasing funds to the channel owner.

# Unified Deal Flow
*Added for clarity: The organizer specifies "one coherent flow working" with these steps. Both sides (channel owners and advertisers) enter this unified workflow, regardless of whether they started via a listing or a request.*

Offers catalog → Deal creation → Approvals → Payment / Escrow hold → Auto-posting → Delivery confirmation → Release / Refund

*Added to clarify entry points: Channel owners enter via listing their channels and applying to advertiser requests. Advertisers enter via creating campaign requests and browsing channel listings. Both converge into the unified deal flow above.*

# Tech Stack Guidelines
- No restrictions on tech stack.
- Show your product thinking, engineering decisions, and system design.
- Code should be clean and ready to open-source.
- Backend is the main focus.
- If short on frontend time, use a lightweight UI: Prioritize working flows over looks. It can be "vibecoded" (simple and functional). Reference other tools on https://tools.tg.

# Submission Requirements
- GitHub repo + README (with run/deploy instructions).
- Demo: A test bot deployed on Telegram.
- Short written project overview (architecture, key decisions, future thoughts, known limitations) – can be on GitHub.
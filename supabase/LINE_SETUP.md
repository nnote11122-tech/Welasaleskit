# LINE booking notifications

The existing `notify-booking` function can send the same confirmed booking details and quotation image to Telegram and one LINE group. The channels run independently; partial failures are returned as warnings to the booking screen. No approval buttons are sent.

In Agentwela, open Edge Functions > Secrets and set:

- `LINE_CHANNEL_ACCESS_TOKEN`: a Messaging API channel access token for the intended LINE Official Account.
- `LINE_GROUP_ID`: the group ID obtained from that same channel's verified webhook events (`source.groupId`). This is not the group display name or invitation URL.

Enable **Allow bot to join group chats** in LINE Developers and invite the OA to the intended group. If an existing webhook already serves that channel, obtain the group ID from it without replacing its URL.

Until both LINE values are configured, Telegram works as before. With neither LINE value present, LINE is skipped. With only one value present, the booking screen reports incomplete LINE configuration. Credentials stay in Supabase Secrets and must not be added to the browser environment or Git.

LINE push requests use the booking UUID as `X-Line-Retry-Key` so duplicate accepted requests are recognized within LINE's retry-key retention window. The notification shows the readable `WelaA-xxxx` booking code. Push messages count against the OA message quota, including recipients in groups.

Mock tests verify both channels, saved-data payloads, missing authentication, and isolated channel failures. Live LINE delivery still requires the two secrets and a booking test by an authorized user.

References:
- https://developers.line.biz/en/docs/messaging-api/sending-messages/
- https://developers.line.biz/en/docs/messaging-api/group-chats/

-- Adds Conversation Intelligence storage to the existing call record.
-- Run this after 0001_init.sql.

alter table call
  add column if not exists conversation_intelligence jsonb;

comment on column call.conversation_intelligence is
  'Structured output of src/lib/intelligence — buyer profile, buying signals, objections, knowledge guard, next best action. Null until analysis has run for this call.';

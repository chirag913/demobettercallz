import { AppShell } from '@/components/app-shell';
import { Badge } from '@/components/ui/badge';
import { CallPanel } from '@/components/agent/call-panel';
import { Button } from '@/components/ui/button';
import { solarProject } from '@/data/solarDemo';
import { getSarvamConfig } from '@/lib/sarvam/config';
import { isSupabaseConfigured } from '@/lib/supabase/env';
export const dynamic = 'force-dynamic';
export default function SolarDemoPage(){
 const ready=!!getSarvamConfig(false,false,true)&&isSupabaseConfigured();
 return <AppShell><section className="mx-auto max-w-3xl px-6 py-14">
 <Button href="/projects" variant="ghost" size="sm">← All projects</Button>
 <div className="mt-8 text-[11px] font-medium uppercase tracking-wide text-[var(--muted-2)]">AI Sales Agent · Solar</div>
 <h1 className="mt-3 text-3xl font-semibold tracking-tight">{solarProject.name}</h1>
 <p className="mt-4 max-w-xl text-[var(--muted)]">Try the first conversation your solar leads could have. The AI calls your phone and asks about your property and solar requirements.</p>
 <div className="mt-6 flex gap-2"><Badge variant={ready?'live':'outline'}>{ready?'Live phone demo':'Temporarily unavailable'}</Badge><Badge variant="neutral">Hindi / Hinglish</Badge></div>
 <div className="my-8 rounded-[var(--radius-md)] border border-[var(--border)] p-5"><h2 className="font-medium">Play the role of a solar enquiry</h2><p className="mt-2 text-sm leading-relaxed text-[var(--muted)]">The agent will greet you as someone who enquired about solar. Answer naturally about a home or commercial property. It may ask about your electricity bill, ownership, location and installation plans.</p></div>
 {ready?<CallPanel projectId={solarProject.id} projectName={solarProject.name}/>:<p className="text-[var(--muted)]">The Solar phone demo is temporarily unavailable. Please try again shortly.</p>}
 <p className="mt-5 text-sm text-[var(--muted-2)]">This is a demonstration, not an installation quote or a confirmed sales appointment.</p>
 </section></AppShell>;
}

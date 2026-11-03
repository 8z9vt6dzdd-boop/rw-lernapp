// Überspringen auf drei Ebenen (09-lektionen.md, Abschnitt 7): Lektion, Abschnitt, Einstufung.
import { useMemo, useState } from 'react';
import { ABSCHNITTE } from '../../content/curriculum';
import { LEKTIONEN, lektion as lektionById } from '../../content/lessons';
import { createRng } from '../../engine/rng';
import { ueberspringenSpeichern } from '../../learning/ereignisse';
import { saveSettings } from '../../storage/db';
import { Button, Card } from '../components/ui';
import { navigate, routeParams } from '../hooks';
import { SkipTest, TestAuswertung, type TestErgebnis, type TestFrage } from '../lesson/SkipTest';
import { Sprechblase } from '../lesson/Sprechblase';

const SCHWELLE_ABSCHNITT = 0.8;

function fragenFuerAbschnitt(abschnittId: string, max = 10): TestFrage[] {
  const lektionen = LEKTIONEN.filter((l) => l.abschnitt === abschnittId);
  const alle = lektionen.flatMap((l) => l.skipTest.map((f) => ({ ...f, skillId: l.skillId })));
  // Aus jeder Lektion mindestens zwei Fragen, dann auffüllen
  const rng = createRng(abschnittId.charCodeAt(0) * 97);
  const proLektion = lektionen.flatMap((l) =>
    rng.shuffle(alle.filter((f) => f.skillId === l.skillId)).slice(0, 2),
  );
  const rest = rng.shuffle(alle.filter((f) => !proLektion.includes(f)));
  return rng.shuffle([...proLektion, ...rest].slice(0, Math.max(max, proLektion.length)));
}

export function TestScreen() {
  const [ebene, ziel] = routeParams();
  const [ergebnis, setErgebnis] = useState<(TestErgebnis & { bestanden: boolean }) | null>(null);
  const l = ebene === 'lektion' && ziel ? lektionById(ziel) : undefined;
  const abschnitt = ebene === 'abschnitt' ? ABSCHNITTE.find((a) => a.id === ziel) : undefined;
  const fragen = useMemo<TestFrage[]>(() => {
    if (l) return l.skipTest.map((f) => ({ ...f, skillId: l.skillId }));
    if (abschnitt) return fragenFuerAbschnitt(abschnitt.id);
    return [];
  }, [l, abschnitt]);

  if (fragen.length === 0) {
    return (
      <Card>
        <p>Für diesen Bereich gibt es noch keinen Test.</p>
        <Button className="mt-3" onClick={() => navigate('lernpfad')}>
          Zum Lernpfad
        </Button>
      </Card>
    );
  }

  if (ergebnis) {
    return (
      <TestAuswertung
        ergebnis={ergebnis}
        bestanden={ergebnis.bestanden}
        textBestanden={
          l
            ? 'Sehr gut, das kannst du schon. Die Übung ist jetzt frei.'
            : 'Stark! Die Lektionen dieses Abschnitts sind erledigt – außer denen, bei denen noch etwas gewackelt hat.'
        }
        onWeiter={() => navigate('lernpfad')}
        onLernen={
          l
            ? () => navigate('lektion', l.id)
            : (() => {
                const erste = LEKTIONEN.find((x) => ergebnis.falscheSkills.includes(x.skillId));
                return erste ? () => navigate('lektion', erste.id) : undefined;
              })()
        }
        lernenLabel="Lektion starten"
      />
    );
  }

  return (
    <SkipTest
      titel={l ? `Kann ich schon: ${l.titel}` : `Abschnitt ${abschnitt?.id} überspringen`}
      fragen={fragen}
      onAbbruch={() => navigate(l ? 'lektion' : 'lernpfad', ...(l ? [l.id] : []))}
      onEnde={async (e) => {
        const bestanden = l ? e.richtig === e.gesamt : e.richtig / e.gesamt >= SCHWELLE_ABSCHNITT;
        const erledigt = bestanden ? e.skills.filter((s) => !e.falscheSkills.includes(s)) : [];
        await ueberspringenSpeichern({
          ebene: l ? 'lektion' : 'abschnitt',
          ziel: l ? l.id : abschnitt!.id,
          bestanden,
          richtig: e.richtig,
          gesamt: e.gesamt,
          skillsErledigt: erledigt,
          skillsOffen: e.skills.filter((s) => !erledigt.includes(s)),
          durationMs: e.durationMs,
        });
        setErgebnis({ ...e, bestanden });
      }}
    />
  );
}

/** Einstufung beim ersten Start: Abschnittstests nacheinander, Abbruch beim ersten nicht bestandenen. */
export function EinstufungScreen() {
  const abschnitte = useMemo(
    () => ABSCHNITTE.filter((a) => LEKTIONEN.some((l) => l.abschnitt === a.id)),
    [],
  );
  const [stufe, setStufe] = useState(0);
  const [phase, setPhase] = useState<'intro' | 'test' | 'ende'>('intro');
  const [freigeschaltet, setFreigeschaltet] = useState<string[]>([]);
  const a = abschnitte[stufe];
  const fragen = useMemo(() => (a ? fragenFuerAbschnitt(a.id, 8) : []), [a]);

  const abschliessen = async () => {
    await saveSettings({ onboardingErledigt: true });
    navigate('lernpfad');
  };

  if (phase === 'intro') {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="hand text-2xl font-bold">Einstufung</h1>
        <Sprechblase
          s={{
            figur: 'jana',
            ausdruck: 'erklaert',
            text: 'Ein paar kurze Fragen je Abschnitt. Was du schon kannst, überspringen wir – ganz ohne Druck.',
          }}
        />
        <Button variant="primary" onClick={() => setPhase('test')}>
          Einstufung starten
        </Button>
        <Button variant="ghost" onClick={() => void abschliessen()}>
          Lieber bei null anfangen
        </Button>
      </div>
    );
  }

  if (phase === 'ende' || !a) {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="hand text-2xl font-bold">Einstufung fertig</h1>
        <Sprechblase
          s={{
            figur: 'jana',
            ausdruck: freigeschaltet.length ? 'freut' : 'erklaert',
            text: freigeschaltet.length
              ? `Abschnitt ${freigeschaltet.join(', ')} kannst du schon. Wir starten danach.`
              : 'Wir starten ganz vorn – genau richtig, um alles sauber aufzubauen.',
          }}
        />
        <Button variant="primary" onClick={() => void abschliessen()}>
          Zum Lernpfad
        </Button>
      </div>
    );
  }

  return (
    <SkipTest
      key={a.id}
      titel={`Einstufung · Abschnitt ${a.id}: ${a.titel}`}
      fragen={fragen}
      onAbbruch={() => setPhase('ende')}
      onEnde={async (e) => {
        const bestanden = e.richtig / e.gesamt >= SCHWELLE_ABSCHNITT;
        const erledigt = bestanden ? e.skills.filter((s) => !e.falscheSkills.includes(s)) : [];
        await ueberspringenSpeichern({
          ebene: 'einstufung',
          ziel: a.id,
          bestanden,
          richtig: e.richtig,
          gesamt: e.gesamt,
          skillsErledigt: erledigt,
          skillsOffen: e.skills.filter((s) => !erledigt.includes(s)),
          durationMs: e.durationMs,
        });
        if (bestanden && stufe + 1 < abschnitte.length) {
          setFreigeschaltet([...freigeschaltet, a.id]);
          setStufe(stufe + 1);
        } else {
          if (bestanden) setFreigeschaltet([...freigeschaltet, a.id]);
          setPhase('ende');
        }
      }}
    />
  );
}

import { useState, useMemo } from 'react';
import { useGameStore } from '@store/gameStore';
import {
  Globe2,
  ScanEye,
  Satellite,
  ShieldHalf,
  FlaskConical,
  Swords,
  Save,
  Upload,
  Bug,
  LogOut,
} from 'lucide-react';
import './HudBottomBar.scss';
import { gameConfig } from '@config';

interface HudBottomBarProps {
  onToggleDebug: () => void;
  debugOpen: boolean;
  onShowWars?: () => void;
  warUnread?: number;
}

export const HudBottomBar = ({
  onToggleDebug,
  debugOpen,
  onShowWars,
  warUnread = 0,
}: HudBottomBarProps) => {
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const session = useGameStore((state) => state.session);
  const returnToMenu = useGameStore((state) => state.returnToMenu);
  const saveSession = useGameStore((state) => state.saveSession);
  const loadSession = useGameStore((state) => state.loadSession);
  const hasSavedSession = useGameStore((state) => state.hasSavedSession);

  const eraInfo = useMemo(() => {
    const currentEra = session?.research.currentEra ?? 1;
    const eraLabel =
      gameConfig.research.eras.find((era) => era.id === currentEra)?.label ??
      `Era ${currentEra}`;
    return {
      currentEra,
      eraLabel,
    };
  }, [session]);

  const stats = useMemo(() => {
    if (!session) return null;
    const { galaxy, scienceShips, empires } = session;
    const revealedCount = galaxy.systems.filter(
      (system) => system.visibility !== 'unknown',
    ).length;
    const surveyedCount = galaxy.systems.filter(
      (system) => system.visibility === 'surveyed',
    ).length;
    const ownedSystems = galaxy.systems.filter(
      (system) => system.ownerId === 'player',
    ).length;
    const activeWars = empires.filter(
      (empire) => empire.kind === 'ai' && empire.warStatus === 'war',
    );
    return [
      {
        icon: Globe2,
        label: 'Sistemi',
        desc: 'Totale sistemi generati',
        value: galaxy.systems.length,
      },
      {
        icon: ScanEye,
        label: 'Rivelati',
        desc: 'Sistemi rivelati',
        value: `${revealedCount}/${galaxy.systems.length}`,
      },
      {
        icon: Satellite,
        label: 'Sondati',
        desc: 'Sistemi sondati',
        value: `${surveyedCount}/${galaxy.systems.length}`,
      },
      {
        icon: ShieldHalf,
        label: 'Controllati',
        desc: 'Sistemi controllati',
        value: ownedSystems,
      },
      {
        icon: FlaskConical,
        label: 'Navi scientifiche',
        desc: 'Flotta di ricerca',
        value: scienceShips.length,
      },
      {
        icon: Swords,
        label: 'Guerre',
        desc: 'Conflitti attivi',
        value: activeWars.length,
      },
    ];
  }, [session]);

  if (!session || !stats) {
    return null;
  }

  const actions = [
    {
      icon: Save,
      label: 'Salva',
      desc: 'Salva la sessione',
      onClick: () => {
        const result = saveSession();
        setSaveMessage(result.success ? 'Partita salvata.' : 'Salvataggio non riuscito.');
      },
      disabled: false,
    },
    {
      icon: Upload,
      label: 'Carica',
      desc: 'Carica salvataggio',
      onClick: () => {
        const result = loadSession();
        setSaveMessage(result.success ? 'Partita caricata.' : 'Caricamento non riuscito.');
      },
      disabled: !hasSavedSession(),
    },
    {
      icon: Bug,
      label: 'Debug',
      desc: debugOpen ? 'Nascondi debug' : 'Apri debug',
      onClick: onToggleDebug,
      disabled: false,
    },
    {
      icon: LogOut,
      label: 'Esci',
      desc: 'Torna al menu',
      onClick: returnToMenu,
      disabled: false,
    },
  ];

  return (
    <div className="hud-bottom-bar">
      <div className="hud-bottom-bar__stats">
        {stats.map(({ icon: Icon, label, desc, value }) => (
          <div key={label} className="hud-stat" data-tooltip={`${label}: ${desc}`}>
            <Icon size={16} />
            <div className="hud-stat__value">{value}</div>
          </div>
        ))}
      </div>
      <div className="hud-bottom-bar__era">
        <div className="hud-era-pill" data-tooltip={`Era corrente: ${eraInfo.eraLabel}`}>
          <span className="hud-era-pill__value">{eraInfo.eraLabel}</span>
        </div>
      </div>
      <div className="hud-bottom-bar__actions">
        {actions.map(({ icon: Icon, label, desc, onClick, disabled }) => (
          <button
            key={label}
            className="hud-icon-btn"
            onClick={onClick}
            disabled={disabled}
            data-tooltip={`${label} - ${desc}`}
            aria-label={label}
          >
            <Icon size={16} />
          </button>
        ))}
        {saveMessage ? <span className="text-muted">{saveMessage}</span> : null}
        {onShowWars && warUnread > 0 ? (
          <span className="hud-war-chip hud-war-chip--alert" title="Eventi guerra non letti">
            {warUnread}
          </span>
        ) : null}
      </div>
    </div>
  );
};

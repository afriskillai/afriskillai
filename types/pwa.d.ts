interface BeforeInstallPromptChoiceResult {
  outcome: "accepted" | "dismissed";
  platform: string;
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];

  prompt(): Promise<void>;

  readonly userChoice: Promise<BeforeInstallPromptChoiceResult>;
}

interface WindowEventMap {
  beforeinstallprompt: BeforeInstallPromptEvent;
  appinstalled: Event;
}

interface Navigator {
  standalone?: boolean;
}